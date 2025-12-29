import { register } from '@tokens-studio/sd-transforms'
import StyleDictionary from 'style-dictionary'
import { usesReferences, getReferences } from 'style-dictionary/utils'

register(StyleDictionary)

const BUILD_PATH = 'src/styles/generated/'

// -----------------------------
// Helpers
// -----------------------------
const tokenVal = (t) => t.$value
const tokenOriginalVal = (t) => t.original?.$value ?? t.original?.value

// -----------------------------
// Transforms
// -----------------------------
// Add px to numeric radius tokens (Tailwind radius scale expects CSS lengths)
StyleDictionary.registerTransform({
  name: 'value/radius-px',
  type: 'value',
  filter: (token) =>
    token.path?.[0] === 'radius' && typeof tokenVal(token) === 'number',
  transform: (token) => `${tokenVal(token)}px`,
})

// -----------------------------
// Formats
// -----------------------------
StyleDictionary.registerFormat({
  name: 'tw/v4-theme',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.map((t) => `  --${t.name}: ${t.$value};`)
    return [
      '/* Generated: Tailwind v4 theme (primitives) */',
      '@theme {',
      ...lines,
      '}',
      '',
    ].join('\n')
  },
})

const makeSemanticFormat = ({ comment, selector }) => {
  return ({ dictionary }) => {
    const lines = dictionary.allTokens.map((token) => {
      const originalValue = tokenOriginalVal(token)

      // Default to $value for output (user preference)
      let value = `${token.$value}`

      const shouldOutputRef =
        typeof originalValue === 'string' && usesReferences(originalValue)

      if (shouldOutputRef) {
        const unfilteredTokens =
          dictionary.unfilteredTokens ?? dictionary.tokens
        const refs = getReferences(originalValue, unfilteredTokens, {
          usesDtcg: true,
          unfilteredTokens: unfilteredTokens,
        })

        value = originalValue

        refs.forEach((ref) => {
          // `ref.ref` is the reference path array, e.g. ['color','green','500']
          const refPath = Array.isArray(ref.ref) ? ref.ref.join('.') : null
          if (!refPath || !ref.name) return

          // Replace both `{color.green.500}`
          value = value.replaceAll(`{${refPath}}`, `var(--${ref.name})`)
        })
      }

      return `  --${token.name}: ${value};`
    })

    return [
      `/* Generated: semantic (${comment}) */`,
      `${selector} {`,
      ...lines,
      '}',
      '',
    ].join('\n')
  }
}

StyleDictionary.registerFormat({
  name: 'tw/semantic-light',
  format: makeSemanticFormat({ comment: 'light', selector: ':root' }),
})

StyleDictionary.registerFormat({
  name: 'tw/semantic-dark',
  format: makeSemanticFormat({ comment: 'dark', selector: '.dark' }),
})

// -----------------------------
// Factory
// -----------------------------
function makeSD({ source, transforms, files, options }) {
  return new StyleDictionary({
    source,
    preprocessors: ['tokens-studio'],
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        transforms,
        buildPath: BUILD_PATH,
        options,
        files,
      },
    },
    log: {
      warnings: 'warn', // 'warn' | 'error' | 'disabled'
      verbosity: 'default', // 'default' | 'silent' | 'verbose'
      errors: {
        brokenReferences: 'throw', // 'throw' | 'console'
      },
    },
  })
}

// -----------------------------
// Build configs
// -----------------------------
const themeSD = makeSD({
  source: ['tokens/**/primitives.json'],
  transforms: ['name/kebab', 'value/radius-px'],
  files: [
    {
      destination: 'theme.css',
      format: 'tw/v4-theme',
    },
  ],
})

const semanticLightSD = makeSD({
  source: ['tokens/**/primitives.json', 'tokens/semantic.light.json'],
  transforms: ['name/kebab'],
  files: [
    {
      destination: 'semantic.light.css',
      format: 'tw/semantic-light',
      filter: (t) => t.filePath?.endsWith('semantic.light.json'),
    },
  ],
})

// Separate instance to avoid collisions between semantic.light and semantic.dark
const semanticDarkSD = makeSD({
  source: ['tokens/**/primitives.json', 'tokens/semantic.dark.json'],
  transforms: ['name/kebab'],
  files: [
    {
      destination: 'semantic.dark.css',
      format: 'tw/semantic-dark',
      filter: (t) => t.filePath?.endsWith('semantic.dark.json'),
    },
  ],
})

// -----------------------------
// Run
// -----------------------------
await Promise.all([
  themeSD.cleanAllPlatforms(),
  semanticLightSD.cleanAllPlatforms(),
  semanticDarkSD.cleanAllPlatforms(),
])

await Promise.all([
  themeSD.buildAllPlatforms(),
  semanticLightSD.buildAllPlatforms(),
  semanticDarkSD.buildAllPlatforms(),
])
