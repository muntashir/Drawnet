var canvas;
var ctx;
var canvasOffsetX;
var canvasOffsetY;

var socket;

var mousePos;
var mouseDown = false;

//Data
var canvasData = {};
var dataBuffer = [];
var bufferLength = 3;

var dim = 80;

//var sessionID, roomID passed in from Jade

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
    9: "9",
    10: "Z",
    11: "A",
    12: "B",
    13: "C",
    14: "D",
    15: "E",
    16: "F",
    17: "G",
    18: "H",
    19: "I",
    20: "J",
    21: "K",
    22: "L",
    23: "M",
    24: "N",
    25: "O",
    26: "P",
    27: "Q",
    28: "R",
    29: "S",
    30: "T",
    31: "U",
    32: "V",
    33: "W",
    34: "X",
    35: "Y"
};
var stringToIndex = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "Z": 10,
    "A": 11,
    "B": 12,
    "C": 13,
    "D": 14,
    "E": 15,
    "F": 16,
    "G": 17,
    "H": 18,
    "I": 19,
    "J": 20,
    "K": 21,
    "L": 22,
    "M": 23,
    "N": 24,
    "O": 25,
    "P": 26,
    "Q": 27,
    "R": 28,
    "S": 29,
    "T": 30,
    "U": 31,
    "V": 32,
    "W": 33,
    "X": 34,
    "Y": 35
};

function canvasToArray(canvas, ctx) {
    var array = [];
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 0; i < data.length; i += 4) {
        array.push(data[i] / 255);
    }
    return array;
}

$(document).ready(function () {
    socket = io();
    initCanvas();
    initPreCanvas(canvas);

    $(window).on('beforeunload', function () {
        socket.close();
    });

    $('#clear').on('click touchend', function () {
        clearCanvas();
    });

    $('#train').on('click touchend', function () {
        bootbox.prompt({
            title: "Enter a label (Capitals and numbers only)",
            value: "",
            callback: function (label) {
                var labelArray = [];
                if (stringToIndex.hasOwnProperty(label)) {
                    for (var i = 0; i < 36; i++) {
                        labelArray[i] = 0;
                    }
                    labelArray[stringToIndex[label]] = 1;
                } else {
                    bootbox.alert("Invalid input");
                    return;
                }
                socket.emit('train', canvasToArray(canvas, ctx), labelArray);
            }
        });
    });

    $('#guess').on('click touchend', function () {
        socket.emit('request-prediction', canvasToArray(canvas, ctx));
    });

    socket.on('send-prediction', function (p) {
        var i = p.indexOf(Math.max.apply(Math, p));
        bootbox.alert(indexToString[i]);
    });

    window.requestAnimationFrame(drawLoop);
});

function clearCanvas() {
    for (var key in canvasData) {
        if (canvasData.hasOwnProperty(key)) {
            canvasData[key] = [];
        }
    }
    canvasData.size = parseInt(0);
    oldDataSize = parseInt(0);
    canvasDraw(canvas, ctx, canvasData, true);
}

function drawLoop() {
    canvasDraw(canvas, ctx, canvasData);
    window.requestAnimationFrame(drawLoop);
}


function flushBuffer() {
    Array.prototype.push.apply(canvasData[sessionID], dataBuffer);
    canvasData.size += parseInt(dataBuffer.length);
    dataBuffer = [];
}

function initCanvas() {
    canvasData[sessionID] = [];
    canvasData.size = 0;

    canvas = document.getElementById("canvas");
    canvas.height = dim;
    canvas.width = dim;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvasOffsetX = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) + parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) + document.body.parentNode.offsetLeft;
    canvasOffsetY = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) + parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) + document.body.parentNode.offsetTop;

    $('#canvas').on('mousedown touchstart', function (e) {
        e.preventDefault();
        if (!mouseDown) {
            mouseDown = true;
            mousePos = getMousePos(canvas, e.originalEvent, canvasOffsetX, canvasOffsetY);
            var point = {};
            point.type = 'path-start';
            point.time = new Date().getTime();
            point.x = mousePos.x;
            point.y = mousePos.y;
            point.color = '#000';
            point.thickness = 1;
            dataBuffer.push(point);
            flushBuffer();
        }
    });

    $(window).on('mouseup touchend', function (e) {
        e.preventDefault();
        if (mouseDown) {
            mouseDown = false;
            flushBuffer();
        }
    });

    $(window).on('mousemove touchmove', function (e) {
        e.preventDefault();
        if (mouseDown) {
            var point = {};
            point.type = 'path-point';
            mousePos = getMousePos(canvas, e.originalEvent, canvasOffsetX, canvasOffsetY);
            point.x = mousePos.x;
            point.y = mousePos.y;
            dataBuffer.push(point);
            if ((dataBuffer.length > bufferLength) || (point.fromX === point.toX && point.fromY === point.toY)) {
                flushBuffer();
            }
        }
    });
}
