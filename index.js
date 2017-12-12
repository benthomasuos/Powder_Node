var fs = require('fs');
var couchUser = require('express-user-couchdb');
var express = require('express')
var router = express.Router();
var app = express()
var bodyParser = require('body-parser');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var flash    = require('connect-flash');


// require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// required for passport
app.use(session({ secret: 'scary_titanium' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

    // LOGIN ===
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.sendFile(process.cwd() + '/login.html', { message: req.flash('loginMessage') });
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);
    // SIGNUP =====
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.sendFile(process.cwd() + '/signup.html', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);
    // PROFILE SECTION ===
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.sendFile(process.cwd() + '/profile.html', {
            user : req.user // get the user out of session and pass to template
        });
    });


    // LOGOUT ====
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect(process.cwd() + '/');
    });

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}








app.get('/',function(req, res){
    res.sendFile(process.cwd() + '/home.html')
})





app.get('/tests/tmc',function(req, res){
    res.sendFile(process.cwd() + '/tmc.html')
})
app.get('/tests/tmc/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile(process.cwd() + '/tmc_process.html')
})
app.get('/tests/tmc/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile(process.cwd() + '/tmc_edit.html')
})
app.get('/tests/tmc/compare',function(req, res){
    console.log("Request to compare tests: " + req.query._id);
    res.sendFile(process.cwd() + '/tmc_compare.html')
})


app.get('/tests/conform',function(req, res){
    res.sendFile(process.cwd() + '/conform.html')
})
app.get('/tests/conform/process',function(req, res){
    console.log("Request to process Conform trial: " + req.query._id);
    res.sendFile(process.cwd() + '/conform_process.html')
})
app.get('/tests/conform/edit',function(req, res){
    console.log("Request to edit Conform trial: " + req.query._id);
    res.sendFile(process.cwd() + '/conform_edit.html')
})

app.get('/models/conform',function(req, res){
    res.sendFile(process.cwd() + '/conform_model.html')
})


app.get('/models/conform',function(req, res){
    res.sendFile(process.cwd() + '/conform_model.html')
})




app.get('/tests/fast',function(req, res){
    res.sendFile(process.cwd() + '/fast.html')
})
app.get('/tests/fast/process',function(req, res){
    console.log("Request to process FAST test: " + req.query._id);
    res.sendFile(process.cwd() + '/fast_process.html')
})
app.get('/tests/fast/edit',function(req, res){
    console.log("Request to edit FAST test: " + req.query._id);
    res.sendFile(process.cwd() + '/fast_edit.html')
})
app.get('/tests/fast/compare',function(req, res){
    res.sendFile(process.cwd() + '/fast_compare.html')
})






app.get('/tests/aspshear',function(req, res){
    res.sendFile(process.cwd() + '/aspshear.html')
})
app.get('/tests/aspshear/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile(process.cwd() + '/aspshear_process.html')
})
app.get('/tests/aspshear/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile(process.cwd() + '/aspshear_edit.html')
})
app.get('/tests/aspshear/compare',function(req, res){
    console.log("Request to compare test: " + req.query._id);
    res.sendFile(process.cwd() + '/aspshear_compare.html')
})




app.get('/tests/orthogonal',function(req, res){
    res.sendFile(process.cwd() + '/orthogonal.html')
})
app.get('/tests/orthogonal/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile(process.cwd() + '/orthogonal_process.html')
})
app.get('/tests/orthogonal/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile(process.cwd() + '/orthogonal_edit.html')
})



app.get('/powders',function(req, res){
    res.sendFile(process.cwd() + '/powders.html')
})
app.get('/powders/edit',function(req, res){
    console.log("Creating new powder: " + req.query._id);
    res.sendFile(process.cwd() + '/powder_edit.html')
})
//app.get('/compare',function(req, res){
//    console.log("Request to compare tests: " + JSON.stringify(req.query) );
//    res.sendFile(process.cwd() + '/compare.html')
//})


//app.get('/explore',function(req, res){
//    console.log("Exploring data");
//    res.sendFile(process.cwd() + '/explore.html')
//})





app.use(express.static('static'))

app.listen(3000, function(){
    console.log("Server started and listening on port 3000")
})
