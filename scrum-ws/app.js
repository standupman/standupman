const express = require('express')
const mongoose = require('mongoose');
const passport = require('passport');
const routes = require('./routes/web');
const app = express()
const PORT = 5000
app.use(express.json())
app.use(passport.initialize());

//Database connection
const mongoDB = 'mongodb://127.0.0.1/scrum_app';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use('/', routes);
app.listen(PORT, () => {
    console.log(`Application running at http://localhost:${PORT}`)
})