require('dotenv').config()
const express = require('express');
const logger = require('morgan');
const app = express();
const cors = require("cors");
const routes = require('./routes');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(routes);

// 404 error handler
app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: `are you lost? ${req.method} ${req.url} is not registered!`,
        data: null
    });
});

// 500 error handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        status: false,
        message: err.message,
        data: null
    });
});

module.exports = app;