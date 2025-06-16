import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Calendar as CalendarIcon, Briefcase, Users, MapPin, Building2, Plane, DollarSign, Percent, Calculator, Save, FileDown, LayoutDashboard, ExternalLink, Filter, RefreshCw, Trash2, Edit, XCircle } from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// --- Firebase Configuration (FOR VERCEL DEPLOYMENT) ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const appId = process.env.REACT_APP_ID || 'default-app-id';


// --- Data & Conversion Rates ---
const fallbackExchangeRates = {
    "USD": 1, "CNY": 0.14, "INR": 0.012, "PHP": 0.017
};

const hotelData = {
    "Afghanistan": { "Kabul": { rate: 150, currency: "USD" } },
    "Albania": { "Tirana": { rate: 320, currency: "USD" } },
    "Algeria": { "Algiers": { rate: 210, currency: "USD" } },
    "American Samoa": { "Pago Pago": { rate: 210, currency: "USD" } },
    "Argentina": { "Buenos Aires": { rate: 420, currency: "USD" } },
    "Armenia": { "Yerevan": { rate: 170, currency: "USD" } },
    "Aruba": { "Oranjestad": { rate: 210, currency: "USD" } },
    "Australia": { "Brisbane": { rate: 210, currency: "USD" }, "Canberra": { rate: 280, currency: "USD" }, "Melbourne": { rate: 280, currency: "USD" }, "Sydney": { rate: 280, currency: "USD" }, "Other Cities": { rate: 210, currency: "USD" } },
    "Azerbaijan": { "Baku": { rate: 200, currency: "USD" }, "Other Cities": { rate: 100, currency: "USD" } },
    "Bahamas": { "Nassau": { rate: 210, currency: "USD" } },
    "Bahrain": { "Manama": { rate: 210, currency: "USD" } },
    "Bangladesh": { "Dhaka": { rate: 250, currency: "USD" }, "Other Cities": { rate: 200, currency: "USD" } },
    "Barbados": { "Bridgetown": { rate: 320, currency: "USD" } },
    "Belarus": { "Minsk": { rate: 210, currency: "USD" } },
    "Benin": { "Porto-Novo": { rate: 210, currency: "USD" } },
    "Bermuda": { "Hamilton": { rate: 210, currency: "USD" } },
    "Bhutan": { "Thimphu": { rate: 310, currency: "USD" }, "Paro": { rate: 310, currency: "USD" }, "Other Cities": { rate: 250, currency: "USD" } },
    "Bolivia": { "Sucre": { rate: 210, currency: "USD" } },
    "Bosnia and Herzegovina": { "Sarajevo": { rate: 210, currency: "USD" } },
    "Botswana": { "Gaborone": { rate: 210, currency: "USD" } },
    "Brazil": { "Brasilia": { rate: 320, currency: "USD" } },
    "Brunei Darussalam": { "Bandar Seri Begawan": { rate: 320, currency: "USD" } },
    "Burkina Faso": { "Ouagadougou": { rate: 210, currency: "USD" } },
    "Burundi": { "Gitega": { rate: 210, currency: "USD" } },
    "Cambodia": { "Phnom Penh": { rate: 240, currency: "USD" }, "Siem Reap": { rate: 240, currency: "USD" }, "Sihanoukville": { rate: 160, currency: "USD" }, "Other Cities": { rate: 100, currency: "USD" } },
    "Cameroon": { "Yaounde": { rate: 320, currency: "USD" } },
    "Canada": { "Ottawa": { rate: 340, currency: "USD" }, "Toronto": { rate: 340, currency: "USD" }, "Vancouver": { rate: 340, currency: "USD" }, "Montreal": { rate: 240, currency: "USD" }, "Other Cities": { rate: 240, currency: "USD" } },
    "Cape Verde": { "Praia": { rate: 320, currency: "USD" } },
    "Cayman Islands": { "George Town": { rate: 210, currency: "USD" } },
    "Chile": { "Santiago": { rate: 210, currency: "USD" } },
    "China, People's Rep. of": { "Beijing": { rate: 1710, currency: "CNY" }, "Shanghai": { rate: 2310, currency: "CNY" }, "Other Cities": { rate: 1190, currency: "CNY" } },
    "Colombia": { "Bogota": { rate: 320, currency: "USD" } },
    "Congo, The Democratic Republic of the": { "Kinshasa": { rate: 210, currency: "USD" } },
    "Cook Islands": { "Avarua": { rate: 210, currency: "USD" } },
    "Costa Rica": { "San Jose": { rate: 320, currency: "USD" } },
    "Cote d'Ivoire": { "Yamoussoukro": { rate: 210, currency: "USD" } },
    "Cuba": { "Havana": { rate: 210, currency: "USD" } },
    "Dominican Republic": { "Santo Domingo": { rate: 210, currency: "USD" } },
    "Ecuador": { "Quito": { rate: 320, currency: "USD" } },
    "Egypt": { "Cairo": { rate: 210, currency: "USD" } },
    "Equatorial Guinea": { "Malabo": { rate: 320, currency: "USD" } },
    "Ethiopia": { "Addis Ababa": { rate: 370, currency: "USD" } },
    "Europe (except Türkiye)": { "All Cities": { rate: 460, currency: "USD" } },
    "Fiji": { "Suva": { rate: 220, currency: "USD" }, "Nadi": { rate: 280, currency: "USD" }, "Other Cities": { rate: 130, currency: "USD" } },
    "French Polynesia": { "Papeete": { rate: 320, currency: "USD" } },
    "Georgia": { "Tbilisi": { rate: 310, currency: "USD" }, "Other Cities": { rate: 220, currency: "USD" } },
    "Ghana": { "Accra": { rate: 210, currency: "USD" } },
    "Gibraltar": { "Gibraltar": { rate: 320, currency: "USD" } },
    "Guam": { "Hagatna": { rate: 240, currency: "USD" } },
    "Guatemala": { "Guatemala City": { rate: 210, currency: "USD" } },
    "Guinea": { "Conakry": { rate: 210, currency: "USD" } },
    "Honduras": { "Tegucigalpa": { rate: 210, currency: "USD" } },
    "Hong Kong, China": { "Hong Kong": { rate: 480, currency: "USD" } },
    "India": { "New Delhi": { rate: 18850, currency: "INR" }, "Bangalore": { rate: 18850, currency: "INR" }, "Goa": { rate: 18850, currency: "INR" }, "Gurgaon": { rate: 18850, currency: "INR" }, "Mumbai": { rate: 18850, currency: "INR" }, "Srinigar": { rate: 18850, currency: "INR" }, "Ahmedabad": { rate: 12970, currency: "INR" }, "Bhopal": { rate: 12970, currency: "INR" }, "Bhubaneswar": { rate: 12970, currency: "INR" }, "Chennai": { rate: 12970, currency: "INR" }, "Guwahati": { rate: 12970, currency: "INR" }, "Hyderabad": { rate: 12970, currency: "INR" }, "Jaipur": { rate: 12970, currency: "INR" }, "Kolkata": { rate: 12970, currency: "INR" }, "Patna": { rate: 12970, currency: "INR" }, "Pune": { rate: 12970, currency: "INR" }, "Shimla": { rate: 12970, currency: "INR" }, "Other Cities": { rate: 8260, currency: "INR" } },
    "Indonesia": { "Jakarta": { rate: 250, currency: "USD" }, "Denpasar (Bali)": { rate: 210, currency: "USD" }, "Other Cities": { rate: 150, currency: "USD" } },
    "Iran, Islamic Republic of": { "Tehran": { rate: 320, currency: "USD" } },
    "Iraq": { "Baghdad": { rate: 210, currency: "USD" } },
    "Israel": { "Jerusalem": { rate: 210, currency: "USD" } },
    "Jamaica": { "Kingston": { rate: 210, currency: "USD" } },
    "Japan": { "Tokyo": { rate: 380, currency: "USD" }, "Other Cities": { rate: 310, currency: "USD" } },
    "Jordan": { "Amman": { rate: 210, currency: "USD" } },
    "Kazakhstan": { "Astana": { rate: 310, currency: "USD" }, "Almaty": { rate: 310, currency: "USD" }, "Other Cities": { rate: 310, currency: "USD" } },
    "Kenya": { "Nairobi": { rate: 320, currency: "USD" } },
    "Kiribati": { "Tarawa": { rate: 120, currency: "USD" }, "Other Cities": { rate: 110, currency: "USD" } },
    "Korea": { "Seoul": { rate: 310, currency: "USD" } },
    "Kuwait": { "Kuwait City": { rate: 320, currency: "USD" } },
    "Kyrgyz Republic": { "Bishkek": { rate: 270, currency: "USD" }, "Other Cities": { rate: 100, currency: "USD" } },
    "Lao, PDR": { "Vientiane": { rate: 160, currency: "USD" } },
    "Lebanon": { "Beirut": { rate: 210, currency: "USD" } },
    "Lesotho": { "Maseru": { rate: 210, currency: "USD" } },
    "Libyan Arab Jamahiriya": { "Tripoli": { rate: 210, currency: "USD" } },
    "Macau": { "Macau": { rate: 400, currency: "USD" } },
    "Macedonia, The Former Yugoslav Repu": { "Skopje": { rate: 210, currency: "USD" } },
    "Madagascar": { "Antananarivo": { rate: 210, currency: "USD" } },
    "Malawi": { "Lilongwe": { rate: 210, currency: "USD" } },
    "Malaysia": { "Kuala Lumpur": { rate: 180, currency: "USD" } },
    "Maldives": { "Male": { rate: 380, currency: "USD" }, "Other Cities": { rate: 290, currency: "USD" } },
    "Mali": { "Bamako": { rate: 320, currency: "USD" } },
    "Marshall Islands": { "Majuro": { rate: 160, currency: "USD" } },
    "Mauritius": { "Port Louis": { rate: 210, currency: "USD" } },
    "Mexico": { "Mexico City": { rate: 320, currency: "USD" } },
    "Micronesia, Fed States of": { "Palikir": { rate: 170, currency: "USD" } },
    "Moldova, Republic of": { "Chisinau": { rate: 210, currency: "USD" } },
    "Monaco": { "Monaco": { rate: 210, currency: "USD" } },
    "Mongolia": { "Ulaanbaatar": { rate: 250, currency: "USD" }, "Other Cities": { rate: 120, currency: "USD" } },
    "Montenegro": { "Podgorica": { rate: 210, currency: "USD" } },
    "Morocco": { "Rabat": { rate: 330, currency: "USD" } },
    "Myanmar": { "Nay Pyi Taw": { rate: 150, currency: "USD" }, "Mandalay": { rate: 250, currency: "USD" }, "Yangon": { rate: 250, currency: "USD" }, "Other Cities": { rate: 150, currency: "USD" } },
    "Namibia": { "Windhoek": { rate: 210, currency: "USD" } },
    "Nauru": { "Yaren": { rate: 320, currency: "USD" } },
    "Nepal": { "Kathmandu": { rate: 200, currency: "USD" }, "Pokhara": { rate: 150, currency: "USD" }, "Bhairahawa": { rate: 150, currency: "USD" }, "Other Cities": { rate: 200, currency: "USD" } },
    "New Caledonia": { "Noumea": { rate: 190, currency: "USD" } },
    "New Zealand": { "Wellington": { rate: 250, currency: "USD" } },
    "Nicaragua": { "Managua": { rate: 210, currency: "USD" } },
    "Nigeria": { "Abuja": { rate: 320, currency: "USD" } },
    "Niue": { "Alofi": { rate: 110, currency: "USD" } },
    "Northern Mariana Islands": { "Saipan": { rate: 210, currency: "USD" } },
    "Oman": { "Muscat": { rate: 210, currency: "USD" } },
    "Pakistan": { "Islamabad": { rate: 350, currency: "USD" }, "Karachi": { rate: 220, currency: "USD" }, "Lahore": { rate: 220, currency: "USD" }, "Other Cities": { rate: 180, currency: "USD" } },
    "Palau": { "Ngerulmud": { rate: 330, currency: "USD" } },
    "Panama": { "Panama City": { rate: 210, currency: "USD" } },
    "Papua New Guinea": { "Port Moresby": { rate: 370, currency: "USD" } },
    "Paraguay": { "Asuncion": { rate: 320, currency: "USD" } },
    "Peru": { "Lima": { rate: 210, currency: "USD" } },
    "Philippines": { "Manila": { rate: 6900, currency: "PHP" } },
    "Puerto Rico": { "San Juan": { rate: 320, currency: "USD" } },
    "Qatar": { "Doha": { rate: 290, currency: "USD" } },
    "Russian Federation": { "Moscow": { rate: 420, currency: "USD" } },
    "Rwanda": { "Kigali": { rate: 210, currency: "USD" } },
    "Saint Lucia": { "Castries": { rate: 210, currency: "USD" } },
    "Samoa": { "Apia": { rate: 240, currency: "USD" } },
    "Saudi Arabia": { "Riyadh": { rate: 270, currency: "USD" } },
    "Senegal": { "Dakar": { rate: 210, currency: "USD" } },
    "Serbia": { "Belgrade": { rate: 210, currency: "USD" } },
    "Seychelles": { "Victoria": { rate: 210, currency: "USD" } },
    "Singapore": { "Singapore": { rate: 320, currency: "USD" } },
    "Solomon Islands": { "Honiara": { rate: 330, currency: "USD" } },
    "South Africa": { "Pretoria": { rate: 210, currency: "USD" } },
    "Sri Lanka": { "Colombo": { rate: 200, currency: "USD" }, "Other Cities": { rate: 150, currency: "USD" } },
    "Sudan": { "Khartoum": { rate: 370, currency: "USD" } },
    "Syrian Arab Republic": { "Damascus": { rate: 210, currency: "USD" } },
    "Taipei, China": { "Taipei": { rate: 250, currency: "USD" } },
    "Tajikistan": { "Dushanbe": { rate: 270, currency: "USD" }, "Other Cities": { rate: 180, currency: "USD" } },
    "Tanzania, United Republic of": { "Dodoma": { rate: 210, currency: "USD" } },
    "Thailand": { "Bangkok": { rate: 210, currency: "USD" } },
    "Timor-Leste": { "Dili": { rate: 180, currency: "USD" } },
    "Tonga": { "Nuku'alofa": { rate: 150, currency: "USD" } },
    "Tunisia": { "Tunis": { rate: 210, currency: "USD" } },
    "Türkiye": { "Ankara": { rate: 260, currency: "USD" } },
    "Turkmenistan": { "Ashgabat": { rate: 270, currency: "USD" }, "Other Cities": { rate: 150, currency: "USD" } },
    "Tuvalu": { "Funafuti": { rate: 150, currency: "USD" } },
    "Uganda": { "Kampala": { rate: 440, currency: "USD" } },
    "Ukraine": { "Kyiv": { rate: 420, currency: "USD" } },
    "United Arab Emirates": { "Abu Dhabi": { rate: 320, currency: "USD" } },
    "United States": { "Washington D.C.": { rate: 470, currency: "USD" } },
    "Uruguay": { "Montevideo": { rate: 210, currency: "USD" } },
    "Uzbekistan": { "Tashkent": { rate: 210, currency: "USD" }, "Other Cities": { rate: 160, currency: "USD" } },
    "Vanuatu": { "Port Vila": { rate: 320, currency: "USD" } },
    "Venezuela, Bolivarian Republic of": { "Caracas": { rate: 210, currency: "USD" } },
    "Viet Nam": { "Hanoi": { rate: 250, currency: "USD" }, "Ho Chi Minh": { rate: 250, currency: "USD" }, "Other Cities": { rate: 160, currency: "USD" } },
    "Yemen": { "Sana'a": { rate: 210, currency: "USD" } },
    "Zambia": { "Lusaka": { rate: 210, currency: "USD" } },
    "Zimbabwe": { "Harare": { rate: 210, currency: "USD" } },
};

const dmaData = {
    "Afghanistan": 120, "Albania": 120, "Algeria": 120, "American Samoa": 140, "Argentina": 140, "Armenia": 100, "Aruba": 140, "Australia": 200, "Azerbaijan": 120, "Bahamas": 140, "Bahrain": 120, "Bangladesh": 120, "Barbados": 140, "Belarus": 120, "Belize": 140, "Benin": 120, "Bermuda": 140, "Bhutan": 100, "Bolivia": 140, "Bosnia and Herzegovina": 120, "Botswana": 120, "Brazil": 140, "Brunei Darussalam": 120, "Burkina Faso": 120, "Burundi": 120, "Cambodia": 100, "Cameroon": 120, "Canada": 140, "Cape Verde": 120, "Cayman Islands": 140, "Chile": 140, "China, People's Rep. of": 140, "Colombia": 140, "Congo, The Democratic Republic of the": 120, "Cook Islands": 100, "Costa Rica": 140, "Cote d'Ivoire": 120, "Cuba": 140, "Dominican Republic": 140, "Ecuador": 140, "Egypt": 120, "El Salvador": 140, "Equatorial Guinea": 120, "Ethiopia": 120, "Europe (except Türkiye)": 180, "Fiji": 120, "French Guiana": 140, "French Polynesia": 120, "Georgia": 140, "Ghana": 120, "Gibraltar": 120, "Greenland": 140, "Guam": 140, "Guatemala": 140, "Guinea": 120, "Guyana": 140, "Honduras": 140, "Hong Kong, China": 160, "India": 140, "Indonesia": 120, "Iran, Islamic Republic of": 120, "Iraq": 120, "Israel": 120, "Jamaica": 140, "Japan": 200, "Jordan": 120, "Kazakhstan": 160, "Kenya": 120, "Kiribati": 100, "Korea": 140, "Kuwait": 120, "Kyrgyz Republic": 120, "Lao, PDR": 100, "Lebanon": 120, "Lesotho": 120, "Libyan Arab Jamahiriya": 120, "Macedonia, The Former Yugoslav Repu": 120, "Madagascar": 120, "Malawi": 120, "Malaysia": 100, "Maldives": 100, "Mali": 120, "Marshall Islands": 100, "Mauritius": 120, "Mexico": 140, "Micronesia, Fed States of": 100, "Moldova, Republic of": 120, "Monaco": 120, "Mongolia": 100, "Montenegro": 120, "Morocco": 120, "Myanmar": 100, "Namibia": 120, "Nauru": 100, "Nepal": 100, "New Caledonia": 120, "New Zealand": 180, "Nicaragua": 140, "Nigeria": 120, "Niue": 100, "Northern Mariana Islands": 140, "Oman": 120, "Pakistan": 100, "Palau": 120, "Panama": 140, "Papua New Guinea": 160, "Paraguay": 140, "Peru": 140, "Philippines": 80, "Puerto Rico": 140, "Qatar": 120, "Russian Federation": 120, "Rwanda": 120, "Saint Lucia": 140, "Samoa": 100, "Saudi Arabia": 120, "Senegal": 120, "Serbia": 120, "Seychelles": 120, "Singapore": 180, "Solomon Islands": 120, "South Africa": 120, "Sri Lanka": 120, "Sudan": 120, "Suriname": 140, "Syrian Arab Republic": 120, "Taipei, China": 160, "Tajikistan": 100, "Tanzania, United Republic of": 120, "Thailand": 120, "Timor-Leste": 100, "Tonga": 120, "Tunisia": 120, "Türkiye": 180, "Turkmenistan": 120, "Tuvalu": 100, "Uganda": 120, "Ukraine": 120, "United Arab Emirates": 120, "United States": 140, "Uruguay": 140, "Uzbekistan": 100, "Vanuatu": 160, "Venezuela, Bolivarian Republic of": 140, "Viet Nam": 100, "Yemen": 120, "Zambia": 120, "Zimbabwe": 120,
};

const countryToCapital = {
    "Afghanistan": "Kabul", "Albania": "Tirana", "Algeria": "Algiers", "American Samoa": "Pago Pago", "Argentina": "Buenos Aires", "Armenia": "Yerevan", "Aruba": "Oranjestad", "Australia": "Canberra", "Azerbaijan": "Baku", "Bahamas": "Nassau", "Bahrain": "Manama", "Bangladesh": "Dhaka", "Barbados": "Bridgetown", "Belarus": "Minsk", "Benin": "Porto-Novo", "Bermuda": "Hamilton", "Bhutan": "Thimphu", "Bolivia": "Sucre", "Bosnia and Herzegovina": "Sarajevo", "Botswana": "Gaborone", "Brazil": "Brasilia", "Brunei Darussalam": "Bandar Seri Begawan", "Burkina Faso": "Ouagadougou", "Burundi": "Gitega", "Cambodia": "Phnom Penh", "Cameroon": "Yaounde", "Canada": "Ottawa", "Cape Verde": "Praia", "Cayman Islands": "George Town", "Chile": "Santiago", "China, People's Rep. of": "Beijing", "Colombia": "Bogota", "Congo, The Democratic Republic of the": "Kinshasa", "Cook Islands": "Avarua", "Costa Rica": "San Jose", "Cote d'Ivoire": "Yamoussoukro", "Cuba": "Havana", "Dominican Republic": "Santo Domingo", "Ecuador": "Quito", "Egypt": "Cairo", "Equatorial Guinea": "Malabo", "Ethiopia": "Addis Ababa", "Europe (except Türkiye)": "Brussels", "Fiji": "Suva", "French Polynesia": "Papeete", "Georgia": "Tbilisi", "Ghana": "Accra", "Gibraltar": "Gibraltar", "Guam": "Hagatna", "Guatemala": "Guatemala City", "Guinea": "Conakry", "Honduras": "Tegucigalpa", "Hong Kong, China": "Hong Kong", "India": "New Delhi", "Indonesia": "Jakarta", "Iran, Islamic Republic of": "Tehran", "Iraq": "Baghdad", "Israel": "Jerusalem", "Jamaica": "Kingston", "Japan": "Tokyo", "Jordan": "Amman", "Kazakhstan": "Astana", "Kenya": "Nairobi", "Kiribati": "Tarawa", "Korea": "Seoul", "Kuwait": "Kuwait City", "Kyrgyz Republic": "Bishkek", "Lao, PDR": "Vientiane", "Lebanon": "Beirut", "Lesotho": "Maseru", "Libyan Arab Jamahiriya": "Tripoli", "Macau": "Macau", "Macedonia, The Former Yugoslav Repu": "Skopje", "Madagascar": "Antananarivo", "Malawi": "Lilongwe", "Malaysia": "Kuala Lumpur", "Maldives": "Male", "Mali": "Bamako", "Marshall Islands": "Majuro", "Mauritius": "Port Louis", "Mexico": "Mexico City", "Micronesia, Fed States of": "Palikir", "Moldova, Republic of": "Chisinau", "Monaco": "Monaco", "Mongolia": "Ulaanbaatar", "Montenegro": "Podgorica", "Morocco": "Rabat", "Myanmar": "Naypyidaw", "Namibia": "Windhoek", "Nauru": "Yaren", "Nepal": "Kathmandu", "New Caledonia": "Noumea", "New Zealand": "Wellington", "Nicaragua": "Managua", "Nigeria": "Abuja", "Niue": "Alofi", "Northern Mariana Islands": "Saipan", "Oman": "Muscat", "Pakistan": "Islamabad", "Palau": "Ngerulmud", "Panama": "Panama City", "Papua New Guinea": "Port Moresby", "Paraguay": "Asuncion", "Peru": "Lima", "Philippines": "Manila", "Puerto Rico": "San Juan", "Qatar": "Doha", "Russian Federation": "Moscow", "Rwanda": "Kigali", "Saint Lucia": "Castries", "Samoa": "Apia", "Saudi Arabia": "Riyadh", "Senegal": "Dakar", "Serbia": "Belgrade", "Seychelles": "Victoria", "Singapore": "Singapore", "Solomon Islands": "Honiara", "South Africa": "Pretoria", "Sri Lanka": "Colombo", "Sudan": "Khartoum", "Syrian Arab Republic": "Damascus", "Taipei, China": "Taipei", "Tajikistan": "Dushanbe", "Tanzania, United Republic of": "Dodoma", "Thailand": "Bangkok", "Timor-Leste": "Dili", "Tonga": "Nuku'alofa", "Tunisia": "Tunis", "Türkiye": "Ankara", "Turkmenistan": "Ashgabat", "Tuvalu": "Funafuti", "Uganda": "Kampala", "Ukraine": "Kyiv", "United Arab Emirates": "Abu Dhabi", "United States": "Washington D.C.", "Uruguay": "Montevideo", "Uzbekistan": "Tashkent", "Vanuatu": "Port Vila", "Venezuela, Bolivarian Republic of": "Caracas", "Viet Nam": "Hanoi", "Yemen": "Sana'a", "Zambia": "Lusaka", "Zimbabwe": "Harare",
};

// Main App Component
const App = () => {
    // Firebase State
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);

    // App State
    const [view, setView] = useState('calculator');
    const [savedRequests, setSavedRequests] = useState([]);
    const [reportFilter, setReportFilter] = useState('All');
    const [exchangeRates, setExchangeRates] = useState(fallbackExchangeRates);
    const [ratesLoading, setRatesLoading] = useState(true);
    const [editingRequestId, setEditingRequestId] = useState(null);

    // Form State
    const [submittedBy, setSubmittedBy] = useState('');
    const [division, setDivision] = useState('CTLA');
    const [purpose, setPurpose] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [departureCountry, setDepartureCountry] = useState('Philippines');
    const [departureCity, setDepartureCity] = useState('Manila');
    const [departureCities, setDepartureCities] = useState([]);
    const [fareClass, setFareClass] = useState('Business');
    const [targetAudience, setTargetAudience] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [travelDays, setTravelDays] = useState(1);
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [cities, setCities] = useState([]);
    
    // Calculation State
    const [airfare, setAirfare] = useState(null);
    const [hotelFare, setHotelFare] = useState(null);
    const [originalHotelInfo, setOriginalHotelInfo] = useState(null);
    const [dma, setDma] = useState(null);
    const [totalCost, setTotalCost] = useState(null);
    const [contingency, setContingency] = useState(null);
    const [overallBudget, setOverallBudget] = useState(null);
    const [airfareSourceUrl, setAirfareSourceUrl] = useState('');

    // UI State
    const [airfareLoading, setAirfareLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isCalculated, setIsCalculated] = useState(false);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    const fetchExchangeRates = useCallback(async () => {
        setRatesLoading(true);
        showNotification("Fetching live exchange rates...", "success");
        try {
            const response = await fetch('/api/getExchangeRates');
            if (!response.ok) throw new Error('Failed to fetch rates from serverless function');
            const data = await response.json();
            setExchangeRates(prev => ({ ...prev, ...data }));
            showNotification("Exchange rates updated.", "success");
        } catch (error) {
            console.error("Failed to fetch dynamic exchange rates:", error);
            setExchangeRates(fallbackExchangeRates);
            showNotification("Could not fetch live rates. Using fallback values.", "error");
        } finally {
            setRatesLoading(false);
        }
    }, []);

    // --- Firebase & Initial Data Load Effect ---
    useEffect(() => {
        fetchExchangeRates();
        if (firebaseConfig && firebaseConfig.apiKey) {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            setAuth(authInstance);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser); setUserId(currentUser.uid);
                    setSubmittedBy(currentUser.displayName || currentUser.email || 'Authenticated User');
                } else {
                    try {
                        await signInAnonymously(authInstance);
                    } catch (error) {
                        console.error("Authentication Error:", error);
                        showNotification('Authentication failed. Please refresh.', 'error' );
                    }
                }
            });
            return () => unsubscribe();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Firestore Data Fetching Effect ---
    useEffect(() => {
        if (db && userId) {
            const requestsCollectionPath = `artifacts/${appId}/users/${userId}/travelRequests`;
            const q = query(collection(db, requestsCollectionPath));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const requests = [];
                querySnapshot.forEach((doc) => requests.push({ id: doc.id, ...doc.data() }));
                requests.sort((a, b) => b.submissionTimestamp.toMillis() - a.submissionTimestamp.toMillis());
                setSavedRequests(requests);
            }, (error) => {
                console.error("Error fetching reports:", error);
                showNotification('Could not fetch saved reports.', 'error');
            });
            return () => unsubscribe();
        }
    }, [db, userId]);

    // --- Form and Calculation Logic ---
    useEffect(() => {
        if (country && hotelData[country]) {
            setCities(Object.keys(hotelData[country])); 
            if(!editingRequestId) { 
                setCity(''); 
            }
            clearResults();
        } else {
            setCities([]); setCity('');
        }
    }, [country, editingRequestId]);
    
     useEffect(() => {
        if (departureCountry && hotelData[departureCountry]) {
            setDepartureCities(Object.keys(hotelData[departureCountry]));
            if(!editingRequestId) {
                setDepartureCity('');
            }
        } else {
            setDepartureCities([]); setDepartureCity('');
        }
    }, [departureCountry, editingRequestId]);

    const clearResults = () => {
        setIsCalculated(false); setAirfare(null); setHotelFare(null); setOriginalHotelInfo(null); setDma(null); setTotalCost(null); setContingency(null); setOverallBudget(null); setAirfareSourceUrl('');
    };

    const resetForm = () => {
        setSubmittedBy(user?.displayName || user?.email || 'Authenticated User');
        setDivision('CTLA'); setPurpose(''); setCountry(''); setCity(''); 
        setDepartureCountry('Philippines'); setDepartureCity('Manila');
        setFareClass('Business'); setTargetAudience(''); setTargetDate(''); setTravelDays(1); setNumberOfPeople(1); setCities([]); clearResults();
        setEditingRequestId(null);
    };

    const calculateBudget = useCallback(async () => {
    if (!country || !city || !departureCountry || !departureCity || !travelDays || !targetDate || travelDays <= 0 || numberOfPeople <= 0) {
        showNotification("Please fill all travel detail fields, including dates and locations.", 'error'); return;
    }
    setIsCalculated(true); setAirfareLoading(true); setAirfareSourceUrl('');
    try {
        const hotelInfo = hotelData[country]?.[city] || { rate: 0, currency: 'USD' };
        setOriginalHotelInfo(hotelInfo);
        const conversionRate = exchangeRates[hotelInfo.currency] || 1;
        const convertedHotelFare = hotelInfo.rate * conversionRate;
        setHotelFare(convertedHotelFare);

        const selectedDma = dmaData[country] || 0; setDma(selectedDma);

        const destinationCapital = countryToCapital[country]
        const destinationCityForFlight = Object.values(countryToCapital).includes(city) ? city : destinationCapital;

        let fetchedAirfare = 1500;
        if (destinationCityForFlight) {
            try {
                // UPDATED LINE: Now sends country information for both departure and destination
                const response = await fetch(`/api/getAirfare?destinationCity=<span class="math-inline">\{encodeURIComponent\(destinationCityForFlight\)\}&destinationCountry\=</span>{encodeURIComponent(country)}&departureCity=<span class="math-inline">\{encodeURIComponent\(departureCity\)\}&departureCountry\=</span>{encodeURIComponent(departureCountry)}&targetDate=<span class="math-inline">\{targetDate\}&travelDays\=</span>{travelDays}&fareClass=${fareClass}`);
                const data = await response.json();

                if (data.error) throw new Error(data.message);
                fetchedAirfare = data.price;
                const url = `https://www.google.com/travel/flights?q=Flights%20from%20${departureCity}%20to%20${encodeURIComponent(destinationCityForFlight)}`;
                setAirfareSourceUrl(url);

            } catch (apiError) {
                console.error("Airfare API Error:", apiError);
                showNotification(`Could not fetch airfare: ${apiError.message}. Using default.`, 'error');
                fetchedAirfare = 1500;
            }
        }
        const perPersonCost = fetchedAirfare + (convertedHotelFare * travelDays) + (selectedDma * travelDays);
        setAirfare(fetchedAirfare);
        const total = perPersonCost * numberOfPeople;
        const cont = total * 0.05;
        setTotalCost(total); setContingency(cont); setOverallBudget(total + cont);
    } catch (error) {
        console.error("Calculation Error:", error);
        showNotification("An error occurred during calculation.", 'error');
    } finally {
        setAirfareLoading(false);
    }
}, [country, city, departureCountry, departureCity, travelDays, targetDate, exchangeRates, fareClass, numberOfPeople, showNotification]);

    const handleDeleteRequest = async (id) => {
        if (!db || !userId) { showNotification("Database not connected. Cannot delete.", "error"); return; }
        if (window.confirm("Are you sure you want to delete this entry?")) {
            try {
                const requestsCollectionPath = `artifacts/${appId}/users/${userId}/travelRequests`;
                const docRef = doc(db, requestsCollectionPath, id);
                await deleteDoc(docRef);
                showNotification("Request deleted successfully.", "success");
            } catch (error) {
                 console.error("Error deleting document: ", error);
                 showNotification("Failed to delete request.", "error");
            }
        }
    };
    
    const handleEditRequest = (request) => {
        setSubmittedBy(request.submittedBy);
        setDivision(request.division);
        setPurpose(request.purpose);
        setDepartureCountry(request.departureCountry || 'Philippines');
        setDepartureCity(request.departureCity || 'Manila');
        setCountry(request.country);
        setCity(request.city);
        setFareClass(request.fareClass || 'Business');
        setTargetAudience(request.targetAudience);
        setTargetDate(request.targetDate);
        setTravelDays(request.travelDays);
        setNumberOfPeople(request.numberOfPeople || 1);
        setEditingRequestId(request.id);
        setView('calculator');
        showNotification("Now editing a saved request. Click Update Request when finished.", "success");
    };

    const downloadCSV = () => {
        const dataToExport = reportFilter === 'All' ? savedRequests : savedRequests.filter(req => req.division === reportFilter);
        if (dataToExport.length === 0) { showNotification(`No data to download for ${reportFilter} division.`, "error"); return; }
        
        const headers = ['Submitted By', 'Division', 'Departure', 'Destination', 'Fare Class', 'No. of People', 'Target Date', 'Travel Days', 'Overall Budget ($)'];
        const rows = dataToExport.map(req => [
                `"${req.submittedBy}"`, `"${req.division}"`, `"${req.departureCity}, ${req.departureCountry}"`, `"${req.city}, ${req.country}"`, `"${req.fareClass}"`, req.numberOfPeople || 1, `"${req.targetDate}"`, req.travelDays, req.overallBudget?.toFixed(2) || '0.00'
            ].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ctl_travel_budget_report_${reportFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (value) => value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00';
    
    const renderCalculatorView = () => (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-semibold text-slate-800">1. Enter Travel Details</h2>
                    {editingRequestId && <button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center"><XCircle className="w-4 h-4 mr-1" />Cancel Edit</button>}
                 </div>
                <form className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="space-y-2"><label htmlFor="submittedBy" className="font-medium text-sm text-slate-700 flex items-center"><Briefcase className="w-4 h-4 mr-2"/>Submitted by/User</label><input type="text" id="submittedBy" value={submittedBy} onChange={e => setSubmittedBy(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div><div className="space-y-2"><label htmlFor="division" className="font-medium text-sm text-slate-700 flex items-center"><Building2 className="w-4 h-4 mr-2"/>Division</label><select id="division" value={division} onChange={e => setDivision(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"><option>CTLA</option> <option>CTFA</option> <option>CTOC</option> <option>CTAC</option></select></div></div>
                    <div className="space-y-2"><label htmlFor="purpose" className="font-medium text-sm text-slate-700 flex items-center"><Briefcase className="w-4 h-4 mr-2"/>Purpose/Event Description</label><textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} rows="3" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"></textarea></div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="text-lg font-semibold mb-3 text-slate-700">Flight Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2"><label htmlFor="departureCountry" className="font-medium text-sm text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2"/>Departure Country</label><select id="departureCountry" value={departureCountry} onChange={e => setDepartureCountry(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"><option value="">Select a country...</option>{Object.keys(hotelData).sort().map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="space-y-2"><label htmlFor="departureCity" className="font-medium text-sm text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2"/>Departure City</label><select id="departureCity" value={departureCity} onChange={e => setDepartureCity(e.target.value)} disabled={!departureCountry} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition disabled:bg-slate-100 bg-white"><option value="">Select a city...</option>{departureCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                            <div className="space-y-2"><label htmlFor="country" className="font-medium text-sm text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2"/>Destination Country</label><select id="country" value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"><option value="">Select a country...</option>{Object.keys(hotelData).sort().map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div className="space-y-2"><label htmlFor="city" className="font-medium text-sm text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2"/>Destination City</label><select id="city" value={city} onChange={e => setCity(e.target.value)} disabled={!country} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition disabled:bg-slate-100 bg-white"><option value="">Select a city...</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                        <div className="space-y-2 mt-5"><label htmlFor="fareClass" className="font-medium text-sm text-slate-700 flex items-center"><Briefcase className="w-4 h-4 mr-2"/>Fare Class</label><select id="fareClass" value={fareClass} onChange={e => setFareClass(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white"><option>Business</option><option>Economy</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2"><label htmlFor="targetAudience" className="font-medium text-sm text-slate-700 flex items-center"><Users className="w-4 h-4 mr-2"/>Target Audience</label><input type="text" id="targetAudience" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                        <div className="space-y-2"><label htmlFor="numberOfPeople" className="font-medium text-sm text-slate-700 flex items-center"><Users className="w-4 h-4 mr-2"/>Number of People</label><input type="number" id="numberOfPeople" value={numberOfPeople} min="1" onChange={e => setNumberOfPeople(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="space-y-2"><label htmlFor="targetDate" className="font-medium text-sm text-slate-700 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Target Date</label><input type="date" id="targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div><div className="space-y-2"><label htmlFor="travelDays" className="font-medium text-sm text-slate-700 flex items-center"><Briefcase className="w-4 h-4 mr-2"/>Expected Travel Days</label><input type="number" id="travelDays" value={travelDays} min="1" onChange={e => setTravelDays(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div></div>
                    <div className="flex space-x-2 pt-4">
                        <button type="button" onClick={calculateBudget} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center disabled:bg-blue-300" disabled={airfareLoading || ratesLoading}>{airfareLoading || ratesLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Calculating...</> : <><Calculator className="w-5 h-5 mr-2" />Calculate</>}</button>
                        <button type="button" onClick={handleSaveRequest} className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center justify-center disabled:bg-green-300" disabled={isSaving || !isCalculated}>{isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Saving...</> : <><Save className="w-5 h-5 mr-2" />{editingRequestId ? 'Update Request' : 'Save Request'}</>}</button>
                    </div>
                </form>
            </div>
            {/* ... Budget Breakdown section ... */}
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                <h2 className="text-2xl font-semibold mb-6 border-b pb-3 text-slate-800">2. Budget Breakdown</h2>
                <div className={`transition-opacity duration-500 ${isCalculated ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="space-y-4 text-slate-700">
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg"><span className="font-medium flex items-center"><Plane className="w-5 h-5 mr-3 text-blue-500"/>Average Airfare (per person)</span><div className="flex items-center space-x-2">{airfareLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold text-lg text-slate-900">{formatCurrency(airfare)}</span>}{airfareSourceUrl && !airfareLoading && (<a href={airfareSourceUrl} target="_blank" rel="noopener noreferrer" title="Consult Source" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-4 h-4"/></a>)}</div></div>
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                            <span className="font-medium flex items-center"><Building2 className="w-5 h-5 mr-3 text-blue-500"/>Hotel Fare (per day)</span>
                            <div className="text-right">
                                <span className="font-bold text-lg text-slate-900">{formatCurrency(hotelFare)}</span>
                                {originalHotelInfo && originalHotelInfo.currency !== 'USD' && <div className="text-xs text-slate-500">Converted from {originalHotelInfo.rate.toLocaleString()} {originalHotelInfo.currency}</div>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg"><span className="font-medium flex items-center"><DollarSign className="w-5 h-5 mr-3 text-blue-500"/>DMA (per day)</span><span className="font-bold text-lg text-slate-900">{formatCurrency(dma)}</span></div>
                    </div>
                    <hr className="my-6 border-slate-200" />
                    <div className="space-y-3"><div className="flex justify-between items-center"><span className="text-slate-600">Total Cost</span><span className="font-semibold text-slate-800">{formatCurrency(totalCost)}</span></div><div className="flex justify-between items-center"><span className="text-slate-600 flex items-center"><Percent className="w-4 h-4 mr-2"/>Contingency (5%)</span><span className="font-semibold text-slate-800">{formatCurrency(contingency)}</span></div></div>
                    <div className="mt-6 p-6 bg-blue-600 text-white rounded-xl text-center shadow-2xl shadow-blue-200"><h3 className="text-lg font-medium opacity-80">OVERALL BUDGET</h3><p className="text-5xl font-extrabold tracking-tight mt-1">{formatCurrency(overallBudget)}</p></div>
                </div>
                 {!isCalculated && <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500 p-8"><Calculator className="w-16 h-16 mb-4 text-slate-300" /><h3 className="text-xl font-semibold">Your results will appear here.</h3><p className="mt-1">Fill out the form and click "Calculate Budget".</p></div>}
            </div>
        </main>
    );

    const renderReportsView = () => {
        const filteredRequests = reportFilter === 'All'
            ? savedRequests
            : savedRequests.filter(req => req.division === reportFilter);

        return (
         <div className="bg-white p-6 rounded-2xl shadow-lg col-span-1 lg:col-span-2">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-2xl font-semibold text-slate-800">My Saved Reports</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-500" />
                        <select id="reportFilter" value={reportFilter} onChange={e => setReportFilter(e.target.value)} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white">
                            <option value="All">All Divisions</option>
                            <option>CTLA</option> <option>CTFA</option> <option>CTOC</option> <option>CTAC</option>
                        </select>
                    </div>
                    <button onClick={downloadCSV} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center disabled:bg-blue-300" disabled={savedRequests.length === 0}>
                        <FileDown className="w-5 h-5 mr-2" />Download CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                {filteredRequests.length > 0 ? (
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-4 py-3">Submitted By</th>
                                <th scope="col" className="px-4 py-3">Division</th>
                                <th scope="col" className="px-4 py-3">Departure</th>
                                <th scope="col" className="px-4 py-3">Destination</th>
                                <th scope="col" className="px-4 py-3">No. of People</th>
                                <th scope="col" className="px-4 py-3">Fare Class</th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-4 py-4">{req.submittedBy}</td>
                                    <td className="px-4 py-4">{req.division}</td>
                                    <td className="px-4 py-4">{req.departureCity}, {req.departureCountry}</td>
                                    <td className="px-4 py-4 font-medium text-slate-900">{req.city}, {req.country}</td>
                                    <td className="px-4 py-4">{req.numberOfPeople || 1}</td>
                                    <td className="px-4 py-4">{req.fareClass}</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end items-center gap-3">
                                            <button onClick={() => handleEditRequest(req)} className="text-blue-600 hover:text-blue-800" title="Edit"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteRequest(req.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (<div className="text-center py-12 text-slate-500"><LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-slate-300"/><h3 className="text-lg font-semibold">No Saved Reports Found</h3><p>Calculate and save a budget request to see it here.</p></div>)}
            </div>
        </div>
    )};

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-md">
                         <div className="flex items-center gap-4">
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">CTL Travel Budget App</h1>
                            <button onClick={fetchExchangeRates} disabled={ratesLoading} className="text-blue-600 disabled:text-slate-400 disabled:cursor-not-allowed" title="Refresh Exchange Rates">
                                {ratesLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <RefreshCw className="w-5 h-5"/>}
                            </button>
                         </div>
                         <div className="flex items-center space-x-4">
                            <button onClick={() => setView('calculator')} className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 ${view === 'calculator' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}><Calculator className="w-5 h-5"/><span>Calculator</span></button>
                            <button onClick={() => setView('reports')} className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 ${view === 'reports' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}><LayoutDashboard className="w-5 h-5"/><span>Reports</span></button>
                         </div>
                    </div>
                     <div className="mt-4 text-center text-xs text-slate-500">{user ? <>Logged in as: <span className="font-mono bg-slate-200 px-2 py-1 rounded">{userId}</span></> : <><Loader2 className="w-4 h-4 inline-block animate-spin mr-2"/>Authenticating...</>}</div>
                </header>
                {notification.message && (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl z-50 text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}>{notification.message}</div>)}
                {view === 'calculator' ? renderCalculatorView() : renderReportsView()}
            </div>
        </div>
    );
};

export default App;