import process from 'node:process'
import { startVite } from '../src'

process.chdir(import.meta.dirname)

startVite(
  {},
  {
    plugins: [
      {
        name: 'test',
        transform(code) {
          return code.replaceAll('not-expected', 'expected')
        },
      },
    ],
  },
)
