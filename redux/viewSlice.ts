import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum View {
  NewChat = "new-chat",
  CurrentChat = "current-chat",
  Itinerary = "itinerary",
  Map = "map",
  PastTrips = "past-trips",
}

interface ViewState {
  currentView: View;
}

const initialState: ViewState = {
  currentView: View.NewChat,
};

const viewSlice = createSlice({
  name: "view",
  initialState,
  reducers: {
    setCurrentView(state, action: PayloadAction<View>) {
      state.currentView = action.payload;
    },
  },
});

export const { setCurrentView } = viewSlice.actions;

export const getCurrentView = (state: { view: ViewState }) => {
  return state.view.currentView;
};

export default viewSlice.reducer;
