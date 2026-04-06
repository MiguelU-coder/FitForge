// src/theme/spacing.ts

export const Spacing = {
  xs: 4,
  s:  8,
  m:  16,
  l:  24,
  xl: 32,
} as const;

export const Radius = {
  s:  8,
  m:  12,
  l:  16,
  xl: 20,
  xxl: 24,
} as const;

export const NavBar = {
  height: 68,
  bottomGap: 12,
  extra: 80,  // height + bottomGap
} as const;
