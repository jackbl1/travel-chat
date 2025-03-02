import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum SessionDetailView {
  Locations = "locations",
  Customize = "customize",
}

interface SessionState {
  activeSessionId: string | null;
  activeSessionName: string | null;
  sessionDetailView: SessionDetailView;
}

const initialState: SessionState = {
  activeSessionId: null,
  activeSessionName: null,
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
    setSessionDetailView(state, action: PayloadAction<SessionDetailView>) {
      state.sessionDetailView = action.payload;
    },
    resetSession: () => initialState,
  },
});

export const getActiveSessionId = (state: { session: SessionState }) => {
  return state.session.activeSessionId;
};

export const getActiveSessionName = (state: { session: SessionState }) => {
  return state.session.activeSessionName;
};

export const getSessionDetailView = (state: { session: SessionState }) => {
  return state.session.sessionDetailView;
};

export const {
  setActiveSessionId,
  setActiveSessionName,
  setSessionDetailView,
  resetSession,
} = sessionSlice.actions;
export default sessionSlice.reducer;
