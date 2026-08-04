exports.handler = async function (event, context) {
  try {
    const body = JSON.parse(event.body);
    const { city, aqi, pm2_5, temperature, weatherCondition, isSensitiveGroup, planningOutdoorActivity } = body;

    if (!city || aqi === undefined || temperature === undefined ||
        isSensitiveGroup === undefined || planningOutdoorActivity === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required field" })
      };
    }

    const prompt = `You are a helpful air quality health advisor. Here is today's data for ${city}: AQI is ${aqi} (PM2.5: ${pm2_5 || "N/A"}), temperature is ${temperature}°C, weather condition is "${weatherCondition}". The user ${isSensitiveGroup ? "IS" : "is NOT"} in a sensitive group (asthma, elderly, respiratory condition), and ${planningOutdoorActivity ? "IS" : "is NOT"} planning outdoor activity today. In 3-4 short, plain-English sentences, give clear, specific, practical health advice. No disclaimers, no markdown formatting, no generic filler.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "AI service temporarily unavailable, please try again" })
      };
    }

    const recommendation = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ recommendation })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong, please try again" })
    };
  }
};