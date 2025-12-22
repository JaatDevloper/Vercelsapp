import { useContext } from "react";
import { Colors } from "@/constants/theme";
import { ThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const { isDark, mode, setMode, toggleTheme } = useContext(ThemeContext);
  const theme = Colors[isDark ? "dark" : "light"];

  return {
    theme,
    isDark,
    mode,
    setMode,
    toggleTheme,
  };
}
