"use strict";
// const dotenv = require("dotenv");
// dotenv.config();
const myLocationButton = document.querySelectorAll(".js-btn-location");
const searchButton = document.querySelector(".js-btn-search");
const searchForm = document.querySelector(".js-location-search");
const input = document.querySelector(".js-location-search__input");
const inputReset = document.querySelector(".js-input");
const resetButton = document.querySelector(".js-reset");
const dangerAlerts = [];
const urlSearch = window.location.search;
let locationLoadTime;
let weatherLoadTime;

function temporarilyThrottle(element, ms = 2000) {
  element.disabled = true;
  setTimeout(() => {
    element.disabled = false;
  }, ms);
}

function handleMyLocationClick() {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      getWeatherData(latitude, longitude);
      getFireAlerts(latitude, longitude);
      getAqi(latitude, longitude);
      locationLoadTime = Math.round(performance.now());
      locationLoadTimeShort = Number(locationLoadTime.toString().slice(0, -1));
      hideBlueIcons(locationLoadTimeShort);
    },
    (error) => {
      let message = "Unable to retrieve your location.";
      if (error.code === error.PERMISSION_DENIED) {
        message = "Location permission denied. Please allow location access.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Location information is unavailable.";
      } else if (error.code === error.TIMEOUT) {
        message = "The request to get your location timed out.";
      }
      const errorEl = document.querySelector(".js-location-search__error");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("c-location-search__hidden");
      } else {
        alert(message);
      }
    }
  );
}

function hideBlueIcons(ms) {
  const windspeedBlue = document.querySelector(
    ".js-windspeed-graph-icon--blue"
  );
  const humidityBlue = document.querySelector(".js-humidity-graph-icon--blue");
  setTimeout(() => {
    windspeedBlue.classList.add("u-icon-hidden");
    humidityBlue.classList.add("u-icon-hidden");
  }, ms);
}

myLocationButton.forEach((btn) => {
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

input.addEventListener("blur", () => {
  removeFocusVisible(input);
});

searchButton.addEventListener("click", function (e) {
  addFocusVisible(input);
});

// handle general json
async function getJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "SafeBurnApp" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return await res.json();
}

// handle api for weather information on weather.gov
async function getWeather(latitude, longitude) {
  const pointData = await getJSON(
    `https://api.weather.gov/points/${latitude},${longitude}`
  );

  const county = await getJSON(pointData.properties.county);

  buildLocation(
    pointData.properties.relativeLocation.properties.city,
    county.properties.name,
    county.properties.state
  );

  const hourlyUrl = pointData.properties.forecastHourly;
  const forecastData = await getJSON(hourlyUrl);
  const timeZone = county.properties.timeZone[0];

  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timeZone,
    timeZoneName: "longOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  let timeZoneOffset = parts
    .find((part) => part.type === "timeZoneName")
    .value.slice(4);

  let dayValue = parts.find((part) => part.type === "day").value.toString();

  let monthValue = parts.find((part) => part.type === "month").value.toString();

  let yearValue = parts.find((part) => part.type === "year").value.toString();

  let hourValue = parts.find((part) => part.type === "hour").value.toString();

  const periods = forecastData.properties.periods;
  const nextHourIndex = periods.findIndex((period) => {
    return period.startTime.startsWith(
      `${yearValue}-${monthValue}-${dayValue}T${hourValue}:00:00-${timeZoneOffset}`
    );
  });

  const forNextHour = periods[nextHourIndex];

  return {
    windSpeed: forNextHour.windSpeed,
    relativeHumidity: forNextHour.relativeHumidity.value,
    relativeLocationCity: pointData.properties.relativeLocation.properties.city,
    relativeLocationState:
      pointData.properties.relativeLocation.properties.state,
  };
}

// alerts function
async function getFireAlerts(latitude, longitude) {
  const alertData = await getJSON(
    `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`
  );

  const checkEvents = [
    "Red Flag Warning",
    "Fire Weather Watch",
    "Burn Ban",
    "Air Quality Alert",
    "High Wind Warning",
    "Wind Advisory",
  ];

  const dangerEvents = ["Red Flag Warning", "Fire Weather Watch", "Burn Ban"];

  const burnAlerts = alertData.features.filter((alert) =>
    checkEvents.some(
      (event) =>
        alert.properties.event &&
        alert.properties.event.toLowerCase() === event.toLowerCase()
    )
  );

  const allAlertsSet = new Set(
    burnAlerts.map((alert) => alert.properties.event)
  );

  const allAlerts = Array.from(allAlertsSet);

  const dangerAlerts = allAlerts.filter((alert) =>
    dangerEvents.includes(alert)
  );
  buildAlerts(allAlerts);
  return dangerAlerts;
}

async function getAqi(latitude, longitude) {
  const API_KEY = "{{AQI_API_KEY}}";
  const alertData = await getJSON(
    `https://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${latitude}&longitude=${longitude}&distance=25&api_key=${API_KEY}`
  );
  console.log(alertData[0]);
}

const weatherCache = {};

async function getWeatherData(latitude, longitude) {
  const key = `${latitude},${longitude}`;
  if (weatherCache[key]) {
    const weatherInfo = weatherCache[key];
    windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
    humidity = weatherInfo.relativeHumidity;
    readings(windspeed, humidity);
    safeToBurn(windspeed, humidity, dangerAlerts);
    return;
  }
  const weatherInfo = await getWeather(latitude, longitude);
  weatherCache[key] = weatherInfo;
  windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
  humidity = weatherInfo.relativeHumidity;

  const dangerAlerts = await getFireAlerts(latitude, longitude);
  readings(windspeed, humidity);
  safeToBurn(windspeed, humidity, dangerAlerts);

  weatherLoadTime = Math.round(performance.now());
  weatherLoadTimeShort = Number(weatherLoadTime.toString().slice(0, -1));
  hideBlueIcons(weatherLoadTimeShort);
}

// functions for getting searched location
async function getLocation(postalCode, city = "Cupertino", state = "CA") {
  let lat, lon;
  if (postalCode) {
    const postalData = await getJSON(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=us&format=json`
    );
    if (!postalData.length) return;
    lat = postalData[0].lat;
    lon = postalData[0].lon;
  } else {
    const cityData = await getJSON(
      `https://nominatim.openstreetmap.org/search?city=${city}&state=${state}&format=json`
    );
    if (!cityData.length) return;
    lat = cityData[0].lat;
    lon = cityData[0].lon;
  }
  await getWeatherData(lat, lon);
  await getFireAlerts(lat, lon);
}

// functions to handle displaying needed information in graphs
const getOffset = (val = 0) => {
  const offset = 1100 - Math.round((860 / 100) * val);
  const cleanOffset = Number(offset >= 240 ? offset.toFixed(2) : 240);
  return cleanOffset;
};

const readings = (windspeed = 0, humidity = 0) => {
  handleWindspeedGraph(windspeed);
  handleHumidityGraph(humidity);
};

function handleWindspeedGraph(reading) {
  const windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
  const windspeedText = document.querySelector(".js-windspeed-text");
  const windspeedGreen = document.querySelector(
    ".js-windspeed-graph-icon--green"
  );
  const windspeedOrange = document.querySelector(
    ".js-windspeed-graph-icon--orange"
  );
  const windspeedRed = document.querySelector(".js-windspeed-graph-icon--red");

  const windspeedMax = 20;

  const windspeedPercentage = Number((reading / windspeedMax) * 100);

  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = `${Number(reading)} mph`;

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
  const humidityGreen = document.querySelector(
    ".js-humidity-graph-icon--green"
  );
  const humidityOrange = document.querySelector(
    ".js-humidity-graph-icon--orange"
  );
  const humidityRed = document.querySelector(".js-humidity-graph-icon--red");
  const humidityCircle = document.querySelector(".js-graph-circle--humidity");
  const humidityText = document.querySelector(".js-humidity-text");

  humidityCircle.style.strokeDashoffset = getOffset(reading);
  humidityText.textContent = `${Number(reading)}%`;

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

document.addEventListener("DOMContentLoaded", () => setTimeout(readings, 100));

function updateContainer(selector, html) {
  const container = document.querySelector(selector);
  if (container) {
    container.innerHTML = "";
    container.insertAdjacentHTML("afterbegin", html);
  }
}

// function to handle saftey messages
const safeToBurn = (windspeed = 0, humidity = 0, dangerAlerts = []) => {
  const warningReasons = [];
  const unsafeReasons = [];
  const safeResons = [];

  if (windspeed > 20) {
    unsafeReasons.push(`<b>High wind</b> (${windspeed} mph)`);
  }
  if (humidity < 15) {
    unsafeReasons.push(`<b>Low humidity</b> (${humidity}%)`);
  }
  if (dangerAlerts.length > 0) {
    unsafeReasons.push(...dangerAlerts.map((alert) => `a ${alert}`));
  }
  if (windspeed > 15 && windspeed <= 20) {
    warningReasons.push(`<b>High wind</b> (${windspeed} mph)`);
  }
  if (humidity >= 14 && humidity < 30) {
    warningReasons.push(`<b>Low humidity</b> (${humidity}%)`);
  }
  if (windspeed <= 15) {
    safeResons.push(`Windspeed`);
  }
  if (humidity > 30) {
    safeResons.push(`Humidity`);
  }

  let warningResponse = warningReasons.join(" and ");
  let unsafeResponse = unsafeReasons.join(" and ");

  const htmlSafe = `
    <div class="c-safe">
      <h2>It's safe to burn!</h2>
      <div>
        <img src="../images/vectors/icon-check.svg" alt="check mark icon">
        <p>${safeResons[0]}</p>
        <img src="../images/vectors/icon-check.svg" alt="check mark icon">
        <p>${safeResons[1]}</p>
      </div>
    </div>
  `;
  const htmlUnsafeReason = `
    <div class="c-unsafe">
      <h2>It's <b>unsafe</b></h2> 
      <div>
        <img src="../images/vectors/icon-x.svg" alt="danger icon">
        <p>${unsafeResponse}</p>
      </div>
    </div>
  `;
  const htmlWarningReason = `
    <div class="c-warning">
      <h2>Use <b>caution</b></h2>
      <div> 
        <img src="../images/vectors/icon-warning.svg" alt="warning icon">
        <p>${warningResponse}</p>
      </div>
    </div>
  `;

  if (unsafeReasons.length > 0) {
    updateContainer(".js-hero__details--response", htmlUnsafeReason);
  } else if (warningReasons.length > 0) {
    updateContainer(".js-hero__details--response", htmlWarningReason);
  } else {
    updateContainer(".js-hero__details--response", htmlSafe);
  }
};

// form validations
searchForm.addEventListener("submit", async function (e) {
  const errorEl = document.querySelector(".js-location-search__error");

  temporarilyThrottle(input);

  readings(0, 0);
  errorEl.textContent = "";
  errorEl.classList.add("c-location-search__hidden");
  input.removeAttribute("aria-invalid");

  const value = input.value.trim();

  if (!value) {
    e.preventDefault();
    errorEl.textContent = "Please enter a city name or ZIP code.";
    errorEl.classList.remove("c-location-search__hidden");
    input.setAttribute("aria-invalid", "true");
    input.focus();
  } else if (/^\d+$/.test(value) && (value.length < 5 || value.length > 5)) {
    e.preventDefault();
    errorEl.textContent = "ZIP codes must be 5 digits.";
    errorEl.classList.remove("c-location-search__hidden");
    input.setAttribute("aria-invalid", "true");
    input.focus();
  } else if (/^\d+$/.test(value) && value.length === 5) {
    e.preventDefault();
    await getLocation(value);
  } else if (!/^\d+$/.test(value)) {
    e.preventDefault();
    const match = value.trim().match(/^(.+)\s([a-zA-Z]{2})$/);
    if (!match) {
      return;
    }
    const city = match[1].trim();
    const state = match[2].toUpperCase();
    await getLocation(null, city, state);
  }
});

function buildLocation(city, county, state) {
  updateContainer(
    ".js-app__location--details",
    `In ${city}, ${county} county, ${state}`
  );
}

function buildAlerts(alerts) {
  if (alerts.length >= 1) {
    updateContainer(
      ".js-hero__details--alerts",
      `<h4>${alerts.join(", ")}</h4>`
    );
  } else {
    updateContainer(
      ".js-hero__details--alerts",
      "<h4>No alerts for this area</h4>"
    );
  }
}

if (urlSearch) {
  async function urlSearchLocation(url) {
    const cleanurlSearch = urlSearch.slice(1).split("&");
    const city = cleanurlSearch[0].slice(5);
    const state = cleanurlSearch[1].slice(6);

    getLocation(null, city, state);
  }

  urlSearchLocation();
}
