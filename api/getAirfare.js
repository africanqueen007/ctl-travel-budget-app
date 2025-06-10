export default async function handler(req, res) {
  const { destination } = req.query;

  if (!destination) {
    return res.status(400).json({ error: 'Destination is required' });
  }

  const prompt = `Find the median roundtrip business class flight price from Manila (MNL) to ${destination}. Return only the price in USD as a single number, without currency symbols or commas. For example: 2500.34`;
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
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedPrice = parseFloat(text?.replace(/[^0-9.]/g, ''));

    if (!isNaN(parsedPrice)) {
      res.status(200).json({ price: parsedPrice });
    } else {
      res.status(200).json({ price: 1500 }); // Fallback
    }
  } catch (error) {
    console.error('Airfare fetch error:', error);
    res.status(500).json({ price: 1500 }); // Fallback on error
  }
}