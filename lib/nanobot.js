'use babel';

import { CompositeDisposable, File } from 'atom';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';



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
                render('span')(renderText('Nanobot')),
                render('span', { 'class': 'menu' })(
                    this.showLogfileLink = render('a')(),
                    this.reportIssueLink = render('a', { 'target': 'blank' })(renderText('Report Issue'))
                )
            ),
            this.output = render('div', { 'class': 'output' })()
        )

        this.pane = atom.workspace.addFooterPanel({
            item: this.root,
            visible: false
        });

        this.loadReportIssueFile().catch(err => { throw err; });
    },

    async loadReportIssueFile() {
        let file = new File(`${__dirname}/report-issue.txt`);
        this.reportIssueLink.href = (await file.read()).trim();
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

        if (this.logfile != null && (style === 'stdout' || style === 'stderr')) {
            this.logfile.write(data)
        }

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
        this.showLogfileLink.style.display = 'none';
        this.showLogfileLink.onclick = null;
        this.clear();
        this.pane.show();
        this.append('Initializing...');

        let dir = this.getCurrentProjectDir();
        if (dir == null) {
            this.append('No active project found.', 'error');

        } else {
            let file = dir.getFile('.nanobot');
            if (await file.exists()) {
                let command = config = JSON.parse(await file.read());
                let commandDir = process.cwd();
                let commandOutput = null;
                if (!Array.isArray(config)) {
                    command = config.command;
                    if ('dir' in config)
                        commandDir = path.resolve(process.cwd(), config.dir);
                    if ('logfile' in config) {
                        let logfilePath = path.resolve(commandDir, config.logfile);
                        this.logfile = fs.createWriteStream(logfilePath, {
                            defaultEncoding: 'utf8',
                            autoClose: true
                        });
                        this.showLogfileLink.style.display = '';
                        this.showLogfileLink.innerHTML = `Show Logfile /${path.relative(dir.getPath(), logfilePath)}`;
                        this.showLogfileLink.onclick = () => atom.workspace.open(logfilePath);
                    }
                }

                if (command.length <= 0) {
                    this.append('Empty command.', 'error');
                } else {
                    let commandName = command[0];
                    let commandArgs = command.slice(1);
                    this.proc = spawn(commandName, commandArgs, {cwd: commandDir});
                    this.append(`Process spawned. (pid=${this.proc.pid})`);
                    this.pipeOutput(this.proc, this.proc.stdout, 'stdout');
                    this.pipeOutput(this.proc, this.proc.stderr, 'stderr');

                    let subscribedProc = this.proc;
                    this.proc.on('close', (code) => {
                        if (this.proc === subscribedProc) {
                            this.append(`Process closed. (code=${code}, pid=${this.proc.pid})`, code == 0 ? void 0 : 'error');
                            this.proc = null;
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
        if (this.logfile != null) {
            this.logfile.destroy();
            this.logfile = null;
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
