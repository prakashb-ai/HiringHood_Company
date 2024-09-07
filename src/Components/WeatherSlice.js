import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"
import { appId, hostName } from "../config/config"
import "../App.css"


export const getCityData = createAsyncThunk(
    "weather/getCityData",
    async ({ city, unit }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${hostName}/data/2.5/weather?q=${city}&units=${unit}&appid=${appId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response ? error.response.data : error.message);
        }
    }
);


export const get5DaysForecast = createAsyncThunk(
    "weather/get5DaysForecast",
    async ({ lat, lon, unit }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${hostName}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${appId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response ? error.response.data : error.message);
        }
    }
);


const weatherSlice = createSlice({
    name: "weather",
    initialState: {
        citySearchData: null,
        citySearchLoading: false,
        forecastData: null,
        forecastLoading: false,
        forecastError: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCityData.pending, (state) => {
                state.citySearchLoading = true;
                state.citySearchError = null;
            })
            .addCase(getCityData.fulfilled, (state, action) => {
                state.citySearchLoading = false;
                state.citySearchData = action.payload;
            })
            .addCase(getCityData.rejected, (state, action) => {
                state.citySearchLoading = false;
                state.citySearchError = action.payload || "Failed to fetch city data"; 
            })
            .addCase(get5DaysForecast.pending, (state) => {
                state.forecastLoading = true;
                state.forecastError = null;
            })
            .addCase(get5DaysForecast.fulfilled, (state, action) => {
                state.forecastLoading = false;
                state.forecastData = action.payload;
            })
            .addCase(get5DaysForecast.rejected, (state, action) => {
                state.forecastLoading = false;
                state.forecastError = action.payload || "Failed to fetch forecast data";
            });
    },
});

export default weatherSlice.reducer;