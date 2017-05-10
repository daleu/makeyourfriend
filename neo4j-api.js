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

  updateProfileImage(email,foto){
      const session = this.driver.session();

      const resp = session.run('MATCH (n {email: "'+ email +'"}) SET n.foto="'+foto+'" RETURN n');

      resp.then(()=> session.close())
          .catch(()=> session.close());

      return resp;
  }

  updateProfileAbout(email,about){
      const session = this.driver.session();

      const resp = session.run('MATCH (n {email: "'+ email +'"}) SET n.about="'+about+'" RETURN n');

      resp.then(()=> session.close())
          .catch(()=> session.close());

      return resp;
  }

  newPost(email,description,foto, date){
      const session = this.driver.session();

      console.log("before neo4j");

      const resp = session
          .run(`CREATE (n:POST {
            description: {description},
            foto: {foto},
            date: {date},
            uuid: {uuid}
            }) RETURN n.uuid`, {
              description,
              foto,
              date,
              uuid: uuid(),
          });

      resp.then(() => session.close())
          .catch(()=> session.close());

      console.log(resp);

      return resp;
  }

  relationToNewPost(email,date){
      const session = this.driver.session();

      console.log("Parametres " +
          email + " " + date);

      var query = "MATCH (u:USER), (r:POST) WHERE u.email = '"+email+"' AND r.date = "+date+" CREATE (u)-[t:MY_POST]->(r) RETURN t";
      console.log(query);
      const resp = session.run(query);

      console.log("resp "+resp);

      resp.then(()=> session.close())
          .catch(()=> session.close());

      console.log("resp2 "+resp);

      return resp;
  }

  getAllUsers(){
      const session = this.driver.session();

      const promise = new Promise((resolve, reject) => {
          session
              .run(`
            MATCH (n:USER)
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

  getMyStories(email){
      const session = this.driver.session();

      const promise = new Promise((resolve, reject) => {
          session
              .run(`MATCH (n:USER {email: "`+email+`"})-[:MY_POST]->(p:POST) RETURN p`)
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

  findUser(email){
      const session = this.driver.session();

      const promise = new Promise((resolve, reject) => {
          session
              .run(`MATCH (s:USER) WHERE s.email = "` + email + `" RETURN s`)
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
