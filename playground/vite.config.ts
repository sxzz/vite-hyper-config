/* eslint-disable no-console */
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'test',
      buildStart() {
        console.log('not-expected')
      },
    },
  ],
})
