"use client"

import axios, { type AxiosError } from "axios"
import type React from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
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
  Loader2,
  RefreshCw,
  Clock,
  Thermometer,
  Sunset,
  Sunrise,
  X,
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
  uv_index?: number
  sunrise: number
  sunset: number
  dt: number
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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
 
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (event: React.MouseEvent) => {
    mouseX.set(event.clientX)
    mouseY.set(event.clientY)
  }

  // Enhanced background gradients with more variety
  const getBackgroundGradient = () => {
    // Default gradient when no weather data is available
    if (!currentWeather || !currentWeather.icon || typeof currentWeather.icon !== "string") {
      return "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    }

    const weatherType = currentWeather.icon.substring(0, 2)
    const isDay = currentWeather.icon.includes("d")

    if (isDay) {
      switch (weatherType) {
        case "01": // Clear sky
          return "bg-gradient-to-br from-blue-400 via-cyan-300 to-yellow-200"
        case "02": // Few clouds
          return "bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-300"
        case "03":
        case "04": // Clouds
          return "bg-gradient-to-br from-gray-400 via-blue-400 to-slate-300"
        case "09":
        case "10": // Rain
          return "bg-gradient-to-br from-gray-600 via-blue-500 to-slate-400"
        case "11": // Thunderstorm
          return "bg-gradient-to-br from-gray-800 via-purple-600 to-slate-600"
        case "13": // Snow
          return "bg-gradient-to-br from-blue-200 via-white to-gray-200"
        default:
          return "bg-gradient-to-br from-blue-400 via-sky-300 to-cyan-200"
      }
    } else {
      switch (weatherType) {
        case "01": // Clear night
          return "bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900"
        case "02": // Few clouds night
          return "bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800"
        case "03":
        case "04": // Cloudy night
          return "bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900"
        case "09":
        case "10": // Rainy night
          return "bg-gradient-to-br from-slate-900 via-blue-800 to-gray-900"
        case "11": // Thunderstorm night
          return "bg-gradient-to-br from-black via-purple-900 to-gray-900"
        case "13": // Snow night
          return "bg-gradient-to-br from-slate-700 via-blue-800 to-gray-800"
        default:
          return "bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900"
      }
    }
  }

  const getWeatherIcon = (iconCode: string, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-6 h-6",
      md: "w-8 h-8",
      lg: "w-20 h-20",
    }

    const iconMap: { [key: string]: React.ElementType } = {
      "01d": Sun,
      "01n": Moon,
      "02d": Cloud,
      "02n": Cloud,
      "03d": Cloud,
      "03n": Cloud,
      "04d": Cloud,
      "04n": Cloud,
      "09d": CloudDrizzle,
      "09n": CloudDrizzle,
      "10d": CloudRain,
      "10n": CloudRain,
      "11d": Zap,
      "11n": Zap,
      "13d": CloudSnow,
      "13n": CloudSnow,
      "50d": Cloud,
      "50n": Cloud,
    }

    const IconComponent = iconMap[iconCode] || Sun
    const isDay = iconCode.includes("d")

    return (
      <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300, damping: 10 }}>
        <IconComponent
          className={`${sizeClasses[size]} ${
            isDay ? "text-yellow-300 drop-shadow-lg" : "text-blue-200 drop-shadow-lg"
          }`}
        />
      </motion.div>
    )
  }


  const fetchWeatherData = async (city: string, lat?: number, lon?: number) => {
    setLoading(true)
    setShowSuggestions(false)
    try {
      const currentResponse = await axios.get(`/api/weather/current`, {
        params: lat && lon ? { lat, lon } : { q: city },
      })
      // console.log("Current weather response:", currentResponse.data)
      setCurrentWeather(currentResponse.data)

      const now = Date.now() / 1000
      setIsDaytime(now > currentResponse.data.sunrise && now < currentResponse.data.sunset)

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
        description:
          (error as AxiosError<ApiErrorResponse>)?.response?.data?.error ||
          (error instanceof Error ? error.message : "Failed to fetch weather data. Please try again."),
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
            const { latitude, longitude } = position.coords
            await fetchWeatherData("", latitude, longitude)
          } catch (error: unknown) {
            toast({
              title: "Error",
              description:
                (error as AxiosError<ApiErrorResponse>)?.response?.data?.error ||
                (error instanceof Error ? error.message : "Failed to fetch weather for your location."),
              variant: "destructive",
            })
          } finally {
            setLoading(false)
          }
        },
        (error) => {
          toast({
            title: "Location Error",
            description: `Unable to access your location: ${error.message}. Please search for a city.`,
            variant: "destructive",
          })
          setLoading(false)
        },
        { timeout: 10000, enableHighAccuracy: true },
      )
    } else {
      toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser. Please search for a city.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery.trim())
      setSearchQuery("")
    }
  }

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    fetchWeatherData(suggestion.name, suggestion.lat, suggestion.lon)
    setSearchQuery("")
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex])
        } else {
          handleSearch(e)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
    getCurrentLocation()
  }, [])

  const formatTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  // Parallax effect for background elements
  const parallaxY = useTransform(mouseY, [0, 1000], [0, -50])
  const parallaxX = useTransform(mouseX, [0, 1000], [0, -30])

  return (
    <motion.div
      className={`min-h-screen w-full  ${getBackgroundGradient()} transition-all duration-1000 relative overflow-hidden`}
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Elements */}
      <motion.div className="absolute inset-0 opacity-10" style={{ y: parallaxY, x: parallaxX }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </motion.div>

      <div className="container  px-4 py-8 w-full relative z-10">
        {/* Enhanced Header with Floating Animation */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text dark:text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            Real Weather
          </motion.h1>
          <motion.p
            className="text-white/80 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Real-time weather updates 
          </motion.p>
        </motion.div>

        {/* Enhanced Search Section with Suggestions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="mb-8"
        >
          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl relative overflow-hidden">
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-lg"
              animate={{
                background: [
                  "linear-gradient(0deg, transparent, rgba(255,255,255,0.1), transparent)",
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)",
                  "linear-gradient(270deg, transparent, rgba(255,255,255,0.1), transparent)",
                ],
              }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            />

            <form onSubmit={handleSearch} className="flex gap-3 mb-4 relative z-10">
              <div className="relative flex-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 z-10"
                >
                  <Search className="w-5 h-5" />
                </motion.div>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  className="pl-12 pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus-visible:ring-white/50 h-12 text-lg backdrop-blur-sm"
                />
                {searchQuery && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setShowSuggestions(false)
                      setSuggestions([])
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}

            
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-12 px-6 backdrop-blur-sm"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-12 px-6 backdrop-blur-sm"
                >
                  <motion.div
                    animate={loading ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <MapPin className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </form>

            {/* Enhanced Recent Searches */}
            {recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <p className="text-sm text-white/80 mb-3">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((city, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant="secondary"
                        className="cursor-pointer bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/20 px-3 py-1"
                        onClick={() => fetchWeatherData(city)}
                      >
                        {city}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentWeather ? (
            <motion.div
              key="weather-content"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Enhanced Current Weather Card */}
              <div className="lg:col-span-2">
                <motion.div
                  whileHover={{ scale: 1.02, rotateY: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="h-full"
                >
                  <Card className="p-8 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl h-full relative overflow-hidden">
                    {/* Animated background pattern */}
                    <motion.div
                      className="absolute inset-0 opacity-5"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                      }}
                    />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h2 className="text-3xl font-bold text-white">{currentWeather.name}</h2>
                        <p className="text-white/80 text-lg">{currentWeather.country=="NP"? 'NEPAL':currentWeather.country}</p>
                      </motion.div>
                      <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
                        <Button
                          onClick={() => fetchWeatherData(currentWeather.name)}
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20 p-3"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 relative z-10">
                      <motion.div
                        className="flex items-center gap-6"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        <div className="relative">
                          {getWeatherIcon(currentWeather.icon, "lg")}
                          {/* Animated glow effect */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                              boxShadow: [
                                "0 0 20px rgba(255,255,255,0.3)",
                                "0 0 40px rgba(255,255,255,0.5)",
                                "0 0 20px rgba(255,255,255,0.3)",
                              ],
                            }}
                            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                          />
                        </div>
                        <div>
                          <motion.div
                            className="text-6xl font-bold text-white"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                          >
                            {currentWeather.temp}°C
                          </motion.div>
                          <div className="text-white/80 text-lg">
                            Feels like {currentWeather.feels_like}°C
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-right"
                      >
                        <div className="text-2xl capitalize text-white font-medium">{currentWeather.description}</div>
                        <div className="text-white/80 text-lg">
                            {now.toLocaleString([], {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                         
                         

                        </div>
                      </motion.div>
                    </div>

                    {/* Enhanced Weather Details Grid */}
                    <motion.div
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1, delay: 0.5 }}
                    >
                      {[
                        {
                          icon: <Thermometer className="w-6 h-6 mx-auto" />,
                          label: "Feels Like",
                          value: `${Math.round(currentWeather.feels_like)}°C`,
                          color: "from-red-400 to-orange-400",
                        },
                        {
                          icon: <Droplets className="w-6 h-6 mx-auto" />,
                          label: "Humidity",
                          value: `${currentWeather.humidity}%`,
                          color: "from-blue-400 to-cyan-400",
                        },
                        {
                          icon: <Wind className="w-6 h-6 mx-auto" />,
                          label: "Wind",
                          value: `${currentWeather.wind_speed} m/s ${getWindDirection(currentWeather.wind_deg)}`,
                          color: "from-green-400 to-teal-400",
                        },
                        {
                          icon: <Gauge className="w-6 h-6 mx-auto" />,
                          label: "Pressure",
                          value: `${currentWeather.pressure} hPa`,
                          color: "from-purple-400 to-pink-400",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          whileHover={{
                            scale: 1.05,
                            y: -5,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`bg-gradient-to-br ${item.color} bg-opacity-20 rounded-xl p-4 text-center backdrop-blur-sm border border-white/20 relative overflow-hidden`}
                        >
                          <motion.div
                            className="absolute inset-0 bg-white/10"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.6 }}
                          />
                          <div className="text-white mb-2 relative z-10">{item.icon}</div>
                          <div className="text-sm text-white/80 relative z-10">{item.label}</div>
                          <div className="font-semibold text-white relative z-10">{item.value}</div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Enhanced Sun Times */}
                    <motion.div
                      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-400/20 to-yellow-400/20 p-6 backdrop-blur-sm border border-white/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between text-sm z-10 relative">
                        <motion.div className="flex items-center gap-3 text-white" whileHover={{ scale: 1.05 }}>
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Sunrise className="w-6 h-6 text-yellow-300" />
                          </motion.div>
                          <span className="text-lg">Sunrise: {formatTime(currentWeather.sunrise)}</span>
                        </motion.div>
                        <motion.div className="flex items-center gap-3 text-white" whileHover={{ scale: 1.05 }}>
                          <motion.div
                            animate={{ rotate: [0, -360] }}
                            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Sunset className="w-6 h-6 text-orange-300" />
                          </motion.div>
                          <span className="text-lg">Sunset: {formatTime(currentWeather.sunset)}</span>
                        </motion.div>
                      </div>

                      {/* Animated progress bar */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-60"
                        animate={{
                          scaleX: [0, 1, 0],
                          originX: [0, 0.5, 1],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 10,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  </Card>
                </motion.div>
              </div>

              {/* Enhanced Hourly Forecast */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl h-full relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    />

                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3 relative z-10">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Clock className="w-6 h-6 text-blue-200" />
                      </motion.div>
                      Hourly Forecast
                    </h3>
                    <div className="space-y-3 relative z-10">
                      {hourlyForecast.map((hour, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{
                            scale: 1.03,
                            x: 5,
                            backgroundColor: "rgba(255,255,255,0.15)",
                          }}
                          className="flex items-center justify-between bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 transition-all duration-300"
                        >
                          <div className="text-white font-medium">{formatTime(hour.dt)}</div>
                          <div className="flex items-center gap-3">
                            {getWeatherIcon(hour.weather[0].icon, "sm")}
                            <motion.span className="font-semibold text-white text-lg" whileHover={{ scale: 1.1 }}>
                              {(hour.temp)}°C
                            </motion.span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center items-center min-h-[60vh]"
            >
              <Card className="p-12 text-center bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl max-w-md w-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(255,255,255,0.1), transparent)",
                      "linear-gradient(225deg, rgba(255,255,255,0.1), transparent)",
                      "linear-gradient(45deg, rgba(255,255,255,0.1), transparent)",
                    ],
                  }}
                  transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
                />

                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="text-8xl mb-6 relative z-10"
                >
                  🌤️
                </motion.div>
                <h2 className="text-3xl font-semibold text-white mb-4 relative z-10">Welcome to Weather App</h2>
                <p className="text-white/80 mb-8 text-lg relative z-10">
                  Search for a city or use your current location to get started
                </p>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="relative z-10">
                  <Button
                    onClick={getCurrentLocation}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-8 py-3 text-lg"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Use Current Location
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced 5-Day Forecast */}
        {forecast.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className="p-8 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl relative overflow-hidden">
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
              />

              <h3 className="text-2xl font-semibold text-white mb-6 relative z-10">5-Day Forecast</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                {forecast.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: 0.1 * index,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    whileHover={{
                      scale: 1.05,
                      y: -10,
                      rotateY: 5,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    }}
                    className="text-center bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />

                    <div className="text-white/80 mb-3 font-medium relative z-10">{formatDate(day.dt)}</div>
                    <motion.div
                      className="flex justify-center mb-4 relative z-10"
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 6 + index,
                        ease: "easeInOut",
                      }}
                    >
                      {getWeatherIcon(day.weather[0].icon)}
                    </motion.div>
                    <div className="text-sm capitalize text-white/90 mb-4 relative z-10">
                      {day.weather[0].description}
                    </div>
                    <div className="flex justify-center gap-3 text-white relative z-10">
                      <motion.span className="text-xl font-bold" whileHover={{ scale: 1.1 }}>
                       H:{day.temp.max}°
                      </motion.span>
                      <span className="text-white/60 text-lg">L:{day.temp.min}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>
                 <div className="flex justify-center items-center py-2 text-sm">
                  <p>H- High / Maximum || L- Low / Minimun</p>
                </div>
            </Card>
          </motion.div>
        )}
     
      </div>

      {/* Enhanced Floating Elements */}
      {isDaytime && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute opacity-10"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 20 + i * 5,
                ease: "easeInOut",
                delay: i * 2,
              }}
            >
              <Cloud className={`w-${16 + i * 4} h-${16 + i * 4} text-white`} />
            </motion.div>
          ))}
        </>
      )}

      {/* Particle effect */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  )
}

export default WeatherApp
