import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  call: null,
  isCalling: false,
  isReceivingCall: false,
  callEnded: false,
};

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.call = action.payload;
      state.isCalling = true;
    },
    receiveCall: (state, action) => {
      state.call = action.payload;
      state.isReceivingCall = true;
    },
    endCall: (state) => {
      state.call = null;
      state.isCalling = false;
      state.isReceivingCall = false;
      state.callEnded = true;
    },
    resetCall: (state) => {
      state.call = null;
      state.isCalling = false;
      state.isReceivingCall = false;
      state.callEnded = false;
    },
  },
});

export const { startCall, receiveCall, endCall, resetCall } = callSlice.actions;

export default callSlice.reducer;
