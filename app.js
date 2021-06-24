const express = require('express')
const mongoose = require('mongoose');
const passport = require('passport');
const routes = require('./routes/web');
require('dotenv').config();
const app = express()
app.use(express.json())
app.use(passport.initialize());

//Database connection
const mongoDB = `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use('/', routes);
app.listen(process.env.DB_HOST, () => {
    console.log(`Application running at http://localhost:${process.env.DB_HOST}`)
})