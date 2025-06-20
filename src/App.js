import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Calendar as CalendarIcon, Briefcase, Users, MapPin, Building2, Plane, DollarSign, Percent, Calculator, Save, FileDown, LayoutDashboard, ExternalLink, Filter, RefreshCw, Trash2, Edit, XCircle, ToggleLeft, ToggleRight, HelpCircle, X } from 'lucide-react';

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
    
    // Manual Airfare Override State
    const [manualAirfareMode, setManualAirfareMode] = useState(false);
    const [manualAirfarePrice, setManualAirfarePrice] = useState('');
    
    // Multi-city State  
    const [multiCityMode, setMultiCityMode] = useState(false);
    const [secondDestinationCountry, setSecondDestinationCountry] = useState('');
    const [secondDestinationCity, setSecondDestinationCity] = useState('');
    const [secondDestinationCities, setSecondDestinationCities] = useState([]);
    const [secondTravelDays, setSecondTravelDays] = useState(1);
    
    // Calculation State
    const [airfare, setAirfare] = useState(null);
    const [hotelFare, setHotelFare] = useState(null);
    const [originalHotelInfo, setOriginalHotelInfo] = useState(null);
    const [secondHotelFare, setSecondHotelFare] = useState(null);
    const [secondOriginalHotelInfo, setSecondOriginalHotelInfo] = useState(null);
    const [dma, setDma] = useState(null);
    const [secondDma, setSecondDma] = useState(null);
    const [totalCost, setTotalCost] = useState(null);
    const [contingency, setContingency] = useState(null);
    const [overallBudget, setOverallBudget] = useState(null);
    const [airfareSourceUrl, setAirfareSourceUrl] = useState('');

    // UI State
    const [airfareLoading, setAirfareLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isCalculated, setIsCalculated] = useState(false);
    const [showUserGuide, setShowUserGuide] = useState(false);

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

    // Multi-city dropdown effect for second destination
    useEffect(() => {
        if (secondDestinationCountry && hotelData[secondDestinationCountry]) {
            setSecondDestinationCities(Object.keys(hotelData[secondDestinationCountry]));
            if(!editingRequestId) {
                setSecondDestinationCity('');
            }
        } else {
            setSecondDestinationCities([]); setSecondDestinationCity('');
        }
    }, [secondDestinationCountry, editingRequestId]);

    const clearResults = () => {
        setIsCalculated(false); setAirfare(null); setHotelFare(null); setOriginalHotelInfo(null); setSecondHotelFare(null); setSecondOriginalHotelInfo(null); setDma(null); setSecondDma(null); setTotalCost(null); setContingency(null); setOverallBudget(null); setAirfareSourceUrl('');
    };

    const resetForm = () => {
        setSubmittedBy(user?.displayName || user?.email || 'Authenticated User');
        setDivision('CTLA'); setPurpose(''); setCountry(''); setCity(''); 
        setDepartureCountry('Philippines'); setDepartureCity('Manila');
        setFareClass('Business'); setTargetAudience(''); setTargetDate(''); setTravelDays(1); setNumberOfPeople(1); setCities([]); clearResults();
        setEditingRequestId(null);
        setManualAirfareMode(false);
        setManualAirfarePrice('');
        setMultiCityMode(false);
        setSecondDestinationCountry('');
        setSecondDestinationCity('');
        setSecondDestinationCities([]);
        setSecondTravelDays(1);
    };

    const calculateBudget = useCallback(async () => {
        // Basic validation
        if (!country || !city || !departureCountry || !departureCity || !travelDays || !targetDate || travelDays <= 0 || numberOfPeople <= 0) {
            showNotification("Please fill all travel detail fields, including dates and locations.", 'error'); 
            return;
        }
        
        // Multi-city validation
        if (multiCityMode && (!secondDestinationCountry || !secondDestinationCity || !secondTravelDays || secondTravelDays <= 0)) {
            showNotification("Please fill all multi-city route fields and mission days when multi-city mode is enabled.", 'error');
            return;
        }
        
        // Validate manual airfare if in manual mode
        if (manualAirfareMode) {
            const manualPrice = parseFloat(manualAirfarePrice);
            if (isNaN(manualPrice) || manualPrice <= 0) {
                showNotification("Please enter a valid manual airfare price.", 'error');
                return;
            }
        }
        
        setIsCalculated(true); 
        setAirfareLoading(true); 
        setAirfareSourceUrl('');
        
        try {
            // Calculate hotel and DMA for first destination (Route 1 destination)
            const hotelInfo1 = hotelData[country]?.[city] || { rate: 0, currency: 'USD' };
            setOriginalHotelInfo(hotelInfo1);
            const conversionRate1 = exchangeRates[hotelInfo1.currency] || 1;
            const convertedHotelFare1 = hotelInfo1.rate * conversionRate1;
            setHotelFare(convertedHotelFare1);
            const selectedDma1 = dmaData[country] || 0; 
            setDma(selectedDma1);
            
            // Calculate hotel and DMA for second destination (if multi-city)
            let convertedHotelFare2 = 0;
            let selectedDma2 = 0;
            if (multiCityMode) {
                const hotelInfo2 = hotelData[secondDestinationCountry]?.[secondDestinationCity] || { rate: 0, currency: 'USD' };
                setSecondOriginalHotelInfo(hotelInfo2);
                const conversionRate2 = exchangeRates[hotelInfo2.currency] || 1;
                convertedHotelFare2 = hotelInfo2.rate * conversionRate2;
                setSecondHotelFare(convertedHotelFare2);
                selectedDma2 = dmaData[secondDestinationCountry] || 0;
                setSecondDma(selectedDma2);
            } else {
                setSecondHotelFare(null);
                setSecondOriginalHotelInfo(null);
                setSecondDma(null);
            }

            let fetchedAirfare;
            
            if (manualAirfareMode) {
                // Use manual airfare price
                fetchedAirfare = parseFloat(manualAirfarePrice);
                setAirfare(fetchedAirfare);
            } else {
                // Fetch airfare from API
                let totalAirfare = 0;
                
                // Route 1: Origin to first destination
                const destinationCapital1 = countryToCapital[country];
                const destinationCityForFlight1 = Object.values(countryToCapital).includes(city) ? city : destinationCapital1;

                if (destinationCityForFlight1) {
                    try {
                        const response1 = await fetch(`/api/getAirfare?destinationCity=${encodeURIComponent(destinationCityForFlight1)}&destinationCountry=${encodeURIComponent(country)}&departureCity=${encodeURIComponent(departureCity)}&departureCountry=${encodeURIComponent(departureCountry)}&targetDate=${targetDate}&travelDays=${travelDays}&fareClass=${fareClass}`);
                        const data1 = await response1.json();

                        if (!data1.error) {
                            totalAirfare += data1.price;
                        } else {
                            totalAirfare += 1500; // fallback for route 1
                        }
                    } catch (apiError) {
                        console.error("Airfare API Error for route 1:", apiError);
                        totalAirfare += 1500; // fallback for route 1
                    }
                } else {
                    totalAirfare += 1500; // fallback for route 1
                }
                
                // Route 2: First destination to second destination (if multi-city)
                if (multiCityMode) {
                    const destinationCapital2 = countryToCapital[secondDestinationCountry];
                    const destinationCityForFlight2 = Object.values(countryToCapital).includes(secondDestinationCity) ? secondDestinationCity : destinationCapital2;

                    if (destinationCityForFlight2) {
                        try {
                            // Route 1 destination becomes Route 2 departure
                            const route2DepartureCity = Object.values(countryToCapital).includes(city) ? city : destinationCapital1;
                            const response2 = await fetch(`/api/getAirfare?destinationCity=${encodeURIComponent(destinationCityForFlight2)}&destinationCountry=${encodeURIComponent(secondDestinationCountry)}&departureCity=${encodeURIComponent(route2DepartureCity)}&departureCountry=${encodeURIComponent(country)}&targetDate=${targetDate}&travelDays=${secondTravelDays}&fareClass=${fareClass}`);
                            const data2 = await response2.json();

                            if (!data2.error) {
                                totalAirfare += data2.price;
                            } else {
                                totalAirfare += 1500; // fallback for route 2
                            }
                        } catch (apiError) {
                            console.error("Airfare API Error for route 2:", apiError);
                            totalAirfare += 1500; // fallback for route 2
                        }
                    } else {
                        totalAirfare += 1500; // fallback for route 2
                    }
                    
                    // Route 3: Return journey (second destination back to origin)
                    try {
                        const response3 = await fetch(`/api/getAirfare?destinationCity=${encodeURIComponent(departureCity)}&destinationCountry=${encodeURIComponent(departureCountry)}&departureCity=${encodeURIComponent(destinationCityForFlight2)}&departureCountry=${encodeURIComponent(secondDestinationCountry)}&targetDate=${targetDate}&travelDays=1&fareClass=${fareClass}`);
                        const data3 = await response3.json();

                        if (!data3.error) {
                            totalAirfare += data3.price;
                        } else {
                            totalAirfare += 1500; // fallback for return
                        }
                    } catch (apiError) {
                        console.error("Airfare API Error for return journey:", apiError);
                        totalAirfare += 1500; // fallback for return
                    }
                }
                
                fetchedAirfare = totalAirfare;
                
                // Set source URL for Google Flights
                if (multiCityMode) {
                    const url = `https://www.google.com/travel/flights?q=Multi-city%20from%20${departureCity}%20to%20${encodeURIComponent(secondDestinationCity)}`;
                    setAirfareSourceUrl(url);
                } else {
                    const url = `https://www.google.com/travel/flights?q=Flights%20from%20${departureCity}%20to%20${encodeURIComponent(destinationCityForFlight1)}`;
                    setAirfareSourceUrl(url);
                }
                
                setAirfare(fetchedAirfare);
            }
            
            // Calculate total cost with separate hotel/DMA for each destination
            const destination1Cost = (convertedHotelFare1 * travelDays) + (selectedDma1 * travelDays);
            const destination2Cost = multiCityMode ? (convertedHotelFare2 * secondTravelDays) + (selectedDma2 * secondTravelDays) : 0;
            const perPersonCost = fetchedAirfare + destination1Cost + destination2Cost;
            const total = perPersonCost * numberOfPeople;
            const cont = total * 0.05;
            setTotalCost(total); 
            setContingency(cont); 
            setOverallBudget(total + cont);
        } catch (error) {
            console.error("Calculation Error:", error);
            showNotification("An error occurred during calculation.", 'error');
        } finally {
            setAirfareLoading(false);
        }
    }, [country, city, departureCountry, departureCity, travelDays, targetDate, exchangeRates, fareClass, numberOfPeople, manualAirfareMode, manualAirfarePrice, multiCityMode, secondDestinationCountry, secondDestinationCity, secondTravelDays, showNotification]);

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
        
        // Handle manual airfare override data
        if (request.manualAirfareMode) {
            setManualAirfareMode(true);
            setManualAirfarePrice(request.airfare?.toString() || '');
        } else {
            setManualAirfareMode(false);
            setManualAirfarePrice('');
        }
        
        // Handle multi-city data
        if (request.multiCityMode) {
            setMultiCityMode(true);
            setSecondDestinationCountry(request.secondDestinationCountry || '');
            setSecondDestinationCity(request.secondDestinationCity || '');
            setSecondTravelDays(request.secondTravelDays || 1);
        } else {
            setMultiCityMode(false);
            setSecondDestinationCountry('');
            setSecondDestinationCity('');
            setSecondTravelDays(1);
        }
        
        setEditingRequestId(request.id);
        setView('calculator');
        showNotification("Now editing a saved request. Click Update Request when finished.", "success");
    };

    const handleSaveRequest = async () => {
        if (!db || !userId) {
            showNotification("Database not connected. Cannot save.", "error");
            return;
        }

        if (!submittedBy || !purpose || !country || !city || !targetDate || !isCalculated) {
            showNotification("Please fill all fields and calculate budget first.", "error");
            return;
        }

        setIsSaving(true);
        
        try {
            const requestsCollectionPath = `artifacts/${appId}/users/${userId}/travelRequests`;
            
            if (multiCityMode) {
                // Save two separate records for multi-city trips
                
                // Record 1: Origin to First Destination
                const requestData1 = {
                    submittedBy,
                    division,
                    purpose: `${purpose} (Route 1: ${departureCity} → ${city})`,
                    departureCity,
                    departureCountry,
                    city,
                    country,
                    fareClass,
                    targetAudience,
                    targetDate,
                    travelDays,
                    numberOfPeople,
                    airfare: airfare / 3, // Airfare split across 3 legs (proportional)
                    hotelFare,
                    dma,
                    secondHotelFare: null,
                    secondDma: null,
                    totalCost: ((airfare / 3) + (hotelFare * travelDays) + (dma * travelDays)) * numberOfPeople,
                    contingency: (((airfare / 3) + (hotelFare * travelDays) + (dma * travelDays)) * numberOfPeople) * 0.05,
                    overallBudget: (((airfare / 3) + (hotelFare * travelDays) + (dma * travelDays)) * numberOfPeople) * 1.05,
                    manualAirfareMode,
                    multiCityMode: true,
                    multiCityLeg: 1,
                    secondDestinationCountry: null,
                    secondDestinationCity: null,
                    secondTravelDays: null,
                    submissionTimestamp: Timestamp.now()
                };

                // Record 2: First Destination to Second Destination
                const requestData2 = {
                    submittedBy,
                    division,
                    purpose: `${purpose} (Route 2: ${city} → ${secondDestinationCity})`,
                    departureCity: city,
                    departureCountry: country,
                    city: secondDestinationCity,
                    country: secondDestinationCountry,
                    fareClass,
                    targetAudience,
                    targetDate,
                    travelDays: secondTravelDays,
                    numberOfPeople,
                    airfare: (airfare * 2) / 3, // Remaining airfare for routes 2 & 3 (return)
                    hotelFare: secondHotelFare,
                    dma: secondDma,
                    secondHotelFare: null,
                    secondDma: null,
                    totalCost: (((airfare * 2) / 3) + (secondHotelFare * secondTravelDays) + (secondDma * secondTravelDays)) * numberOfPeople,
                    contingency: ((((airfare * 2) / 3) + (secondHotelFare * secondTravelDays) + (secondDma * secondTravelDays)) * numberOfPeople) * 0.05,
                    overallBudget: ((((airfare * 2) / 3) + (secondHotelFare * secondTravelDays) + (secondDma * secondTravelDays)) * numberOfPeople) * 1.05,
                    manualAirfareMode,
                    multiCityMode: true,
                    multiCityLeg: 2,
                    secondDestinationCountry: null,
                    secondDestinationCity: null,
                    secondTravelDays: null,
                    submissionTimestamp: Timestamp.now()
                };

                if (editingRequestId) {
                    showNotification("Multi-city edits not supported. Please create a new request.", "error");
                    setIsSaving(false);
                    return;
                } else {
                    // Create both records
                    await addDoc(collection(db, requestsCollectionPath), requestData1);
                    await addDoc(collection(db, requestsCollectionPath), requestData2);
                    showNotification("Multi-city request saved successfully (2 records created).", "success");
                }
            } else {
                // Single destination - save one record as before
                const requestData = {
                    submittedBy,
                    division,
                    purpose,
                    departureCity,
                    departureCountry,
                    city,
                    country,
                    fareClass,
                    targetAudience,
                    targetDate,
                    travelDays,
                    numberOfPeople,
                    airfare,
                    hotelFare,
                    dma,
                    secondHotelFare: null,
                    secondDma: null,
                    totalCost,
                    contingency,
                    overallBudget,
                    manualAirfareMode,
                    multiCityMode: false,
                    multiCityLeg: null,
                    secondDestinationCountry: null,
                    secondDestinationCity: null,
                    secondTravelDays: null,
                    submissionTimestamp: Timestamp.now()
                };

                if (editingRequestId) {
                    // Update existing request
                    const docRef = doc(db, requestsCollectionPath, editingRequestId);
                    await updateDoc(docRef, requestData);
                    showNotification("Request updated successfully.", "success");
                    setEditingRequestId(null);
                } else {
                    // Create new request
                    await addDoc(collection(db, requestsCollectionPath), requestData);
                    showNotification("Request saved successfully.", "success");
                }
            }
            
            resetForm();
        } catch (error) {
            console.error("Error saving request: ", error);
            showNotification("Failed to save request.", "error");
        } finally {
            setIsSaving(false);
        }
    };
	
    const downloadCSV = () => {
        const dataToExport = reportFilter === 'All' ? savedRequests : savedRequests.filter(req => req.division === reportFilter);
        if (dataToExport.length === 0) { showNotification(`No data to download for ${reportFilter} division.`, "error"); return; }
        
        const headers = [
            'Submitted By', 'Division', 'Purpose', 'Departure', 'Destination', 
            'Fare Class', 'No. of Travelers', 'Target Date', 'Mission Days', 
            'Airfare ($)', 'Hotel/Day ($)', 'DMA/Day ($)', 
            'Reserved', 'Reserved', 'Total Cost ($)', 
            'Contingency ($)', 'Overall Budget ($)'
        ];
        
        const rows = dataToExport.map(req => [
            `"${req.submittedBy}"`,
            `"${req.division}"`,
            `"${req.purpose || ''}"`,
            `"${req.departureCity}, ${req.departureCountry}"`,
            `"${req.city}, ${req.country}"`,
            `"${req.fareClass}"`,
            req.numberOfPeople || 1,
            `"${req.targetDate}"`,
            req.travelDays,
            req.airfare?.toFixed(2) || '0.00',
            req.hotelFare?.toFixed(2) || '0.00',
            req.dma?.toFixed(2) || '0.00',
            'N/A',
            'N/A',
            req.totalCost?.toFixed(2) || '0.00',
            req.contingency?.toFixed(2) || '0.00',
            req.overallBudget?.toFixed(2) || '0.00'
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ctl_travel_budget_detailed_report_${reportFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (value) => value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00';
    
    const renderUserGuide = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">🛫 CTL Travel Budget App Guide</h2>
                        <p className="opacity-90 mt-1">Step-by-step instructions for using the app</p>
                    </div>
                    <button onClick={() => setShowUserGuide(false)} className="text-white hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-blue-500">
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">1</div>
                                <h3 className="text-xl font-semibold text-slate-800">Getting Started - Basic Information</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">👤 User Information</h4>
                                    <p className="text-slate-600 text-sm mb-2"><span className="font-semibold text-red-600">Submitted by/User:</span> Auto-filled with your authenticated user name. Edit if needed.</p>
                                    <p className="text-slate-600 text-sm"><span className="font-semibold text-red-600">Division:</span> Select your department (CTLA, CTFA, CTOC, or CTAC) for report organization.</p>
                                </div>
                                
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">📝 Purpose/Event Description</h4>
                                    <p className="text-slate-600 text-sm"><span className="font-semibold text-red-600">Required:</span> Provide detailed travel purpose, event names, meeting objectives, or business reasons.</p>
                                </div>
                                
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-yellow-800 text-sm"><span className="font-semibold">💡 Pro Tip:</span> Be specific in your purpose description - it helps with budget approval and record-keeping!</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step 2 */}
                        <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-green-500">
                            <div className="flex items-center mb-4">
                                <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">2</div>
                                <h3 className="text-xl font-semibold text-slate-800">Flight Details Configuration</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">🛫 Departure & Destination</h4>
                                    <p className="text-slate-600 text-sm mb-1"><span className="font-semibold text-red-600">Departure:</span> Select country and city where journey begins</p>
                                    <p className="text-slate-600 text-sm mb-1"><span className="font-semibold text-red-600">Destination:</span> Choose target country and city</p>
                                    <p className="text-slate-600 text-sm"><span className="font-semibold text-red-600">Fare Class:</span> Business or Economy for airfare calculations</p>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-600 mb-2">🎛️ Manual Airfare Override</h4>
                                    <p className="text-slate-600 text-sm mb-2">Toggle this feature to enter custom airfare instead of API-fetched prices:</p>
                                    <ul className="text-slate-600 text-sm space-y-1 ml-4">
                                        <li>• <span className="font-semibold">OFF:</span> App fetches current airfare automatically</li>
                                        <li>• <span className="font-semibold">ON:</span> Enter your own airfare amount in USD</li>
                                        <li>• Manual entries are marked with orange "Manual" badges</li>
                                    </ul>
                                </div>
                                
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-purple-600 mb-2">🗺️ Multi-city Trip</h4>
                                    <p className="text-slate-600 text-sm mb-2">Enable for complex itineraries with multiple destinations:</p>
                                    <ul className="text-slate-600 text-sm space-y-1 ml-4">
                                        <li>• <span className="font-semibold">OFF:</span> Standard round-trip calculation</li>
                                        <li>• <span className="font-semibold">ON:</span> Route-based itinerary (Origin → Dest1 → Dest2 → Origin)</li>
                                        <li>• Hotel/DMA calculated only for destinations (not return leg)</li>
                                        <li>• Separate mission days for each destination</li>
                                        <li>• Airfare includes all route segments</li>
                                        <li>• Multi-city trips are marked with purple "Multi-city" badges</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step 3 */}
                        <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-purple-500">
                            <div className="flex items-center mb-4">
                                <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">3</div>
                                <h3 className="text-xl font-semibold text-slate-800">Travel Details & Timing</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">👥 Attendee Information</h4>
                                    <p className="text-slate-600 text-sm mb-1"><span className="font-semibold text-green-600">Target Audience:</span> Optional - describe who will attend</p>
                                    <p className="text-slate-600 text-sm"><span className="font-semibold text-red-600">Number of Travelers:</span> Total travelers (affects final budget)</p>
                                </div>
                                
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">📅 Schedule Information</h4>
                                    <p className="text-slate-600 text-sm mb-1"><span className="font-semibold text-red-600">Target Date:</span> Departure date (affects airfare pricing)</p>
                                    <p className="text-slate-600 text-sm"><span className="font-semibold text-red-600">Mission Days:</span> Total days (affects hotel and DMA costs)</p>
                                </div>
                                
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-yellow-800 text-sm font-semibold mb-2">📊 Cost Calculation Notes:</p>
                                    <ul className="text-yellow-800 text-sm space-y-1 ml-4">
                                        <li>• Hotel rates: per day × mission days (calculated separately for multi-city)</li>
                                        <li>• DMA (Daily Meal Allowance): per day × mission days (calculated separately for multi-city)</li>
                                        <li>• All costs multiplied by number of travelers</li>
                                        <li>• 5% contingency automatically added</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step 4 */}
                        <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-orange-500">
                            <div className="flex items-center mb-4">
                                <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">4</div>
                                <h3 className="text-xl font-semibold text-slate-800">Calculate & Save Your Budget</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                                    <div className="text-2xl mb-2">🧮</div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Calculate Budget</h4>
                                    <p className="text-slate-600 text-xs mt-1">Fetch airfare, hotel rates, and generate breakdown</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                                    <div className="text-2xl mb-2">👀</div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Review Results</h4>
                                    <p className="text-slate-600 text-xs mt-1">Check budget breakdown and verify amounts</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                                    <div className="text-2xl mb-2">💾</div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Save Request</h4>
                                    <p className="text-slate-600 text-xs mt-1">Store budget for future reference</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-slate-200 text-center">
                                    <div className="text-2xl mb-2">📊</div>
                                    <h4 className="font-semibold text-slate-800 text-sm">View Reports</h4>
                                    <p className="text-slate-600 text-xs mt-1">See saved budgets and download CSV</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step 5 */}
                        <div className="bg-slate-50 rounded-xl p-6 border-l-4 border-indigo-500">
                            <div className="flex items-center mb-4">
                                <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">5</div>
                                <h3 className="text-xl font-semibold text-slate-800">Understanding Your Budget Breakdown</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">💰 Cost Components</h4>
                                    <div className="text-slate-600 text-sm space-y-1">
                                        <p><span className="font-semibold">Airfare:</span> Roundtrip flight cost (per person)</p>
                                        <p><span className="font-semibold">Hotel Fare:</span> Daily accommodation cost</p>
                                        <p><span className="font-semibold">DMA:</span> Daily Meal Allowance per day</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <h4 className="font-semibold text-blue-600 mb-2">📈 Final Calculations</h4>
                                    <div className="text-slate-600 text-sm space-y-1">
                                        <p><span className="font-semibold">Total Cost:</span> (Airfare + Hotel×Days + DMA×Days) × Travelers</p>
                                        <p><span className="font-semibold">Contingency:</span> 5% buffer added to total</p>
                                        <p><span className="font-semibold">Overall Budget:</span> Total Cost + Contingency</p>
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-blue-800 text-sm"><span className="font-semibold">🔄 Currency Conversion:</span> Hotel rates in local currency (CNY, INR, PHP) are automatically converted to USD using live exchange rates.</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Final Tips */}
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-6 text-center">
                            <h3 className="text-xl font-bold mb-3">🎉 You're Ready to Start!</h3>
                            <p className="mb-4">Follow these steps to create accurate travel budgets for your CTL trips.</p>
                            <div className="flex flex-wrap justify-center gap-2 text-sm">
                                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">Calculate Budget</span>
                                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">Save Request</span>
                                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">View Reports</span>
                            </div>
                            <p className="mt-4 text-sm opacity-90">💡 All required fields must be filled before calculating. The app will guide you with notifications!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-700">Flight Details</h3>
                            <div className="flex items-center">
                                <label className="font-medium text-sm text-slate-700 flex items-center mr-3">
                                    <MapPin className="w-4 h-4 mr-2"/>Multi-city Trip
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMultiCityMode(!multiCityMode);
                                        if (!multiCityMode) {
                                            setSecondDestinationCountry('');
                                            setSecondDestinationCity('');
                                            setSecondTravelDays(1);
                                        }
                                    }}
                                    className="flex items-center text-purple-600 hover:text-purple-800"
                                >
                                    {multiCityMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    <span className="ml-1 text-sm">{multiCityMode ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Route 1: Origin to First Destination */}
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <h4 className="font-medium text-blue-700 text-sm mb-3">Route 1: Origin → First Destination</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="departureCountry" className="font-medium text-xs text-slate-600">From Country</label>
                                        <select id="departureCountry" value={departureCountry} onChange={e => setDepartureCountry(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white text-sm">
                                            <option value="">Select country...</option>
                                            {Object.keys(hotelData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="departureCity" className="font-medium text-xs text-slate-600">From City</label>
                                        <select id="departureCity" value={departureCity} onChange={e => setDepartureCity(e.target.value)} disabled={!departureCountry} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition disabled:bg-slate-100 bg-white text-sm">
                                            <option value="">Select city...</option>
                                            {departureCities.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <label htmlFor="country" className="font-medium text-xs text-slate-600">To Country</label>
                                        <select id="country" value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white text-sm">
                                            <option value="">Select country...</option>
                                            {Object.keys(hotelData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="city" className="font-medium text-xs text-slate-600">To City</label>
                                        <select id="city" value={city} onChange={e => setCity(e.target.value)} disabled={!country} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition disabled:bg-slate-100 bg-white text-sm">
                                            <option value="">Select city...</option>
                                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="font-medium text-xs text-slate-600">Mission Days at Destination 1</label>
                                    <input 
                                        type="number" 
                                        value={travelDays} 
                                        min="1" 
                                        onChange={e => setTravelDays(Number(e.target.value))} 
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm mt-1"
                                    />
                                </div>
                            </div>
                            
                            {/* Route 2: Multi-city Second Leg */}
                            {multiCityMode && (
                                <div className="bg-white p-4 rounded-lg border border-purple-200">
                                    <h4 className="font-medium text-purple-700 text-sm mb-3">Route 2: First Destination → Second Destination</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="font-medium text-xs text-slate-600">From (Auto-filled)</label>
                                            <input 
                                                type="text" 
                                                value={city && country ? `${city}, ${country}` : 'Select Route 1 destination first'} 
                                                disabled 
                                                className="w-full p-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-medium text-xs text-slate-600">To Country</label>
                                            <select 
                                                value={secondDestinationCountry} 
                                                onChange={e => setSecondDestinationCountry(e.target.value)} 
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition bg-white text-sm"
                                            >
                                                <option value="">Select country...</option>
                                                {Object.keys(hotelData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <label className="font-medium text-xs text-slate-600">To City</label>
                                            <select 
                                                value={secondDestinationCity} 
                                                onChange={e => setSecondDestinationCity(e.target.value)} 
                                                disabled={!secondDestinationCountry} 
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition disabled:bg-slate-100 bg-white text-sm"
                                            >
                                                <option value="">Select city...</option>
                                                {secondDestinationCities.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-medium text-xs text-slate-600">Mission Days at Destination 2</label>
                                            <input 
                                                type="number" 
                                                value={secondTravelDays} 
                                                min="1" 
                                                onChange={e => setSecondTravelDays(Number(e.target.value))} 
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Return Journey Info */}
                            {multiCityMode && secondDestinationCity && secondDestinationCountry && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-600 text-sm mb-2">Return Journey (Included in Airfare)</h4>
                                    <p className="text-xs text-gray-500">
                                        {secondDestinationCity}, {secondDestinationCountry} → {departureCity}, {departureCountry}
                                        <br />
                                        <span className="italic">No additional hotel/DMA costs for return travel</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-2 mt-5">
                            <label htmlFor="fareClass" className="font-medium text-sm text-slate-700 flex items-center">
                                <Briefcase className="w-4 h-4 mr-2"/>Fare Class
                            </label>
                            <select id="fareClass" value={fareClass} onChange={e => setFareClass(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white">
                                <option>Business</option>
                                <option>Economy</option>
                            </select>
                        </div>
                        
                        {/* Manual Airfare Override Section */}
                        <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="font-medium text-sm text-slate-700 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2"/>Manual Airfare Override
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManualAirfareMode(!manualAirfareMode);
                                        if (!manualAirfareMode) {
                                            setManualAirfarePrice('');
                                        }
                                    }}
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                    {manualAirfareMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    <span className="ml-1 text-sm">{manualAirfareMode ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                            {manualAirfareMode && (
                                <div className="space-y-2">
                                    <input
                                        type="number"
                                        placeholder="Enter custom airfare price (USD)"
                                        value={manualAirfarePrice}
                                        onChange={e => setManualAirfarePrice(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-xs text-slate-600">When enabled, this price will be used instead of API-fetched airfare.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2"><label htmlFor="targetAudience" className="font-medium text-sm text-slate-700 flex items-center"><Users className="w-4 h-4 mr-2"/>Target Audience</label><input type="text" id="targetAudience" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                        <div className="space-y-2"><label htmlFor="numberOfPeople" className="font-medium text-sm text-slate-700 flex items-center"><Users className="w-4 h-4 mr-2"/>Number of Travelers</label><input type="number" id="numberOfPeople" value={numberOfPeople} min="1" onChange={e => setNumberOfPeople(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                    </div>
                    <div className="space-y-2"><label htmlFor="targetDate" className="font-medium text-sm text-slate-700 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Target Date</label><input type="date" id="targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/></div>
                    <div className="flex space-x-2 pt-4">
                        <button type="button" onClick={calculateBudget} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center disabled:bg-blue-300" disabled={airfareLoading || ratesLoading}>{airfareLoading || ratesLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Calculating...</> : <><Calculator className="w-5 h-5 mr-2" />Calculate</>}</button>
                        <button type="button" onClick={handleSaveRequest} className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center justify-center disabled:bg-green-300" disabled={isSaving || !isCalculated}>{isSaving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Saving...</> : <><Save className="w-5 h-5 mr-2" />{editingRequestId ? 'Update Request' : 'Save Request'}</>}</button>
                    </div>
                </form>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                <h2 className="text-2xl font-semibold mb-6 border-b pb-3 text-slate-800">2. Budget Breakdown</h2>
                <div className={`transition-opacity duration-500 ${isCalculated ? 'opacity-100' : 'opacity-50'}`}>
                    <div className="space-y-4 text-slate-700">
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                            <span className="font-medium flex items-center">
                                <Plane className="w-5 h-5 mr-3 text-blue-500"/>
                                Airfare (per person)
                                {manualAirfareMode && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Manual</span>}
                                {multiCityMode && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Multi-city</span>}
                            </span>
                            <div className="flex items-center space-x-2">
                                {airfareLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="font-bold text-lg text-slate-900">{formatCurrency(airfare)}</span>}
                                {airfareSourceUrl && !airfareLoading && !manualAirfareMode && (
                                    <a href={airfareSourceUrl} target="_blank" rel="noopener noreferrer" title="Consult Source" className="text-blue-500 hover:text-blue-700">
                                        <ExternalLink className="w-4 h-4"/>
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                            <span className="font-medium flex items-center">
                                <Building2 className="w-5 h-5 mr-3 text-blue-500"/>
                                Hotel Fare {multiCityMode ? '(Route 1)' : '(per day)'}
                            </span>
                            <div className="text-right">
                                <span className="font-bold text-lg text-slate-900">{formatCurrency(hotelFare)}</span>
                                {originalHotelInfo && originalHotelInfo.currency !== 'USD' && <div className="text-xs text-slate-500">Converted from {originalHotelInfo.rate.toLocaleString()} {originalHotelInfo.currency}</div>}
                            </div>
                        </div>
                        {multiCityMode && secondHotelFare !== null && (
                            <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                                <span className="font-medium flex items-center">
                                    <Building2 className="w-5 h-5 mr-3 text-purple-500"/>
                                    Hotel Fare (Route 2)
                                </span>
                                <div className="text-right">
                                    <span className="font-bold text-lg text-slate-900">{formatCurrency(secondHotelFare)}</span>
                                    {secondOriginalHotelInfo && secondOriginalHotelInfo.currency !== 'USD' && <div className="text-xs text-slate-500">Converted from {secondOriginalHotelInfo.rate.toLocaleString()} {secondOriginalHotelInfo.currency}</div>}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                            <span className="font-medium flex items-center">
                                <DollarSign className="w-5 h-5 mr-3 text-blue-500"/>
                                DMA {multiCityMode ? '(Route 1)' : '(per day)'}
                            </span>
                            <span className="font-bold text-lg text-slate-900">{formatCurrency(dma)}</span>
                        </div>
                        {multiCityMode && secondDma !== null && (
                            <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
                                <span className="font-medium flex items-center">
                                    <DollarSign className="w-5 h-5 mr-3 text-purple-500"/>
                                    DMA (Route 2)
                                </span>
                                <span className="font-bold text-lg text-slate-900">{formatCurrency(secondDma)}</span>
                            </div>
                        )}
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
                        <FileDown className="w-5 h-5 mr-2" />Download Detailed CSV
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
                                <th scope="col" className="px-4 py-3">No. of Travelers</th>
                                <th scope="col" className="px-4 py-3">Fare Class</th>
                                <th scope="col" className="px-4 py-3">Overall Budget</th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-4 py-4">{req.submittedBy}</td>
                                    <td className="px-4 py-4">{req.division}</td>
                                    <td className="px-4 py-4">{req.departureCity}, {req.departureCountry}</td>
                                    <td className="px-4 py-4 font-medium text-slate-900">
                                        {req.city}, {req.country}
                                        {req.multiCityMode && req.multiCityLeg && (
                                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                                                Leg {req.multiCityLeg}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">{req.numberOfPeople || 1}</td>
                                    <td className="px-4 py-4">
                                        {req.fareClass}
                                        {req.manualAirfareMode && <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">Manual</span>}
                                        {req.multiCityMode && <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">Multi-city</span>}
                                    </td>
                                    <td className="px-4 py-4 font-semibold">{formatCurrency(req.overallBudget)}</td>
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
                            <button onClick={() => setShowUserGuide(true)} className="px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 transition-colors"><HelpCircle className="w-5 h-5"/><span>Help</span></button>
                         </div>
                    </div>
                     <div className="mt-4 text-center text-xs text-slate-500">{user ? <>Logged in as: <span className="font-mono bg-slate-200 px-2 py-1 rounded">{userId}</span></> : <><Loader2 className="w-4 h-4 inline-block animate-spin mr-2"/>Authenticating...</>}</div>
                </header>
                {notification.message && (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl z-50 text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}>{notification.message}</div>)}
                {showUserGuide && renderUserGuide()}
                {view === 'calculator' ? renderCalculatorView() : renderReportsView()}
            </div>
        </div>
    );
};

export default App;