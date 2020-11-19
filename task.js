var canvas = document.getElementById("myCanvas")
var ctx = canvas.getContext("2d")

var base = 650;
var axisBase = 900
var width = 6;
var margin = { top: 20, left:20, right:20, bottom: 20}
var initX = margin.left;

window.onload = async () => {

    var dummyHigh = [];
    var dummyLow = [];
    var yMax, yMin, yInc, yPos = 0

    ctx.fillStyle = "#df294a";
    ctx.strokeStyle = "#df294a";
    ctx.lineWidth = 3;
    fetchSeriesData()
        .then(seriesData => {
            console.log("Series Data: ", seriesData);


            for (let i = 0; i < seriesData.length; i++){
                dummyHigh.push(seriesData[i][2])
                dummyLow.push(seriesData[i][3])
            }
            console.log("Dummy High Array is: ", dummyHigh);
            console.log("Dummy Low Array is: ", dummyLow);
            yMax = Math.max(...dummyHigh) + 10 // Let the Maximum Value on y-axis be 10 more than the maximum high value in the array
            yMin = Math.min(...dummyLow) - 10 // Let the Maximum Value on y-axis be 10 less than the minimum high value in t

            renderLabels(yMax, yMin)

            drawLine({x1: axisBase, y1: 0, x2: axisBase, y2:canvas.height}, ctx)

            let permittedBarsCount = Math.round(axisBase / (width + 10) ) // Number of bars that can display on the space
            if (seriesData.length >= permittedBarsCount){
                seriesData = seriesData.splice(1,permittedBarsCount-2)
                console.log(seriesData.length)
            }
            drawBars(seriesData,width,yMin,yMax,initX)

        })

    let counter = 0;
    let dataBag = [];
    subscribe(data => { // data: [time, open, high, low, close]
        // console.log(data)
        ctx.clearRect(0,0,canvas.width,canvas.height)

        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        dataBag.push(data);
        dataBag.reverse()
        drawLine({x1: axisBase, y1: 0, x2: axisBase, y2:canvas.height}, ctx)
        renderLabels(yMax, yMin)

        drawBars(dataBag,width,yMin,yMax,initX)
        dataBag.reverse()

        let permittedBarsCount = Math.round(axisBase / (width + 10) )
        if (dataBag.length >= permittedBarsCount){
            dataBag = dataBag.splice(1,permittedBarsCount-2)
            console.log(dataBag.length)
        }


    })

}

function drawLine(pt){
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pt.x1, pt.y1)
    ctx.lineTo(pt.x2, pt.y2)
    ctx.stroke()
    ctx.closePath()
}

function renderLabels(max, min){
    ctx.font = "12pt Calibri"
    let inc  = (max - min)/10 //For 10 labels on the y-axis
    ctx.fillStyle = "#ddd";
    for (let i = 0; i < 11; i++){
        let txt = Math.round(min + (i)*inc)
        ctx.fillText(txt.toString(),axisBase + 10, base - ((i)*59.09 + margin.bottom))
        drawLine({x1:axisBase,y1:base - ((i)*59.09 + margin.bottom),x2:axisBase + 7, y2:base - ((i)*59.09 + margin.bottom)},ctx)
    }
    ctx.fillStyle = "#df294a"
}

function drawBars(data, width, yMin, yMax, initX){

    data.forEach(d => {

        if (d[1] > d[4]){
            ctx.strokeStyle = "#2ebd85"
            ctx.fillStyle = "#2ebd85"
        }
        else{
            ctx.strokeStyle = "#df294a"
            ctx.fillStyle = "#df294a"
        }
        ctx.fillRect(initX,base - base*((d[1]-yMin)/(yMax-yMin)) - margin.bottom,width,d[4]-d[1])
        ctx.beginPath()
        ctx.moveTo(initX + width/2,base - base*((d[2]-yMin)/(yMax-yMin)) - margin.bottom)
        ctx.lineTo(initX + width/2,base - base*((d[3]-yMin)/(yMax-yMin)) -  margin.bottom)
        ctx.stroke()
        ctx.closePath()
        initX += width + 10
        ctx.strokeStyle = "#df294a"
        ctx.fillStyle = "#df294a"
    })
}

function subscribe(success) {
    try {
        const socket = new WebSocket('wss://stream.binance.com/stream?streams=btcusdt@kline_1m')
        socket.onmessage = e => {
            const res = JSON.parse(e.data)
            const { t, o, h, l, c } = res.data.k
            success([t, o, h, l, c]);
        }
    } catch(e) {
        console.error(e.message)
    }
}

function fetchSeriesData() {
    return new Promise((resolve, reject) => {
        fetch('https://www.binance.com/api/v1/klines?symbol=BTCUSDT&interval=1m')
            .then(async res => {
                const data = await res.json()
                const result = data.map(([time, open, high, low, close]) => [time, open, high, low, close])
                resolve(result)
            })
            .catch(e => reject(e))
    })
}