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

var dim;
var netDim;
var netCanvas;
var netCtx;

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
    "9": 9
};

function getNetInputs() {
    canvasDraw(netCanvas, netCtx, canvasData, true);
    var array = [];
    var data = netCtx.getImageData(0, 0, netDim, netDim).data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        array.push(2 * (avg / 255) - 1);
    }
    return array;
}

function initNetCanvas(canvas) {
    netCanvas = document.createElement('canvas');
    var scale = netDim / dim;
    netCanvas.width = canvas.width;
    netCanvas.height = canvas.height;
    netCtx = netCanvas.getContext('2d');
    netCtx.scale(scale, scale);
}

function processing() {
    $('#train').prop('disabled', true);
    $('#guess').prop('disabled', true);
}

function doneProcessing() {
    $('#train').prop('disabled', false);
    $('#guess').prop('disabled', false);
}

$(document).ready(function () {
    socket = io();

    socket.on('init', function (d, s) {
        dim = d;
        netDim = s;
        initCanvas();
        initPreCanvas(canvas);
        initNetCanvas(canvas);
        window.requestAnimationFrame(drawLoop);
    });

    $(window).on('beforeunload', function () {
        socket.close();
    });

    $('#clear').on('click touchend', function () {
        clearCanvas();
    });

    $('#train').on('click touchend', function () {

    });

    $('#guess').on('click touchend', function () {
        socket.emit('request-prediction', getNetInputs());
        processing();
    });

    socket.on('send-prediction', function (pred, confidence) {
        doneProcessing();
        bootbox.dialog({
            title: "Guess: " + pred.toString() + " Confidence: " + confidence.toFixed(2) + "%",
            message: "Is this correct?",
            buttons: {
                no: {
                    label: "No",
                    className: "btn-danger",
                    callback: function () {
                        bootbox.prompt({
                            title: "What was the answer? (numbers only)",
                            value: "",
                            callback: function (label) {
                                var labelArray = [];
                                if (stringToIndex.hasOwnProperty(label)) {
                                    for (var i = 0; i < 10; i++) {
                                        labelArray[i] = 0;
                                    }
                                    labelArray[stringToIndex[label]] = 1;
                                } else {
                                    bootbox.alert("Invalid input");
                                    return;
                                }
                                socket.emit('train', getNetInputs(), labelArray);
                                processing();
                            }
                        });
                    }
                },
                yes: {
                    label: "Yes",
                    className: "btn-success",
                    callback: function () {}
                }
            }
        });
    });

    socket.on('done-train', function (pred, confidence) {
        doneProcessing();
    });
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
            point.thickness = dim / 5;
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