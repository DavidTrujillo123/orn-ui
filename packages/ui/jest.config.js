/** @type {import('jest').Config} */
module.exports = {
  // 'react-native' resolves react-native/jest-preset.js, not the
  // @react-native/jest-preset package directly: that package only exists since
  // react-native 0.85 (Expo SDK 56), and in 0.81–0.84 (SDK 54/55) the preset
  // lives inside react-native. jest-preset.js is there across the whole
  // supported range — since 0.85 it's a shim to the new package —, so this
  // same config runs against all four SDKs (see scripts/compat-matrix.mjs).
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
