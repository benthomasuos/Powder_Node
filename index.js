var fs = require('fs');
var express = require('express')
var router = express.Router();
var app = express()
var bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
