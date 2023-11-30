import { existsSync } from 'node:fs'
import path from 'node:path'
import type { InlineConfig } from 'vite'

export const DEFAULT_CONFIG_FILES = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.cjs',
  'vite.config.mts',
  'vite.config.cts',
]

export function findConfigFile(
  configFile: InlineConfig['configFile'],
  configRoot = process.cwd(),
) {
  let resolvedPath: string | undefined
  if (configFile) {
    // explicit config path is always resolved from cwd
    resolvedPath = path.resolve(configFile)
  } else {
    // implicit config file loaded from inline root (if present)
    // otherwise from cwd
    for (const filename of DEFAULT_CONFIG_FILES) {
      const filePath = path.resolve(configRoot, filename)
      if (!existsSync(filePath)) continue

      resolvedPath = filePath
      break
    }
  }

  if (!resolvedPath) {
    return null
  }
  return resolvedPath
}
