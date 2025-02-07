import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ItineraryState {
  selectedSession: string | null;
}

const initialState: ItineraryState = {
  selectedSession: null,
};

const itinerarySlice = createSlice({
  name: "itinerary",
  initialState,
  reducers: {
    setActiveSessionId(state, action: PayloadAction<string | null>) {
      state.selectedSession = action.payload;
    },
  },
});

export const getActiveSessionId = (state: { itinerary: ItineraryState }) => {
  return state.itinerary.selectedSession;
};

export const { setActiveSessionId } = itinerarySlice.actions;
export default itinerarySlice.reducer;
