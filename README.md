# The Pandora's Backend Development :rocket:
The repository for Pandora's backend side development. (Currently working with ExpressJS, NodeJS and a little bit of HTML and CSS)

## Getting Started
First let's see some guides to build our dependencies and development platform:

## NodeJS & ExpressJS

ExpressJS is a framework for working with NodeJS easily. This will handle our main server. However, we need to install NodeJS to work with ExpressJS.

### 1- Installing NodeJS
To prepare the machine for installing NodeJS:
```bash
sudo apt-get install python-software-properties
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
```
_If 'curl' program is not installed on your machine, consider running this line:_
```bash
sudo apt-get install curl
```
To install NodeJS:
```bash
sudo apt-get install nodejs
```
To check the npm's version:(which will guarantee that your installation is successful!)
```bash
npm -v 
```
Further information about installing NodeJS: [Installing NodeJS on Ubuntu](https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/)

Further information about NodeJS: [NodeJS Official Website](https://nodejs.org/en/)

### 2- Installing ExpressJS
