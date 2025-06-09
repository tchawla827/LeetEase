import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  // Apply class and persist preference synchronously
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    // Force a reflow so the transition class is applied before the
    // `dark` class toggles. This avoids the abrupt flash when modes change.
    void root.offsetWidth;

    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Immediately toggle the class so the transition begins without waiting
    // for React's re-render cycle. This keeps the background from flashing
    // when switching between themes.
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist the preference and update context state
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);

    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
