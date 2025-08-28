/** @type {import('jest').Config} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/**/*.e2e-spec.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.dto.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html', 'lcov'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        // Cobertura específica para partes core
        './src/agents/': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
        './src/utils/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};