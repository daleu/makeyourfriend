const neo4j = require('neo4j-driver').v1;
const uuid = require('uuid/v4');
const crypto = require('crypto');

const url = process.env.GRAPHENEDB_BOLT_URL;
const user = process.env.GRAPHENEDB_BOLT_USER;
const pass = process.env.GRAPHENEDB_BOLT_PASSWORD;


class Neo4jApi {

  constructor() {
    this.driver = neo4j.driver(url, neo4j.auth.basic(user, pass));
  }

  createUser(name,surname,gender,birthday,email,about,password){
    const session = this.driver.session();

    const hash = crypto.createHash('sha256').update(password).digest('base64');

    const resp = session
        .run(`
          CREATE (n:USER {
            name: {name},
            surname: {surname},
            gender: {gender},
            birthday: {birthday},
            email: {email},
            about: {about},
            password: {hash},
            uuid: {uuid}
          })
          RETURN n.name`, {
          name,
          surname,
          gender,
          birthday,
          email,
          about,
          hash,
          uuid: uuid(),
        });

    resp.then(() => session.close())
        .catch(() => session.close());

    return resp;

  }

  createNode(name) {
    const session = this.driver.session();
    const resp = session
      .run(`
          CREATE (n:EXPRESS_SAMPLE_NAME {
            name: {name},
            uuid: {uuid}
          })
          RETURN n.name`, {
            name,
            uuid: uuid(),
          });

    resp.then(() => session.close())
      .catch(() => session.close());

    return resp;
  }

  getNodes() {
    const session = this.driver.session();

    const promise = new Promise((resolve, reject) => {
      session
        .run(`
            MATCH (n:EXPRESS_SAMPLE_NAME)
            RETURN n`)
        .then((result) => {
          session.close();
          resolve(result.records
            .map(record => record._fields[0].properties));
        })
        .catch((error) => {
          session.close();
          reject(error);
        });
    });

    return promise;
  }

  clearNodes() {
    const session = this.driver.session();
    return session.run(`
        MATCH (n)
        DETACH DELETE n`);
  }

  close() {
    this.driver.close();
  }

}

module.exports = Neo4jApi;
