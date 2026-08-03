function calculateSafetyScore(aqi) {
  if (aqi <= 50) {
    return { numericScore: 95, grade: "A", label: "Excellent Air Quality", color: "#2FBF9F" };
  } else if (aqi <= 100) {
    return { numericScore: 80, grade: "B", label: "Good Air Quality", color: "#7FD1A5" };
  } else if (aqi <= 150) {
    return { numericScore: 60, grade: "C", label: "Moderate Air Quality", color: "#E8B646" };
  } else if (aqi <= 200) {
    return { numericScore: 35, grade: "D", label: "Poor Air Quality", color: "#E2604F" };
  } else {
    return { numericScore: 10, grade: "F", label: "Hazardous Air Quality", color: "#B33A2E" };
  }
}