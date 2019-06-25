var request = require('request');
const fetch = require('node-fetch');
var receivedData = false; 
var SerialPort = require('serialport');
var rpio = require('rpio');


//Websockets: 

var ws = require("nodejs-websocket")
var server = ws.createServer().listen(8001);


var throttleString = ""; 
var oldTimeStamp;
var newTimeStamp; 
var timeStampCount = 0; 




var url = 'https://api.cognitedata.com/api/0.5/projects/demo/timeseries/data';
var apiKey = 'UJMR4MSoNHx84Pt5yGSdTx9M8rsQujed';

var maxSendRate = 500;  // ms Arduino sends every 200ms

//signal that the code is running: 
//flash(1, 0, 0, 0.01);

// LED when sending data
//var ledPin = 40;
//var wifiPin = 22; // gpio25
//rpio.open(ledPin, rpio.OUTPUT, rpio.HIGH);
//rpio.open(wifiPin, rpio.OUTPUT, rpio.LOW);
//Add timeseries and tags to Cognite Data Platform (if not already in place) NOW: torque, rpm, wind
//-------------------------------------------------------------------------------------

// request({
// 	method: 'post',
// 	body: { items: [{'tagId': 'wind'},
//                   {'tagId': 'torque}'},
//                   {'tagId': 'rpm'},
//         ]},
// 	json: true,
// 	url: 'https://api.cognitedata.com/api/0.3/projects/demo/timeseries',
// 	headers: {'api-key': 'TESTKEY'}
// }, function (error, response, body) {
// 	//if(!error && response.statusCode == 200) {
// 	console.log(body);
// 	//}
// });

//Read data from serial port and save in appropriate variables, send to Cognite API
//------------------------------------------------------------------------------------
var serialPort = new SerialPort('/dev/ttyUSB0', { 
  baudrate: 9600,
  parser: SerialPort.parsers.readline('\n')
});
//
// var Readline = SerialPort.parsers.Readline;
// var parser serialPort.pipe(new Readline());
var tag = "";
// Debugging
var lastSendTime = 0;
var lastSendTime2= 0; 

var now = 0;
var now2= 0
/* Data is transmittet on serialPort on this format:
				rpm ##.##	torque ##.## wind ##.##
In this order
*/
var dataTurbine = {
  rpm:0.0,
  torque:0.0,
  wind:0.0,
  now:0
};

var hasCalledSendToAPI = false;

serialPort.on('open', function() {
  serialPort.flush(); //Flush data built up in serial connection
  console.log('Opening port');
  serialPort.on('data', function(data){
      //Split data string so first element is string with tag and second element is value:
      splitData = data.split(" ");
      tag = splitData[0];

      // console.log(data);
      dataTurbine.now = Date.now();
      //	console.log(splitData);
      dataTurbine.rpm = parseFloat(splitData[1]);
      dataTurbine.torque = parseFloat(splitData[3]);
      dataTurbine.wind = parseFloat(splitData[5]);
     
    // Sending throttle values with Serial cable 
    if (recievedData = true){
      //throttleValues = JSON.stringify(body.data.items[0].value);
 
    }
  });
  setTimeout(function() {
    sendDataToAPI();
  }, 1000);
});

function sendDataToAPI() {

  server.connections.forEach(function (conn) {
    conn.sendText(JSON.stringify({ rpm: dataTurbine.rpm, wind: dataTurbine.wind, torque: dataTurbine.torque }));
  })
  console.log(JSON.stringify({ rpm: dataTurbine.rpm, wind: dataTurbine.wind, torque: dataTurbine.torque }));


  now = Date.now();
  var deltaTime = now - lastSendTime;
  console.log(JSON.stringify(dataTurbine) + ' deltaTime: ' + deltaTime);


  request({
    method: 'post',
    body: {items:[
            { 'tagId': 'rpm5', 'datapoints':     [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.rpm }] },
            { 'tagId': 'torque5', 'datapoints': [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.torque}] },
            { 'tagId': 'wind5', 'datapoints':     [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.wind }] },
            
    ]},
    json: true,
    url: url,
    headers: {
      'api-key': apiKey
    }
  }).on('response', function(res) {
    

    //This is where the WIFI-signal should be performed. 
    // Old signal: rpio.write(wifiPin, rpio.HIGH);
    //flash(0, 255, 0, 0.01); //Yellow signal
    console.log(res.statusCode);
    if (res.statusCode == 200) {  // This could either be that everything is fine or that there is some friendly http password site
      sendDuration = Date.now() - now;
      if (/application\/json/.test(res.headers['content-type'])) {
        //blinkLed(ledPin, 70);
        //if successfully send to API, then blink ledstrip: 
        flash(0, 0, 255, 0.0005);
        console.log('setTimeout(sendDataToAPI,150); sendDuration=' + sendDuration);
        setTimeout(sendDataToAPI2, 750); 
        setTimeout(sendDataToAPI, 1400);
      } 
      else {
        setTimeout(sendDataToAPI, 1000);
      }
    } 

  }).on('error', function(err) {
    console.log('Error: ' + err);
    //Turns off wifi: 
    //rpio.write(wifiPin, rpio.LOW);
    setTimeout(sendDataToAPI, 1000);  // Not to overload the server when it's down
  });

  lastSendTime = now;
}

function sendDataToAPI2() {
  now = Date.now();
  var deltaTime = now - lastSendTime;
  console.log(JSON.stringify(dataTurbine) + ' deltaTime: ' + deltaTime);
  request({
    method: 'post',
    body: {items:[
            { 'tagId': 'rpm5extra', 'datapoints':     [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.rpm }] },
            { 'tagId': 'torque5extra', 'datapoints': [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.torque}] },
            { 'tagId': 'wind5extra', 'datapoints':     [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.wind }] },
    ]},
    json: true,
    url: url,
    headers: {
      'api-key': apiKey
    }
  }).on('response', function(res) {
    //This is where the WIFI-signal should be performed. 
    // Old signal: rpio.write(wifiPin, rpio.HIGH);
    //flash(0, 255, 0, 0.01); //Yellow signal
    console.log(res.statusCode);
    if (res.statusCode == 200) {  // This could either be that everything is fine or that there is some friendly http password site
      sendDuration = Date.now() - now;
      if (/application\/json/.test(res.headers['content-type'])) {
        //blinkLed(ledPin, 70);
        //if successfully send to API, then blink ledstrip: 
        flash(0, 0, 255, 0.01);
        console.log('setTimeout(sendDataToAPI,150); sendDuration=' + sendDuration);
        //setTimeout(sendDataToAPI2, 250);
      } 
      else {
        //setTimeout(sendDataToAPI2, 250);
      }
    } 
  }).on('error', function(err) {
    console.log('Error: ' + err);
    //Turns off wifi: 
    //rpio.write(wifiPin, rpio.LOW);
    //setTimeout(sendDataToAPI2, 1000);  // Not to overload the server when it's down
  });

  lastSendTime = now;
}

var LPD8806 = require('lpd8806-async/lib/LPD8806');
// npm install async
var async = require("async");
var leds = new LPD8806(2, '/dev/spidev0.0');
// Flash ledstrip by manipulation of the color brightness
function flash(r, g, b, speed){
  var i = 0;
  var step = speed;

  function performStep(){
    var level = 0.2,
    dir = step;
      
    async.whilst(function(){
      return (level >= 0.2);
    },function (callback) {
      setTimeout(function(){
        leds.setMasterBrightness(level);
        leds.fillRGB(r,g,b);
        if(level >= 0.99){
          dir =- step;
        }
        level += dir;
        callback();
      },4);
    }, function (err) {
      return;
    });
  }
  performStep();
}
