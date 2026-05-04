import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import "./ThemeToggle.css";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? "Modo Claro" : "Modo Escuro"}
      aria-label={isDark ? "Alternar para modo claro" : "Alternar para modo escuro"}
      id="theme-toggle"
    >
      <div className={`theme-toggle-track ${isDark ? "track-dark" : "track-light"}`}>
        <div className={`theme-toggle-thumb ${isDark ? "thumb-dark" : "thumb-light"}`}>
          {isDark ? (
            <Moon size={12} className="theme-toggle-icon" />
          ) : (
            <Sun size={12} className="theme-toggle-icon" />
          )}
        </div>
        <Sun size={10} className="theme-toggle-label-icon sun-icon" />
        <Moon size={10} className="theme-toggle-label-icon moon-icon" />
      </div>
    </button>
  );
};
