require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const Neo4jApi = require('./neo4j-api');
const session = require('client-sessions');  //ADD SESSION MANAGEMENT
const crypto = require('crypto');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

var user;

const db = new Neo4jApi();

var storageProfile = multer.diskStorage({
    destination: './uploadsProfile/',
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err);
            if(user.foto!=null){
                var pathFoto = user.foto;
                fs.unlink(pathFoto);
            }
            user.foto = "./uploadsProfile/" + raw.toString('hex') + path.extname(file.originalname);
            db.updateProfileImage(user.email, user.foto);
            cb(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

var storagePost = multer.diskStorage({
    destination: './uploadsPost/',
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return cb(err);
            var description = req.body.description;
            var foto = "./uploadsPost/" + raw.toString('hex') + path.extname(file.originalname);
            if(foto==null) foto = "nothing";
            if(description == null) description = "nothing";
            var date = new Date();
            var dateInMilliseconds = date.getTime();
            db.newPost(user.email, description, foto, dateInMilliseconds).then(function(){
                console.log("relation");
                db.relationToNewPost(user.email,dateInMilliseconds);
            });
            cb(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

var uploadProfile = multer({ storage: storageProfile });
var uploadPost = multer({ storage: storagePost });

const app = express();
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
app.use('/uploadsProfile', express.static(__dirname + '/uploadsProfile'));
app.use('/uploadsPost', express.static(__dirname + '/uploadsPost'));


app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));

/*SESSION COOKIE & COOKIE MANAGEMENT*/
app.use(session({
    cookieName: 'session',
    secret: 'randomWord',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    //ephemeral: true
}));

function setLogin(email,password,res,req,page,pageer){
    db.findUser(email).then(function(usr){
        if(!usr[0]){
            res.render(pageer, { error: 'Invalid email or password.' });
        } else {
            const hash = crypto.createHash('sha256').update(password).digest('base64');
            if(usr[0].password == hash){
                user = usr[0];
                req.session.usr = usr;
                res.redirect(page);
            }
            else{
                res.render(pageer, { error: 'Invalid email or password.' });
            }
        }
    });
}

function requireLogin (req, res, next) {
    if (!req.session.usr || user==null) {
        if(req.get("accept-language").includes("ca")){
            res.redirect("/login-ca");
        }
        else if(req.get("accept-language").includes("es")){
            res.redirect("/login-en");  ///////////////////////////////////////////////////FALTA PAGINA CASTELLÀ
        }
        else res.redirect('/login-en');
    } else {
        next();
    }
}

app.get('/logout', function(req, res) {
    req.session.reset();
    user = null;
    res.redirect('/');
});

/*AJAX FUNCTIONS*/

app.get('/getUsers',(req,res) =>{
    db.getAllUsers().then(function (users) {
        res.send(users);
    });
});

/*INITIAL REDIRECT*/
app.get('/', requireLogin, (req, res) => {
    if(req.get("accept-language").includes("ca")){
        res.redirect("/main-page-ca");
    }
    else if(req.get("accept-language").includes("es")){
        res.redirect("/main-page-en");  ///////////////////////////////////////////////////FALTA PAGINA CASTELLÀ
    }
    else res.redirect('/main-page-en');
});

/*LOGIN*/
app.get('/login-en', (req, res) => {
    res.render('./login/login-en.pug');
});

app.get('/login-ca', (req, res) => {
    res.render('./login/login-ca.pug'); /////////////////////////////////////////////// INFO CATALÀ I CAT REQUIRED FIELDS
});

app.post('/login-en', (req, res) => {
    const email = req.body.email;
    const password = req.body.pass1;
    setLogin(email,password,res,req, "/main-page-en", "./login/login-en.pug");
});

app.post('/login-ca', (req, res) => {
    const email = req.body.email;
    const password = req.body.pass1;
    setLogin(email,password,res,req, "/main-page-ca", "./login/login-ca.pug");
});

///////////////////////////////////////////////////////////////////////////////////////// FALTA CASTELLÀ

/*REGISTRE*/

app.get('/register-ca', (req, res) => {
    res.render('./register/register-ca.pug');  //////////////////////////////////////////////// CAT REQUIRED FIELDS
});

app.get('/register-en', (req, res) => {
    res.render('./register/register-en.pug');
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

app.post('/register-en', (req, res) => {
    const name = req.body.name;
    const surname = req.body.surname;
    const gender = req.body.gender;

    //FORMAT TO STANDAR DATE
    var auxDate = req.body.birthday;
    var parts = auxDate.split("/");
    const birthday = parts[1] + '/' + parts[0] + '/' + parts[2];

    const email = req.body.email;
    const about = req.body.about;
    const password = req.body.pass1;

    db.createUser(name,surname,gender,birthday,email,about,password)
        .then(() => res.redirect('/'))
        .catch(error => res.status(500).send(error));
});

/////////////////////////////////////////////////////////////////////////////////////////// FALTA CASTELLÀ

/*MAIN PAGE*/
app.get('/main-page-en',requireLogin, (req, res) => {
    res.render('./mainPage/main-page-en.pug');
});

app.get('/main-page-ca',requireLogin, (req, res) => {   //////////////////////////////////// FALTA FER
    res.render('./mainPage/main-page-ca.pug');
});

app.get('/main-page-es',requireLogin, (req, res) => {   //////////////////////////////////// FALTA FER
    res.render('./mainPage/main-page-es.pug');
});

/*MY PROFILE*/
app.get('/profile-en',requireLogin, (req, res) => {
    console.log(user);
    res.render('./profile/profile-en.pug',{user});
});

app.get('/profile-ca',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./profile/profile-ca.pug',{user});
});

app.get('/profile-es',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./profile/profile-es.pug',{user});
});

/*EDIT PROFILE*/
app.get('/profile-edit-en',requireLogin, (req, res) => {
    res.render('./profile-edit/profile-edit-en.pug',{user}); //////////////////////////////////// BULDING
});

app.get('/profile-edit-ca',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./profile-edit/profile-edit-ca.pug',{user});
});

app.get('/profile-edit-es',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./profile-edit/profile-edit-es.pug',{user});
});

app.post('/upload-profile-image',uploadProfile.single('image'), (req, res) => {
    res.redirect("/profile-en");
});

app.post('/upload-profile-about',requireLogin,(req, res) => {
    var about = req.body.about;
    user.about = about;
    db.updateProfileAbout(user.email,about);
    res.redirect("/profile-en");
});

/*NEW POST*/
app.get('/new-post-en',requireLogin, (req, res) => {     //////////////////////////////////// BULDING
    res.render('./new-post/new-post-en.pug');
});

app.get('/new-post-es',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./new-post/new-post-es.pug');
});

app.get('/new-post-en',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    res.render('./new-post/new-post-ca.pug');
});

app.post('/post-story',uploadPost.single('image'), (req, res) => {
    if(req.body.image != undefined){
        console.log("BADBAD " + req.body.image);
        var description = req.body.description;
        var date = new Date();
        var dateInMilliseconds = date.getTime();
        db.newPost(user.email, description, "nothing", dateInMilliseconds)
            .then(function(){
                db.relationToNewPost(user.email,dateInMilliseconds).then(() => res.redirect("/main-page-en"));
            });
    }
    else{
        res.redirect("/main-page-en");
   }
});

/*MY STORIES*/
app.get('/my-posts-en',requireLogin, (req, res) => {     //////////////////////////////////// BULDING
    db.getMyStories(user.email).then(function (posts) {
        res.render('./my-posts/my-posts-en.pug',{posts, user});
    });
});

app.get('/my-posts-es',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    db.getMyStories(user.email).then(function (posts) {
        res.render('./my-posts/my-posts-es.pug',{posts, user});
    });
});

app.get('/my-posts-ca',requireLogin, (req, res) => {     //////////////////////////////////// FALTA FER
    db.getMyStories(user.email).then(function (posts) {
        res.render('./my-posts/my-posts-ca.pug',{posts, user});
    });
});

































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
