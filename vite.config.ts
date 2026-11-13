import { defineConfig } from 'vite';
export default defineConfig({
  base: '/vernier-caliper/',
  build: { sourcemap: true, target: 'es2022', chunkSizeWarningLimit: 950 },
  test: { include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'src/**/*.test.ts'], environment: 'node' },
});
