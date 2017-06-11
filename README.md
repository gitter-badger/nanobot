# Atom Nanobot

## Installation
First make sure, apm & git is available in your command line.
```bash
git clone "git+https://code.q-zero.de/code/atom-nanobot"
cd atom-nanobot
apm link
```

## Configuration
Create a file `.nanobot` in your project's root directory.<br/>
The nanobot file may contain two types of json objects:

### Simple command execution
```json
["your_command", "arg1", "arg2", "..."]
```

### Advanced configuration
```json
{
    "command": ["your_command", "arg1", "arg2", "..."],
    "dir": "/working/directory",
    "logfile": "nanobot.log"
}
```
* **command** - The command to execute.
* **dir** - The working directory where the command will be executed. (Optional)
* **logfile** - Append standard & error output to a file in the command working directory. (Optional)

## Usage
Once, you have configured nanobot for your project, open any file from your
project and press `STRG + ALT + N`. A panel will appear at the bottom of atom
showing the output of your command and some other information.

Press `STRG + ALT + N` again, to stop nanobot. This will also kill the command
process with a 'SIGINT' if it's still running.

## Example
**.nanobot**
```json
["node", "debug", "./nanobot.js"]
```

**nanobot.js**
```js
console.log('Hello World!')
```

---

### Hints
Text in the output log is currently not selectable in atom, but you could use the `logfile` option
to append the output to a file and copy text from there.
