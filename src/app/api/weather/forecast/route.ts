import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  // Using your provided API key
  // const API_KEY = "077e79f89e9cce36fa430f6a6fe293ab"
    const API_KEY= process.env.API_KEY || "077e79f89e9cce36fa430f6a6fe293ab"


  try {
    let url = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric`

    if (q) {
      url += `&q=${encodeURIComponent(q)}`
    } else if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`
    } else {
      return NextResponse.json({ error: "Missing location parameters" }, { status: 400 })
    }

    console.log(`Fetching forecast data from OpenWeatherMap API`)
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Forecast API error response:", errorData)
      return NextResponse.json({ error: "Forecast data not found", details: errorData }, { status: response.status })
    }

    const data = await response.json()
    console.log("Forecast data received successfully")

    // Process forecast data to get daily forecasts
    const dailyForecasts = []
    const processedDates = new Set()

    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toDateString()

      if (!processedDates.has(date)) {
        processedDates.add(date)
        dailyForecasts.push({
          dt: item.dt,
          temp: {
            min: item.main.temp_min,
            max: item.main.temp_max,
          },
          weather: item.weather,
        })
      }
    }

    interface WeatherItem {
      dt: number;
      weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
      }>;
    }

    interface ForecastItem extends WeatherItem {
      main: {
        temp: number;
        temp_min: number;
        temp_max: number;
      };
    }

    interface DailyForecast extends WeatherItem {
      temp: {
        min: number;
        max: number;
      };
    }

    interface ForecastResponse {
      list: Array<{
        dt: number;
        temp: number;
        weather: WeatherItem['weather'];
      }>;
      daily: DailyForecast[];
    }

        return NextResponse.json<ForecastResponse>({
          list: data.list.map((item: ForecastItem) => ({
            dt: item.dt,
            temp: item.main.temp,
            weather: item.weather,
          })),
          daily: dailyForecasts,
        })
  } catch (error) {
    console.error("Forecast API error:", error)
    return NextResponse.json({ error: "Failed to fetch forecast data", details: String(error) }, { status: 500 })
  }
}
