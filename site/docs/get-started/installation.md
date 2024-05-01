---
sidebar_position: 2
description: Instructions on installing Cloudsite.
---
# Installation

If you're familiar with Node and terminals and all that, just install cloudsite with:
```bash
npm i -g cloudsite
```

If that doesn't work, or you're just not sure what to do, then keep reading.

## Terminal commands

Cloudsite is a _terminal program_ meaning you interface with the tool by typing commands in a _command terminal_. Even if you're not familiar with terminals and the command line, just follow the instructions.

### Opening a terminal on Mac

Select 'Applications' => 'Utilities' => 'Terminal'

### Opening a terminal on Windows

Use the shortcut '⊞ Windows key + X', and then select Windows Terminal (Admin)

## Node and NPM

You will need Node and a Node package manager installed in order to install and run Cloudsite.

### Checking for Node and NPM

To see if Node and NPM are installed, open a terminal and execute:
```bash
node -v
```

If you get something like 'v21.5.0', then Node is installed. If you get a 'command not found' error, then node is not installed.

Node and NPM usually come together, but to check for NPM specifically, execute:
```bash
npm -v
```

### Install Node and NPM

NPM is a package manager installed with Node; hence 'Node Package Manager' or 'NPM'. Cloudsite is distributed as an NPM package and runs on Node.

There are many different ways to install Node/NPM and advanced users can refer to the [Node download and install page](https://nodejs.org/en/download/package-manager). For users who just want to install Cloudsite, we recommend what we believe to be the simplest methods below:

#### Install Node/NPM on Mac

__Option 1__: Homebrew

If you have Homebrew installed, open a terminal and run:
```bash
brew install node@latest
```

__Option 2__: PKG installer

If you don't have or don't know what Homebrew is, don't worry. Just go to the [Node download page](https://nodejs.org/en/download) and to download and install the Node package.

#### Install Node/NPM on Windows

Go to the [Node download page](https://nodejs.org/en/download) to download and install Node+NPM.

#### Install Node/NPM on Linux

__Option 1__: Install using the system package manager

If you're using Linux and you know what a package manager is, Node is almost certainly offered.

__Option 2__: Install using NVM

NVM or the 'Node version manager' is like a mini-package manager specifically to allow you to install, manage, and select different versions of Node. To install using the latest NVM, refer to the [Node package manager installation page](https://nodejs.org/en/download/package-manager) and select 'Linux' as the OS and 'NVM' as the package manager.

## Install Cloudsite

Once NPM is installed, simply type:
```bash
npm install --global cloudsite
```

You're now ready to [set up authentication](/docs/get-started/authentication).

