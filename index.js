var fs = require('fs');
var couchUser = require('express-user-couchdb');
var express = require('express')
var router = express.Router();
var app = express()
var bodyParser = require('body-parser');
var passport = require('passport');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.use(couchUser({
    users: 'http://143.167.48.53:5984/_users',
    request_defaults: {
        auth: {
            user: 'admin',
            pass: 'adminpw'
        }
    },
    email:{
        address: "b.thomas@sheffield.ac.uk"
    },
    validateUser: function(data, cb) {
      var MAX_FAILED_LOGIN = 5;
      var req = data.req;     //all the fields in data is captured from /api/user/signin callback function
      var user = data.user;
      var headers = data.headers;
      var outData = {         // This object will be attached to the session
        userInfo: "userAge"   // req.session.userInfo will be "userAge"
      };

      if(data.user.failedLogin > MAX_FAILED_LOGIN) {
        //fails check
        var errorPayload = {
          statusCode: 403,                           //if not included will default to 401
          message: 'Exceeded fail login attempts',   //if not included will default to 'Invalid User Login'
          error: 'Forbidden'                         //if not included will default 'unauthorized'
        }
        cb(errorPayload);
      } else {
        //passess check
        cb(null, outData);
      }
    }
}));


















app.get('/',function(req, res){
    res.sendFile(process.cwd() + '/home.html')
})




app.post('/',function(req, res){
    res.redirect
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
