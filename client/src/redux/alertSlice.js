import { createSlice } from "@reduxjs/toolkit";

const alertSlice = createSlice({
    name: "alert",
    initialState: {
        isOpen: false,
        title: "",
        message: "",
    },
    reducers: {
        showAlert: (state, action) => {
            state.isOpen = true;
            state.title = action.payload.title || "Notice";
            state.message = action.payload.message || "";
        },
        hideAlert: (state) => {
            state.isOpen = false;
            state.title = "";
            state.message = "";
        },
    },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
