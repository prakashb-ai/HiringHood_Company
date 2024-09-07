import { configureStore } from "@reduxjs/toolkit";
import weatherReducer from "./components/WheatherSlice"; 

const store = configureStore({
  reducer: {
    weather: weatherReducer,
  },
});

export default store;
