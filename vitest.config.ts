import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import dotenv from 'dotenv'

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' })
}

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/globalSetup.ts'],
    environment: 'node',
  },
  plugins: [tsconfigPaths()],
})
