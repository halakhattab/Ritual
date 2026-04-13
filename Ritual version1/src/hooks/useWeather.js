import { useState, useEffect } from 'react'

const WMO_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
}

async function geocodeCity(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  )
  const data = await res.json()
  if (data.results?.length > 0) {
    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      name: data.results[0].name,
    }
  }
  return null
}

async function reverseGeocodeCity(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    // Prefer city > town > village > county > state
    const place =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      null
    return place
  } catch {
    return null
  }
}

async function fetchWeatherData(lat, lon) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m` +
    `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`
  )
  return res.json()
}

export function useWeather(city) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        let lat, lon, locationName

        if (city) {
          const geo = await geocodeCity(city)
          if (!geo) throw new Error('City not found')
          lat = geo.lat
          lon = geo.lon
          locationName = geo.name
        } else {
          // Geolocation
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
          )
          lat = pos.coords.latitude
          lon = pos.coords.longitude
          // Reverse geocode for real city name
          const cityName = await reverseGeocodeCity(lat, lon)
          locationName = cityName || 'Your location'
        }

        const data = await fetchWeatherData(lat, lon)
        if (cancelled) return

        const current = data.current
        setWeather({
          temp: Math.round(current.temperature_2m),
          condition: WMO_CODES[current.weathercode] ?? 'Unknown',
          windspeed: Math.round(current.windspeed_10m),
          humidity: current.relative_humidity_2m,
          location: locationName,
          unit: 'F',
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [city])

  return { weather, loading, error }
}
