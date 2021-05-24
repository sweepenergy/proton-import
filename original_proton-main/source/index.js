const {app, BrowserWindow} = require ('electron');
const express = require ('express');
const application = express ();
const path = require ('path');
const multer = require ('multer');
const session = require ('express-session');
var redis = require ('redis');
var connectRedis = require ('connect-redis') (session);
var client = require ('redis').createClient ();
var storage = multer.diskStorage ({
  destination: function (req, file, cb) {
    cb (null, path.join (__dirname, './public/data'));
  },
  filename: function (req, file, cb) {
    cb (null, 'client.csv');
  },
});
const force = multer ({
  storage: storage,
});
const browserT = require ('btoa');
const axios = require ('axios');
application.use ('/', express.static (path.join (__dirname, 'public/')));
application.use (
  express.urlencoded ({
    extended: false,
  })
);
application.use (
  session ({
    store: new connectRedis ({
      host: 'localhost',
      port: 6379,
      client: client,
    }),
    secret: 'ProtonImport',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: false,
      maxAge: 1000 * 60 * 10,
    },
  })
);
client.on ('error', function (err) {
  console.log ('Error ' + err);
});
client.on ('connect', function () {
  console.log ('Connected');
});
application.set ('trust proxy', 1);
application.set ('views', path.join (__dirname, '/public/static'));
application.set ('view engine', 'ejs');
application.engine ('html', require ('ejs').renderFile);
global.key;
global.token;
application.get ('/', (req, res) => {
  const sess = req.session;
  if (sess.userkey && sess.usertoken) {
    if (sess.userkey) {
      console.log (sess);
      key = sess.userkey;
      token = sess.usertoken;
      res.redirect ('/upload');
    }
  } else {
    res.render ('signin.html');
  }
});
application.post ('/auth', function (req, res) {
  var userkey = req.body.userkey;
  var usertoken = req.body.usertoken;
  key = req.body.userkey;
  token = req.body.usertoken;
  const sess = req.session;
  const auth = `Basic ${browserT (userkey + ':' + usertoken)}`;
  sess.userkey = userkey;
  sess.usertoken = usertoken;
  axios ('https://api.sweepapi.com/account/verify_auth', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
  })
    .then (function (response) {
      console.log ('account/verify_auth res:', response.data);
      var string = JSON.stringify (response.data);
      if (string !== '{"status":"ok"}') {
        console.log ('Not Authenticated');
        res.redirect ('/login');
      } else {
        console.log ('Authenticated');
        res.redirect ('/upload');
      }
    })
    .catch (function (error) {
      console.log (error);
    });
});
application.get ('/login', function (req, res) {
  res.render ('signin.html');
});
application.get ('/upload', (req, res) => {
  res.render ('upload.html');
});
application.post ('/upload', force.single ('file'), function (req, res) {
  res.redirect ('/import');
});
application.get ('/import', (req, res) => {
  res.render ('import.html');
});
application.post ('/import', (req, res) => {
  if (!req.body.success) {
    const test = require ('./public/js/data_t');
    test.fetchDataCols (req.body);
  } else {
    console.log ('Redirecting to the success page...');
    res.redirect ('/success');
  }
});
application.get ('/success', (req, res) => {
  res.render ('success.html');
});
application.post ('/success', (req, res) => {
  res.redirect ('/upload');
});
application.listen (3000, () => {
  console.log ('Express server listening on port 3000');
});
let mainWindow;
process.env.NODE_ENV = 'production';

function createWindow () {
  mainWindow = new BrowserWindow ({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.maximize ();
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools ();
  }
  mainWindow.loadURL ('http://localhost:3000');
  mainWindow.on ('closed', function () {
    mainWindow = null;
  });
}
app.on ('ready', createWindow);
app.on ('resize', function (e, x, y) {
  mainWindow.setSize (x, y);
});
app.on ('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit ();
  }
});
app.on ('activate', function () {
  if (mainWindow === null) {
    createWindow ();
  }
});
