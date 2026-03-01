import { createSlice } from "@reduxjs/toolkit";

const loadAuth = () => {
    try {
        const data = localStorage.getItem("extractAuth");
        if (!data) return { token: null, admin: null, user: null };
        const parsed = JSON.parse(data);
        // Don't persist admin sessions — admin must re-login each visit
        // Only keep regular user sessions
        if (parsed.admin && !parsed.user) {
            return { token: null, admin: null, user: null };
        }
        // If it's a regular user session, strip any admin data
        return { token: parsed.token, admin: null, user: parsed.user || null };
    } catch {
        return { token: null, admin: null, user: null };
    }
};

const authSlice = createSlice({
    name: "auth",
    initialState: loadAuth(),
    reducers: {
        loginSuccess: (state, action) => {
            state.token = action.payload.token;
            state.admin = action.payload.admin || null;
            state.user = action.payload.user || null;
            localStorage.setItem("extractAuth", JSON.stringify(state));
        },
        logout: (state) => {
            state.token = null;
            state.admin = null;
            state.user = null;
            localStorage.removeItem("extractAuth");
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
