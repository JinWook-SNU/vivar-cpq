// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.jest.ts'],
  // 필요 시: testMatch, transform 등 추가
};

export default createJestConfig(config);
