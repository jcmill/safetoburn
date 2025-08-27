"use strict";
// use my location
const myLocationButton = document.querySelector(".js-my-location");
const form = document.querySelector("form");
const input = document.querySelector(".js-location-search__input");
const locationContainer = document.querySelector(".js-hero__details--response");
const inputReset = document.querySelector(".js-input");
const resetButton = document.querySelector(".js-reset");
const dangerAlerts = [];
const urlSearch = window.location.search;

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
      // Display error to user (customize selector as needed)
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

if (myLocationButton) {
  myLocationButton.addEventListener("click", function (e) {
    temporarilyThrottle(myLocationButton);
    handleMyLocationClick();
  });
}

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
  const d = new Date();
  let hours = d.getHours();

  const periods = forecastData.properties.periods;
  const nextHourIndex = periods.findIndex((period) => {
    const periodHour = new Date(period.startTime).getHours();
    return periodHour === hours;
  });

  const nextHour = periods[nextHourIndex];

  return {
    windSpeed: nextHour.windSpeed,
    relativeHumidity: nextHour.relativeHumidity.value,
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

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(readings, 100);
  getLocation(null);
});

// functions to handle displaying needed information in graphs
const getOffset = (val = 0) => {
  const offset = 1100 - Math.round((860 / 100) * val);
  const cleanOffset = Number(offset >= 240 ? offset.toFixed(2) : 240);
  return cleanOffset;
};

const readings = (windspeed = 0, humidity = 0) => {
  const windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
  const windspeedText = document.querySelector(".js-windspeed-text");
  const humidityCircle = document.querySelector(".js-graph-circle--humidity");
  const humidityText = document.querySelector(".js-humidity-text");

  const windspeedMax = 15;

  const windspeedPercentage = Number((windspeed / windspeedMax) * 100);

  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = `${Number(windspeed)} mph`;

  humidityCircle.style.strokeDashoffset = getOffset(humidity);
  humidityText.textContent = `${Number(humidity)}%`;

  windspeedPercentage <= 80
    ? (windspeedCircle.style.stroke = "#cc9c50")
    : windspeedPercentage >= 100
    ? (windspeedCircle.style.stroke = "#c94c26")
    : (windspeedCircle.style.stroke = "#f87819");

  humidity > 30
    ? (humidityCircle.style.stroke = "#cc9c50")
    : humidity <= 15
    ? (humidityCircle.style.stroke = "#c94c26")
    : (humidityCircle.style.stroke = "#f87819");
};

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

  if (windspeed > 15) {
    unsafeReasons.push(`<b>High wind</b> (${windspeed} mph)`);
  }
  if (humidity < 15) {
    unsafeReasons.push(`<b>Low humidity</b> (${humidity}%)`);
  }
  if (dangerAlerts.length > 0) {
    unsafeReasons.push(...dangerAlerts.map((alert) => `a ${alert}`));
  }
  if (windspeed >= 11 && windspeed <= 15) {
    warningReasons.push(`<b>High wind</b> (${windspeed} mph)`);
  }
  if (humidity >= 14 && humidity <= 30) {
    warningReasons.push(`<b>Low humidity</b> (${humidity}%)`);
  }

  let warningResponse = warningReasons.join(" and ");
  let unsafeResponse = unsafeReasons.join(" and ");

  const htmlSafe = `
    <div class="c-safe">
      <h2>It's safe to burn!</h2>
    </div>
  `;
  const htmlUnsafeReason = `
    <div class="c-unsafe">
      <h3>It's <b>unsafe</b> to burn because ${unsafeResponse}</h3>
    </div>
  `;
  const htmlWarningReason = `
    <div class="c-warning">
      <h3>Use <b>caution</b> when burning because of ${warningResponse}</h3>
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
form.addEventListener("submit", async function (e) {
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
    ".js-hero__details--location",
    `<h4>In ${city}, ${county} county, ${state}</h4>`
  );
}

function buildAlerts(alerts) {
  if (alerts.length >= 1) {
    updateContainer(
      ".js-hero__details--alerts",
      `<p><b>Beware of alerts:</b> ${alerts.join(", ")}</p>`
    );
  } else {
    updateContainer(".js-hero__details--alerts", "");
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
