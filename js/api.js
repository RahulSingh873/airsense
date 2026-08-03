async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found");
  }

  const result = data.results[0];
  return {
    cityName: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

async function getAirQuality(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.current) {
    throw new Error("Air quality data unavailable");
  }

  return {
    aqi: data.current.us_aqi,
    pm2_5: data.current.pm2_5,
    pm10: data.current.pm10
  };
}

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.current) {
    throw new Error("Weather data unavailable");
  }

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code
  };
}

async function fetchCityData(cityName) {
  const location = await geocodeCity(cityName);
  const [airQuality, weather] = await Promise.all([
    getAirQuality(location.latitude, location.longitude),
    getWeather(location.latitude, location.longitude)
  ]);

  return {
    ...location,
    ...airQuality,
    ...weather
  };
}