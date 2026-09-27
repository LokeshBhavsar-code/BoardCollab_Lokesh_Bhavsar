import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  user: null,
  activeRoom: null,
  users: [],
  connected: false,
  error: null
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    },
    clearCredentials() {
      return initialState;
    },
    setActiveRoom(state, action) {
      state.activeRoom = action.payload;
      state.users = [];
      state.error = null;
    },
    setUsers(state, action) {
      state.users = action.payload || [];
    },
    setConnectionStatus(state, action) {
      state.connected = action.payload;
    },
    setRoomError(state, action) {
      state.error = action.payload;
    }
  }
});

export const {
  setCredentials,
  clearCredentials,
  setActiveRoom,
  setUsers,
  setConnectionStatus,
  setRoomError
} = roomSlice.actions;

export default roomSlice.reducer;