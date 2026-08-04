document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const quickButtons = document.querySelectorAll(".quick-btn");
  const emptyState = document.getElementById("empty-state");

  const personalizationSection = document.getElementById("personalization-section");
  const toggleButtons = document.querySelectorAll(".toggle-btn");
  const getRecommendationBtn = document.getElementById("get-recommendation-btn");
  let currentCityData = null;
  let answers = { sensitive: null, outdoor: null };

  const compareToggleBtn = document.getElementById("compare-toggle-btn");
  const compareSection = document.getElementById("compare-section");
  const cityInput2 = document.getElementById("city-input-2");
  const searchBtn2 = document.getElementById("search-btn-2");

  async function handleSearch(cityName) {
    const trimmedCity = cityName.trim();

    if (!trimmedCity) {
      showStatusMessage("Please enter a city name.", "error");
      return;
    }

    clearStatusMessage();
    showStatusMessage("Fetching live data...", "loading");
    searchBtn.disabled = true;

    try {
      const data = await fetchCityData(trimmedCity);
      currentCityData = data;
      emptyState.classList.add("hidden");
      renderSnapshot(data, "snapshot-card");
      personalizationSection.classList.remove("hidden");
      document.getElementById("ai-card").classList.add("hidden");
      clearStatusMessage();
    } catch (error) {
      showStatusMessage("City not found — try another name or use a quick-select below.", "error");
    } finally {
      searchBtn.disabled = false;
    }
  }

  searchBtn.addEventListener("click", () => {
    handleSearch(cityInput.value);
  });

  cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch(cityInput.value);
    }
  });

  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const city = btn.getAttribute("data-city");
      cityInput.value = city;
      handleSearch(city);
    });
  });
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const question = btn.getAttribute("data-question");
      const value = btn.getAttribute("data-value") === "true";
      answers[question] = value;

      document.querySelectorAll(`[data-question="${question}"]`).forEach((b) => {
        b.classList.remove("selected");
      });
      btn.classList.add("selected");

      if (answers.sensitive !== null && answers.outdoor !== null) {
        getRecommendationBtn.disabled = false;
      }
    });
  });

  getRecommendationBtn.addEventListener("click", async () => {
    if (!currentCityData) return;

    getRecommendationBtn.disabled = true;
    getRecommendationBtn.textContent = "Thinking...";

    try {
      const recommendation = await getRecommendation({
        city: currentCityData.cityName,
        aqi: currentCityData.aqi,
        pm2_5: currentCityData.pm2_5,
        temperature: currentCityData.temperature,
        weatherCondition: getWeatherLabel(currentCityData.weatherCode),
        isSensitiveGroup: answers.sensitive,
        planningOutdoorActivity: answers.outdoor
      });
      renderRecommendation(recommendation);
    } catch (error) {
      showRecommendationError("Unable to get a recommendation right now. Please try again.");
    } finally {
      getRecommendationBtn.disabled = false;
      getRecommendationBtn.textContent = "Get My Recommendation";
    }
  });

  compareToggleBtn.addEventListener("click", () => {
    compareSection.classList.toggle("hidden");
    if (!compareSection.classList.contains("hidden")) {
      compareToggleBtn.textContent = "− Hide comparison";
    } else {
      compareToggleBtn.textContent = "+ Compare with another city";
    }
  });

  async function handleSecondSearch(cityName) {
    const trimmedCity = cityName.trim();
    if (!trimmedCity) return;

    searchBtn2.disabled = true;
    try {
      const data = await fetchCityData(trimmedCity);
      renderSnapshot(data, "snapshot-card-2");
    } catch (error) {
      const container = document.getElementById("snapshot-card-2");
      container.innerHTML = `<p class="rec-error">City not found — try another name.</p>`;
      container.classList.remove("hidden");
    } finally {
      searchBtn2.disabled = false;
    }
  }

  searchBtn2.addEventListener("click", () => {
    handleSecondSearch(cityInput2.value);
  });

  cityInput2.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSecondSearch(cityInput2.value);
    }
  });
});