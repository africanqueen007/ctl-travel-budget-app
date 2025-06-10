export default async function handler(req, res) {
  const prompt = `What are the current exchange rates for 1 CNY to USD, 1 INR to USD, and 1 PHP to USD? Please provide the answer in a valid JSON format like this: {"CNY": 0.14, "INR": 0.012, "PHP": 0.017}`;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const ratesJson = result.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(ratesJson));

  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    res.status(500).json({ "CNY": 0.14, "INR": 0.012, "PHP": 0.017 }); // Fallback
  }
}