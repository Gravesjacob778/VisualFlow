import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AuthStoreState {
    isAuthenticated: boolean;
    setAuthenticated: (isAuthenticated: boolean) => void;
    logout: () => void;
}

const initialState = {
    isAuthenticated: false,
};

export const useAuthStore = create<AuthStoreState>()(
    devtools(
        (set) => ({
            ...initialState,
            setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
            logout: () => set({ isAuthenticated: false }),
        }),
        { name: "auth-store" }
    )
);
