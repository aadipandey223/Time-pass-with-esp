export interface WeatherConfig {
  provider: 'openweathermap' | 'weatherapi';
  key: string;
}

export interface ForecastPoint {
  time: string;
  temp: number;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  aqi: number;
  description: string;
  forecast: ForecastPoint[];
}

const fetchOpenWeatherMap = async (key: string, lat: number, lon: number): Promise<WeatherData> => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OpenWeatherMap current weather failed');
  const data = await res.json();
  
  // Fetch AQI
  const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
  let aqi = 50;
  try {
    const aqiRes = await fetch(aqiUrl);
    if (aqiRes.ok) {
      const aqiData = await aqiRes.json();
      aqi = (aqiData.list[0]?.main?.aqi || 1) * 20; 
    }
  } catch (e) {
    console.error('AQI fetch failed', e);
  }

  // Fetch Forecast (5 day / 3 hour)
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  let forecast: ForecastPoint[] = [];
  try {
    const forecastRes = await fetch(forecastUrl);
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      // Take first 8 points (24 hours in 3-hour intervals)
      forecast = forecastData.list.slice(0, 8).map((item: any) => {
        const date = new Date(item.dt * 1000);
        return {
          time: `${String(date.getHours()).padStart(2, '0')}:00`,
          temp: item.main.temp
        };
      });
    }
  } catch (e) {
    console.error('Forecast fetch failed', e);
  }

  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    wind: Math.round(data.wind.speed * 3.6), // m/s to km/h
    aqi,
    description: data.weather[0]?.description || 'Clear',
    forecast
  };
};

const fetchWeatherAPI = async (key: string, lat: number, lon: number): Promise<WeatherData> => {
  // Use forecast endpoint which includes current and forecast data
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=2&aqi=yes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('WeatherAPI failed');
  const data = await res.json();

  let forecast: ForecastPoint[] = [];
  try {
    const currentEpoch = data.current.last_updated_epoch;
    let allHours: any[] = [];
    if (data.forecast?.forecastday) {
      data.forecast.forecastday.forEach((day: any) => {
        allHours = allHours.concat(day.hour);
      });
    }
    // Filter to hours after current time and take 24
    forecast = allHours
      .filter((hour: any) => hour.time_epoch >= currentEpoch)
      .slice(0, 24)
      .filter((_, i) => i % 3 === 0) // sample every 3 hours to match OWM density if desired, or keep 24. Let's keep 8 points for consistency.
      .slice(0, 8)
      .map((hour: any) => {
        const date = new Date(hour.time_epoch * 1000);
        return {
          time: `${String(date.getHours()).padStart(2, '0')}:00`,
          temp: hour.temp_c
        };
      });
  } catch (e) {
    console.error('WeatherAPI forecast extraction failed', e);
  }

  return {
    temp: Math.round(data.current.temp_c),
    feelsLike: Math.round(data.current.feelslike_c),
    humidity: data.current.humidity,
    wind: Math.round(data.current.wind_kph),
    aqi: Math.round(data.current.air_quality?.['us-epa-index'] * 20 || 50),
    description: data.current.condition.text,
    forecast
  };
};

export const getWeatherData = async (configs: WeatherConfig[], lat: number, lon: number): Promise<WeatherData> => {
  let lastError: Error | null = null;

  for (const config of configs) {
    try {
      if (config.provider === 'openweathermap') {
        return await fetchOpenWeatherMap(config.key, lat, lon);
      } else if (config.provider === 'weatherapi') {
        return await fetchWeatherAPI(config.key, lat, lon);
      }
    } catch (e: any) {
      console.warn(`Weather Engine: Provider ${config.provider} failed.`, e);
      lastError = e;
      continue; // Try next config
    }
  }

  if (lastError) {
    throw lastError;
  }
  
  throw new Error('No valid weather configurations found.');
};
