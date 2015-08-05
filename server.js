var app = require('./app');
var redis = require('redis');
var synaptic = require('synaptic');
var db;
var net;

if (process.env.REDISCLOUD_URL) {
    var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
    db = redis.createClient(redisURL.port, redisURL.hostname, {
        no_ready_check: true
    });
    db.auth(redisURL.auth.split(":")[1]);
} else {
    db = redis.createClient();
}

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

var dim = 200;
var netDim = 20;
var hiddenLayer = 25;
var learningRate = 0.1;

db.on('connect', function () {
    db.get('net', function (err, data) {
        if (err || data === null) {
            net = new synaptic.Architect.Perceptron((netDim * netDim), hiddenLayer, 10);
        } else {
            net = new synaptic.Network.fromJSON(JSON.parse(data));
        }
    });
});

var indexToString = {
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9"
};

//Init socket
io.on('connection', function (socket) {
    socket.emit('init', dim, netDim);

    socket.on('request-prediction', function (data) {
        var p = net.activate(data);
        var i = p.indexOf(Math.max.apply(Math, p));
        socket.emit('send-prediction', indexToString[i], p[i] * 100);
    });

    socket.on('train', function (data, label) {
        net.activate(data);
        net.propagate(learningRate, label);
        db.set('net', JSON.stringify(net.toJSON()));
        socket.emit('done-train');
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