import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  // Using your provided API key
  // const API_KEY = "077e79f89e9cce36fa430f6a6fe293ab"
  const API_KEY= process.env.API_KEY 

  try {
    let url = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric`

    if (q) {
      url += `&q=${encodeURIComponent(q)}`
    } else if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`
    } else {
      return NextResponse.json({ error: "Missing location parameters" }, { status: 400 })
    }

    console.log(`Fetching weather data from OpenWeatherMap API`)
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Weather API error response:", errorData)
      return NextResponse.json({ error: "Weather data not found", details: errorData }, { status: response.status })
    }

    const data = await response.json()
    console.log("Weather data received successfully")

    const weatherData = {
      name: data.name,
      country: data.sys.country,
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data", details: String(error) }, { status: 500 })
  }
}
