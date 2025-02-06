import process from 'node:process'
import { cac, type CAC } from 'cac'
import colors from 'picocolors'
import {
  createLogger,
  mergeConfig,
  resolveConfig,
  version,
  type BuildOptions,
  type LogLevel,
  type ServerOptions,
} from 'vite'
import { context } from '.'

export const cli: CAC = cac('vite')

// global options
export interface GlobalCLIOptions {
  '--'?: string[]
  c?: boolean | string
  config?: string
  base?: string
  l?: LogLevel
  logLevel?: LogLevel
  clearScreen?: boolean
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  force?: boolean
}

const filterDuplicateOptions = <T extends object>(options: T) => {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value.at(-1)
    }
  }
}
/**
 * removing global flags before passing as command specific sub-configs
 */
function cleanOptions<Options extends GlobalCLIOptions>(
  options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
  const ret = { ...options }
  delete ret['--']
  delete ret.c
  delete ret.config
  delete ret.base
  delete ret.l
  delete ret.logLevel
  delete ret.clearScreen
  delete ret.d
  delete ret.debug
  delete ret.f
  delete ret.filter
  delete ret.m
  delete ret.mode

  // convert the sourcemap option to a boolean if necessary
  if ('sourcemap' in ret) {
    const sourcemap = ret.sourcemap as `${boolean}` | 'inline' | 'hidden'
    ret.sourcemap =
      sourcemap === 'true'
        ? true
        : sourcemap === 'false'
          ? false
          : ret.sourcemap
  }

  return ret
}

/**
 * host may be a number (like 0), should convert to string
 */
const convertHost = (v: any) => {
  if (typeof v === 'number') {
    return String(v)
  }
  return v
}

/**
 * base may be a number (like 0), should convert to empty string
 */
const convertBase = (v: any) => {
  if (v === 0) {
    return ''
  }
  return v
}

cli
  .option('-c, --config <file>', `[string] use specified config file`)
  .option('--base <path>', `[string] public base path (default: /)`, {
    type: [convertBase],
  })
  .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
  .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
  .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
  .option('-f, --filter <filter>', `[string] filter debug logs`)
  .option('-m, --mode <mode>', `[string] set env mode`)

// dev
cli
  .command('[root]', 'start dev server') // default command
  .alias('serve') // the command is called 'serve' in Vite's API
  .alias('dev') // alias to align with the script name
  .option('--host [host]', `[string] specify hostname`, { type: [convertHost] })
  .option('--port <port>', `[number] specify port`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle`,
  )
  .action(async (root: string, options: ServerOptions & GlobalCLIOptions) => {
    filterDuplicateOptions(options)
    // output structure is preserved even after bundling so require()
    // is ok here
    const { createServer } = await import('vite')
    try {
      const config = mergeConfig(
        {
          root,
          base: options.base,
          mode: options.mode,
          configFile: false,
          logLevel: options.logLevel,
          clearScreen: options.clearScreen,
          optimizeDeps: { force: options.force },
          server: cleanOptions(options),
        },
        context.config,
      )
      const server = (context.viteServer = await createServer(config))

      if (!server.httpServer) {
        throw new Error('HTTP server not available')
      }

      await server.listen()

      const info = server.config.logger.info
      const hasExistingLogs =
        process.stdout.bytesWritten > 0 || process.stderr.bytesWritten > 0

      info(`\n  ${colors.green(`${colors.bold('VITE')} v${version}`)}\n`, {
        clear: !hasExistingLogs,
      })

      server.printUrls()
      server.bindCLIShortcuts({ print: true })
    } catch (error: any) {
      const logger = createLogger(options.logLevel)
      logger.error(
        colors.red(`error when starting dev server:\n${error.stack}`),
        { error },
      )
      process.exit(1)
    }
  })

// build
cli
  .command('build [root]', 'build for production')
  .option('--target <target>', `[string] transpile target (default: 'modules')`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .option(
    '--assetsDir <dir>',
    `[string] directory under outDir to place assets in (default: assets)`,
  )
  .option(
    '--assetsInlineLimit <number>',
    `[number] static asset base64 inline threshold in bytes (default: 4096)`,
  )
  .option(
    '--ssr [entry]',
    `[string] build specified entry for server-side rendering`,
  )
  .option(
    '--sourcemap [output]',
    `[boolean | "inline" | "hidden"] output source maps for build (default: false)`,
  )
  .option(
    '--minify [minifier]',
    `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
      `or specify minifier to use (default: esbuild)`,
  )
  .option('--manifest [name]', `[boolean | string] emit build manifest json`)
  .option('--ssrManifest [name]', `[boolean | string] emit ssr manifest json`)
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle (experimental)`,
  )
  .option(
    '--emptyOutDir',
    `[boolean] force empty outDir when it's outside of root`,
  )
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .action(async (root: string, options: BuildOptions & GlobalCLIOptions) => {
    filterDuplicateOptions(options)
    const { build } = await import('vite')
    const buildOptions: BuildOptions = cleanOptions(options)

    try {
      await build(
        mergeConfig(
          {
            root,
            base: options.base,
            mode: options.mode,
            configFile: false,
            logLevel: options.logLevel,
            clearScreen: options.clearScreen,
            optimizeDeps: { force: options.force },
            build: buildOptions,
          },
          context.config,
        ),
      )
    } catch (error: any) {
      createLogger(options.logLevel).error(
        colors.red(`error during build:\n${error.stack}`),
        { error },
      )
      process.exit(1)
    }
  })

// optimize
cli
  .command('optimize [root]', 'pre-bundle dependencies')
  .option(
    '--force',
    `[boolean] force the optimizer to ignore the cache and re-bundle`,
  )
  .action(
    async (root: string, options: { force?: boolean } & GlobalCLIOptions) => {
      filterDuplicateOptions(options)
      const { optimizeDeps } = await import('vite')
      try {
        const config = await resolveConfig(
          mergeConfig(
            {
              root,
              base: options.base,
              configFile: false,
              logLevel: options.logLevel,
              mode: options.mode,
            },
            context.config,
          ),
          'serve',
        )
        await optimizeDeps(config, options.force, true)
      } catch (error: any) {
        createLogger(options.logLevel).error(
          colors.red(`error when optimizing deps:\n${error.stack}`),
          { error },
        )
        process.exit(1)
      }
    },
  )

// preview
cli
  .command('preview [root]', 'locally preview production build')
  .option('--host [host]', `[string] specify hostname`, { type: [convertHost] })
  .option('--port <port>', `[number] specify port`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .action(
    async (
      root: string,
      options: {
        host?: string | boolean
        port?: number
        open?: boolean | string
        strictPort?: boolean
        outDir?: string
      } & GlobalCLIOptions,
    ) => {
      filterDuplicateOptions(options)
      const { preview } = await import('vite')
      try {
        const server = await preview(
          mergeConfig(
            {
              root,
              base: options.base,
              configFile: false,
              logLevel: options.logLevel,
              mode: options.mode,
              build: {
                outDir: options.outDir,
              },
              preview: {
                port: options.port,
                strictPort: options.strictPort,
                host: options.host,
                open: options.open,
              },
            },
            context.config,
          ),
        )
        server.printUrls()
        server.bindCLIShortcuts({ print: true })
      } catch (error: any) {
        createLogger(options.logLevel).error(
          colors.red(`error when starting preview server:\n${error.stack}`),
          { error },
        )
        process.exit(1)
      }
    },
  )

cli.help()
cli.version(version)
