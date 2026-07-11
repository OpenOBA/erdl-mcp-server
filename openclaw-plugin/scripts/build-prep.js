/**
 * Build helper: copies compiled engine + presets from the parent
 * erdl-mcp-server build into the plugin's src/ for TypeScript compilation,
 * then into dist/ for publishing.
 *
 * Run before: tsc -p tsconfig.json
 * Run after:  npm run build:post
 */

import { cp, rm, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pluginRoot = join(__dirname, "..")
const parentRoot = join(__dirname, "..", "..")
const srcEngine = join(pluginRoot, "src", "engine")
const srcPresets = join(pluginRoot, "src", "presets")
const parentDist = join(parentRoot, "dist")

async function main() {
  // 1. Clean previous copies
  await rm(srcEngine, { recursive: true, force: true })
  await rm(srcPresets, { recursive: true, force: true })

  // 2. Check parent build exists
  if (!existsSync(join(parentDist, "engine"))) {
    console.error("[erdl-plugin] ERROR: Parent project not built. Run 'npm run build' in erdl-mcp-server first.")
    process.exit(1)
  }

  // 3. Copy parent build output → src/ (for TypeScript compilation)
  await cp(join(parentDist, "engine"), srcEngine, { recursive: true })
  await cp(join(parentDist, "presets"), srcPresets, { recursive: true })

  console.log("[erdl-plugin] Engine + presets copied from parent build.")
}

main().catch((err) => {
  console.error("[erdl-plugin] Build prep failed:", err.message)
  process.exit(1)
})
