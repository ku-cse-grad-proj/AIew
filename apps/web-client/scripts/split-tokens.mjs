import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd() // apps/web-client
const inputPath = path.join(root, 'tokens/tokens.json')
const outDir = path.join(root, 'tokens')

fs.mkdirSync(outDir, { recursive: true })

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

const mapping = {
  'primitives/Mode 1': 'primitives.json',
  'semantic/light': 'semantic.light.json',
  'semantic/dark': 'semantic.dark.json',
  'components/Mode 1': 'components.json',
  'Typography/Mode 1': 'typography.json',
}

for (const [setName, fileName] of Object.entries(mapping)) {
  if (!raw[setName]) throw new Error(`Token set not found: ${setName}`)
  fs.writeFileSync(
    path.join(outDir, fileName),
    JSON.stringify(raw[setName], null, 2),
  )
}

console.log('tokens/ 분리 완료')
