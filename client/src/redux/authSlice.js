import { createSlice } from "@reduxjs/toolkit";

const loadAuth = () => {
    try {
        // Admin sessions are stored in sessionStorage (cleared when browser closes)
        const adminData = sessionStorage.getItem("extractAdminAuth");
        if (adminData) {
            const parsed = JSON.parse(adminData);
            if (parsed.token && parsed.admin) {
                return { 
                    token: parsed.token, 
                    admin: parsed.admin, 
                    user: { ...parsed.admin, email: parsed.admin.username } 
                };
            }
        }

        // User sessions are stored in localStorage (persistent)
        const userData = localStorage.getItem("extractAuth");
        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.token && parsed.user) {
                return { token: parsed.token, admin: null, user: parsed.user };
            }
        }

        return { token: null, admin: null, user: null };
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
            state.user = action.payload.user || (action.payload.admin ? { ...action.payload.admin, email: action.payload.admin.username } : null);

            if (action.payload.admin) {
                // Admin sessions go to sessionStorage (ephemeral per tab/window)
                sessionStorage.setItem("extractAdminAuth", JSON.stringify({
                    token: action.payload.token,
                    admin: action.payload.admin,
                }));
                localStorage.removeItem("extractAuth");
            } else {
                // User sessions go to localStorage (persistent)
                localStorage.setItem("extractAuth", JSON.stringify({
                    token: action.payload.token,
                    user: action.payload.user,
                }));
                sessionStorage.removeItem("extractAdminAuth");
            }
        },
        logout: (state) => {
            state.token = null;
            state.admin = null;
            state.user = null;
            localStorage.removeItem("extractAuth");
            sessionStorage.removeItem("extractAdminAuth");
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
