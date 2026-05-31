module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: ['src/**/*.js', '!src/**/*.d.ts'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    verbose: true,
    testTimeout: 10000,
};
