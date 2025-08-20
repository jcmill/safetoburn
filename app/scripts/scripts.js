"use strict";
// import "regenerator-runtime/runtime";
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

navigator.geolocation.getCurrentPosition(
  async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const weatherInfo = await getWeather(latitude, longitude);
    windspeed = parseFloat(weatherInfo.windSpeed.replace("mph", "").trim());
    console.log(windspeed);
    readings(windspeed);
  },
  (error) => {
    // Handle permission denied and or other errors
  }
);

async function getJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "SafeBurnApp" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return await res.json();
}

async function getWeather(latitude, longitude) {
  // Get grid endpoint for the location
  const pointData = await getJSON(
    `https://api.weather.gov/points/${latitude},${longitude}`
  );
  const hourlyUrl = pointData.properties.forecastHourly;

  const forecastData = await getJSON(hourlyUrl);
  const nextHour = forecastData.properties.periods[0];

  return {
    windSpeed: nextHour.windSpeed, // e.g. "8 mph"
    relativeHumidity: nextHour.relativeHumidity.value || null,
  };
}

const windspeedCircle = document.querySelector(".js-graph-circle--windspeed");
const windspeedText = document.querySelector(".js-windspeed-text");

const getOffset = (val = 0) => {
  const offset = 1100 - Math.round((860 / 100) * val);
  const cleanOffset = Number(offset >= 240 ? offset.toFixed(2) : 240);
  return cleanOffset;
};

const readings = (windspeed = 0, humidity) => {
  const windspeedPercentage = Number((windspeed / 10) * 100);
  windspeedCircle.style.strokeDashoffset = getOffset(windspeedPercentage);
  windspeedText.textContent = `${Number(windspeed)} mph`;

  windspeedPercentage <= 79
    ? (windspeedCircle.style.stroke = "#cc9c50")
    : windspeedPercentage >= 100
    ? (windspeedCircle.style.stroke = "red")
    : (windspeedCircle.style.stroke = "#f87819");
};

document.addEventListener("DOMContentLoaded", () => setTimeout(readings, 100));
