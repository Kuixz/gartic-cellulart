import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'old/*'],
    reporters: ["verbose"],
    environment: "jsdom",
    passWithNoTests: true,
    coverage: {
        provider: "istanbul",
        enabled: true,
        include: ['src/**/*.ts'],
        reporter: ['text']
    }
  },
})