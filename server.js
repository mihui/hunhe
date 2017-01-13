var express = require("express"),
	http = require('http'),
    app = express();

var port = process.env.VCAP_APP_PORT || 8080;

// app.use(express.static(__dirname + '/public'));
app.get("/", function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"})

	// forwarding
	http.get('https://github.com/mihui/ml/blob/master/README.md', function (res) {
        res.setEncoding('binary');
        var type = res.headers["content-type"];
        var read = '';
        res.on('data', function (data) {
            read += data;
        }).on('end', function () {
            response.writeHead(200, { 'Access-Control-Allow-Origin': '*', "Content-Type": type });
            response.write(read , "binary");
            response.end();
        })
    });
});

app.get("/hello", function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"})
    response.end("Hello World!\n");
});

app.listen(port);

require("cf-deployment-tracker-client").track();
