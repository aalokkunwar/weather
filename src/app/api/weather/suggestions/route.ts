import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Using OpenWeatherMap's Geocoding API for location suggestions
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`

   const response = await fetch(url)
const data = await response.json()

if (!response.ok) {
  console.error("OpenWeather response error:", response.status, data)
  return NextResponse.json({ error: "Failed to fetch location suggestions" }, { status: response.status })
}


    // Transform the data to match our interface
    interface LocationData {
      name: string;
      country: string;
      state?: string;
      lat: number;
      lon: number;
    }

    interface LocationSuggestion {
      name: string;
      country: string;
      state?: string;
      lat: number;
      lon: number;
      display_name: string;
    }

    const suggestions: LocationSuggestion[] = (data as LocationData[]).map((location: LocationData) => ({
      name: location.name,
      country: location.country,
      state: location.state,
      lat: location.lat,
      lon: location.lon,
      display_name: `${location.name}${location.state ? `, ${location.state}` : ""}, ${location.country}`,
    }))

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Location suggestions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
