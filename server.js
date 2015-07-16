require('node-jsx').install();
var React = require('react');
var mainView = require('./views/app');
var newUserView = require('./views/newuser');
var loginView = require('./views/login');
var usersView = require('./views/users')

var express = require('express');
var app = express();

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    var htmlMarkup = React.renderToString(mainView());
    res.send(htmlMarkup);
});

app.get('/newuser', function(req, res) { //todo: rename to newuser or add userslist here
    var htmlMarkup = React.renderToString(newUserView());
    res.send(htmlMarkup);
});

app.get('/users', function(req, res) {
    var htmlMarkup = React.renderToString(usersView());
    res.send(htmlMarkup);
});

app.get('/login', function(req, res) {
    var htmlMarkup = React.renderToString(loginView());
    res.send(htmlMarkup);
});

var port = 2222;
app.listen(port);
console.log("Server is running on: localhost:" + port);