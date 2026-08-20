/** @type {import('jest').Config} */
module.exports = {
  // 'react-native' resuelve react-native/jest-preset.js, no el paquete
  // @react-native/jest-preset directo: ese paquete existe recién desde
  // react-native 0.85 (Expo SDK 56), y en 0.81–0.84 (SDK 54/55) el preset vive
  // adentro de react-native. jest-preset.js está en todo el rango soportado —
  // desde 0.85 es un shim al paquete nuevo —, así que este mismo config corre
  // contra los cuatro SDK (ver scripts/compat-matrix.mjs).
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  // pnpm nests every package under node_modules/.pnpm/<pkg>/node_modules/<pkg>,
  // so a single "ignore unless it matches react-native/" regex always has an
  // earlier node_modules/ segment (the .pnpm one) that satisfies the "ignore"
  // branch, however it's written. Transforming all of node_modules sidesteps
  // that regex entirely; the extra transform cost is negligible for this suite.
  transformIgnorePatterns: [],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/index.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      branches: 85,
    },
  },
};
