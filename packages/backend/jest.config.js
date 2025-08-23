/** @type {import('jest').Config} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: 'coverage',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};