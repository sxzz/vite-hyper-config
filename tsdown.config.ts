import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: true,
  platform: 'node',
})
