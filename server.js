var express = require("express"),
	jsdom = require("jsdom"),
    app = express();

var port = process.env.VCAP_APP_PORT || 8080;

var forwardUrl = 'https://github.com/mihui/ml/blob/master/README.md';

app.use(express.static(__dirname + '/public'));
app.get("/", function (request, response) {
    response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html'});
	response.write('<!DOCTYPE html>');
    response.write('<head>');
    response.write('<link rel="apple-touch-icon" href="/favicon.png">');
    response.write('<link rel="shortcut icon" href="/favicon.ico" />');
    response.write('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
    response.write('<meta name="apple-mobile-web-app-title" content="Machine Learning" />');
    response.write('<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no" />');
    response.write('<meta name="format-detection" content="telephone=no" />');
    response.write('<meta name="apple-mobile-web-app-capable" content="yes" />');
    response.write('<link rel="stylesheet" href="/css/github.css" />');
    response.write('<link rel="stylesheet" href="/css/site.css" />');

	jsdom.env(
	  forwardUrl,
	  ['http://'+request.headers.host+'/js/jquery.min.js'],
	  function (err, window) {
	    var $ = window.$;
	    var readme = $('#readme');
	    var html = readme.html();
	    response.write('<title>');
	    response.write(readme.find('h1').eq(0).text());
	    response.write('</title>');
	    response.write('</head>');
	    response.write('<body>');
	    response.write(html);
	    response.write('</body>');
	    response.write('</html>');
	    response.end();
	  }
	);
});

app.get("/hello", function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"})
    response.end("Hello World!\n");
});

app.listen(port);

require("cf-deployment-tracker-client").track();
