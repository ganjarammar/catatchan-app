import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "kawaii";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  toggleKawaii?: () => void;
  isKawaii: boolean;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [isKawaii, setIsKawaii] = useState(() => {
    if (switchable) {
      const stored = localStorage.getItem("isKawaii");
      return stored === "true";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isKawaii) {
      root.classList.add("kawaii");
      root.classList.remove("dark");
    } else {
      root.classList.remove("kawaii");
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
      localStorage.setItem("isKawaii", isKawaii.toString());
    }
  }, [theme, isKawaii, switchable]);

  const toggleTheme = switchable
    ? () => {
        if (isKawaii) {
          setIsKawaii(false);
        } else {
          setTheme(prev => (prev === "light" ? "dark" : "light"));
        }
      }
    : undefined;

  const toggleKawaii = switchable
    ? () => {
        setIsKawaii(prev => !prev);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, toggleKawaii, isKawaii, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
