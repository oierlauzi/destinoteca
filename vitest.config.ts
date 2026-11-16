import { defineConfig } from 'vitest/config';

// Plain Vitest, no Astro: src/lib must stay importable without the site around it.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
