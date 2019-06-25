var request = require('request');
const fetch = require('node-fetch');
var receivedData = false; 
var SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

var rpio = require('rpio');

var throttleString = ""; 
var oldTimeStamp;
var newTimeStamp; 
var timeStampCount = 0; 

var url = 'https://api.cognitedata.com/api/0.3/projects/demo/timeseries/data';
var apiKey = 'UJMR4MSoNHx84Pt5yGSdTx9M8rsQujed';

var maxSendRate = 500;  // ms Arduino sends every 200ms

/*
var ws = require("nodejs-websocket")
var server = ws.createServer().listen(8001);
*/

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

const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });
const parser = port.pipe(new Readline({ delimiter: '\n' }));

//Read data from serial port and save in appropriate variables, send to Cognite API
//------------------------------------------------------------------------------------
/*
var serialPort = new SerialPort('/dev/ttyUSB0', { 
  baudrate: 9600,
  parser: SerialPort.parsers.readline('\n')
});
*/

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


// Read the port data
port.on("open", () => {
  port.flush();
  console.log('serial port open');
  parser.on('data', data =>{
    splitData = data.split(" ");
    tag = splitData[0];
    dataTurbine.now = Date.now();
  
    console.log('got word from arduino:', data);
    dataTurbine.rpm = parseFloat(splitData[1]); 
    dataTurbine.torque = parseFloat(splitData[3]);
    dataTurbine.wind = parseFloat(splitData[5]);
    
  });

  setTimeout(function() {
    sendDataToAPI();
  }, 600);
});




/*
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
      // if (!hasCalledSendToAPI) {
      //   sendDataToAPI();  // Hack to not send to API before Raspberry Pi has god sensor data from Arduino
      //   hasCalledSendToAPI = true;
      // }
    // Sending throttle values with Serial cable 
    if (recievedData = true){
      //throttleValues = JSON.stringify(body.data.items[0].value);
      serialPort.write(throttleValues, function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('throttle values sent');
      });
      
    }

  });
  setTimeout(function() {
    sendDataToAPI();
  }, 1000);
});
/*


/*
function blinkLed(pin, duration) {
    rpio.write(pin, rpio.HIGH);
    setTimeout(function() {
      rpio.write(pin, rpio.LOW);
    }, duration);
}

var y = setInterval(function() {
  const headers2 = {
    'Accept':'application/json',
    'api-key': apiKey
  };
  
  fetch('https://api.cognitedata.com/api/0.4/projects/demo/timeseries/latest/throttle5',{
    method: 'GET',
    headers: headers2
  }).then(function(res) {
      return res.json();
  }).then(function(body) {
      
      receivedData == true; 
      throttleValues = Math.floor(body.data.items[0].value);
      throttleString = throttleValues.toString();
      throttleString = throttleString + "e";
      
      oldTimeStamp = newTimeStamp; 
      newTimeStamp = body.data.items[0].timestamp;

      if (newTimeStamp != oldTimeStamp){
        timeStampCount = 0;
        console.log("New unique timestamp"); 
      }

      if (newTimeStamp == oldTimeStamp){
        if (timeStampCount > 20){
          throttleString = "99e"; 
        }
        timeStampCount +=1;
      }
      console.log(JSON.stringify(throttleString));
      serialPort.write(throttleString, function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('throttle values sent');
      });
  });
}, 1500);
*/

var mqtt = require('mqtt');
 const mqttClient  = mqtt.connect('mqtt://mqtt-demos.cognitedata.com');

function sendDataToAPI() {
  now = Date.now();
  var deltaTime = now - lastSendTime;
  console.log(JSON.stringify(dataTurbine) + ' deltaTime: ' + deltaTime);

 mqttClient.publish('ignite-windturbine', JSON.stringify({ rpm: dataTurbine.rpm, torque: dataTurbine.torque, wind: dataTurbine.wind, time: now }));
 
 //mqttClient.publish('pwc-windmill-sensors', JSON.stringify({ torque: dataTurbine.torque, time: now }));
 //mqttClient.publish('pwc-windmill-sensors', JSON.stringify({ wind: dataTurbine.wind, time: now }));
 //mqttClient.publish('cognite-web2mqtt', JSON.stringify({ 'tagId': 'torque5', 'datapoints': [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.torque}] }));
 //mqttClient.publish('cognite-web2mqtt', JSON.stringify({ 'tagId': 'wind5', 'datapoints':     [{ 'timestamp': dataTurbine.now, 'value': dataTurbine.wind }] }));
 //mqtt pub -t 'pwc-windmill-sensors' -h 'mqtt-pwc.cognitedata.com' -m '{ "rpm": 32 }'

 setTimeout(sendDataToAPI, 1000);
  lastSendTime = now;

}
/*
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
*/