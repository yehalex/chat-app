import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useThemeStore = create(
  devtools(
    (set) => ({
      theme: localStorage.getItem("chat-theme") || "coffee",
      setTheme: (theme) => {
        localStorage.setItem("chat-theme", theme);
        set({ theme });
      },
    }),
    { name: "Theme Store" }
  )
);
