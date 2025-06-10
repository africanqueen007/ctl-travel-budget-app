export default async function handler(req, res) {
  const { destination, departure, targetDate, travelDays, fareClass } = req.query;

  if (!destination || !departure || !targetDate || !travelDays || !fareClass) {
    return res.status(400).json({ error: true, message: 'Missing required query parameters.' });
  }

  const departureDate = new Date(targetDate);
  const returnDate = new Date(departureDate);
  returnDate.setDate(departureDate.getDate() + parseInt(travelDays, 10));

  const departureDateString = departureDate.toISOString().split('T')[0];
  const returnDateString = returnDate.toISOString().split('T')[0];

  // A more structured and direct prompt to force the AI to use specific details.
  const prompt = `
    You are a flight data API. Your only job is to return a single number representing a flight price.
    Analyze the following flight details:
    - Departure City: ${departure}
    - Destination City: ${destination}
    - Departure Date: ${departureDateString}
    - Return Date: ${returnDateString}
    - Fare Class: ${fareClass}
    Based on these details, provide the estimated median roundtrip flight price in USD.
    Your entire response must be a single number only, with no currency symbols, commas, or explanatory text. For example: 3725.
  `;

  // Log the exact prompt being sent for debugging purposes.
  console.log("Sending prompt to Google AI:", prompt);

  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: true, message: 'API key is not configured on the server.' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
        console.error('Google API Error:', result.error);
        throw new Error(result.error?.message || `API call failed with status: ${response.status}`);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('AI Response Text:', text); 

    const parsedPrice = parseFloat(text?.replace(/[^0-9.]/g, ''));

    if (!isNaN(parsedPrice)) {
      res.status(200).json({ price: parsedPrice });
    } else {
      throw new Error(`Could not parse a valid price. AI returned: "${text}"`);
    }
  } catch (error) {
    console.error('Airfare fetch error:', error.message);
    res.status(500).json({ error: true, message: error.message, price: 1500 });
  }
}