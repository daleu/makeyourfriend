# makeyourfriend

Social Network implemented with Node.js, Neo4j and Heroku.

### Run locally on Linux

1. Download, setup and start a [Neo4j instance](https://neo4j.com/download/)
2. Extract the contents of the archive, using: 
```bash
$tar -xf "filecode"
```
For example: 
```bash
$tar -xf neo4j-enterprise-2.3.1-unix.tar.gz
```
3. Go to the folder you extracted and run: 
```bash
$ /bin/neo4j start
```
to start a neo4j server.

4.Clone this repository:
```bash
$ git clone https://github.com/daleu/makeyourfriend.git
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
