require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const session = require('express-session')
const mongoose = require('mongoose')
const findOrCreate = require('mongoose-find-or-create')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

mongoose.connect(process.env.URI)

const userSchema = mongoose.Schema({
    fullName: String,
    googleID: String,
    todos: [{type: String}]
})

userSchema.plugin(findOrCreate)

const Users = mongoose.model('User', userSchema)

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    maxAge: 86400000
}))

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done)=>done(null, user))
passport.deserializeUser(async(user, done)=>{
    const foundUser = await Users.find(user)
    done(null, foundUser[0])
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:8000/auth/google/callback'
}, async (accessToken, refreshToken, profile, cb) => {
    const foundUser = await Users.find({ googleID: profile.id })
    if (foundUser.length == 0) {
        const newUser = new Users({fullName: profile.displayName, googleID: profile.id, todos: ["Example Todo", "Another Todo"]})
        await newUser.save()
        cb(null, newUser)
    } else {
        cb(null, foundUser[0])
    }
}))


app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/todos')
    } else {
        res.render('enter')
    }
})

app.get('/auth/google', passport.authenticate('google', { scope: ["profile"] }))

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', successRedirect: '/todos' }))

app.get('/todos', (req, res) => {
    if (req.isAuthenticated()) {
        const dataToSend = {}
        dataToSend.title = req.user.fullName + "'s todo list"
        dataToSend.todos = req.user.todos
        res.render('todos', {data: dataToSend})
    } else {
        res.redirect('/')
    }
})

app.get('/logout', (req, res) => {
    req.logOut((err)=>err ? console.log(err) : null)
    res.redirect('/')
})

app.listen(8000, () => {
    console.log('Server running on port 8000')
})