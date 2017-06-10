# Atom Nanobot (Alpha)

## Installation
Since this is an unofficial package, you have to install atom nanobot manually.
```bash
git clone "git+https://code.q-zero.de/code/atom-nanobot"
cd atom-nanobot
apm link
```

## Usage
Create a file **.nanobot** in your project directory root that contains a single shell command that you want to be run, when nanobot is enabled.

To enable nanobot press `CTRL + ALT + N` and nanobot will open and run your command displaying the output.

To disable nanobot press `CTRL + ALT + N` again. This will also kill the process if still running.
