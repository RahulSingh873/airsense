const weatherCodeMap = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  95: "Thunderstorm"
};

function getWeatherLabel(code) {
  return weatherCodeMap[code] || "Unknown conditions";
}

function showStatusMessage(message, type) {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.className = "status-message " + (type || "");
}

function clearStatusMessage() {
  const el = document.getElementById("status-message");
  el.textContent = "";
  el.className = "status-message";
}

function renderSnapshot(data, containerId) {
  const container = document.getElementById(containerId || "snapshot-card");
  const score = calculateSafetyScore(data.aqi);
  const weatherLabel = getWeatherLabel(data.weatherCode);


  container.innerHTML = `
    <div class="snapshot-header">
      <h2>${data.cityName}, ${data.country}</h2>
      <span class="safety-badge" style="background-color: ${score.color}">
        ${score.grade}
      </span>
    </div>
    <div class="snapshot-details">
      <div class="detail-item">
        <span class="detail-label">AQI</span>
        <span class="detail-value">${data.aqi}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Condition</span>
        <span class="detail-value">${score.label}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Temperature</span>
        <span class="detail-value">${data.temperature}°C</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Humidity</span>
        <span class="detail-value">${data.humidity}%</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Weather</span>
        <span class="detail-value">${weatherLabel}</span>
      </div>
    </div>
  `;

  container.classList.remove("hidden");
}

function renderRecommendation(text) {
     const container = document.getElementById("ai-card");
     container.innerHTML = `
       <h3>Your Recommendation</h3>
       <p>${text}</p>
     `;
     container.classList.remove("hidden");
   }

   function showRecommendationError(message) {
     const container = document.getElementById("ai-card");
     container.innerHTML = `<p class="rec-error">${message}</p>`;
     container.classList.remove("hidden");
   }

   function renderSuggestions(suggestions, containerId, onSelect) {
  const container = document.getElementById(containerId);

  if (!suggestions.length) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  container.innerHTML = suggestions.map((s, i) => `
    <div class="suggestion-item" data-index="${i}">
      ${s.name}${s.admin1 ? ", " + s.admin1 : ""}, ${s.country}
    </div>
  `).join("");

  container.classList.remove("hidden");

  container.querySelectorAll(".suggestion-item").forEach((el) => {
    el.addEventListener("click", () => {
      const index = parseInt(el.getAttribute("data-index"));
      onSelect(suggestions[index]);
      hideSuggestions(containerId);
    });
  });
}

function hideSuggestions(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  container.classList.add("hidden");
}