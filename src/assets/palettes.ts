export const PASTEL_PALETTE = [
  '#1f1b2d',
  '#f8d7e5',
  '#ff97b7',
  '#fff1c1',
  '#ffd166',
  '#cbf3d2',
  '#76c893',
  '#b8d8ff',
  '#7fb7ff',
  '#dac4ff',
  '#fff9eb',
  '#ff6f6f'
] as const;

export type PaletteColor = (typeof PASTEL_PALETTE)[number];
