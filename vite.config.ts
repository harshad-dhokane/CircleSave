import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

function suppressBrokenStarkZapSourceMaps() {
  return {
    name: 'suppress-broken-starkzap-sourcemaps',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('/node_modules/starkzap/dist/') || !id.endsWith('.js')) {
        return null
      }

      return {
        code: code.replace(/\n\/\/# sourceMappingURL=.*$/gm, ''),
        map: null,
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [suppressBrokenStarkZapSourceMaps(), inspectAttr(), react(), wasm(), topLevelAwait()],
  optimizeDeps: {
    exclude: ['@avnu/avnu-sdk'],
  },
  resolve: {
    dedupe: ['dayjs', 'qs'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      dayjs: path.resolve(__dirname, './node_modules/dayjs/esm/index.js'),
      '@avnu/avnu-sdk/node_modules/dayjs': path.resolve(__dirname, './node_modules/dayjs/esm/index.js'),
      '@avnu/avnu-sdk/node_modules/dayjs/dayjs.min.js': path.resolve(__dirname, './node_modules/dayjs/esm/index.js'),
      qs: path.resolve(__dirname, './src/lib/qs-compat.ts'),
      '@avnu/avnu-sdk/node_modules/qs': path.resolve(__dirname, './src/lib/qs-compat.ts'),
      '@avnu/avnu-sdk/node_modules/qs/lib/index.js': path.resolve(__dirname, './src/lib/qs-compat.ts'),
    },
  },
});
