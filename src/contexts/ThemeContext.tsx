
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "@/services/api";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserInfo } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    user?.frontend_settings?.displaySettings?.darkMode || false
  );

  useEffect(() => {
    // Update the dark mode setting when the user's settings change
    if (user?.frontend_settings?.displaySettings) {
      setIsDarkMode(user.frontend_settings.displaySettings.darkMode);
    }
  }, [user?.frontend_settings?.displaySettings]);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = async () => {
    const newDarkModeValue = !isDarkMode;
    setIsDarkMode(newDarkModeValue);
    
    // Update the user's settings if they're logged in
    if (user) {
      const currentSettings = user.frontend_settings || {};
      const displaySettings = currentSettings.displaySettings || {};
      
      const updatedSettings = {
        ...currentSettings,
        displaySettings: {
          ...displaySettings,
          darkMode: newDarkModeValue,
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
    isDarkMode,
    toggleDarkMode,
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
