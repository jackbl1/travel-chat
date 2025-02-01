import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LocationType = {
  name: string;
  placeholder: string;
};

interface ItineraryState {
  locations: LocationType[];
}

const initialState: ItineraryState = {
  locations: [],
};

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    setLocations(state, action: PayloadAction<LocationType[]>) {
      state.locations = action.payload;
    },
    addLocation(state, action: PayloadAction<LocationType>) {
      state.locations.push(action.payload);
    },
    removeLocation(state, action: PayloadAction<string>) {
      state.locations = state.locations.filter(
        (location) => location.name !== action.payload
      );
    },
  },
});

export const { setLocations, addLocation, removeLocation } =
  itinerarySlice.actions;
export default itinerarySlice.reducer;
