"use strict"; // use my location

var myLocationButton = document.querySelector(".js-my-location");
myLocationButton.addEventListener("click", function () {
  navigator.geolocation.getCurrentPosition(function _callee(position) {
    var latitude, longitude, weatherInfo;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            _context.next = 4;
            return regeneratorRuntime.awrap(getWeather(latitude, longitude));

          case 4:
            weatherInfo = _context.sent;
            windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
            humidity = weatherInfo.relativeHumidity;
            readings(windspeed, humidity);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    });
  }, function (error) {// Handle permission denied and or other errors
  });
}); // handle general json

function getJSON(url) {
  var res;
  return regeneratorRuntime.async(function getJSON$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(fetch(url, {
            headers: {
              "User-Agent": "SafeBurnApp"
            }
          }));

        case 2:
          res = _context2.sent;

          if (res.ok) {
            _context2.next = 5;
            break;
          }

          throw new Error("Request failed: ".concat(res.status));

        case 5:
          _context2.next = 7;
          return regeneratorRuntime.awrap(res.json());

        case 7:
          return _context2.abrupt("return", _context2.sent);

        case 8:
        case "end":
          return _context2.stop();
      }
    }
  });
} // handle api for weather information on weather.gov


function getWeather(latitude, longitude) {
  var pointData, hourlyUrl, forecastData, d, hours, periods, nextHourIndex, nextHour;
  return regeneratorRuntime.async(function getWeather$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(getJSON("https://api.weather.gov/points/".concat(latitude, ",").concat(longitude)));

        case 2:
          pointData = _context3.sent;
          hourlyUrl = pointData.properties.forecastHourly;
          console.log(hourlyUrl);
          _context3.next = 7;
          return regeneratorRuntime.awrap(getJSON(hourlyUrl));

        case 7:
          forecastData = _context3.sent;
          // get the date and hour of the user to grab the correct index of periods
          d = new Date();
          hours = d.getHours();
          periods = forecastData.properties.periods;
          nextHourIndex = periods.findIndex(function (period) {
            var periodHour = new Date(period.startTime).getHours();
            return periodHour === hours;
          });
          nextHour = periods[nextHourIndex];
          return _context3.abrupt("return", {
            windSpeed: nextHour.windSpeed,
            relativeHumidity: nextHour.relativeHumidity.value
          });

        case 14:
        case "end":
          return _context3.stop();
      }
    }
  });
} // functions to handle displaying needed information in graphs


var getOffset = function getOffset() {
  var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var offset = 1100 - Math.round(860 / 100 * val);
  var cleanOffset = Number(offset >= 240 ? offset.toFixed(2) : 240);
  return cleanOffset;
};

var readings = function readings() {
  var windspeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var humidity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
  var windspeedText = document.querySelector(".js-windspeed-text");
  var humidityCircle = document.querySelector(".js-graph-circle--humidity");
  var humidityText = document.querySelector(".js-humidity-text");
  var windspeedPercentage = Number(windspeed / 10 * 100);
  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = "".concat(Number(windspeed), " mph");
  humidityCircle.style.strokeDashoffset = getOffset(humidity);
  humidityText.textContent = "".concat(Number(humidity), "%");
  windspeedPercentage <= 79 ? windspeedCircle.style.stroke = "#cc9c50" : windspeedPercentage >= 100 ? windspeedCircle.style.stroke = "#c94c26" : windspeedCircle.style.stroke = "#f87819";
  humidity > 40 ? humidityCircle.style.stroke = "#cc9c50" : humidity <= 30 ? humidityCircle.style.stroke = "#c94c26" : humidityCircle.style.stroke = "#f87819";
};

document.addEventListener("DOMContentLoaded", function () {
  return setTimeout(readings, 100);
}); // function to handle saftey messages

var safeToBurn = function safeToBurn(windspeed, humidity) {
  var unsafeReasons = [];
  if (windspeed > 10) unsafeReasons.push("High wind (".concat(windMph, " mph)"));
  if (humidity < 30) unsafeReasons.push("Low humidity (".concat(humidity, "%)"));

  if (unsafeReasons.length === 0) {// functions for safe to burn messaging
  } else {// functions for unsafe to burn messaging
    }
};