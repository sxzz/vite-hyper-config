import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startVite } from '../src'

const dirname = path.dirname(fileURLToPath(import.meta.url))
process.chdir(dirname)

startVite(
  {},
  {
    plugins: [
      {
        name: 'test',
        transform(code) {
          return code.replace('not-expected', 'expected')
        },
      },
    ],
  },
)
