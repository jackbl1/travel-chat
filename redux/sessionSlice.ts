import { SessionInterface } from "@/lib/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum SessionDetailView {
  Locations = "locations",
  Activities = "activities",
  Accommodations = "accommodations",
}

interface SessionState {
  activeSessionId: string | null;
  activeSession: SessionInterface | null;
  sessionDetailView: SessionDetailView;
}

const initialState: SessionState = {
  activeSessionId: null,
  activeSession: null,
  sessionDetailView: SessionDetailView.Locations,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setActiveSessionId(state, action: PayloadAction<string | null>) {
      state.activeSessionId = action.payload;
    },
    setActiveSession(state, action: PayloadAction<SessionInterface | null>) {
      state.activeSession = action.payload;
    },
    setSessionDetailView(state, action: PayloadAction<SessionDetailView>) {
      state.sessionDetailView = action.payload;
    },
  },
});

export const getActiveSessionId = (state: { session: SessionState }) => {
  return state.session.activeSessionId;
};

export const getActiveSession = (state: { session: SessionState }) => {
  return state.session.activeSession;
};

export const getSessionDetailView = (state: { session: SessionState }) => {
  return state.session.sessionDetailView;
};

export const { setActiveSessionId, setActiveSession, setSessionDetailView } =
  sessionSlice.actions;
export default sessionSlice.reducer;
