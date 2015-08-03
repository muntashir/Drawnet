var app = require('./app');
var redis = require('redis');
//var db;
//
//if (process.env.REDISCLOUD_URL) {
//    var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
//    db = redis.createClient(redisURL.port, redisURL.hostname, {
//        no_ready_check: true
//    });
//    db.auth(redisURL.auth.split(":")[1]);
//} else {
//    db = redis.createClient();
//}

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

//db.on('connect', function () {
//    console.log('Connected to Redis');
//});

var synaptic = require('synaptic');
net = new synaptic.Architect.Perceptron(80 * 80, 10, 36);

//Init socket
io.on('connection', function (socket) {
    socket.on('request-prediction', function (data) {
        socket.emit('send-prediction', net.activate(data));
    });

    socket.on('train', function (data, label) {
        if (data) {
            net.activate(data);
            net.propagate(1, label);
        }
    });
});

//Start server
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

//Server functions
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
