# makeyourfriend

This sample shows how to bootstrap a sample [Neo4j](https://neo4j.org) project on [Heroku](https://heroku.com/) using [Node](https://nodejs.org/en/) and [Express](http://expressjs.com/).

### Run locally

1. Download, setup and start a [Neo4j instance](https://neo4j.com/download/)
2. Clone this repository
3. Create a `.env` configuration (see `.env.sample` for a reference)
4. Install dependencies: `npm install`
5. Start your local express instance: `npm start`
6. Launch: http://localhost:3000

### Run locally on Linux

1. Download, setup and start a [Neo4j instance](https://neo4j.com/download/)
2. Extract the contents of the archive, using: $tar -xf <filecode>. For example, $tar -xf neo4j-enterprise-2.3.1-unix.tar.gz
3. Go to the folder you extracted and run: 
```bash
$ /bin/neo4j start
```
to start a neo4j server
4.Clone this repository:
```bash
$ git clone ...
```
5. Install Nodejs:
```bash
$ sudo apt-get update
$ sudo apt-get install npm
$ sudo apt-get install nodejs-legacy
```
6. Navigate to the repository folder and execute:
```bash
$ npm install
```
7. Finally, on the same folder, execute:
```bash
$ node --use_strict app.js
```
8. Navigate to this URL to see the webpage: http://localhost:3000
