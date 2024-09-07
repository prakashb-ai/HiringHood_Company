import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import App from "./App";
import weatherReducer from "./Components/WeatherSlice"; 
import './App.css';

const store = configureStore({
  reducer: {
    weather: weatherReducer, 
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
