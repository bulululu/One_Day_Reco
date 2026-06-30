import { ViewStyle } from 'react-native';

export const UI = {
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 26,
  },
  font: {
    caption: 12,
    body: 14,
    lead: 16,
    title: 22,
    hero: 28,
  },
  space: {
    pageX: 18,
    section: 14,
  },
};

export function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function softShadow(color: string, opacity = 0.08): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  };
}
