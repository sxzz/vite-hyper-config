import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  target: 'node18',
  splitting: true,
  cjsInterop: true,
  clean: true,
  dts: true,
  platform: 'node',
})
