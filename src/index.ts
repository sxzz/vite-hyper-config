import {
  type InlineConfig,
  type Logger,
  type UserConfig,
  type ViteDevServer,
  createLogger,
  createServer,
  mergeConfig,
} from 'vite'
import { ViteNodeServer } from 'vite-node/server'
import { ViteNodeRunner } from 'vite-node/client'
import { installSourcemapsSupport } from 'vite-node/source-map'
import { reload } from 'vite-node/hmr'
import { type GlobalCLIOptions, cli } from './cli'
import { findConfigFile } from './config'
import type { ViteNodeServerOptions } from 'vite-node'

export const context: {
  config: InlineConfig
  viteServer: ViteDevServer | null
  runner: Runner | null
} = {
  config: {},
  viteServer: null,
  runner: null,
}

interface Runner extends ViteNodeRunner {
  onUpdate?: () => void
}

export async function createRunner(
  logger: Logger,
  config: InlineConfig = {},
  viteNodeServerOptions: ViteNodeServerOptions = {},
) {
  const inlineConfig: InlineConfig = {
    configFile: false,
    optimizeDeps: { disabled: true },
    customLogger: logger,
    plugins: [
      {
        name: 'hmr',
        async handleHotUpdate({ modules }) {
          if (modules.length === 0) return
          await reload(runner, [])
          runner.onUpdate?.()
        },
      },
    ],
  }
  const server = await createServer(mergeConfig(inlineConfig, config))
  await server.pluginContainer.buildStart({})
  const node = new ViteNodeServer(server, viteNodeServerOptions)
  installSourcemapsSupport({
    getSourceMap: (source) => node.getSourceMap(source),
  })

  const runner: Runner = new ViteNodeRunner({
    root: server.config.root,
    base: server.config.base,
    fetchModule(id) {
      node.fetchCache.clear()
      return node.fetchModule(id)
    },
    resolveId(id, importer) {
      return node.resolveId(id, importer)
    },
  })

  return { server, runner }
}

export async function startVite(
  viteConfig: InlineConfig = {},
  runnerConfig: InlineConfig = {},
  viteNodeServerOptions: ViteNodeServerOptions = {},
) {
  const args = cli.parse(undefined, { run: false })
  const configFile = findConfigFile(
    (args.options as GlobalCLIOptions).config || viteConfig.configFile,
  )
  if (!configFile) {
    cli.parse()
    return
  }

  const logger = createLogger(undefined, {
    prefix: '[vite-node]',
    allowClearScreen: runnerConfig.clearScreen ?? true,
  })
  logger.info('Starting server...', { timestamp: true })
  const { server: viteNodeServer, runner } = await createRunner(
    logger,
    runnerConfig,
    viteNodeServerOptions,
  )
  runner.onUpdate = async () => {
    const config = await executeConfig(configFile)
    if (context.viteServer) {
      Object.assign(context.viteServer.config.inlineConfig, config)
      // context.viteServer.config.inlineConfig.plugins = config?.plugins
      await context.viteServer.restart()
    }
  }

  const config = await executeConfig(configFile)

  context.config = mergeConfig(
    {
      plugins: [
        {
          name: 'vite-node-close',
          configResolved({ command }) {
            if (command === 'build') return viteNodeServer.close()
          },
        },
      ],
    } satisfies InlineConfig,
    config || {},
  )
  context.runner = runner

  try {
    await cli.runMatchedCommand()
  } finally {
    if (!context.viteServer) viteNodeServer.close()
  }

  async function executeConfig(file: string) {
    return (await runner.executeFile(file)).default as Promise<
      UserConfig | undefined
    >
  }
}
