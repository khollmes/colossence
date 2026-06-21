import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['app/api/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'lib/prisma.ts',
        'lib/stripe.ts',
        'lib/email.ts',
        'lib/auth.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
    },
  },
})
