import React, { createContext, useState, ReactNode } from 'react';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Theme,
} from '@react-navigation/native';

export const ThemeContext = createContext({
  theme: NavigationLightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(NavigationLightTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme.dark ? NavigationLightTheme : NavigationDarkTheme
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
