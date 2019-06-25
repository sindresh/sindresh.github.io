
var receivedData = false; 

var ds18b20 = require('ds18b20');

var throttleString = ""; 
var oldTimeStamp;
var newTimeStamp; 
var timeStampCount = 0; 

var url = 'https://api.cognitedata.com/api/0.3/projects/demo/timeseries/data';
var apiKey = 'UJMR4MSoNHx84Pt5yGSdTx9M8rsQujed';

var maxSendRate = 500;  // ms Arduino sends every 200ms
var tag = "";
// Debugging
var lastSendTime = 0;
var lastSendTime2= 0; 

var now = 0;
var now2= 0

var dataChemical = {
  temp: 0,
};
var hasCalledSendToAPI = false;





ds18b20.sensors(function(err, ids) {
  // got sensor IDs ...
});
// ... async call
ds18b20.temperature('10-00080283a977', function(err, value) {
  console.log('Current temperature is', value);
});
// ... or sync call
console.log('Current temperature is' + ds18b20.temperatureSync('10-00080283a977'));
// default parser is the decimal one. You can use the hex one by setting an option
ds18b20.temperature('10-00080283a977', {parser: 'hex'}, function(err, value) {
  console.log('Current temperature is', value);
});

console.log('Current temperature is' + ds18b20.temperatureSync('10-00080283a977', {parser: 'hex'}));





var mqtt = require('mqtt');
 const mqttClient  = mqtt.connect('mqtt://mqtt-chemical.cognitedata.com.');

function sendDataToAPI() {
    now = Date.now();
    var deltaTime = now - lastSendTime;
    console.log(JSON.stringify(dataTurbine) + ' deltaTime: ' + deltaTime);

    mqttClient.publish('pwc-windmill-sensors', JSON.stringify({ rpm: dataTurbine.rpm, time: now }));

    setTimeout(sendDataToAPI, maxSendRate);

  lastSendTime = now;
}
