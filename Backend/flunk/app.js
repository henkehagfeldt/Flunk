const express = require("express");
const session = require("express-session");
const moment = require("moment");
const mysql = require('mysql');
const cors = require('cors');

var db_connection = {};

const app = express();

const logger = (req, res, next) => {
    console.log(`${req.protocol}://${req.get('host')}${req.originalUrl}:${moment().format()}`);
    //console.log("User: ", req.session.userId);
    next();
}

app.use(
    session({
        path: '/',
        name: 'cookiename',
        resave: false,
        secret: 'secret',
        saveUninitialized: false,
        cookie: {
            maxAge: 86400000,
            sameSite: 'lax'
        }
    })
);


// Body parser
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// Init logging middleware
app.use(logger);
app.use(cors({credentials: true}));
/*
app.use('/login', redirectToHome);
app.use('/login', require('./routes/login.js'));
app.use('/API', get_db_connection);
app.use('/API/sessions/top', require('./routes/top.js'))
app.use('/API/sessions', require('./routes/sessions.js'));
app.use('/API/details', require('./routes/roomDetails.js'));
app.use('/home/', redirectToLogin);
app.use('/leaderboards', redirectToLogin);
app.use('/', redirectRoot);
*/
app.use('/rooms', require('./routes/rooms.js'));

app.use(express.static('public'));


module.exports = app;
