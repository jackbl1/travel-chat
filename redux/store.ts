import { configureStore } from "@reduxjs/toolkit";
import itineraryReducer from "./itinerarySlice";
import viewReducer from "./viewSlice";
import sessionDetailReducer from "./sessionDetailSlice";
import mapReducer from "./mapSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      itinerary: itineraryReducer,
      view: viewReducer,
      sessionDetail: sessionDetailReducer,
      map: mapReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
