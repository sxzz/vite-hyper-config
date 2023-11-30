# vite-hyper-config [![npm](https://img.shields.io/npm/v/vite-hyper-config.svg)](https://npmjs.com/package/vite-hyper-config)

[![Unit Test](https://github.com/sxzz/vite-hyper-config/actions/workflows/unit-test.yml/badge.svg)](https://github.com/sxzz/vite-hyper-config/actions/workflows/unit-test.yml)

Use Vite to run Vite's own config. In other words, transform and run `vite.config.ts` with Vite.

## Install

```bash
npm i vite-hyper-config
```

## Usage

```ts
import { startVite } from 'vite-hyper-config'
import { DevPlugin } from './plugin'

startVite(
  {
    // (Optional)
    // Vite config for transforming client code (undering `src`)
    // Will be merged with result of `vite.config.ts` if it exists
  },
  {
    // (Optional)
    // Vite config for transforming `vite.config.ts` itself
    plugins: [DevPlugin()],
  },
  {
    // (Optional)
    // Runner options, see https://github.com/vitest-dev/vitest/blob/main/packages/vite-node/src/types.ts#L92-L111
    deps: {
      // Also transform some dependency
      inline: ['@vitejs/plugin-vue'],
    },
  },
)
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2023 [三咲智子 Kevin Deng](https://github.com/sxzz)
