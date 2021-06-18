const express = require('express')
const mongoose = require('mongoose');
const passport = require('passport');
const routes = require('./routes/web');
require('dotenv').config();
const app = express()
const PORT = 5000
app.use(express.json())
app.use(passport.initialize());

//Database connection
const mongoDB = `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use('/', routes);
app.listen(PORT, () => {
    console.log(`Application running at http://localhost:${PORT}`)
})