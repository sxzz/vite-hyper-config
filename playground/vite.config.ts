import assert from 'node:assert'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'test',
      buildStart() {
        const s: string = 'not-expected'
        assert(s === 'expected')
      },
    },
  ],
})
