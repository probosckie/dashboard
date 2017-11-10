const express = require('express');
const app = express();
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const morgan = require('morgan');
const session = require('express-session');
const port = process.env.PORT || 8001;
const dataCache = require('./app/controllers/dataCache');


app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.csv')
  }
});


app.use(multer({
    storage:storage
}).single('data'));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');


//require('./config/passport')(passport); // pass passport for configuration


//required for passport
//app.use(session({ secret: 'iloveyoudear...' })); // session secret
/*
app.use(session({
    secret: 'I Love India...',
    resave: true,
    saveUninitialized: true
}));*/

/*app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions*/

// routes ======================================================================
require('./config/routes.js')(app); // load our routes and pass in our app and fully configured passport


//launch ======================================================================
app.listen(port, () => {
	console.log('listening on port 8001');
});

exports = module.exports = app;