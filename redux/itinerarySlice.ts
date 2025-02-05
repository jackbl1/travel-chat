import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LocationType = {
  name: string;
  placeholder?: string;
  geolocation?: LatLongType;
};

type LatLongType = {
  lat: number;
  long: number;
};

interface ItineraryState {
  selectedSession: string | null;
  locations: LocationType[];
}

const initialState: ItineraryState = {
  selectedSession: null,
  locations: [
    // {name: 'Noregon Systems Greensboro', placeholder: 'bottom text', lat: 36.07996, lng: -79.9631899},
    // {name: 'Meadowlark Elementary School Winston Salem', placeholder: 'Spawn', lat: 36.1002502, lng: -80.3644626},
    // {name: "Mozelle's, Winston Salem", placeholder: 'Foo Bar', lat: 36.0969189, lng: -80.25673239999999}
  ],
};

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    setActiveSessionId(state, action: PayloadAction<string | null>) {
      state.selectedSession = action.payload;
    },
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

export const getActiveSessionId = (state: { itinerary: ItineraryState }) => {
  return state.itinerary.selectedSession;
};

export const { setActiveSessionId, setLocations, addLocation, removeLocation } =
  itinerarySlice.actions;
export default itinerarySlice.reducer;
