export const SPORTS = [
  { id: 'football', label: 'Fotbal' },
  { id: 'basketball', label: 'Baschet' },
  { id: 'hockey', label: 'Hochei' },
] as const;

export type Sport = (typeof SPORTS)[number]['id'];
