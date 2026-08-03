document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const quickButtons = document.querySelectorAll(".quick-btn");
  const emptyState = document.getElementById("empty-state");

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
      emptyState.classList.add("hidden");
      renderSnapshot(data, "snapshot-card");
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
});