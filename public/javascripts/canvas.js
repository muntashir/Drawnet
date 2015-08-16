var paths = [];
var oldDataSize = 0;
var preCanvas;
var preCtx;

function initPreCanvas(canvas) {
    preCanvas = document.createElement('canvas');
    preCanvas.width = canvas.width;
    preCanvas.height = canvas.height;
    preCtx = preCanvas.getContext('2d');
}

//Inserts paths in order they are drawn according to time
function insertPath(path) {
    paths.push(jQuery.extend(true, {}, path));
}

function drawPaths(ctx) {
    for (var pathIndex = 0, outerLen = paths.length; pathIndex < outerLen; pathIndex += 1) {
        ctx.fillStyle = paths[pathIndex].color;
        ctx.strokeStyle = paths[pathIndex].color;
        ctx.lineWidth = paths[pathIndex].thickness;

        ctx.beginPath();
        ctx.arc(paths[pathIndex].startX, paths[pathIndex].startY, paths[pathIndex].thickness / 2, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(paths[pathIndex].startX, paths[pathIndex].startY);
        for (var pointIndex = 0, innerLen = paths[pathIndex].x.length - 2; pointIndex < innerLen; pointIndex += 1) {
            var c = (paths[pathIndex].x[pointIndex] + paths[pathIndex].x[pointIndex + 1]) / 2;
            var d = (paths[pathIndex].y[pointIndex] + paths[pathIndex].y[pointIndex + 1]) / 2;
            ctx.quadraticCurveTo(paths[pathIndex].x[pointIndex], paths[pathIndex].y[pointIndex], c, d);
        }
        ctx.quadraticCurveTo(paths[pathIndex].x[pointIndex], paths[pathIndex].y[pointIndex], paths[pathIndex].x[pointIndex + 1], paths[pathIndex].y[pointIndex + 1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(paths[pathIndex].x[pointIndex + 1], paths[pathIndex].y[pointIndex + 1], paths[pathIndex].thickness / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function canvasDraw(canvas, ctx, canvasData, forceUpdate) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Only update paths if new data is available or update is being forced
    if (canvasData.size >= oldDataSize || forceUpdate) {
        paths = [];
        var path = {};
        path.x = [];
        path.y = [];

        preCtx.fillStyle = 'white';
        preCtx.fillRect(0, 0, canvas.width, canvas.height);
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                var dataElement = canvasData[key];
                for (var i = 0, len = dataElement.length; i < len; i += 1) {
                    if (dataElement[i].type === 'path-start') {
                        path.time = dataElement[i].time;
                        path.color = dataElement[i].color;
                        path.startX = dataElement[i].x * canvas.width;
                        path.startY = dataElement[i].y * canvas.height;
                        if (forceUpdate) {
                            path.thickness = dataElement[i].thickness;
                        } else {
                            path.thickness = 1;
                        }
                    } else if (dataElement[i].type === 'path-point') {
                        path.x.push(dataElement[i].x * canvas.width);
                        path.y.push(dataElement[i].y * canvas.height);
                    }
                    if (i === len - 1 || dataElement[i + 1].type !== 'path-point') {
                        insertPath(path);
                        path = {};
                        path.x = [];
                        path.y = [];
                    }
                }
            }
        }
        oldDataSize = canvasData.size;
        drawPaths(preCtx);
    }

    if (preCanvas) {
        ctx.drawImage(preCanvas, 0, 0);
    }
}

function getMousePos(canvas, e, canvasOffsetX, canvasOffsetY) {
    var rect = canvas.getBoundingClientRect();
    if (e.clientX) {
        return {
            x: (e.clientX - rect.left - canvasOffsetX) / canvas.width,
            y: (e.clientY - rect.top - canvasOffsetY) / canvas.height
        };
    }
    if (e.changedTouches) {
        return {
            x: (e.changedTouches[0].pageX - rect.left) / canvas.width,
            y: (e.changedTouches[0].pageY - rect.top) / canvas.height
        };
    };
    return mousePos;
}