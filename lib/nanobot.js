'use babel';

import { CompositeDisposable } from 'atom';
import { spawn } from 'child_process';
import path from 'path';



let render = (tagName, attributes = {}) => (...children) => {
    let element = document.createElement(tagName);
    for(let name in attributes)
        element.setAttribute(name, attributes[name]);
    for(let child of children)
        element.appendChild(child);
    return element;
}

let renderText = (text) => document.createTextNode(text);



export default {
    nanobotView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'nanobot:toggle': () => this.toggle()
        }));

        this.root = render('div', { 'class': 'nanobot' })(
            this.header = render('div', { 'class': 'header' })(
                render('span')(renderText('Nanobot'))
            ),
            this.output = render('div', { 'class': 'output' })()
        )

        this.pane = atom.workspace.addFooterPanel({
            item: this.root,
            visible: false
        });
    },

    deactivate() {
        this.pane.destroy();
        this.subscriptions.dispose();
    },

    serialize() {
        return { };
    },

    getCurrentProjectDir() {
        let editor = atom.workspace.getActiveTextEditor();
        if (editor == null)
            return null;

        for(let dir of atom.project.getDirectories())
            if (dir.contains(editor.getPath()))
                return dir;

        return null;
    },

    toOutputString(data) {
        if (data instanceof Buffer) {
            return data.toString('utf8');
        } if (typeof data === 'string') {
            return data;
        } else if (data == null) {
            return 'none';
        } else {
            console.log(data, typeof data);
            return data.toString();
        }
    },

    clear() {
        this.output.innerHTML = '';
    },

    append(data, style = 'info') {
        let text = this.toOutputString(data);
        let lines = text.match(/[^\r\n]+/g);
        if (lines != null) {
            for(let line of lines) {
                let container = render('pre', { 'class': `line ${style}` })(renderText(line))
                this.output.appendChild(container);
            }
        }

        this.output.scrollTop = this.output.scrollHeight;
    },

    appendIf(proc, data, style) {
        if (this.proc === proc) {
            this.append(data, style)
        }
    },

    pipeOutput(proc, stream, style) {
        stream.on('data', chunk => this.appendIf(proc, chunk, style));
        stream.on('error', error => this.appendIf(proc, error, style));
    },

    async enable() {
        this.pane.show();
        this.clear();
        this.append('Initializing...');

        let dir = this.getCurrentProjectDir();
        if (dir == null) {
            this.append('No active project found.', 'error');

        } else {
            let file = dir.getFile('.nanobot');
            if (await file.exists()) {
                let command = JSON.parse(await file.read());
                let commandDir = dir.getPath()
                if (!Array.isArray(command)) {
                    command = command.command;
                    commandDir = path.resolve(process.cwd(), command.dir);
                }

                if (command.length <= 0) {
                    this.append('Empty command.', 'error');
                } else {
                    let commandName = command[0];
                    let commandArgs = command.slice(1);
                    this.proc = spawn(commandName, commandArgs, {cwd: commandDir});

                    this.append(`Process started: ${command}`);

                    this.pipeOutput(this.proc, this.proc.stdout, 'stdout');
                    this.pipeOutput(this.proc, this.proc.stderr, 'stderr');

                    let subscribedProc = this.proc;
                    this.proc.on('close', (code) => {
                        if (this.proc === subscribedProc) {
                            this.proc = null;
                            this.append(`Process has exited with code ${code}`, code == 0 ? void 0 : 'error');
                        }
                    });
                }

            } else {
                this.append(`Missing .nanobot file in current project directory.`, 'error');
            }
        }
    },

    disable() {
        if (this.proc != null) {
            console.log('Killing process...');
            this.proc.kill('SIGINT');
            this.proc = null;
        }
        this.pane.hide();
    },

    toggle() {
        if (this.pane.isVisible()) {
            this.disable();
        } else {
            this.enable().catch(err => {
                throw err;
            })
        }
    }
};
