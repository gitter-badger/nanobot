# Nanobot
> Nanobot is a lightweight atom package that allows simple command execution for a specific project.



## Installation
```bash
apm install nanobot
```



## Configuration
Create a file `.nanobot` in your project's root directory.<br/>
The nanobot file may contain two types of json objects:

### Simple execution
This will run the executable specified in the first array element with remaining arguments.
The working directory will be your project's root directory.
```json
["your_command", "arg1", "arg2", "..."]
```
_See advanced configuration's [command](#command) parameter for explaination._

### Advanced configuration
```json
{
    "command": ["node", "arg1", "arg2", "..."],
    "dir": "/working/directory",
    "logfile": "nanobot.log"
}
```
#### command
The command to execute. The first element is the name if the executable. (Required)

#### dir
Set the working directory. Relative paths will be resolved to the project's root directory. (Optional)

#### logfile
Append standard & error output to a file in the command working directory. Relative paths will be resolved to the working directory. (Optional)



## Usage
Once, you have configured nanobot for your project, open any file from your
project and press `STRG + ALT + N`. A panel will appear at the bottom of atom
showing the output of your command and some other information.

Press `STRG + ALT + N` again, to stop nanobot. This will also kill the command
process with a 'SIGINT' if it's still running.



## Example

Create the following files inside your project's root directory and make sure you have nodejs installed:

**.nanobot**
```json
["node", "nanobot.js"]
```
**nanobot.js**
```js
console.log('Hello World!')
```

Now open any file from your project and press `STRG + ALT + N`. The nanobot output will appear at the bottom of atom.

See the `.nanobot` & `nanobot.js` files in this [repository](https://github.com/MaxPolster/nanobot) for another example.
