require('node-jsx').install();
var React = require('react');
var mainView = require('./app');

var express = require('express');
var app = express();

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    var htmlMarkup = React.renderToString(mainView());
    res.send(htmlMarkup);
});

var port = 2222;
app.listen(port);
console.log("Server is running on: localhost:" + port);