import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getCityData, get5DaysForecast } from "./WeatherSlice";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Earth from "../images/earth-unscreen.gif"
import { appId } from "../config/config";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);
const WeatherComponent = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const dispatch = useDispatch();
    const [city, setCity] = useState("hyderabad");
    const [unit, setUnit] = useState("metric");
    const [viewType, setViewType] = useState("forecast");
    const [citySuggestions, setCitySuggestions] = useState([])
    const { citySearchData, citySearchLoading, forecastData, forecastError } = useSelector(
        (state) => state.weather
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);



    useEffect(() => {
        dispatch(getCityData({ city, unit }));
    }, [dispatch, city, unit]);

    useEffect(() => {
        if (citySearchData?.coord) {
            const { lat, lon } = citySearchData.coord;
            dispatch(get5DaysForecast({ lat, lon, unit }));
        }
    }, [citySearchData, dispatch, unit]);




    const handleViewTypeChange = (e) => {
        setViewType(e.target.value);
    };

    const fetchCitySuggestions = async (query) => {
        if (!query) return;
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&appid=${appId}`);
            const data = await response.json();
            setCitySuggestions(data.list || []);
        } catch (error) {
            console.error("Error fetching city suggestions:", error);
        }
    };


    const handleCitySuggestionClick = (city) => {
        setCity(city.name);
        setCitySuggestions([]);
    };

    const handleCityChange = (e) => {
        const value = e.target.value;
        setCity(value);
        if (value.length > 2) {
            fetchCitySuggestions(value);
        } else {
            setCitySuggestions([]);
        }
    };

    const getCityNameFromCoords = async (lat, lon) => {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${appId}`);
            const data = await response.json();
            return data.name;
        } catch (error) {
            console.error("Error fetching city name:", error);
            return null;
        }
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const cityName = await getCityNameFromCoords(latitude, longitude);
                if (cityName) {
                    setCity(cityName);
                    dispatch(getCityData({ city: cityName, unit }));
                }
            }, (error) => {
                console.error("Geolocation error:", error);
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    const getDailyForecast = (list) => {
        if (!list) return [];

        const dailyForecast = {};
        list.forEach(item => {
            const date = new Date(item.dt_txt).toDateString();
            if (!dailyForecast[date]) {
                dailyForecast[date] = {
                    temp: 0,
                    count: 0,
                    weather: item.weather[0].description,
                };
            }
            dailyForecast[date].temp += item.main.temp;
            dailyForecast[date].count += 1;
        });

        return Object.keys(dailyForecast).slice(0, 6).map(date => ({
            date,
            temp: (dailyForecast[date].temp / dailyForecast[date].count).toFixed(1),
            weather: dailyForecast[date].weather,
        }));
    };


    const forecastChartData = {
        labels: forecastData?.list?.slice(0, 6).map(item => new Date(item.dt_txt).toDateString()) || [],
        datasets: [
            {
                label: 'Temperature',
                data: forecastData?.list?.slice(0, 6).map(item => item.main.temp) || [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    const humidityChartData = {
        labels: forecastData?.list?.slice(0, 6).map(item => new Date(item.dt_txt).toDateString()) || [],
        datasets: [
            {
                label: 'Humidity',
                data: forecastData?.list?.slice(0, 6).map(item => item.main.humidity) || [],
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
            },
        ],
    };

    const windSpeedChartData = {
        labels: forecastData?.list?.slice(0, 6).map(item => new Date(item.dt_txt).toDateString()) || [],
        datasets: [
            {
                label: 'Wind Speed',
                data: forecastData?.list?.slice(0, 6).map(item => item.wind.speed) || [],
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
            },
        ],
    };

    const weatherConditionCounts = forecastData?.list?.reduce((acc, item) => {
        const condition = item.weather[0]?.main;
        if (condition) {
            acc[condition] = (acc[condition] || 0) + 1;
        }
        return acc;
    }, {});

    const weatherConditionData = {
        labels: weatherConditionCounts ? Object.keys(weatherConditionCounts) : [],
        datasets: [
            {
                data: weatherConditionCounts ? Object.values(weatherConditionCounts) : [],
                backgroundColor: [
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 205, 86, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };


    return (
        <div className='container background  shadow shadow-lg border border-2 rounded rounded-5'>
            <div className='row'>
                <div className='col-sm-12 col-md-12 col-lg-12 col-xl-12 d-flex justify-content-end py-1'>
                    <div className='profile-container position-relative'>
                        <img src='https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001882.png'
                            alt='profile' width="10%"
                            className='img-fluid'
                        />
                        <span className={`status-indicator ${isOnline ? 'bg-success' : 'bg-danger'}`}></span>
                    </div>
                </div>
            </div>

            <div className='row mt-3 d-flex justify-content-center'>
                <div className='col-sm-6 col-md-6 col-lg-6 col-xl-6'>
                    <div className='input-group'>
                        <input
                            type='text'
                            className='form-control border border-1 border-success rounded-5 shadow'
                            placeholder='Enter the City Name'
                            value={city}
                            onChange={handleCityChange}
                            aria-label='City Name'
                        />
                        <div className="input-group-append mx-1">
                            <span className="input-group-text bg-white border border-1 rounded-circle ">
                                <i className="bi bi-search"></i>
                            </span>
                        </div>

                        <div className="input-group-append mx-1 d-flex justify-content-center" onClick={handleCurrentLocation}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} size='2sm' className='bg-white border border-1 rounded-circle p-2' />
                            <span className="d-none d-md-inline text-success p-1">Use Current Location
                            </span>
                        </div>
                    </div>

                </div>
                {citySuggestions.length > 0 && (
                    <ul className="list-group position-absolute w-100" style={{ maxHeight: '200px', overflowY: 'auto', zIndex: '1000' }}>
                        {citySuggestions.map((suggestion, index) => (
                            <li
                                key={`${suggestion.name}-${suggestion.sys.country}`}
                                className="list-group-item"
                                onClick={() => handleCitySuggestionClick(suggestion)}
                            >
                                {suggestion.name}, {suggestion.sys.country}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className='row mt-3 d-flex justify-content-center'>
                <div className='col-sm-12 col-md-12 col-lg-12 col-xl-12 '>
                    <div className="btn-group" role="group" aria-label="Unit Toggle">
                        <button
                            type="button"
                            className={`btn btn-sm border rounded border-2 rounded-4 mx-1 toggle-btn ${unit === "metric" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setUnit("metric")}
                        >
                            Celsius (°C)
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm border rounded border-2 rounded-4 toggle-btn ${unit === "imperial" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setUnit("imperial")}
                        >
                            Fahrenheit (°F)
                        </button>
                    </div>
                </div>
            </div>

            <div className='row mt-3'>
                <div className='col-sm-12 col-md-12 col-lg-12 col-xl-12  '>
                    <label htmlFor="view-select">View Type: </label>
                    <select id="view-select" className="form-select" onChange={handleViewTypeChange} value={viewType}>
                        <option value="forecast">Forecast</option>
                        <option value="graph">Temperature Graph</option>
                        <option value="humidity">Humidity Graph</option>
                        <option value="windSpeed">Wind Speed Graph</option>
                        <option value="conditions">Weather Conditions</option>
                    </select>
                </div>

            </div>


            <div className='row mt-2'>
                <div className='col-sm-12 col-md-12 col-lg-12 col-xl-12'>
                    {citySearchLoading && <div className="text-center spinner">
                        <img src={Earth} alt='earth' width="100px"></img>
                    </div>}

                    {citySearchData && citySearchData.main && (
                        <div
                            className="weather-background d-flex justify-content-center p-1 mt-2 shadow shadow-md"
                            style={{
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '8px',
                            }}
                        >
                            <div className="weather-info text-center text-white  ">
                                <h1>{citySearchData.name}</h1>
                                <h2>{Math.round(citySearchData.main.temp)}°{unit === 'metric' ? 'C' : 'F'}</h2>
                                <p>{citySearchData.weather[0].description}</p>
                                <p>Humidity: {citySearchData.main.humidity}%</p>
                                <p>Wind Speed: {citySearchData.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className='row mt-3'>
                <div className='col-sm-12 col-lg-12 col-md-12 col-xl-12'>



                    {forecastError && <div className="alert alert-danger">Error fetching forecast data.</div>}

                    {forecastData && (
                        <div>
                            {viewType === "forecast" && (
                                <div className="forecast-details mt-3 shadow shadow-lg">
                                    {getDailyForecast(forecastData.list).map((day, index) => (
                                        <div key={index} className="forecast-day mx-1 border border-1 rounded rounded-3">
                                            <h6>{day.date}</h6>
                                            <p>Temperature: {day.temp}°{unit === 'metric' ? 'C' : 'F'}</p>
                                            <p>Weather: {day.weather}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewType === "graph" && (
                                <div className="forecast-chart-container">
                                    <Line data={forecastChartData} width="50%" height="60%" />
                                </div>
                            )}

                            {viewType === "humidity" && (
                                <div className="forecast-chart-container">
                                    <Line data={humidityChartData} width="100%" />
                                </div>
                            )}

                            {viewType === "windSpeed" && (
                                <div className="forecast-chart-container">
                                    <Line data={windSpeedChartData} width="100%" />
                                </div>
                            )}

                            {viewType === "conditions" && (
                                <div className="forecast-chart-container">
                                    <Pie data={weatherConditionData} width="50%" height="50%" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
}

export default WeatherComponent;
