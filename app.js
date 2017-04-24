require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');

const Neo4jApi = require('./neo4j-api');


const app = express();
const db = new Neo4jApi();
const port = process.env.PORT;

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));

/*PATHS*/
app.use('/', express.static(__dirname + '/www')); // redirect root
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/jquery-validation/dist'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/css', express.static(__dirname + '/node_modules/w3-css'));
app.use('/images', express.static(__dirname + '/public/images'));
app.use('/style', express.static(__dirname + '/public/style'));
app.use('/css', express.static(__dirname + '/node_modules/font-awesome/css'));
app.use('/fonts', express.static(__dirname + '/node_modules/font-awesome/fonts'));


app.get('/', (req, res) => {
  db.getNodes()
    .then((nodes) => {
      res.render('./home.pug', { nodes });
    })
    .catch(error => res.status(500).send(error));
});

/*REGISTRE*/

app.get('/register-ca', (req, res) => {
    db.getNodes()
        .then((nodes) => {
            res.render('./register/register-ca.pug', { nodes });
        })
        .catch(error => res.status(500).send(error));
});

app.post('/register-ca', (req, res) => {
    const name = req.body.name;
    const surname = req.body.surname;
    const gender = req.body.gender;
    const birthday = req.body.birthday;
    const email = req.body.email;
    const about = req.body.about;
    const password = req.body.pass1;

    db.createUser(name,surname,gender,birthday,email,about,password)
        .then(() => res.redirect('/'))
        .catch(error => res.status(500).send(error));
});

app.get('/register-en', (req, res) => {
  db.getNodes()
      .then((nodes) => {
        res.render('./register-en.pug', { nodes });
      })
      .catch(error => res.status(500).send(error));
});

app.post('/register-en', (req, res) => {
    const name = req.body.name;
    const surname = req.body.surname;
    const gender = req.body.gender;
    const birthday = req.body.birthday;
    const email = req.body.email;
    const about = req.body.about;
    const password = req.body.pass1;

    db.createUser(name,surname,gender,birthday,email,about,password)
        .then(() => res.redirect('/'))
        .catch(error => res.status(500).send(error));
});

/*LOGIN*/
app.get('/login-en', (req, res) => {
    db.getNodes()
        .then((nodes) => {
            res.render('./login-en.pug', { nodes });
        })
        .catch(error => res.status(500).send(error));
});

app.post('/', (req, res) => {
  const name = req.body.name;
  db.createNode(name)
    .then(() => res.redirect('/'))
    .catch(error => res.status(500).send(error));
});

app.post('/clear', (req, res) => {
  db.clearNodes()
    .then(() => res.redirect('/'))
    .catch(error => res.status(500).send(error));
});

app.listen(port,
  () => console.log(`Server listening on http://localhost:${port}`));
