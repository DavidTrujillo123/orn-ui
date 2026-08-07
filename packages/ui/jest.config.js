/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
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
