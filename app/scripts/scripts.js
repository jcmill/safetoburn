"use strict";
// use my location
const myLocationButton = document.querySelector(".js-my-location");

myLocationButton.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const weatherInfo = await getWeather(latitude, longitude);
      windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
      humidity = weatherInfo.relativeHumidity;
      readings(windspeed, humidity);
    },
    (error) => {
      // Handle permission denied and or other errors
    }
  );
});

// handle general json
async function getJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "SafeBurnApp" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return await res.json();
}

// handle api for weather information on weather.gov
async function getWeather(latitude, longitude) {
  // Get grid endpoint for the location
  const pointData = await getJSON(
    `https://api.weather.gov/points/${latitude},${longitude}`
  );
  const hourlyUrl = pointData.properties.forecastHourly;
  console.log(hourlyUrl);
  const forecastData = await getJSON(hourlyUrl);
  // get the date and hour of the user to grab the correct index of periods
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
  };
}

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

  const windspeedPercentage = Number((windspeed / 10) * 100);

  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = `${Number(windspeed)} mph`;

  humidityCircle.style.strokeDashoffset = getOffset(humidity);
  humidityText.textContent = `${Number(humidity)}%`;

  windspeedPercentage <= 79
    ? (windspeedCircle.style.stroke = "#cc9c50")
    : windspeedPercentage >= 100
    ? (windspeedCircle.style.stroke = "#c94c26")
    : (windspeedCircle.style.stroke = "#f87819");

  humidity > 40
    ? (humidityCircle.style.stroke = "#cc9c50")
    : humidity <= 30
    ? (humidityCircle.style.stroke = "#c94c26")
    : (humidityCircle.style.stroke = "#f87819");
};

document.addEventListener("DOMContentLoaded", () => setTimeout(readings, 100));
