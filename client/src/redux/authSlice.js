import { createSlice } from "@reduxjs/toolkit";

// One kind of session for everyone. Admins are customer accounts with role "admin" (set in the
// database); the server re-checks the role on every admin request.
const loadAuth = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem("extractAuth"));
        if (parsed?.token && parsed.user) return { token: parsed.token, user: parsed.user };
    } catch { /* storage unavailable or corrupt: start signed out */ }
    return { token: null, user: null };
};

const authSlice = createSlice({
    name: "auth",
    initialState: loadAuth(),
    reducers: {
        loginSuccess: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            try {
                localStorage.setItem("extractAuth", JSON.stringify({ token: action.payload.token, user: action.payload.user }));
            } catch { /* private mode: the session lasts for this tab only */ }
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            try {
                localStorage.removeItem("extractAuth");
            } catch { /* nothing stored */ }
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
