import { configureStore } from "@reduxjs/toolkit";
import itineraryReducer from "./itinerarySlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      itinerary: itineraryReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
