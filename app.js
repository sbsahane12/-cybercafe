// app.js

const { config } = require('dotenv');
config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const connectFlash = require('connect-flash');
const ensureRole = require('./middleware/roleMiddleware');
const ExpressError = require('./utils/ExpressError');
// const isLoggedIn = require('./middleware/isLoggedInMiddleware');
async function main() {
    await mongoose.connect(process.env.DB_URL);
    console.log('MongoDB connected');
}

main().catch(console.error);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cors());

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));
app.use(passport.initialize());
app.use(passport.session());


passport.use(User.createStrategy());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(connectFlash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.user;
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});


app.use('/', require('./routes/serviceRoute'));
app.use('/admin', ensureRole('admin'), require('./routes/adminServicesRoute'));
// app.use('/admin', require('./routes/adminRoute'));
app.use('/user', require('./routes/userRoute'));

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).render('error', { err });
});

app.use("*", (req, res) => {
    throw new ExpressError("Page Not Found", 404);
});
const PORT = 8000 || process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
