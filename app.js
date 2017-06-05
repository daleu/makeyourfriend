require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const Neo4jApi = require('./neo4j-api');
const session = require('client-sessions');  // ADD SESSION MANAGEMENT
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

var lastUpload;
var eventx;

let user;
let fileUploaded = false;

const db = new Neo4jApi();

const storageProfile = multer.diskStorage({
  destination: './uploadsProfile/',
  filename(req, file, cb) {
    crypto.pseudoRandomBytes(16, (err, raw) => {
      if (err) return cb(err);
      if (user.foto != null) {
        const pathFoto = user.foto;
        fs.unlink(pathFoto);
      }
      user.foto = `./uploadsProfile/${raw.toString('hex')}${path.extname(file.originalname)}`;
      db.updateProfileImage(user.email, user.foto);
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

const storagePost = multer.diskStorage({
  destination: './uploadsPost/',
  filename(req, file, cb) {
    crypto.pseudoRandomBytes(16, (err, raw) => {
      if (err) return cb(err);
      lastUpload = `./uploadsPost/${raw.toString('hex')}${path.extname(file.originalname)}`;
        fileUploaded = true;
      /*const description = req.body.description;
      console.log(description);
      const foto = `./uploadsPost/${raw.toString('hex')}${path.extname(file.originalname)}`;
      const date = new Date();
      const dateInMilliseconds = date.getTime();
      const usuari = `${user.name} ${user.surname}`;
      fileUploaded = true;
      console.log('VAAAAAAAAAAAAAA');
      db.newPost(user.email, description, foto, dateInMilliseconds, usuari).then(() => {
        console.log('relation');
        db.relationToNewPost(user.email, dateInMilliseconds);
      });*/
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

var maxSize = 1 * 1000 * 1000*1000*1000;
const uploadProfile = multer({
    storage: storageProfile,
    limits: { fileSize: maxSize }
});
const uploadPost = multer({
    storage: storagePost,
    limits: { fileSize: maxSize },
    onFileUploaded: function(){

    }
}).single('image');

const app = express();
const port = process.env.PORT;

/* PATHS*/
app.use('/', express.static(`${__dirname}/www`)); // redirect root
app.use('/js', express.static(`${__dirname}/public/js`));
app.use('/js', express.static(`${__dirname}/node_modules/bootstrap/dist/js`));
app.use('/js', express.static(`${__dirname}/node_modules/jquery/dist`)); // redirect JS jQuery
app.use('/js', express.static(`${__dirname}/node_modules/jquery-validation/dist`));
app.use('/js', express.static(`${__dirname}/node_modules/moment/min`));
app.use('/js', express.static(`${__dirname}/node_modules/fullcalendar/dist`));
app.use('/css', express.static(`${__dirname}/node_modules/bootstrap/dist/css`));
app.use('/css', express.static(`${__dirname}/node_modules/w3-css`));
app.use('/images', express.static(`${__dirname}/public/images`));
app.use('/style', express.static(`${__dirname}/public/style`));
app.use('/css', express.static(`${__dirname}/node_modules/font-awesome/css`));
app.use('/fonts', express.static(`${__dirname}/node_modules/font-awesome/fonts`));
app.use('/css',express.static(`${__dirname}/node_modules/fullcalendar/dist`));
app.use('/uploadsProfile', express.static(`${__dirname}/uploadsProfile`));
app.use('/uploadsPost', express.static(`${__dirname}/uploadsPost`));


app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));

/* SESSION COOKIE & COOKIE MANAGEMENT*/
app.use(session({
  cookieName: 'session',
  secret: 'randomWord',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
    //ephemeral: true
}));

function setLogin(email, password, res, req, page, pageer) {
  db.findUser(email).then((usr) => {
    if (!usr[0]) {
      res.render(pageer, { error: 'Invalid email or password.' });
    } else {
      const hash = crypto.createHash('sha256').update(password).digest('base64');
      if (usr[0].password == hash) {
        user = usr[0];
        req.session.usr = usr;
        res.redirect(page);
      } else {
        res.render(pageer, { error: 'Invalid email or password.' });
      }
    }
  });
}

function requireLogin(req, res, next) {
  if (!req.session.usr || user == null) {
    if (req.get('accept-language').includes('ca')) {
      res.redirect('/login-ca');
    } else if (req.get('accept-language').includes('es')) {
      res.redirect('/login-en');  // /////////////////////////////////////////////////FALTA PAGINA CASTELLÀ
    } else res.redirect('/login-en');
  } else {
    next();
  }
}

app.get('/logout', (req, res) => {
  req.session.reset();
  user = null;
  res.redirect('/');
});

/* AJAX FUNCTIONS*/

app.get('/getUsers', (req, res) => {
  db.getAllUsers().then((users) => {
    res.send(users);
  });
});

/* INITIAL REDIRECT*/
app.get('/', requireLogin, (req, res) => {
  if (req.get('accept-language').includes('ca')) {
    res.redirect('/main-page-ca');
  } else if (req.get('accept-language').includes('es')) {
    res.redirect('/main-page-en');  // /////////////////////////////////////////////////FALTA PAGINA CASTELLÀ
  } else res.redirect('/main-page-en');
});

/* LOGIN*/
app.get('/login-en', (req, res) => {
  res.render('./login/login-en.pug');
});

app.get('/login-ca', (req, res) => {
  res.render('./login/login-ca.pug'); // ///////////////////////////////////////////// INFO CATALÀ I CAT REQUIRED FIELDS
});

app.post('/login-en', (req, res) => {
  const email = req.body.email;
  const password = req.body.pass1;
  setLogin(email, password, res, req, '/main-page-en', './login/login-en.pug');
});

app.post('/login-ca', (req, res) => {
  const email = req.body.email;
  const password = req.body.pass1;
  setLogin(email, password, res, req, '/main-page-ca', './login/login-ca.pug');
});

// /////////////////////////////////////////////////////////////////////////////////////// FALTA CASTELLÀ

/* REGISTRE*/

app.get('/register-ca', (req, res) => {
  res.render('./register/register-ca.pug');  // ////////////////////////////////////////////// CAT REQUIRED FIELDS
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

  db.createUser(name, surname, gender, birthday, email, about, password)
        .then(() => res.redirect('/'))
        .catch(error => res.status(500).send(error));
});

app.post('/register-en', (req, res) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const gender = req.body.gender;
  let isAdmin = req.body.isAdmin;
  if (isAdmin == undefined) isAdmin = 'NO';

    // FORMAT TO STANDAR DATE
  const auxDate = req.body.birthday;
  const parts = auxDate.split('/');
  const birthday = `${parts[1]}/${parts[0]}/${parts[2]}`;

  const email = req.body.email;
  const about = req.body.about;
  const password = req.body.pass1;

  db.createUser(name, surname, gender, birthday, email, about, password, isAdmin)
        .then(() => res.redirect('/'))
        .catch(error => res.status(500).send(error));
});

// ///////////////////////////////////////////////////////////////////////////////////////// FALTA CASTELLÀ

/* MAIN PAGE*/
app.get('/main-page-en', requireLogin, (req, res) => {
  res.render('./mainPage/main-page-en.pug', { user });
});

app.get('/main-page-ca', requireLogin, (req, res) => {   // ////////////////////////////////// FALTA FER
  res.render('./mainPage/main-page-ca.pug', { user });
});

app.get('/main-page-es', requireLogin, (req, res) => {   // ////////////////////////////////// FALTA FER
  res.render('./mainPage/main-page-es.pug', { user });
});

/* MY PROFILE*/
app.get('/profile-en', requireLogin, (req, res) => {
  db.getFriends(user.email).then((friends) => {
    db.getMyStories(user.email).then((posts) => {
      res.render('./profile/profile-en.pug', { user, friends, posts });
    });
  });
});

app.get('/profile-ca', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./profile/profile-ca.pug', { user });
});

app.get('/profile-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./profile/profile-es.pug', { user });
});

/* EDIT PROFILE*/
app.get('/profile-edit-en', requireLogin, (req, res) => {
  res.render('./profile-edit/profile-edit-en.pug', { user }); // ////////////////////////////////// BULDING
});

app.get('/profile-edit-ca', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./profile-edit/profile-edit-ca.pug', { user });
});

app.get('/profile-edit-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./profile-edit/profile-edit-es.pug', { user });
});

app.post('/upload-profile-image', uploadProfile.single('image'), (req, res) => {
  res.redirect('/profile-en');
});

app.post('/upload-profile-about', requireLogin, (req, res) => {
  const about = req.body.about;
  user.about = about;
  db.updateProfileAbout(user.email, about);
  res.redirect('/profile-en');
});

/* NEW POST*/
app.get('/new-post-en', requireLogin, (req, res) => {     // ////////////////////////////////// BULDING
  res.render('./new-post/new-post-en.pug');
});

app.get('/new-post-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./new-post/new-post-es.pug');
});

app.get('/new-post-en', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./new-post/new-post-ca.pug');
});

app.post('/post-story', requireLogin, (req, res) => {
  uploadPost(req,res, function(err){
      if(err){

      }
      else{
          const description = req.body.description;
          const date = new Date();
          const dateInMilliseconds = date.getTime();
          const usuari = `${user.name} ${user.surname}`;
          if(fileUploaded===true){
              db.newPost(user.email, description, lastUpload, dateInMilliseconds, usuari).then(() => {
                  db.relationToNewPost(user.email, dateInMilliseconds);
              });
          }
          else{
              db.newPost(user.email, description, 'nothing', dateInMilliseconds, usuari).then(() => {
                  db.relationToNewPost(user.email, dateInMilliseconds);
              });
          }
          res.redirect('/main-page-en');
      }
      fileUploaded = false;
  });
});

/* MY STORIES*/
app.get('/my-posts-en', requireLogin, (req, res) => {     // ////////////////////////////////// BULDING
  db.getMyStories(user.email).then((posts) => {
    res.render('./my-posts/my-posts-en.pug', { posts, user });
  });
});

app.get('/my-posts-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  db.getMyStories(user.email).then((posts) => {
    res.render('./my-posts/my-posts-es.pug', { posts, user });
  });
});

app.get('/my-posts-ca', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  db.getMyStories(user.email).then((posts) => {
    res.render('./my-posts/my-posts-ca.pug', { posts, user });
  });
});

/* SEARCH PEOPLE*/
app.get('/search-people-en', requireLogin, (req, res) => {     // ////////////////////////////////// BULDING
  res.render('./search-people/search-people-en.pug');
});

app.get('/search-people-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./search-people/search-people-es.pug');
});

app.get('/search-people-en', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./search-people/search-people-ca.pug');
});

app.get('/get-people-by-name/:letters', requireLogin, (req, res) => {
  const letters = req.params.letters;
  db.getUsersByName(letters, user.email).then((users) => {
    res.send(users);
  });
});

app.get('/get-people', requireLogin, (req, res) => {
  db.getAllUsersPossible(user.email).then((users) => {
    res.send(users);
  });
});

app.post('/send-friend-request/:targetEmail', requireLogin, (req, res) => {
  const targetEmail = req.params.targetEmail;
  db.sendRequest(user.email, targetEmail).then(() => {
    res.send('OK');
  });
});

/* MY FRIENDS*/
app.get('/my-friends-en', requireLogin, (req, res) => {     // ////////////////////////////////// BULDING
  db.getFriends(user.email).then((friends) => {
    res.render('./my-friends/my-friends-en.pug', { friends });
  });
});

app.get('/my-friends-es', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./my-friends/my-friends-es.pug');
});

app.get('/my-friends-en', requireLogin, (req, res) => {     // ////////////////////////////////// FALTA FER
  res.render('./my-friends/my-friends-ca.pug');
});

app.get('/get-my-requests', requireLogin, (req, res) => {
  db.getMyFriendResquests(user.email).then((users) => {
    res.send(users);
  });
});

app.get('/get-friends', requireLogin, (req, res) => {
  db.getFriends(user.email).then((users) => {
    res.send(users);
  });
});

app.get('/get-requests', requireLogin, (req, res) => {
  db.getFriendResquests(user.email).then((users) => {
    res.send(users);
  });
});

app.post('/accept-request/:targetEmail', requireLogin, (req, res) => {
  const targetEmail = req.params.targetEmail;
  db.deleteRequest(user.email, targetEmail).then(() => {
    db.createFriend(user.email, targetEmail).then(() => {
      db.createFriend(targetEmail, user.email).then(() => {
        res.send('OK');
      });
    });
  });
});

app.post('/decline-request/:targetEmail', requireLogin, (req, res) => {
    const targetEmail = req.params.targetEmail;
    db.deleteRequest(user.email, targetEmail).then(() => {
        res.send("OK");
    });
});

/* OTHER PROFILE*/

app.get('/profile-out-en/:targetEmail', requireLogin, (req, res) => {
  const email = req.params.targetEmail;
  if (email == user.email) res.redirect('/profile-en');
  else {
    db.findUser(email).then((result) => {
      const usuari = result[0];
      db.getFriends(email).then((result2) => {
        const friends = result2;
        db.getMyStories(email).then((result3) => {
          const posts = result3;
          db.getIfFriend(email,user.email).then((result4) => {
              var isFriend = false;
              if(result4[0]!=null) isFriend=true;
              res.render('./profile-out/profile-out-en.pug', { usuari, friends, posts,isFriend});
          });
        });
      });
    });
  }
});

app.post('/delete-friend/:targetEmail', requireLogin, (req, res) => {
    const targetEmail = req.params.targetEmail;
    db.deleteFriend(user.email, targetEmail).then(() => {
        db.deleteFriend(targetEmail, user.email).then(() => {
            res.send("OK");
        });
    });
});

app.get('/profile-out-ca/:targetEmail', requireLogin, (req, res) => {
  res.render('./profile-out/profile-out-ca.pug', { user });
});

app.get('/profile-out-es/:targetEmail', requireLogin, (req, res) => {
  res.render('./profile-out/profile-out-es.pug', { user });
});

/*TIMELINE*/
app.get('/timeline-en', requireLogin, (req, res) => {
  db.getFriendsPosts(user.email).then((result3) => {
    const posts = result3;
    res.render('./timeline/timeline-en.pug', { posts });
  });
});

app.get('/timeline-ca', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./timeline/timeline-ca.pug', { posts });
    });
});

app.get('/timeline-es', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./timeline/timeline-es.pug', { posts });
    });
});

/*CREATE EVENT*/                                            //TODO
app.get('/create-event-en', requireLogin, (req, res) => {             //DONE
    res.render('./create-event/create-event-en.pug');
});

app.get('/create-event-es', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./timeline/create-event-es.pug', { posts });
    });
});

app.get('/create-event-es', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./timeline/create-event-es.pug', { posts });
    });
});

app.post('/create-event', requireLogin, (req, res) => {

    const description = req.body.description;
    const title = req.body.title;
    const place = req.body.place;
    const start = req.body.start;
    const end = req.body.end;

    const date = new Date();
    const dateInMilliseconds = date.getTime();

    const usuari = `${user.name} ${user.surname}`;

    db.newEvent(user.email, title, start, end, place, description, dateInMilliseconds, usuari)
        .then((resp) => {
            db.relationToNewEvent(user.email, dateInMilliseconds).then(() =>{
                db.getEventByTime(dateInMilliseconds).then((response) =>{
                    eventx = response[0];
                    res.redirect('/event-invitations-en');
                });
            });
        });
});

/*EVENT INVITATIONS*/

app.get('/event-invitations-en',requireLogin, (req,res) =>{
    db.getFriends(user.email).then((friends) => {
        res.render('./event-invitations/event-invitations-en.pug', {eventx,friends});
    });
});

app.get('/event-invitations-es',requireLogin, (req,res) =>{
    db.getFriends(user.email).then((friends) => {
        res.render('./event-invitations/event-invitations-es.pug', {eventx,friends});
    });
});

app.get('/event-invitations-ca',requireLogin, (req,res) =>{
    db.getFriends(user.email).then((friends) => {
        res.render('./event-invitations/event-invitations-ca.pug', {eventx,friends});
    });
});

app.post('/send-invitation/:targetEmail', requireLogin, (req, res) => {
    const targetEmail = req.params.targetEmail;
    console.log("here");
    db.sendInvitation(eventx.uuid, targetEmail).then(() => {
        res.send('OK');
    });
});

/*EVENT MANAGING*/                                          //TODO

app.get('/getevents', requireLogin, (req,res) =>{
    db.getMyEvents(user.email).then((events) => {
        res.send(events);
    });
});

app.get('/see-events-en', requireLogin, (req, res) => {
    db.getMyEventsInvitations(user.email).then((invitations) => {
        res.render('./see-events/see-events-en.pug', { invitations });
    });
});

app.get('/see-events-es', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./see-events/see-events-es.pug', { posts });
    });
});

app.get('/see-events-ca', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./see-events/see-events-ca.pug', { posts });
    });
});

app.post('/accept-invitation/:uuid', requireLogin, (req, res) => {
    const uuid = req.params.uuid;
    db.deleteRequestEvent(user.email, uuid).then(() => {
        db.createEventRelationship(user.email, uuid).then(() => {
            res.send('OK');
        });
    });
});

/*ADMIN-CONSOLE*/                                           //TODO

app.get('/admin-console-en', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./admin-console/admin-console-en.pug', { posts });
    });
});

app.get('/admin-console-ca', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./admin-console/admin-console-ca.pug', { posts });
    });
});

app.get('/admin-console-es', requireLogin, (req, res) => {
    db.getFriendsPosts(user.email).then((result3) => {
        const posts = result3;
        res.render('./admin-console/admin-console-es.pug', { posts });
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
