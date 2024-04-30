---
sidebar_position: 1
description: Instructions on installing Cloudsite.
---
# Installation

## Terminal commands

Cloudsite is a _terminal program_ meaning you interface with the tool by typing commands in a _command terminal_. If you're not familiar with terminals but you'd like to use the tool with a graphical user interface, you can show interest by [commenting on this issue](https://github.com/liquid-labs/cloudsite/issues/160) or supporting development for as little as $5/month [@liquidlabs on Patreon](https://www.patreon.com/liquidlabs).

Otherwise, even if you're not familiar with terminals and the command line, the documents lay out what you need for almost all use cases and you can probably follow along. Refer below to see how to open a terminal on your specific platform.

### Opening a terminal on Mac

Select 'Applications' => 'Utilities' => 'Terminal'

### Opening a terminal on Windows

Use the shortcut '⊞ Windows key + X', and then select Windows Terminal (Admin)

## Node and NPM

Cloudsite runs on Node and requires a package manager, like NPM, for installation. You will need Node and a Node package manager installed in order to install Cloudsite. The default Node package manager is NPM (which stands for 'Node package manager'). Since NPM comes bundled with Node, we show you how to install Node and NPM here, but if you have another package manager (like yarn or pnpm), feel free to use those as well.

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

### Installing Node and NPM

NPM is a package manager installed with Node; hence 'Node Package Manager' or 'NPM'. It can be used to install user tools as well as libraries used in developing software for Node. Cloudsite is distributed as an NPM package and runs on Node.

There are many different ways to install Node/NPM and advanced users who might want to develop with node should refer to the [Node download and install page](https://nodejs.org/en/download/package-manager). For users who just want to install Cloudsite and perhaps other end-user tools, we recommend what we believe to be the simplest methods below:

#### Installing Node/NPM on Mac

__Option 1__: Homebrew

If you have Homebrew installed, that's probably the easiest way to install and keep node up to date. Open a terminal (Applications => Utilities => Terminal) and type the following:
```bash
brew install node@latest
```

__Option 2__: PKG installer

If you don't have or don't know what Homebrew is, don't worry. Just use the pre-built PKG installer. Goto the [Node download page](https://nodejs.org/en/download) and it should detect your platform type. Double check the OS and architecture are correct (if you know them) and simply download and install the Node package.

#### Installing Node/NPM on Windows

Goto the [Node download page](https://nodejs.org/en/download) and it should detect your platform type. Double check Windows is selected and download and install the Node package.

#### Installing Node/NPM on Linux

__Option 1__: Install using the system package manager

If you're using Linux and you know what a package manager is, Node is almost certainly offered.

__Option 2__: Install using NVM

NVM or the 'Node version manager' is like a mini-package manager specifically to allow you to install, manage, and select different versions of Node. To install using the latest NVM, refer to the [Node package manager installation page](https://nodejs.org/en/download/package-manager) and select 'Linux' as the OS and 'NVM' as the package manager.

## Installing Cloudsite

Once NPM is installed, simply type:
```bash
npm install --global cloudsite
```

You're now ready to [set up authentication](/docs/getting-started/authentication).

