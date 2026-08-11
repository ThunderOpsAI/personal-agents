# Weather & Washing Schedule Rules

## 1. Location & Source Invariants
- **Location**: Wangaratta, Victoria, Australia.
- **Coordinates**: Latitude `-36.3536`, Longitude `146.3225`.
- **Data Source**: Live Open-Meteo HTTP API (`https://api.open-meteo.com/v1/forecast`).
- **No Inference**: No LLM weather guessing or static mock values. Weather data must come strictly from live API calls.

## 2. Washing Day Selection Logic
- Fetch 7-day daily forecast parameters: `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `precipitation_probability_max`.
- Calculate precipitation risk for each day in the 7-day forecast.
- **Target Selection**: Select exactly **2 washing days** per week corresponding to the dates with the **lowest forecast precipitation probabilities**.
- Present selected dates alongside their exact forecast precipitation percentage and temperature range.

## 3. Unavailable & Error State Handling
- If Open-Meteo HTTP requests fail or network is unreachable, return explicit state:
  `{ status: "unavailable", error: "Weather data service unavailable" }`.
- Do NOT generate fallback mock weather or fabricate dry days when API is unreachable.
