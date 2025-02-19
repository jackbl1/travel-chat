import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum SessionDetailView {
  Locations = "locations",
  Activities = "activities",
  Accommodations = "accommodations",
}

interface SessionState {
  activeSessionId: string | null;
  activeSessionName: string | null;
  activeSessionLocations: string[] | null;
  sessionDetailView: SessionDetailView;
}

const initialState: SessionState = {
  activeSessionId: null,
  activeSessionName: null,
  activeSessionLocations: null,
  sessionDetailView: SessionDetailView.Locations,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setActiveSessionId(state, action: PayloadAction<string | null>) {
      state.activeSessionId = action.payload;
    },
    setActiveSessionName(state, action: PayloadAction<string | null>) {
      state.activeSessionName = action.payload;
    },
    setActiveSessionLocations(state, action: PayloadAction<string[] | null>) {
      state.activeSessionLocations = action.payload;
    },
    setSessionDetailView(state, action: PayloadAction<SessionDetailView>) {
      state.sessionDetailView = action.payload;
    },
  },
});

export const getActiveSessionId = (state: { session: SessionState }) => {
  return state.session.activeSessionId;
};

export const getActiveSessionName = (state: { session: SessionState }) => {
  return state.session.activeSessionName;
};

export const getActiveSessionLocations = (state: { session: SessionState }) => {
  return state.session.activeSessionLocations;
};

export const getSessionDetailView = (state: { session: SessionState }) => {
  return state.session.sessionDetailView;
};

export const {
  setActiveSessionId,
  setActiveSessionName,
  setActiveSessionLocations,
  setSessionDetailView,
} = sessionSlice.actions;
export default sessionSlice.reducer;
