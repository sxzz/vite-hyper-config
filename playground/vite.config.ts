import assert from 'node:assert'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'test',
      buildStart() {
        const s = 'not-expected'
        assert.equal(s, 'expected')
        console.info('success')
      },
    },
  ],
})
