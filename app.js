// DOM Elements
const searchBox = document.querySelector(".search-box input");
const searchBtn = document.querySelector("#search");
const locationBtn = document.querySelector("#location");
const unitToggle = document.querySelector("#unit-toggle");
const weatherIcon = document.querySelector(".weather-icon");
const appContainer = document.querySelector(".app-container");
const hourlyContainer = document.getElementById("hourly-container");
const dailyContainer = document.getElementById("daily-container");
const currentTimeElement = document.querySelector(".current-time");
const updateTimeElement = document.getElementById("update-time");
const body = document.body;

// API Keys and URLs
const weatherApiKey = 'Your Openweathermap API key';
const weatherURL = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=`;
const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?units=metric&`;
const geolocationURL = `https://api.openweathermap.org/data/2.5/weather?units=metric&`;
const imageApiKey = "Your Unsplash API key";
const imageURL = "https://api.unsplash.com/search/photos?page=1&query=";

// App State
let isCelsius = true;
let lastUpdateTime = null;

// Initialize the app
function init() {
    // Load saved preferences
    loadPreferences();

    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', getLocationWeather);
    unitToggle.addEventListener('click', toggleTemperatureUnit);
    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Update time immediately and then every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Update background based on time of day
    updateBackgroundByTime();
    setInterval(updateBackgroundByTime, 60000);

    // Hide preloader after 1.5 seconds
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelector("#preloader").style.display = "none";
        }, 1500);
    });

    // Default to London weather
    checkWeather("BlackBird Leys");
}

// Load user preferences from localStorage
function loadPreferences() {
    const savedUnit = localStorage.getItem('temperatureUnit');
    if (savedUnit === 'fahrenheit') {
        isCelsius = false;
        unitToggle.textContent = '°F/°C';
    }
}

// Save user preferences to localStorage
function savePreferences() {
    localStorage.setItem('temperatureUnit', isCelsius ? 'celsius' : 'fahrenheit');
}

// Handle search button click
function handleSearch() {
    const city = searchBox.value.trim();
    if (city) {
        checkWeather(city);
        generateImage(city);
    } else {
        showError("Please enter a city name");
    }
}

// Toggle between Celsius and Fahrenheit
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    unitToggle.textContent = isCelsius ? '°C/°F' : '°F/°C';
    savePreferences();

    // Update displayed temperatures
    const tempElement = document.querySelector("#temp");
    if (tempElement.textContent) {
        const currentTemp = parseFloat(tempElement.textContent);
        tempElement.textContent = isCelsius
            ? convertToCelsius(currentTemp) + "°C"
            : convertToFahrenheit(currentTemp) + "°F";
    }

    // Update hourly forecast temperatures
    const hourlyTemps = document.querySelectorAll(".hourly-temp");
    hourlyTemps.forEach(tempElement => {
        const tempValue = parseFloat(tempElement.textContent);
        tempElement.textContent = isCelsius
            ? Math.round(convertToCelsius(tempValue)) + "°"
            : Math.round(convertToFahrenheit(tempValue)) + "°";
    });

    // Update daily forecast temperatures
    const dailyHighs = document.querySelectorAll(".daily-high");
    const dailyLows = document.querySelectorAll(".daily-low");

    dailyHighs.forEach(highElement => {
        const highValue = parseFloat(highElement.textContent);
        highElement.textContent = isCelsius
            ? Math.round(convertToCelsius(highValue))
            : Math.round(convertToFahrenheit(highValue));
    });

    dailyLows.forEach(lowElement => {
        const lowValue = parseFloat(lowElement.textContent.match(/\d+/)[0]);
        lowElement.textContent = isCelsius
            ? Math.round(convertToCelsius(lowValue))
            : Math.round(convertToFahrenheit(lowValue));
    });
}

// Convert Celsius to Fahrenheit
function convertToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Convert Fahrenheit to Celsius
function convertToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

// Update current time display
function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeString = now.toLocaleTimeString('en-US', options);
    const dateString = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    currentTimeElement.textContent = `${dateString} | ${timeString}`;
}

// Update last updated time
function updateLastUpdatedTime() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    lastUpdateTime = now.toLocaleTimeString('en-US', options);
    updateTimeElement.textContent = lastUpdateTime;
}

// Update background based on time of day and weather
function updateBackgroundByTime() {
    const now = new Date();
    const hours = now.getHours();

    // Remove all weather classes first
    body.className = '';

    // Set day/night background
    if (hours >= 6 && hours < 18) {
        body.classList.add('day');
    } else {
        body.classList.add('night');
    }

    // Add weather-specific class if available
    const weatherCondition = document.querySelector("#condition").textContent.toLowerCase();
    if (weatherCondition.includes('clear')) {
        body.classList.add('sunny');
    } else if (weatherCondition.includes('rain')) {
        body.classList.add('rainy');
    } else if (weatherCondition.includes('cloud')) {
        body.classList.add('cloudy');
    } else if (weatherCondition.includes('snow')) {
        body.classList.add('snowy');
    }
}

// Show error message
function showError(message) {
    const errorElement = document.querySelector(".error");
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.display = 'block';
    document.querySelector(".weather").style.display = "none";

    // Hide error after 3 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

// Get weather by geolocation
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchLocationWeather(lat, lon);
            },
            (error) => {
                showError("Geolocation access denied. Please enable it or search manually.");
                console.error("Geolocation error:", error);
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
}

// Fetch weather by geolocation
async function fetchLocationWeather(lat, lon) {
    try {
        const response = await fetch(`${geolocationURL}lat=${lat}&lon=${lon}&appid=${weatherApiKey}`);
        if (!response.ok) throw new Error('Failed to fetch location weather');

        const data = await response.json();
        updateData(data);
        getForecast(lat, lon);
        generateImage(data.name);
        searchBox.value = data.name;
    } catch (error) {
        console.error("Error fetching location weather:", error);
        showError("Failed to get weather for your location");
    }
}

// Main weather check function
async function checkWeather(city) {
    try {
        const response = await fetch(weatherURL + city + `&appid=${weatherApiKey}`);

        if (response.status === 404) {
            showError("City not found. Please check the spelling.");
            appContainer.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("images/weather.jpg")`;
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch weather data');

        const data = await response.json();
        updateData(data);
        getForecast(data.coord.lat, data.coord.lon);
        updateLastUpdatedTime();
    } catch (error) {
        console.error("Error fetching weather:", error);
        showError("Failed to fetch weather data. Please try again.");
    }
}

// Get forecast data (hourly and daily)
async function getForecast(lat, lon) {
    try {
        const response = await fetch(`${forecastURL}lat=${lat}&lon=${lon}&appid=${weatherApiKey}`);
        if (!response.ok) throw new Error('Failed to fetch forecast data');

        const data = await response.json();
        displayHourlyForecast(data.list);
        displayDailyForecast(data.list);
    } catch (error) {
        console.error("Error fetching forecast:", error);
        hourlyContainer.innerHTML = "<p>Forecast not available</p>";
        dailyContainer.innerHTML = "<p>Forecast not available</p>";
    }
}

// Display hourly forecast
function displayHourlyForecast(hourlyData) {
    hourlyContainer.innerHTML = "";

    // Group forecasts by day
    const forecastsByDay = {};
    const now = new Date();
    const currentHour = now.getHours();

    hourlyData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        if (!forecastsByDay[day]) {
            forecastsByDay[day] = [];
        }

        if (date > now || (date.getDate() === now.getDate() && date.getHours() === currentHour)) {
            forecastsByDay[day].push(item);
        }
    });

    // Display maximum 3 days with 8 hours each
    const maxDays = 3;
    const maxHoursPerDay = 8;
    let daysDisplayed = 0;

    for (const day in forecastsByDay) {
        if (daysDisplayed >= maxDays) break;

        const dayForecasts = forecastsByDay[day].slice(0, maxHoursPerDay);
        if (dayForecasts.length === 0) continue;

        // Create day container
        const daySection = document.createElement("div");
        daySection.className = "day-section";

        // Create day header
        const dayHeader = document.createElement("div");
        dayHeader.className = "day-header";
        dayHeader.textContent = day;
        daySection.appendChild(dayHeader);

        // Create container for hours
        const hoursContainer = document.createElement("div");
        hoursContainer.className = "hours-container";

        dayForecasts.forEach(item => {
            const date = new Date(item.dt * 1000);
            const hour = date.getHours().toString().padStart(2, '0');
            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

            const hourItem = document.createElement("div");
            hourItem.className = "hourly-item";
            hourItem.innerHTML = `
                <div>${hour}:00</div>
                <img src="${iconUrl}" alt="${item.weather[0].description}" loading="lazy">
                <div class="hourly-temp">${isCelsius ? temp : Math.round(convertToFahrenheit(temp))}°</div>
            `;

            hoursContainer.appendChild(hourItem);
        });

        daySection.appendChild(hoursContainer);
        hourlyContainer.appendChild(daySection);
        daysDisplayed++;
    }
}

// Display 5-day forecast
function displayDailyForecast(forecastData) {
    dailyContainer.innerHTML = "";

    // Group forecasts by day
    const forecastsByDay = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to beginning of day

    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        date.setHours(0, 0, 0, 0);
        const dayKey = date.toISOString().split('T')[0];

        if (!forecastsByDay[dayKey]) {
            forecastsByDay[dayKey] = [];
        }

        forecastsByDay[dayKey].push(item);
    });

    // Get the next 5 days (including today)
    const next5Days = Object.keys(forecastsByDay).slice(0, 5);

    next5Days.forEach(dayKey => {
        const dayForecasts = forecastsByDay[dayKey];
        const date = new Date(dayKey);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Find min and max temps for the day
        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let mainIcon = '';

        dayForecasts.forEach(item => {
            if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
            if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;

            // Use the midday forecast (around 12pm) for the icon
            const hour = new Date(item.dt * 1000).getHours();
            if (hour >= 11 && hour <= 13) {
                mainIcon = item.weather[0].icon;
            }
        });

        // If no midday icon, use the first one
        if (!mainIcon && dayForecasts.length > 0) {
            mainIcon = dayForecasts[0].weather[0].icon;
        }

        const iconUrl = `https://openweathermap.org/img/wn/${mainIcon}.png`;

        const dayItem = document.createElement("div");
        dayItem.className = "daily-item";
        dayItem.innerHTML = `
            <div class="daily-day">${dayName}</div>
            <img src="${iconUrl}" alt="${dayForecasts[0].weather[0].description}" class="daily-icon" loading="lazy">
            <div class="daily-temp">
                <span class="daily-high">${isCelsius ? Math.round(maxTemp) : Math.round(convertToFahrenheit(maxTemp))}</span>
                <span class="daily-low">${isCelsius ? Math.round(minTemp) : Math.round(convertToFahrenheit(minTemp))}</span>
            </div>
        `;

        dailyContainer.appendChild(dayItem);
    });
}

// Update weather data in the UI
function updateData(data) {
    // Update the weather data
    document.querySelector("#city").textContent = data.name;

    const temp = Math.round(data.main.temp);
    document.querySelector("#temp").textContent = isCelsius ? `${temp}°C` : `${Math.round(convertToFahrenheit(temp))}°F`;

    document.querySelector(".humidity").textContent = data.main.humidity + '%';
    document.querySelector(".wind").textContent = data.wind.speed + " km/h";
    document.querySelector(".pressure").textContent = data.main.pressure + " hPa";

    // Update weather condition and icon
    const weatherCondition = data.weather[0].main;
    document.querySelector("#condition").textContent = weatherCondition;

    // Set appropriate weather icon
    const iconMap = {
        'Clear': 'clear',
        'Clouds': 'clouds',
        'Rain': 'rain',
        'Drizzle': 'drizzle',
        'Thunderstorm': 'thunderstorm',
        'Snow': 'snow',
        'Mist': 'mist',
        'Smoke': 'mist',
        'Haze': 'mist',
        'Dust': 'mist',
        'Fog': 'mist',
        'Sand': 'mist',
        'Ash': 'mist',
        'Squall': 'rain',
        'Tornado': 'thunderstorm'
    };

    const iconName = iconMap[weatherCondition] || 'clear';
    weatherIcon.src = `images/${iconName}.png`;

    // Update background based on weather condition
    updateBackgroundByTime();

    // Show the weather section
    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = 'none';
}

// Generate background image from Unsplash
async function generateImage(city) {
    try {
        const response = await fetch(imageURL + city + `&client_id=${imageApiKey}`);
        if (!response.ok) throw new Error('Failed to fetch image');

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const img = data.results[0].urls.regular;
            appContainer.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${img})`;
        }
    } catch (error) {
        console.error("Error fetching image:", error);
        // Fallback to default background
        appContainer.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("images/weather.jpg")`;
    }
}

// Initialize the app
init();
