"use strict";
const fs = require('fs');
const express = require('express');
const favicon = require('express-favicon');
const router = express.Router();
const app = express();


// set up our express application


  app.get('/login',function(req, res){
      res.sendFile( __dirname + '/views/login.html')
  })


app.get('/',function(req, res){
    res.sendFile( __dirname + '/views/home.html')
})



app.get('/tests/tmc',function(req, res){
    res.sendFile( __dirname + '/views/tmc.html')
})
app.get('/tests/tmc/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile( __dirname + '/views/tmc_process.html')
})
app.get('/tests/tmc/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile( __dirname + '/views/tmc_edit.html')
})
app.get('/tests/tmc/compare',function(req, res){
    console.log("Request to compare tests: " + req.query._id);
    res.sendFile( __dirname + '/views/tmc_compare.html')
})


app.get('/tests/conform',function(req, res){
    res.sendFile( __dirname + '/views/conform.html')
})
app.get('/tests/conform/process',function(req, res){
    console.log("Request to process Conform trial: " + req.query._id);
    res.sendFile( __dirname + '/views/conform_process.html')
})
app.get('/tests/conform/edit',function(req, res){
    console.log("Request to edit Conform trial: " + req.query._id);
    res.sendFile( __dirname + '/views/conform_edit.html')
})

app.get('/models/conform',function(req, res){
    res.sendFile( __dirname + '/views/conform_model.html')
})


app.get('/models/conform',function(req, res){
    res.sendFile( __dirname + '/views/conform_model.html')
})




app.get('/tests/fast',function(req, res){
    res.sendFile( __dirname + '/views/fast.html')
})
app.get('/tests/fast/process',function(req, res){
    console.log("Request to process FAST test: " + req.query._id);
    res.sendFile( __dirname + '/views/fast_process.html')
})
app.get('/tests/fast/edit',function(req, res){
    console.log("Request to edit FAST test: " + req.query._id);
    res.sendFile( __dirname + '/views/fast_edit.html')
})
app.get('/tests/fast/compare',function(req, res){
    res.sendFile( __dirname + '/views/fast_compare.html')
})






app.get('/tests/aspshear',function(req, res){
    res.sendFile( __dirname + '/views/aspshear.html')
})
app.get('/tests/aspshear/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile( __dirname + '/views/aspshear_process.html')
})
app.get('/tests/aspshear/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile( __dirname + '/views/aspshear_edit.html')
})
app.get('/tests/aspshear/compare',function(req, res){
    console.log("Request to compare test: " + req.query._id);
    res.sendFile( __dirname + '/views/aspshear_compare.html')
})




app.get('/tests/orthogonal',function(req, res){
    res.sendFile( __dirname + '/views/orthogonal.html')
})
app.get('/tests/orthogonal/process',function(req, res){
    console.log("Request to process test: " + req.query._id);
    res.sendFile( __dirname + '/views/orthogonal_process.html')
})
app.get('/tests/orthogonal/edit',function(req, res){
    console.log("Request to edit test: " + req.query._id);
    res.sendFile( __dirname + '/views/orthogonal_edit.html')
})



app.get('/powders',function(req, res){
    res.sendFile( __dirname + '/views/powders.html')
})
app.get('/powders/edit',function(req, res){
    console.log("Creating new powder: " + req.query._id);
    res.sendFile( __dirname + '/views/powder_edit.html')
})






app.use(express.static("static"));
app.use(favicon( __dirname + '/static/images/star-icon.png'));


app.use(function (req, res, next) {
  res.status(404).sendFile(__dirname + "/views/404.html")
})


app.listen(3000, function(){
    console.log("Server started and listening on port 3000")
})
