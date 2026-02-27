import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("bizsolve-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bizsolve-theme", theme);
  }, [theme]);

  const toggle  = () => setTheme(t => t === "dark" ? "light" : "dark");
  const setDark  = () => setTheme("dark");
  const setLight = () => setTheme("light");
  const isDark   = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, toggle, setDark, setLight, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);