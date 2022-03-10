import express from 'express'
import mongoose from 'mongoose'
import passport from 'passport'
import path from 'path'
import { expressReceiver } from './mode/slack/app.js'
import { remindersJob } from './Jobs/Reminder.js'
import routes from './routes/web.js'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve('.', '.env') });
const app = express()
app.use(expressReceiver.router)
app.use(express.json())
app.use(passport.initialize());

//Database connection
const mongoDB = `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`;
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use('/', routes);
app.listen(process.env.APP_PORT, () => {
    console.log(`Application running at http://localhost:${process.env.APP_PORT}`)
})
remindersJob
