"use client"

import axios, { type AxiosError } from "axios"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Moon,
  CloudRain,
  Cloud,
  CloudSnow,
  Zap,
  CloudDrizzle,
  Clock,
  Thermometer,
  Sunset,
  Sunrise,
  X,
  Navigation,
  CalendarDays,
  Share2,
  Eye,
  Tornado,
  Waves,
  Umbrella,
  Shirt,
  Snowflake,
  Flame,
} from "lucide-react"

import { toast } from "@/hooks/use-toast"

interface ApiErrorResponse {
  error: string
}

interface WeatherData {
  name: string
  country: string
  temp: number
  feels_like: number
  description: string
  icon: string
  humidity: number
  pressure: number
  visibility: number
  wind_speed: number
  wind_deg: number
  uv_index?: number // Often missing in standard API call unless OneCall used
  sunrise: number
  sunset: number
  dt: number
  timezone: number // Added timezone offset in seconds
}

interface ForecastData {
  dt: number
  temp: {
    min: number
    max: number
  }
  weather: {
    main: string
    description: string
    icon: string
  }[]
}

interface HourlyData {
  dt: number
  temp: number
  weather: {
    main: string
    icon: string
  }[]
}

interface LocationSuggestion {
    name: string
    country: string
    state?: string
    lat: number
    lon: number
    display_name: string
}

type Unit = "C" | "F"

const WeatherApp = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [hourlyForecast, setHourlyForecast] = useState<HourlyData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isDaytime, setIsDaytime] = useState(true)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [now, setNow] = useState(new Date())
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [unit, setUnit] = useState<Unit>("C")
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Refined Premium Gradients
  const getBackgroundClass = () => {
    if (!currentWeather) return "from-[#0f0c29] via-[#302b63] to-[#24243e]"
    
    const code = currentWeather.icon.substring(0, 2)
    const isDay = currentWeather.icon.includes("d")

    if (isDay) {
      switch (code) {
        case "01": return "from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]" // Clear - Deep Blue
        case "02": return "from-[#1e40af] via-[#3b82f6] to-[#60a5fa]" // Few clouds - Royal Blue
        case "03": 
        case "04": return "from-[#1e293b] via-[#475569] to-[#64748b]" // Clouds - Slate Gray
        case "09": 
        case "10": return "from-[#0c4a6e] via-[#0369a1] to-[#0891b2]" // Rain - Deep Cyan
        case "11": return "from-[#1e293b] via-[#334155] to-[#475569]" // Thunder - Dark Slate
        case "13": return "from-[#7dd3fc] via-[#bae6fd] to-[#e0f2fe]" // Snow - Light Blue (kept lighter for snow)
        default: return "from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]"
      }
    } else {
      switch (code) {
        case "01": return "from-[#0f0c29] via-[#302b63] to-[#24243e]" // Clear Night
        case "02": return "from-[#000000] via-[#434343] to-[#000000]" // Clouds Night
        case "03":
        case "04": return "from-[#232526] via-[#414345] to-[#232526]" // Overcast Night
        case "09":
        case "10": return "from-[#000428] via-[#004e92] to-[#000428]" // Rainy Night
        case "11": return "from-[#141E30] via-[#243B55] to-[#141E30]" // Thunder Night
        case "13": return "from-[#20002c] via-[#cbb4d4] to-[#20002c]" // Snowy Night
        default: return "from-[#0f0c29] via-[#302b63] to-[#24243e]"
      }
    }
  }

  const getWeatherIcon = (iconCode: string, className: string = "w-8 h-8") => {
    const iconMap: { [key: string]: React.ElementType } = {
      "01d": Sun, "01n": Moon,
      "02d": Cloud, "02n": Cloud,
      "03d": Cloud, "03n": Cloud,
      "04d": Cloud, "04n": Cloud,
      "09d": CloudDrizzle, "09n": CloudDrizzle,
      "10d": CloudRain, "10n": CloudRain,
      "11d": Zap, "11n": Zap,
      "13d": CloudSnow, "13n": CloudSnow,
      "50d": Tornado, "50n": Tornado,
    }
    const Icon = iconMap[iconCode] || Sun
    const isDay = iconCode.includes("d")
    return <Icon className={`${className} ${isDay ? 'text-amber-300' : 'text-blue-200'} drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]`} />
  }

  // --- Feature Logic ---

  // Temperature Conversion
  const displayTemp = (temp: number) => {
    return unit === "C" ? Math.round(temp) : Math.round((temp * 9/5) + 32)
  }

  // Dew Point Calculation (Approximation)
  const calculateDewPoint = (temp: number, humidity: number) => {
    return temp - ((100 - humidity) / 5)
  }

  // Get Local Time of the Searched City
  const getCityLocalTime = (timezoneOffset: number) => {
    // timezoneOffset from API is in seconds from UTC
    const offset = Number(timezoneOffset) || 0
    // Get current time in UTC (milliseconds)
    const nowUTC = Date.now()
    // Add the timezone offset (convert seconds to milliseconds)
    const cityTime = new Date(nowUTC + (offset * 1000))
    if (isNaN(cityTime.getTime())) return ""
    return cityTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
  }

  // Smart Clothing/Activity Advice
  const getSmartAdvice = (weather: WeatherData) => {
    const temp = weather.temp
    const condition = weather.icon.substring(0, 2) // 01, 02, etc.
    
    let advice = { text: "Enjoy your day!", icon: Sun }

    // Rain/Snow logic
    if (["09", "10", "11"].includes(condition)) {
      advice = { text: "Don't forget an umbrella!", icon: Umbrella }
    } else if (condition === "13") {
      advice = { text: "Bundle up, it's snowing!", icon: Snowflake }
    } 
    // Clear/Cloudy logic based on temp
    else if (temp > 30) {
      advice = { text: "Stay hydrated & cool.", icon: Flame }
    } else if (temp < 10) {
      advice = { text: "Wear a warm jacket.", icon: Shirt }
    } else if (temp >= 10 && temp <= 20) {
      advice = { text: "A light hoodie is perfect.", icon: Shirt }
    } else {
      advice = { text: "Perfect weather for a walk!", icon: Sun }
    }

    return advice
  }

  const fetchWeatherData = async (city: string, lat?: number, lon?: number) => {
    setLoading(true)
    setShowSuggestions(false)
    try {
      const currentResponse = await axios.get(`/api/weather/current`, {
        params: lat && lon ? { lat, lon } : { q: city },
      })
      // Ensure timezone is present or fallback to 0
      const dataWithTimezone = { ...currentResponse.data, timezone: currentResponse.data.timezone || 0 }
      setCurrentWeather(dataWithTimezone)

      const nowSec = Date.now() / 1000
      setIsDaytime(nowSec > currentResponse.data.sunrise && nowSec < currentResponse.data.sunset)

      const forecastResponse = await axios.get(`/api/weather/forecast`, {
        params: lat && lon ? { lat, lon } : { q: city },
      })
      setForecast(forecastResponse.data.daily)
      setHourlyForecast(forecastResponse.data.list.slice(0, 8))

      const cityName = currentResponse.data.name
      const updatedSearches = [cityName, ...recentSearches.filter((s) => s !== cityName)].slice(0, 5)
      setRecentSearches(updatedSearches)
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as AxiosError<ApiErrorResponse>)?.response?.data?.error || "Failed to fetch weather data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await fetchWeatherData("", position.coords.latitude, position.coords.longitude)
          } catch {
            toast({ title: "Error", description: "Failed to fetch location weather.", variant: "destructive" })
          } finally { setLoading(false) }
        },
        (error) => {
          toast({ title: "Location Error", description: error.message, variant: "destructive" })
          setLoading(false)
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    } else {
      toast({ title: "Not Supported", description: "Geolocation not supported.", variant: "destructive" })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery.trim())
      setSearchQuery("")
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i < suggestions.length - 1 ? i + 1 : i))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex(i => (i > 0 ? i - 1 : -1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          const s = suggestions[selectedSuggestionIndex]
          fetchWeatherData(s.name, s.lat, s.lon)
          setSearchQuery("")
          setShowSuggestions(false)
        } else {
          handleSearch(e)
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
      }
    }

  const handleShare = () => {
    if (currentWeather) {
        const text = `Current weather in ${currentWeather.name}: ${currentWeather.temp}°C, ${currentWeather.description}. Check it out on Real Weather!`
        if (navigator.share) {
            navigator.share({ title: "Real Weather", text: text, url: window.location.href })
                .catch(console.error)
        } else {
            navigator.clipboard.writeText(text)
            toast({ title: "Copied!", description: "Weather info copied to clipboard." })
        }
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) setRecentSearches(JSON.parse(saved))
    getCurrentLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helpers
  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
  const getWindDirection = (deg: number) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8]

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  // Calculate coordinates for simple SVG graph in Hourly Forecast
  const getGraphPoints = () => {
    if (hourlyForecast.length < 2) return ""
    const temps = hourlyForecast.map(h => h.temp)
    const min = Math.min(...temps)
    const max = Math.max(...temps)
    const range = max - min || 1
    
    // Scale to SVG viewbox 0,0 to 100,50
    const points = hourlyForecast.map((h, i) => {
        const x = (i / (hourlyForecast.length - 1)) * 100
        // Invert Y because SVG 0 is top. Scale temp normalized 0-1 to 10-40 (padding)
        const y = 50 - (((h.temp - min) / range) * 30 + 10) 
        return `${x},${y}`
    }).join(" ")
    return points
  }

  return (
    <div className={`min-h-screen w-full relative overflow-hidden text-white transition-colors duration-1000 bg-gradient-to-br ${getBackgroundClass()}`}>
      
      {/* Dynamic Animated Atmospheric Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Subtle moving gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-white/5 via-transparent to-transparent animate-aurora opacity-30 mix-blend-overlay blur-3xl rounded-full"></div>
          {/* Floating orbs for depth */}
          <div className="absolute top-[10%] right-[20%] w-64 h-64 bg-white/10 rounded-full blur-[80px] animate-pulse"></div>
          <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 backdrop-blur-sm bg-black/10 p-4 rounded-3xl border border-white/10 shadow-lg">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
             <div className="bg-gradient-to-tr from-blue-500 to-cyan-400 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Cloud className="w-8 h-8 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight leading-none">Real Weather</h1>
                <p className="text-white/60 text-xs font-medium tracking-wide uppercase">
                    {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
             </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg relative group"
          >
            <form onSubmit={handleSearch} className="relative flex items-center bg-white/10 backdrop-filter backdrop-blur-md border border-white/20 rounded-2xl shadow-inner transition-all focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-white/30 h-12 overflow-hidden">
              <Search className="w-5 h-5 text-white/50 ml-4 absolute pointer-events-none" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search city, zip code..."
                className="border-none bg-transparent h-full pl-12 pr-14 text-white placeholder:text-white/40 focus-visible:ring-0 text-base w-full shadow-none font-medium"
              />
              <div className="absolute right-1 flex items-center">
                 {searchQuery && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-lg mr-1">
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={getCurrentLocation} className="h-9 w-9 p-0 text-white/80 hover:text-white hover:bg-blue-500/50 rounded-lg transition-colors" title="Use current location">
                  <Navigation className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </form>

            {/* Recent Searches (Floating below) */}
            {recentSearches.length > 0 && !searchQuery && (
              <div className="absolute top-14 left-0 right-0 flex flex-wrap gap-2 justify-center md:justify-start px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto z-50">
                 {recentSearches.slice(0, 4).map(city => (
                   <Badge key={city} variant="secondary" className="bg-black/40 hover:bg-blue-500 text-white border-white/10 cursor-pointer backdrop-blur-md shadow-lg transition-all" onClick={() => fetchWeatherData(city)}>
                     <Clock className="w-3 h-3 mr-1 opacity-70" /> {city}
                   </Badge>
                 ))}
              </div>
            )}
          </motion.div>
          
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setUnit(u => u === "C" ? "F" : "C")}
                className="bg-white/5 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm rounded-xl font-bold w-10 h-10 p-0"
             >
                °{unit}
             </Button>
             <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="bg-white/5 hover:bg-white/20 text-white rounded-xl w-10 h-10 p-0 transition-all border border-transparent hover:border-white/20"
                title="Share Weather"
             >
                <Share2 className="w-5 h-5" />
             </Button>
          </div>
        </header>

        {/* --- Main Dashboard Content --- */}
        <AnimatePresence mode="wait">
          {currentWeather ? (
            <motion.div 
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 pb-10"
            >
              
              {/* 1. Main Weather Card (Large) */}
              <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 row-span-2 relative group translate-z-0">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"></div>
                 <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg">{currentWeather.name}</h2>
                            <div className="flex items-center gap-2 mt-2 text-lg font-medium text-white/80">
                                <MapPin className="w-5 h-5" />
                                <span>{currentWeather.country === "NP" ? "Nepal" : currentWeather.country}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="bg-black/25 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-white shadow-black drop-shadow-md">
                                        {getCityLocalTime(currentWeather.timezone).split(' ')[0] || "--:--"}
                                    </span>
                                    <span className="text-sm font-bold text-white/60">
                                        {getCityLocalTime(currentWeather.timezone).split(' ')[1]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mt-8">
                        <div className="text-center md:text-left">
                            <span className="text-[7rem] md:text-[9rem] font-bold leading-none tracking-tighter drop-shadow-2xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">
                                {displayTemp(currentWeather.temp)}°
                            </span>
                            <p className="text-2xl md:text-3xl font-medium capitalize mt-[-10px] ml-2 drop-shadow-md">{currentWeather.description}</p>
                        </div>
                        <motion.div 
                            animate={{ y: [0, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="relative"
                        >
                            {/* Glow behind icon */}
                            <div className="absolute inset-0 bg-white/30 blur-[60px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-700"></div>
                            {getWeatherIcon(currentWeather.icon, "w-40 h-40 md:w-56 md:h-56 filter drop-shadow-2xl")}
                        </motion.div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                        <div className="text-center md:text-left">
                            <p className="text-white/50 text-sm font-medium mb-1">Feels Like</p>
                            <p className="text-xl font-bold">{displayTemp(currentWeather.feels_like)}°</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-white/50 text-sm font-medium mb-1">High / Low</p>
                            <p className="text-xl font-bold">{displayTemp(forecast[0]?.temp.max)}° / {displayTemp(forecast[0]?.temp.min)}°</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-white/50 text-sm font-medium mb-1">Dew Point</p>
                            <p className="text-xl font-bold">{displayTemp(calculateDewPoint(currentWeather.temp, currentWeather.humidity))}°</p>
                        </div>
                    </div>
                 </div>
              </motion.div>

              {/* 2. Hourly Forecast with Graph (Wide) */}
              <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 h-full">
                 <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 h-full flex flex-col justify-center relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 text-white/80 relative z-10">
                        <Clock className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Hourly Forecast</h3>
                    </div>
                    
                    {/* SVG Trend Line Background */}
                    <div className="absolute left-0 right-0 bottom-10 h-24 pointer-events-none opacity-20">
                         <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                            <path 
                                d={`M0,50 L${getGraphPoints()} L100,50 Z`} 
                                fill="currentColor" 
                                className="text-blue-500"
                            />
                            <path 
                                d={`M${getGraphPoints()}`} 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="0.5" 
                                vectorEffect="non-scaling-stroke"
                            />
                         </svg>
                    </div>

                    <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar items-center relative z-10">
                        {hourlyForecast.map((hour, i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl transition-colors cursor-default min-w-[90px] group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5">
                                <span className="text-sm font-medium text-white/70">{formatTime(hour.dt)}</span>
                                <div className="group-hover:scale-110 transition-transform duration-300">
                                    {getWeatherIcon(hour.weather[0].icon, "w-10 h-10")}
                                </div>
                                <span className="text-xl font-bold">{displayTemp(hour.temp)}°</span>
                            </div>
                        ))}
                    </div>
                 </div>
              </motion.div>

              {/* Smart Advice Widget (New Feature) */}
              <motion.div variants={itemVariants} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center hover:bg-black/30 transition-colors group">
                    {(() => {
                        const advice = getSmartAdvice(currentWeather)
                        return (
                            <>
                                <div className="bg-white/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    <advice.icon className="w-10 h-10 text-white" />
                                </div>
                                <p className="text-lg font-bold leading-tight">{advice.text}</p>
                            </>
                        )
                    })()}
              </motion.div>

              {/* Wind Speed */}
              <motion.div variants={itemVariants} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between hover:bg-black/30 transition-colors">
                  <div className="flex items-center gap-2 text-white/70 mb-2">
                      <Wind className="w-5 h-5 text-blue-300" />
                      <span className="text-sm font-semibold uppercase tracking-wider">Wind</span>
                  </div>
                  <div className="flex items-end gap-2">
                       <span className="text-4xl font-bold">{currentWeather.wind_speed}</span>
                       <span className="text-lg text-white/60 mb-1">m/s</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="text-sm text-white/70">Direction: <span className="font-bold text-white">{getWindDirection(currentWeather.wind_deg)}</span></div>
                      <div className="bg-white/10 p-2 rounded-full transform transition-transform duration-500" style={{ transform: `rotate(${currentWeather.wind_deg}deg)` }}>
                          <Navigation className="w-4 h-4" />
                      </div>
                  </div>
              </motion.div>

              {/* Humidity */}
              <motion.div variants={itemVariants} className="lg:col-span-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex items-center justify-between relative overflow-hidden group hover:bg-black/30 transition-colors">
                  <div className="z-10 flex flex-col justify-between h-full">
                      <div className="flex items-center gap-2 text-white/70 mb-2">
                          <Droplets className="w-5 h-5 text-blue-300" />
                          <span className="text-sm font-semibold uppercase tracking-wider">Humidity</span>
                      </div>
                      <span className="text-5xl font-bold">{currentWeather.humidity}%</span>
                      <p className="text-sm text-white/80 mt-2 font-medium">{calculateDewPoint(currentWeather.temp, currentWeather.humidity) > 20 ? "The air feels heavy & humid." : "The air feels comfortable."}</p>
                  </div>
                  <div className="h-32 w-4 bg-white/10 rounded-full relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-cyan-300 transition-all duration-1000" style={{ height: `${currentWeather.humidity}%` }}></div>
                  </div>
              </motion.div>

              {/* Visibility and Pressure Split */}
              <motion.div variants={itemVariants} className="flex flex-col gap-6 h-full">
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col justify-center hover:bg-black/30 transition-colors">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                          <Eye className="w-5 h-5 text-blue-300" />
                          <span className="text-sm font-semibold uppercase tracking-wider">Visibility</span>
                      </div>
                      <span className="text-3xl font-bold">{currentWeather.visibility / 1000}<span className="text-lg text-white/60 ml-1">km</span></span>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col justify-center hover:bg-black/30 transition-colors">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                          <Waves className="w-5 h-5 text-blue-300" />
                          <span className="text-sm font-semibold uppercase tracking-wider">Pressure</span>
                      </div>
                      <span className="text-3xl font-bold">{currentWeather.pressure}<span className="text-lg text-white/60 ml-1">hPa</span></span>
                  </div>
              </motion.div>

              {/* 4. 5-Day Forecast List */}
              <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-1 md:row-span-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 h-full hover:bg-black/30 transition-colors">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-white/90">
                        <CalendarDays className="w-5 h-5 text-blue-300" />
                        <h3 className="font-bold text-lg">Next 5 Days</h3>
                      </div>
                   </div>
                   <div className="space-y-4">
                     {forecast.slice(0, 5).map((day, i) => (
                       <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                          <span className="w-12 font-bold text-white/90">{i === 0 ? 'Today' : formatDate(day.dt).split(' ')[0]}</span>
                          <div className="flex items-center gap-3 flex-1 justify-center">
                            <div className="bg-white/10 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                                {getWeatherIcon(day.weather[0].icon, "w-6 h-6")}
                            </div>
                            <span className="text-xs font-medium text-white/70 w-20 truncate">{day.weather[0].main}</span>
                          </div>
                          <div className="flex gap-3 font-semibold w-20 justify-end text-white">
                            <span>{displayTemp(day.temp.max)}°</span>
                            <span className="text-white/60">{displayTemp(day.temp.min)}°</span>
                          </div>
                       </div>
                     ))}
                   </div>
              </motion.div>

              {/* Sun Times */}
              <motion.div variants={itemVariants} className="lg:col-span-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 relative overflow-hidden hover:bg-black/30 transition-colors">
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-40 h-full">
                       <div className="text-center md:text-left">
                           <div className="flex items-center gap-2 text-orange-300 font-bold mb-1">
                               <Sunrise className="w-6 h-6" /> Sunrise
                           </div>
                           <span className="text-3xl font-bold text-white">{formatTime(currentWeather.sunrise)}</span>
                       </div>
                       
                       {/* Sun Path Arc Visualization */}
                       <div className="w-full h-24 relative flex items-end justify-center pb-2">
                           {/* Dotted Arc */}
                           <div className="absolute w-full h-[200%] border-t-2 border-dashed border-white/30 rounded-[50%] top-4"></div>
                           {/* Sun Position Indicator (Approximate) */}
                            <motion.div 
                                className="absolute bg-yellow-400 w-6 h-6 rounded-full shadow-[0_0_20px_#fbbf24] bottom-[40%]"
                                initial={{ left: "10%" }}
                                animate={{ left: isDaytime ? "50%" : "90%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                       </div>

                       <div className="text-center md:text-right">
                           <div className="flex items-center justify-end gap-2 text-indigo-300 font-bold mb-1">
                               <Sunset className="w-6 h-6" /> Sunset
                           </div>
                           <span className="text-3xl font-bold text-white">{formatTime(currentWeather.sunset)}</span>
                       </div>
                   </div>
              </motion.div>

            </motion.div>
          ) : (
            /* --- Improved Empty State --- */
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center p-4"
            >
               <div className="relative mb-8">
                   <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full animate-pulse"></div>
                   <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/20 shadow-2xl relative z-10">
                      <CloudRain className="w-32 h-32 text-blue-200 drop-shadow-lg" />
                   </div>
               </div>
               
               <h2 className="text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white via-blue-100 to-white/50 bg-clip-text text-transparent">Real Weather</h2>
               <p className="text-xl text-white/60 max-w-lg mb-10 font-medium leading-relaxed">
                   Experience weather like never before. <br/>Enter a location or use your current position.
               </p>
               
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                   <Button onClick={getCurrentLocation} size="lg" className="rounded-full text-lg h-16 px-10 bg-white text-black hover:bg-blue-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] border-4 border-transparent bg-clip-padding">
                     <MapPin className="mr-2 w-6 h-6" /> Use Current Location
                   </Button>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default WeatherApp
