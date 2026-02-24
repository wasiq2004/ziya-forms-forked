'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './Button'; // assumes you have a Button component (like shadcn/ui)

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 p-0 relative transition-all duration-300"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
          theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
        }`}
      >
        <Moon className="w-5 h-5 text-gray-800" />
      </span>

      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
          theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
        }`}
      >
        <Sun className="w-5 h-5 text-yellow-400" />
      </span>
    </Button>
  );
}
