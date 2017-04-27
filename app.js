require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const Neo4jApi = require('./neo4j-api');
const session = require('client-sessions');  //ADD SESSION MANAGEMENT
const crypto = require('crypto');

const app = express();
const db = new Neo4jApi();
const port = process.env.PORT;

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


app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));

/*SESSION COOKIE & COOKIE MANAGEMENT*/
app.use(session({
    cookieName: 'session',
    secret: 'randomWord',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

function setLogin(email,password,res,req,page){
    db.findUser(email).then(function(usr){
        console.log("USER INFO");
        console.log(usr);
        if(!usr[0]){
            console.log("NO USER");
            res.render(page, { error: 'Invalid email or password.' });
        } else {
            const hash = crypto.createHash('sha256').update(password).digest('base64');
            if(usr[0].password == hash){
                console.log("GOOD USER!!!");
                req.session.usr = usr;
                res.render('./login-en.pug');
            }
            else{
                console.log("BAD PASSWORD");
                res.render(page, { error: 'Invalid email or password.' });
            }
        }
    });
}

function requireLogin (req, res, next) {
    if (!req.session.usr) {
        res.redirect('/');
    } else {
        next();
    }
}

/*INITIAL REDIRECT*/
app.get('/', (req, res) => {
    res.redirect('/login-en');
});

/*LOGIN*/
app.get('/login-en', (req, res) => {
    res.render('./login-en.pug');
});

app.post('/login-en', (req, res) => {
    const email = req.body.email;
    const password = req.body.pass1;
    setLogin(email,password,res,req, "./login-en.pug");
});

/*REGISTRE*/

app.get('/register-ca', (req, res) => {
    res.render('./register/register-ca.pug');
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
    db.getAllUsers().then((users) => {
        res.render('./register/register-en.pug', { users });
    });
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

/*MAIN PAGE*/



































/* SOMETHING */
app.post('/aux', (req, res) => {
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


 app.get('/aux', requireLogin, (req, res) => {
 db.getNodes()
 .then((nodes) => {
 res.render('./home.pug', { nodes });
 })
 .catch(error => res.status(500).send(error));
 });

app.listen(port,
  () => console.log(`Server listening on http://localhost:${port}`));
