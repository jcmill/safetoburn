"use strict"; // use my location

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var myLocationButton = document.querySelectorAll(".js-btn-location");
var searchButton = document.querySelector(".js-btn-search");
var searchForm = document.querySelector(".js-location-search");
var input = document.querySelector(".js-location-search__input");
var inputReset = document.querySelector(".js-input");
var resetButton = document.querySelector(".js-reset");
var dangerAlerts = [];
var urlSearch = window.location.search;
var locationLoadTime;
var weatherLoadTime;

function temporarilyThrottle(element) {
  var ms = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2000;
  element.disabled = true;
  setTimeout(function () {
    element.disabled = false;
  }, ms);
}

function handleMyLocationClick() {
  navigator.geolocation.getCurrentPosition(function _callee(position) {
    var latitude, longitude;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            getWeatherData(latitude, longitude);
            getFireAlerts(latitude, longitude);
            locationLoadTime = Math.round(performance.now());
            locationLoadTimeShort = Number(locationLoadTime.toString().slice(0, -1));
            hideBlueIcons(locationLoadTimeShort);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    });
  }, function (error) {
    var message = "Unable to retrieve your location.";

    if (error.code === error.PERMISSION_DENIED) {
      message = "Location permission denied. Please allow location access.";
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      message = "Location information is unavailable.";
    } else if (error.code === error.TIMEOUT) {
      message = "The request to get your location timed out.";
    }

    var errorEl = document.querySelector(".js-location-search__error");

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("c-location-search__hidden");
    } else {
      alert(message);
    }
  });
}

function hideBlueIcons(ms) {
  var windspeedBlue = document.querySelector(".js-windspeed-graph-icon--blue");
  var humidityBlue = document.querySelector(".js-humidity-graph-icon--blue");
  setTimeout(function () {
    windspeedBlue.classList.add("u-icon-hidden");
    humidityBlue.classList.add("u-icon-hidden");
  }, ms);
}

myLocationButton.forEach(function (btn) {
  btn.addEventListener("click", function (e) {
    temporarilyThrottle(myLocationButton);
    handleMyLocationClick();
  });
});

function addFocusVisible(e) {
  e.classList.add("focus-visible");
}

function removeFocusVisible(e) {
  e.classList.remove("focus-visible");
}

input.addEventListener("blur", function () {
  removeFocusVisible(input);
});
searchButton.addEventListener("click", function (e) {
  addFocusVisible(input);
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
  var pointData, county, hourlyUrl, forecastData, timeZone, formatter, parts, timeZoneOffset, dayValue, monthValue, yearValue, hourValue, periods, nextHourIndex, forNextHour;
  return regeneratorRuntime.async(function getWeather$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(getJSON("https://api.weather.gov/points/".concat(latitude, ",").concat(longitude)));

        case 2:
          pointData = _context3.sent;
          _context3.next = 5;
          return regeneratorRuntime.awrap(getJSON(pointData.properties.county));

        case 5:
          county = _context3.sent;
          buildLocation(pointData.properties.relativeLocation.properties.city, county.properties.name, county.properties.state);
          hourlyUrl = pointData.properties.forecastHourly;
          _context3.next = 10;
          return regeneratorRuntime.awrap(getJSON(hourlyUrl));

        case 10:
          forecastData = _context3.sent;
          timeZone = county.properties.timeZone[0];
          formatter = new Intl.DateTimeFormat("en", {
            timeZone: timeZone,
            timeZoneName: "longOffset",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          });
          parts = formatter.formatToParts(new Date());
          timeZoneOffset = parts.find(function (part) {
            return part.type === "timeZoneName";
          }).value.slice(4);
          dayValue = parts.find(function (part) {
            return part.type === "day";
          }).value.toString();
          monthValue = parts.find(function (part) {
            return part.type === "month";
          }).value.toString();
          yearValue = parts.find(function (part) {
            return part.type === "year";
          }).value.toString();
          hourValue = parts.find(function (part) {
            return part.type === "hour";
          }).value.toString();
          periods = forecastData.properties.periods;
          console.log("".concat(yearValue, "-").concat(monthValue, "-").concat(dayValue, "T").concat(hourValue, ":00:00-").concat(timeZoneOffset), periods);
          nextHourIndex = periods.findIndex(function (period) {
            return period.startTime.startsWith("".concat(yearValue, "-").concat(monthValue, "-").concat(dayValue, "T").concat(hourValue, ":00:00-").concat(timeZoneOffset));
          });
          forNextHour = periods[nextHourIndex];
          return _context3.abrupt("return", {
            windSpeed: forNextHour.windSpeed,
            relativeHumidity: forNextHour.relativeHumidity.value,
            relativeLocationCity: pointData.properties.relativeLocation.properties.city,
            relativeLocationState: pointData.properties.relativeLocation.properties.state
          });

        case 24:
        case "end":
          return _context3.stop();
      }
    }
  });
} // alerts function


function getFireAlerts(latitude, longitude) {
  var alertData, checkEvents, dangerEvents, burnAlerts, allAlertsSet, allAlerts, dangerAlerts;
  return regeneratorRuntime.async(function getFireAlerts$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(getJSON("https://api.weather.gov/alerts/active?point=".concat(latitude, ",").concat(longitude)));

        case 2:
          alertData = _context4.sent;
          checkEvents = ["Red Flag Warning", "Fire Weather Watch", "Burn Ban", "Air Quality Alert", "High Wind Warning", "Wind Advisory"];
          dangerEvents = ["Red Flag Warning", "Fire Weather Watch", "Burn Ban"];
          burnAlerts = alertData.features.filter(function (alert) {
            return checkEvents.some(function (event) {
              return alert.properties.event && alert.properties.event.toLowerCase() === event.toLowerCase();
            });
          });
          allAlertsSet = new Set(burnAlerts.map(function (alert) {
            return alert.properties.event;
          }));
          allAlerts = Array.from(allAlertsSet);
          dangerAlerts = allAlerts.filter(function (alert) {
            return dangerEvents.includes(alert);
          });
          buildAlerts(allAlerts);
          return _context4.abrupt("return", dangerAlerts);

        case 11:
        case "end":
          return _context4.stop();
      }
    }
  });
}

var weatherCache = {};

function getWeatherData(latitude, longitude) {
  var key, _weatherInfo, weatherInfo, dangerAlerts;

  return regeneratorRuntime.async(function getWeatherData$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          key = "".concat(latitude, ",").concat(longitude);

          if (!weatherCache[key]) {
            _context5.next = 8;
            break;
          }

          _weatherInfo = weatherCache[key];
          windspeed = parseFloat(_weatherInfo.windSpeed.replace("mph", "").trim());
          humidity = _weatherInfo.relativeHumidity;
          readings(windspeed, humidity);
          safeToBurn(windspeed, humidity, dangerAlerts);
          return _context5.abrupt("return");

        case 8:
          _context5.next = 10;
          return regeneratorRuntime.awrap(getWeather(latitude, longitude));

        case 10:
          weatherInfo = _context5.sent;
          weatherCache[key] = weatherInfo;
          windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
          humidity = weatherInfo.relativeHumidity;
          _context5.next = 16;
          return regeneratorRuntime.awrap(getFireAlerts(latitude, longitude));

        case 16:
          dangerAlerts = _context5.sent;
          readings(windspeed, humidity);
          safeToBurn(windspeed, humidity, dangerAlerts);
          weatherLoadTime = Math.round(performance.now());
          weatherLoadTimeShort = Number(weatherLoadTime.toString().slice(0, -1));
          hideBlueIcons(weatherLoadTimeShort);

        case 22:
        case "end":
          return _context5.stop();
      }
    }
  });
} // functions for getting searched location


function getLocation(postalCode) {
  var city,
      state,
      lat,
      lon,
      postalData,
      cityData,
      _args6 = arguments;
  return regeneratorRuntime.async(function getLocation$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          city = _args6.length > 1 && _args6[1] !== undefined ? _args6[1] : "Cupertino";
          state = _args6.length > 2 && _args6[2] !== undefined ? _args6[2] : "CA";

          if (!postalCode) {
            _context6.next = 12;
            break;
          }

          _context6.next = 5;
          return regeneratorRuntime.awrap(getJSON("https://nominatim.openstreetmap.org/search?postalcode=".concat(postalCode, "&country=us&format=json")));

        case 5:
          postalData = _context6.sent;

          if (postalData.length) {
            _context6.next = 8;
            break;
          }

          return _context6.abrupt("return");

        case 8:
          lat = postalData[0].lat;
          lon = postalData[0].lon;
          _context6.next = 19;
          break;

        case 12:
          _context6.next = 14;
          return regeneratorRuntime.awrap(getJSON("https://nominatim.openstreetmap.org/search?city=".concat(city, "&state=").concat(state, "&format=json")));

        case 14:
          cityData = _context6.sent;

          if (cityData.length) {
            _context6.next = 17;
            break;
          }

          return _context6.abrupt("return");

        case 17:
          lat = cityData[0].lat;
          lon = cityData[0].lon;

        case 19:
          _context6.next = 21;
          return regeneratorRuntime.awrap(getWeatherData(lat, lon));

        case 21:
          _context6.next = 23;
          return regeneratorRuntime.awrap(getFireAlerts(lat, lon));

        case 23:
        case "end":
          return _context6.stop();
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
  handleWindspeedGraph(windspeed);
  handleHumidityGraph(humidity);
};

function handleWindspeedGraph(reading) {
  var windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
  var windspeedText = document.querySelector(".js-windspeed-text");
  var windspeedGreen = document.querySelector(".js-windspeed-graph-icon--green");
  var windspeedOrange = document.querySelector(".js-windspeed-graph-icon--orange");
  var windspeedRed = document.querySelector(".js-windspeed-graph-icon--red");
  var windspeedMax = 20;
  var windspeedPercentage = Number(reading / windspeedMax * 100);
  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = "".concat(Number(reading), " mph");

  if (windspeedPercentage <= 75 && windspeedPercentage > 0) {
    windspeedCircle.style.stroke = "#cc9c50";
    windspeedGreen.classList.remove("u-icon-hidden");
    windspeedOrange.classList.add("u-icon-hidden");
    windspeedRed.classList.add("u-icon-hidden");
  } else if (windspeedPercentage > 76 && windspeedPercentage < 100) {
    windspeedCircle.style.stroke = "#f87819";
    windspeedGreen.classList.add("u-icon-hidden");
    windspeedOrange.classList.remove("u-icon-hidden");
    windspeedRed.classList.add("u-icon-hidden");
  } else if (windspeedPercentage === 100) {
    windspeedCircle.style.stroke = "#c94c26";
    windspeedGreen.classList.add("u-icon-hidden");
    windspeedOrange.classList.add("u-icon-hidden");
    windspeedRed.classList.remove("u-icon-hidden");
  }
}

function handleHumidityGraph(reading) {
  var humidityGreen = document.querySelector(".js-humidity-graph-icon--green");
  var humidityOrange = document.querySelector(".js-humidity-graph-icon--orange");
  var humidityRed = document.querySelector(".js-humidity-graph-icon--red");
  var humidityCircle = document.querySelector(".js-graph-circle--humidity");
  var humidityText = document.querySelector(".js-humidity-text");
  humidityCircle.style.strokeDashoffset = getOffset(reading);
  humidityText.textContent = "".concat(Number(reading), "%");

  if (reading >= 40) {
    humidityCircle.style.stroke = "#cc9c50";
    humidityGreen.classList.remove("u-icon-hidden");
    humidityOrange.classList.add("u-icon-hidden");
    humidityRed.classList.add("u-icon-hidden");
  } else if (reading > 15 && reading < 40) {
    humidityCircle.style.stroke = "#f87819";
    humidityGreen.classList.add("u-icon-hidden");
    humidityOrange.classList.remove("u-icon-hidden");
    humidityRed.classList.add("u-icon-hidden");
  } else if (reading <= 15) {
    humidityCircle.style.stroke = "#c94c26";
    humidityGreen.classList.add("u-icon-hidden");
    humidityOrange.classList.add("u-icon-hidden");
    humidityRed.classList.remove("u-icon-hidden");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  return setTimeout(readings, 100);
});

function updateContainer(selector, html) {
  var container = document.querySelector(selector);

  if (container) {
    container.innerHTML = "";
    container.insertAdjacentHTML("afterbegin", html);
  }
} // function to handle saftey messages


var safeToBurn = function safeToBurn() {
  var windspeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var humidity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var dangerAlerts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var warningReasons = [];
  var unsafeReasons = [];
  var safeResons = [];

  if (windspeed > 20) {
    unsafeReasons.push("<b>High wind</b> (".concat(windspeed, " mph)"));
  }

  if (humidity < 15) {
    unsafeReasons.push("<b>Low humidity</b> (".concat(humidity, "%)"));
  }

  if (dangerAlerts.length > 0) {
    unsafeReasons.push.apply(unsafeReasons, _toConsumableArray(dangerAlerts.map(function (alert) {
      return "a ".concat(alert);
    })));
  }

  if (windspeed > 15 && windspeed <= 20) {
    warningReasons.push("<b>High wind</b> (".concat(windspeed, " mph)"));
  }

  if (humidity >= 14 && humidity < 30) {
    warningReasons.push("<b>Low humidity</b> (".concat(humidity, "%)"));
  }

  if (windspeed <= 15) {
    safeResons.push("Windspeed");
  }

  if (humidity > 30) {
    safeResons.push("Humidity");
  }

  var warningResponse = warningReasons.join(" and ");
  var unsafeResponse = unsafeReasons.join(" and ");
  var htmlSafe = "\n    <div class=\"c-safe\">\n      <h2>It's safe to burn!</h2>\n      <div>\n        <img src=\"../images/vectors/icon-check.svg\" alt=\"check mark icon\">\n        <p>".concat(safeResons[0], "</p>\n        <img src=\"../images/vectors/icon-check.svg\" alt=\"check mark icon\">\n        <p>").concat(safeResons[1], "</p>\n      </div>\n    </div>\n  ");
  var htmlUnsafeReason = "\n    <div class=\"c-unsafe\">\n      <h2>It's <b>unsafe</b></h2> \n      <div>\n        <img src=\"../images/vectors/icon-x.svg\" alt=\"danger icon\">\n        <p>".concat(unsafeResponse, "</p>\n      </div>\n    </div>\n  ");
  var htmlWarningReason = "\n    <div class=\"c-warning\">\n      <h2>Use <b>caution</b></h2>\n      <div> \n        <img src=\"../images/vectors/icon-warning.svg\" alt=\"warning icon\">\n        <p>".concat(warningResponse, "</p>\n      </div>\n    </div>\n  ");

  if (unsafeReasons.length > 0) {
    updateContainer(".js-hero__details--response", htmlUnsafeReason);
  } else if (warningReasons.length > 0) {
    updateContainer(".js-hero__details--response", htmlWarningReason);
  } else {
    updateContainer(".js-hero__details--response", htmlSafe);
  }
}; // form validations


searchForm.addEventListener("submit", function _callee2(e) {
  var errorEl, value, match, city, state;
  return regeneratorRuntime.async(function _callee2$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          errorEl = document.querySelector(".js-location-search__error");
          temporarilyThrottle(input);
          readings(0, 0);
          errorEl.textContent = "";
          errorEl.classList.add("c-location-search__hidden");
          input.removeAttribute("aria-invalid");
          value = input.value.trim();

          if (value) {
            _context7.next = 15;
            break;
          }

          e.preventDefault();
          errorEl.textContent = "Please enter a city name or ZIP code.";
          errorEl.classList.remove("c-location-search__hidden");
          input.setAttribute("aria-invalid", "true");
          input.focus();
          _context7.next = 38;
          break;

        case 15:
          if (!(/^\d+$/.test(value) && (value.length < 5 || value.length > 5))) {
            _context7.next = 23;
            break;
          }

          e.preventDefault();
          errorEl.textContent = "ZIP codes must be 5 digits.";
          errorEl.classList.remove("c-location-search__hidden");
          input.setAttribute("aria-invalid", "true");
          input.focus();
          _context7.next = 38;
          break;

        case 23:
          if (!(/^\d+$/.test(value) && value.length === 5)) {
            _context7.next = 29;
            break;
          }

          e.preventDefault();
          _context7.next = 27;
          return regeneratorRuntime.awrap(getLocation(value));

        case 27:
          _context7.next = 38;
          break;

        case 29:
          if (/^\d+$/.test(value)) {
            _context7.next = 38;
            break;
          }

          e.preventDefault();
          match = value.trim().match(/^(.+)\s([a-zA-Z]{2})$/);

          if (match) {
            _context7.next = 34;
            break;
          }

          return _context7.abrupt("return");

        case 34:
          city = match[1].trim();
          state = match[2].toUpperCase();
          _context7.next = 38;
          return regeneratorRuntime.awrap(getLocation(null, city, state));

        case 38:
        case "end":
          return _context7.stop();
      }
    }
  });
});

function buildLocation(city, county, state) {
  updateContainer(".js-app__location--details", "In ".concat(city, ", ").concat(county, " county, ").concat(state));
}

function buildAlerts(alerts) {
  if (alerts.length >= 1) {
    updateContainer(".js-hero__details--alerts", "<h4>".concat(alerts.join(", "), "</h4>"));
  } else {
    updateContainer(".js-hero__details--alerts", "<h4>No alerts for this area</h4>");
  }
}

if (urlSearch) {
  var urlSearchLocation = function urlSearchLocation(url) {
    var cleanurlSearch, city, state;
    return regeneratorRuntime.async(function urlSearchLocation$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            cleanurlSearch = urlSearch.slice(1).split("&");
            city = cleanurlSearch[0].slice(5);
            state = cleanurlSearch[1].slice(6);
            getLocation(null, city, state);

          case 4:
          case "end":
            return _context8.stop();
        }
      }
    });
  };

  urlSearchLocation();
}