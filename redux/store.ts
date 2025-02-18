import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./sessionSlice";
import viewReducer from "./viewSlice";
import mapReducer from "./mapSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      session: sessionReducer,
      view: viewReducer,
      map: mapReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
