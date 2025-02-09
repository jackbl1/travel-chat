import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export enum SessionDetailView {
  Locations = "locations",
  Activities = "activities",
  Accommodations = "accommodations",
}

interface SessionDetailState {
  currentView: SessionDetailView;
}

const initialState: SessionDetailState = {
  currentView: SessionDetailView.Locations,
};

export const sessionDetailSlice = createSlice({
  name: "sessionDetail",
  initialState,
  reducers: {
    setSessionDetailView: (state, action: PayloadAction<SessionDetailView>) => {
      state.currentView = action.payload;
    },
  },
});

export const { setSessionDetailView } = sessionDetailSlice.actions;
export const getCurrentSessionDetailView = (state: RootState) => state.sessionDetail.currentView;
export default sessionDetailSlice.reducer;
