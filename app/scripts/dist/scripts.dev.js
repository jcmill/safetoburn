"use strict"; // import "regenerator-runtime/runtime";
// navigator.geolocation.getCurrentPosition(
//   (position) => {
//     const latitude = position.coords.latitude;
//     const longitude = position.coords.longitude;
//     getWeather(latitude, longitude);
//     console.log(getWeather(latitude, longitude));
//   },
//   (error) => {
//     // Handle permission denied and or other errors
//   }
// );

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
          console.log(windspeed);
          readings(windspeed);

        case 8:
        case "end":
          return _context.stop();
      }
    }
  });
}, function (error) {// Handle permission denied and or other errors
});

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
}

function getWeather(latitude, longitude) {
  var pointData, hourlyUrl, forecastData, nextHour;
  return regeneratorRuntime.async(function getWeather$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(getJSON("https://api.weather.gov/points/".concat(latitude, ",").concat(longitude)));

        case 2:
          pointData = _context3.sent;
          hourlyUrl = pointData.properties.forecastHourly;
          _context3.next = 6;
          return regeneratorRuntime.awrap(getJSON(hourlyUrl));

        case 6:
          forecastData = _context3.sent;
          nextHour = forecastData.properties.periods[0];
          return _context3.abrupt("return", {
            windSpeed: nextHour.windSpeed,
            // e.g. "8 mph"
            relativeHumidity: nextHour.relativeHumidity.value || null
          });

        case 9:
        case "end":
          return _context3.stop();
      }
    }
  });
}

var windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
var windspeedText = document.querySelector(".js-windspeed-text");

var getOffset = function getOffset() {
  var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var offset = 1100 - Math.round(860 / 100 * val);
  var cleanOffset = Number(offset >= 240 ? offset.toFixed(2) : 240);
  return cleanOffset;
};

var readings = function readings() {
  var windspeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var humidity = arguments.length > 1 ? arguments[1] : undefined;
  var windspeedPercentage = Number(windspeed / 10 * 100);
  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = "".concat(Number(windspeed), " mph");
  windspeedPercentage <= 79 ? windspeedCircle.style.stroke = "#cc9c50" : windspeedPercentage >= 100 ? windspeedCircle.style.stroke = "red" : windspeedCircle.style.stroke = "#f87819";
};

document.addEventListener("DOMContentLoaded", function () {
  return setTimeout(readings, 100);
});