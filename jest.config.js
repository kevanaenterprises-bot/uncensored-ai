module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'pages/**/*.{ts,tsx}',
    '!pages/**/_*.{ts,tsx}',
    '!pages/_app.tsx',
    '!pages/_document.tsx',
  ],
};
