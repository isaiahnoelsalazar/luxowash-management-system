import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'midnight-gold' | 'ocean' | 'forest' | 'rose';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('luxowash_theme');
    return (saved as Theme) || 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('luxowash_theme', newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'midnight-gold', 'ocean', 'forest', 'rose');
    root.classList.add(theme);
    
    // Add 'dark' class for dark themes to trigger dark: variants
    if (theme === 'dark' || theme === 'midnight-gold') {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
