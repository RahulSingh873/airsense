async function getRecommendation(payload) {
  const response = await fetch("/.netlify/functions/get-recommendation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get recommendation");
  }

  return data.recommendation;
}