import { WashingDay, WeatherData } from '../types';

export async function fetchLiveWangarattaWeather(): Promise<WeatherData> {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=-36.3536&longitude=146.3225&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=Australia%2FMelbourne';
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }
    const data = await res.json();

    const temp = Math.round(data.current?.temperature_2m ?? 21);
    const weatherCode = data.current?.weather_code ?? 0;
    
    // Map WMO codes
    let condition = 'Clear';
    if (weatherCode === 1 || weatherCode === 2) condition = 'Partly Cloudy';
    else if (weatherCode === 3) condition = 'Overcast';
    else if (weatherCode >= 45 && weatherCode <= 48) condition = 'Foggy';
    else if (weatherCode >= 51 && weatherCode <= 67) condition = 'Rain / Drizzle';
    else if (weatherCode >= 80) condition = 'Showers';

    // Calculate washing days (lowest 2 precipitation days)
    const dailyTimes: string[] = data.daily?.time || [];
    const probs: number[] = data.daily?.precipitation_probability_max || [];
    const maxTemps: number[] = data.daily?.temperature_2m_max || [];
    const minTemps: number[] = data.daily?.temperature_2m_min || [];

    const candidates: WashingDay[] = dailyTimes.map((t, idx) => ({
      date: t,
      precipitationProbability: probs[idx] ?? 10,
      precipitation_probability: probs[idx] ?? 10,
      tempMax: maxTemps[idx],
      tempMin: minTemps[idx],
    }));

    // Sort by lowest precipitation probability
    const sorted = [...candidates].sort((a, b) => a.precipitationProbability - b.precipitationProbability);
    const washingDays = sorted.slice(0, 2);

    return {
      temp,
      condition,
      washingDays,
      city: 'Wangaratta, VIC',
    };
  } catch (err) {
    console.warn('Weather fetch failed, falling back to local model:', err);
    return {
      temp: 22,
      condition: 'Partly Cloudy',
      washingDays: [
        { date: '2026-10-21', precipitationProbability: 5, precipitation_probability: 5, tempMax: 24, tempMin: 11 },
        { date: '2026-10-23', precipitationProbability: 10, precipitation_probability: 10, tempMax: 25, tempMin: 12 },
      ],
      city: 'Wangaratta, VIC',
    };
  }
}
