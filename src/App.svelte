<script lang="ts">
import { onMount } from "svelte";

let city = "";
let weatherData: any = null;
let forecastData: any[] = [];
let loading = true;
let error = "";
let currentTime = new Date();
let mapLat = 0;
let mapLon = 0;

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;

async function fetchWeather(query: string) {
  loading = true;
  error = "";

  if (!API_KEY) {
    error = "Missing API key. Set VITE_OPENWEATHER_API_KEY.";
    loading = false;
    return;
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`
    );
    weatherData = await res.json();
    mapLat = weatherData.coord.lat;
    mapLon = weatherData.coord.lon;

    const forecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=metric&appid=${API_KEY}`
    );
    const f = await forecast.json();
    forecastData = f.list.slice(0, 8);
  } catch (e) {
    error = "City not found";
  } finally {
    loading = false;
  }
}

async function fetchByCoords(lat: number, lon: number) {
  if (!API_KEY) {
    error = "Missing API key. Set VITE_OPENWEATHER_API_KEY.";
    loading = false;
    return;
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    weatherData = await res.json();
    city = weatherData.name;
    mapLat = lat;
    mapLon = lon;

    const forecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const f = await forecast.json();
    forecastData = f.list.slice(0, 8);
  } catch (e) {
    error = "Location error";
  } finally {
    loading = false;
  }
}

function getWeatherIcon(main: string) {
  switch (main) {
    case "Rain": return "🌧️";
    case "Clouds": return "☁️";
    case "Clear": return "☀️";
    case "Thunderstorm": return "⛈️";
    default: return "🌤️";
  }
}

onMount(() => {
  const timer = setInterval(() => {
    currentTime = new Date();
  }, 1000);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => { loading = false; }
    );
  } else {
    loading = false;
  }

  return () => clearInterval(timer);
});

$: timeString = currentTime.toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

$: hour = currentTime.getHours();
$: isNight = hour >= 18 || hour < 6;
$: mapSrc = mapLat && mapLon
  ? `https://maps.google.com/maps?q=${mapLat},${mapLon}&z=13&output=embed`
  : "";
</script>

<main class="min-h-screen flex items-start justify-center text-white relative py-6">

  <div
    class="absolute inset-0 bg-cover bg-center"
    style="background-image:url('{isNight
      ? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee'
      : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}')"
  ></div>

  <div class="absolute inset-0 bg-black/40"></div>

  <div class="relative z-10 max-w-[1300px] w-full grid grid-cols-12 gap-6 px-4">

    <!-- LEFT -->
    <div class="col-span-5 space-y-4">

      <input
        bind:value={city}
        on:keydown={(e) => e.key === "Enter" && fetchWeather(city)}
        placeholder="Search city..."
        class="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 outline-none focus:border-white/50 text-white placeholder-white/40"
      />

      <div class="bg-black/20 backdrop-blur-xl rounded-3xl p-6 text-center">
        {#if weatherData}
          <div class="text-5xl">{getWeatherIcon(weatherData.weather[0].main)}</div>

          <div class="flex justify-center items-start">
            <h1 class="text-[90px] font-black leading-none">{Math.round(weatherData.main.temp)}</h1>
            <span class="text-4xl mt-4">°C</span>
          </div>

          <p class="text-xl font-bold">{weatherData.name}, {weatherData.sys.country}</p>
          <p class="opacity-80 text-sm">{timeString}</p>

          <div class="grid grid-cols-3 mt-4 bg-black/30 p-4 rounded-xl">
            <div>
              <p class="text-xs opacity-50">Humidity</p>
              <p class="font-bold">{weatherData.main.humidity}%</p>
            </div>
            <div>
              <p class="text-xs opacity-50">Wind</p>
              <p class="font-bold">{weatherData.wind.speed} km/h</p>
            </div>
            <div>
              <p class="text-xs opacity-50">Feels</p>
              <p class="font-bold">{Math.round(weatherData.main.feels_like)}°</p>
            </div>
          </div>
        {:else if loading}
          <p class="opacity-50 py-10">Loading weather...</p>
        {:else}
          <p class="opacity-50 py-10">Search a city to get started</p>
        {/if}
      </div>

      <!-- SMART INSIGHTS -->
      <div class="bg-black/20 backdrop-blur-xl rounded-3xl p-5">
        <p class="text-xs opacity-50 mb-3">SMART INSIGHTS</p>
        <p class="mb-1">👕 Outfit: {weatherData && weatherData.main.temp > 25 ? "Light Clothes" : "Jacket"}</p>
        <p>💧 Advice: Drink water</p>
      </div>

      <!-- FORECAST -->
      <div class="bg-black/20 backdrop-blur-xl rounded-3xl p-4">
        <p class="text-xs opacity-50 mb-4">FORECAST</p>
        <div class="flex gap-3 overflow-x-auto pb-1">
          {#each forecastData as item}
            <div class="bg-white/5 p-3 rounded-xl text-center min-w-[72px]">
              <p class="text-xs opacity-70">{item.dt_txt.split(" ")[1].substring(0, 5)}</p>
              <p class="text-2xl my-1">{getWeatherIcon(item.weather[0].main)}</p>
              <p class="font-bold text-sm">{Math.round(item.main.temp)}°</p>
            </div>
          {/each}
        </div>
      </div>

    </div>

    <!-- RIGHT — GOOGLE MAP -->
    <div class="col-span-7">
      <div class="bg-black/20 backdrop-blur-xl rounded-3xl p-4 h-full">
        <p class="text-xs opacity-50 mb-3">LOCATION MAP</p>

        <div class="rounded-2xl overflow-hidden w-full" style="height: 520px;">
          {#if mapSrc}
            <iframe
              src={mapSrc}
              class="w-full h-full border-0"
              title="Location Map"
              loading="lazy"
              allowfullscreen
            ></iframe>
          {:else}
            <div class="w-full h-full flex items-center justify-center bg-white/5 rounded-2xl">
              <p class="opacity-30 text-sm">Map will appear after search</p>
            </div>
          {/if}
        </div>

      </div>
    </div>

  </div>

</main>

<style>
  :global(body) {
    margin: 0;
    font-family: sans-serif;
  }
</style>