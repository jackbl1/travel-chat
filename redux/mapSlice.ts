import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface MapState {
  selectedLocation: string | null;
}

const initialState: MapState = {
  selectedLocation: null,
};

export const mapSlice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setSelectedLocation: (state, action: PayloadAction<string | null>) => {
      state.selectedLocation = action.payload;
    },
    resetMap: () => initialState,
  },
});

export const { setSelectedLocation, resetMap } = mapSlice.actions;
export const getSelectedLocation = (state: RootState) =>
  state.map.selectedLocation;
export default mapSlice.reducer;
