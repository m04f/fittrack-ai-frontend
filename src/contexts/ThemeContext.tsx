
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "@/services/api";

type ThemeContextType = {
  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserInfo } = useAuth();
  const [theme, setTheme] = useState<"system" | "light" | "dark">(
    user?.frontend_settings?.displaySettings?.theme || "system"
  );

  // Apply theme on initial load
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  useEffect(() => {
    // Update the dark mode setting when the user's settings change
    if (user?.frontend_settings?.displaySettings) {
      setTheme(user.frontend_settings.displaySettings.theme || "system");
    }
  }, [user?.frontend_settings?.displaySettings]);

  useEffect(() => {
    // Apply dark mode class to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const setThemePreference = async (newTheme: "system" | "light" | "dark") => {
    setTheme(newTheme);

    // Update the user's settings if they're logged in
    if (user) {
      const currentSettings = user.frontend_settings || {};
      const displaySettings = currentSettings.displaySettings || {};

      const updatedSettings = {
        ...currentSettings,
        displaySettings: {
          ...displaySettings,
          theme: newTheme,
        },
      };

      try {
        await api.updateUserInfo({
          frontend_settings: updatedSettings,
        });

        // Update local user state with the new settings
        updateUserInfo({
          ...user,
          frontend_settings: updatedSettings,
        });
      } catch (error) {
        console.error("Failed to update theme settings:", error);
      }
    }
  };

  const value = {
    theme,
    setTheme: setThemePreference,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
