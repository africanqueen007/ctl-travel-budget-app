export default async function handler(req, res) {
  const { destinationCity, destinationCountry, departureCity, departureCountry, targetDate, travelDays, fareClass, numberOfPeople } = req.query;

  if (!destinationCity || !destinationCountry || !departureCity || !departureCountry || !targetDate || !travelDays || !fareClass) {
    return res.status(400).json({ error: true, message: 'Missing required query parameters.' });
  }

  // Your Railway service URL
  const PYTHON_SERVICE_URL = process.env.PYTHON_FLIGHT_SERVICE_URL || 'https://ctl-flight-service-production.up.railway.app';
  
  console.log('DEBUG: Using PYTHON_SERVICE_URL:', PYTHON_SERVICE_URL);
  console.log('DEBUG: Parameters:', { departureCity, destinationCity, targetDate, fareClass });
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Call your Python flight service
    const flightServiceUrl = new URL('/api/getFlightPrice', PYTHON_SERVICE_URL);
    flightServiceUrl.searchParams.append('departureCity', departureCity);
    flightServiceUrl.searchParams.append('departureCountry', departureCountry);
    flightServiceUrl.searchParams.append('destinationCity', destinationCity);
    flightServiceUrl.searchParams.append('destinationCountry', destinationCountry);
    flightServiceUrl.searchParams.append('targetDate', targetDate);
    flightServiceUrl.searchParams.append('travelDays', travelDays);
    flightServiceUrl.searchParams.append('fareClass', fareClass);
    flightServiceUrl.searchParams.append('numberOfPeople', numberOfPeople || '1');

    console.log('Calling Railway service:', flightServiceUrl.toString());

    const response = await fetch(flightServiceUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CTL-Travel-Budget-App/1.0'
      },
      timeout: 30000
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Railway service error:', result);
      return await fallbackToAIEstimation(req, res);
    }

    console.log('Railway service success:', result);

    // Return the Railway service result
    res.status(200).json({
      price: result.price,
      source: result.source,
      flight_details: result.flight_details,
      search_url: result.search_url
    });

  } catch (error) {
    console.error('Railway service fetch error:', error.message);
    return await fallbackToAIEstimation(req, res);
  }
}

// Fallback to your original AI estimation
async function fallbackToAIEstimation(req, res) {
  const { destinationCity, destinationCountry, departureCity, departureCountry, targetDate, travelDays, fareClass } = req.query;
  
  const [year, month, day] = targetDate.split('-').map(Number);
  const departureDate = new Date(Date.UTC(year, month - 1, day));
  const returnDate = new Date(departureDate);
  returnDate.setDate(departureDate.getDate() + parseInt(travelDays, 10));
  const departureDateString = departureDate.toISOString().split('T')[0];
  const returnDateString = returnDate.toISOString().split('T')[0];

  const prompt = `
    You are a flight data API. Your only job is to return a single number representing a flight price.
    Analyze the following flight details:
    - Departure: ${departureCity}, ${departureCountry}
    - Destination: ${destinationCity}, ${destinationCountry}
    - Departure Date: ${departureDateString}
    - Return Date: ${returnDateString}
    - Fare Class: ${fareClass}
    Based on these details, provide the estimated median roundtrip flight price in USD.
    Your entire response must be a single number only, with no currency symbols, commas, or explanatory text. For example: 3725.
  `;

  console.log("Falling back to Google AI estimation");

  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: true, message: 'No flight service available and API key not configured.', price: 1500 });
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
        console.error('Google AI Error:', result.error);
        throw new Error(result.error?.message || `API call failed with status: ${response.status}`);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedPrice = parseFloat(text?.replace(/[^0-9.]/g, ''));

    if (!isNaN(parsedPrice)) {
      res.status(200).json({ 
        price: parsedPrice, 
        source: 'ai_estimate',
        warning: 'Using AI estimation - Railway service unavailable' 
      });
    } else {
      throw new Error(`Could not parse a valid price. AI returned: "${text}"`);
    }
  } catch (error) {
    console.error('AI estimation error:', error.message);
    res.status(500).json({ 
      error: true, 
      message: `All flight price sources failed: ${error.message}`, 
      price: 1500,
      source: 'fallback_default'
    });
  }
}