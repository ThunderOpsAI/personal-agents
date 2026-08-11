import { NextResponse } from "next/server";

export const runtime = "edge";

const LATITUDE = -36.3536;
const LONGITUDE = 146.3225;
const TIMEZONE = "Australia/Melbourne";
const LOCATION_NAME = "Wangaratta, Victoria, Australia";

export async function GET() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${encodeURIComponent(TIMEZONE)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { status: "unavailable", error: "Weather forecast service unreachable" },
        { status: 503 }
      );
    }
    const data = await res.json();
    return NextResponse.json({
      status: "success",
      location: LOCATION_NAME,
      latitude: LATITUDE,
      longitude: LONGITUDE,
      timezone: TIMEZONE,
      forecast: data,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "unavailable", error: "Weather forecast service unreachable" },
      { status: 503 }
    );
  }
}
