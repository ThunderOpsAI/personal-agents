import { NextResponse } from "next/server";

const LATITUDE = -36.3536;
const LONGITUDE = 146.3225;
const TIMEZONE = "Australia/Melbourne";
const LOCATION_NAME = "Wangaratta, Victoria, Australia";

export async function GET() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=${encodeURIComponent(TIMEZONE)}`;  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { status: "unavailable", error: "Weather forecast service unreachable" },
        { status: 503 }
      );
    }
    const data = await res.json();
    
    let forecastArray = [];
    if (data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        forecastArray.push({
          date: data.daily.time[i],
          precipitation_probability_pct: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0
        });
      }
    }

    return NextResponse.json({
      status: "success",
      location: LOCATION_NAME,
      latitude: LATITUDE,
      longitude: LONGITUDE,
      timezone: TIMEZONE,
      temp_c: data.current_weather?.temperature,
      rain_probability_pct: data.hourly?.precipitation_probability ? data.hourly.precipitation_probability[0] : 0,
      forecast: forecastArray,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unavailable", error: "Weather forecast service unreachable" },
      { status: 503 }
    );
  }
}
