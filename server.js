var _ = require('lodash'),
    express = require('express'),
    bodyParser = require('body-parser'),
    moment = require('moment-timezone');

var app = express();

// Parse application/json
app.use(bodyParser.json())

// Stub data
var locale = "Pacific/Auckland";
function makeNight(dateStr) {
  return moment.tz(dateStr, locale).startOf('day').unix();
}

var data = [
  makeNight("2016-01-01"),
  makeNight("2016-01-08"),
  makeNight("2016-02-14"),
  makeNight("2016-02-29"),
  makeNight("2016-03-15"),
  makeNight("2016-03-16"),
  makeNight("2016-04-12"),
  makeNight("2016-04-18"),
  makeNight("2016-05-25"),
  makeNight("2016-06-18"),
  makeNight("2016-08-11"),
  makeNight("2016-09-25"),
  makeNight("2016-10-14"),
  makeNight("2016-12-29"),
  makeNight("2017-01-25"),
  makeNight("2017-02-21"),
  makeNight("2017-02-08"),
  makeNight("2017-03-31")
];


// Probably not the safest way to handle CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.header("Access-Control-Allow-Headers",
             "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Simulate failure every so often
var failureProb = 0.1;

// Simulate latency
var maxLatency = 1500;

// JSON-encodes data for response and sends with random latency
function send(response, data) {
  var latency = Math.floor(Math.random() * maxLatency);
  setTimeout(function() {
    response.send(JSON.stringify(data))
  }, latency);
}

function badRequest(response) {
  response.status(400);
  response.send('Bad Request');
}

function internalError(response) {
  response.status(500);
  response.send('Internal Server Error');
}


// End-point to get booked nights
// * start and end are integers (seconds since Unix epoch)
app.get('/reserved/:start/:end', function(request, response) {
  var start = parseInt(request.params.start);
  var end   = parseInt(request.params.end);
  if (isNaN(start) || isNaN(end)) {
    badRequest(response);
    return;
  }

  if (Math.random() < failureProb) {
    internalError(response);
    return;
  }

  var reserved = _.filter(data, function(night) {
    return night >= start && night <= end;
  });
  send(response, {
    reserved: reserved
  });
});

// End-point to change
app.put('/reserved/:date', function(request, response) {
  var date = request.params.date;
  var reserved = !!request.body.reserved;
  if (isNaN(date)) {
    badRequest(response);
    return;
  }
  else if (Math.random() < failureProb) {
    internalError(response);
    return;
  }
  else {
    var date = moment.unix(date).tz(locale).startOf('day').unix();
    if (reserved) {
      data.push(date);
      data.sort();
      data = _.sortedUniq(data);
    } else {
      _.pull(data, date);
    }
    send(response, {
      ok: true
    });
  }
});

// Get server time
app.get('/now', function(request, response) {
  send(response, {
    time: moment(new Date()).unix()
  });
});

var port = 3000;
console.info("API server listening at http://localhost:" + port)
app.listen(port);
