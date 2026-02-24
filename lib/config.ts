/**
 * Application configuration
 */

// Gradient colors used throughout the application
export const GRADIENT_COLORS = {
  start: process.env.NEXT_PUBLIC_GRADIENT_START || '#3b84f2',
  end: process.env.NEXT_PUBLIC_GRADIENT_END || '#57d58b',
  palette: [
    process.env.NEXT_PUBLIC_GRADIENT_START || '#3b84f2',
    process.env.NEXT_PUBLIC_GRADIENT_END || '#57d58b',
    '#f2994a',
    '#eb5757',
    '#9b51e0',
    '#56ccf2',
  ],
};

// Default form theme color
export const DEFAULT_FORM_THEME_COLOR = process.env.NEXT_PUBLIC_DEFAULT_FORM_THEME_COLOR || '#3b84f2';

// Application name
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Ziya Forms';

// Application description
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Create beautiful forms, collect responses, and analyze results with ease.';