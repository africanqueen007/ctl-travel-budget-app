export default async function handler(req, res) {
  const { destination, targetDate, travelDays } = req.query;

  if (!destination || !targetDate || !travelDays) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }

  // Calculate return date
  const departureDate = new Date(targetDate);
  const returnDate = new Date(departureDate);
  returnDate.setDate(departureDate.getDate() + parseInt(travelDays, 10));

  const departureDateString = departureDate.toISOString().split('T')[0];
  const returnDateString = returnDate.toISOString().split('T')[0];

  const prompt = `Find the median price for a roundtrip business class flight from Manila (MNL) to ${destination} departing on ${departureDateString} and returning on ${returnDateString}. The price should be in USD. Return only the price as a single number, without currency symbols or commas. For example: 2500.34`;

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