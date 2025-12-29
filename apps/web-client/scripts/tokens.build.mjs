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
const tokenType = (t) =>
  t.original?.$type ?? t.original?.type ?? t.$type ?? t.type

const FONT_WEIGHT_VALUE_MAP = {
  regular: 400,
  medium: 500,
  bold: 700,
  extrabold: 800,
}

const normalizeWeightKey = (value) =>
  String(value).replace(/\s+/g, '').toLowerCase()

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

// Tailwind typography naming (map from name/kebab output)
StyleDictionary.registerTransform({
  name: 'name/typography-tailwind',
  type: 'name',
  filter: (token) => token.filePath?.endsWith('typography.json'),
  transform: (token) => {
    const name = token.name ?? ''

    if (name.startsWith('font-family-')) {
      return name.replace('font-family-', 'font-')
    }

    if (name.startsWith('font-size-')) {
      return name.replace('font-size-', 'text-')
    }

    if (name.startsWith('font-line-height-')) {
      const size = name.slice('font-line-height-'.length)
      return `leading-${size}`
    }

    if (name.startsWith('font-letter-spacing-')) {
      const size = name.slice('font-letter-spacing-'.length)
      return `tracking-${size}`
    }

    return name
  },
})

// Add px to numeric typography sizes/line-heights
StyleDictionary.registerTransform({
  name: 'value/typography-px',
  type: 'value',
  filter: (token) => {
    const group = token.path?.[1]
    return (
      token.filePath?.endsWith('typography.json') &&
      (group === 'size' || group === 'line-height') &&
      typeof tokenVal(token) === 'number'
    )
  },
  transform: (token) => `${tokenVal(token)}px`,
})

// Map typography font-weight labels to numeric values
StyleDictionary.registerTransform({
  name: 'value/font-weight-number',
  type: 'value',
  filter: (token) =>
    token.filePath?.endsWith('typography.json') && token.path?.[1] === 'weight',
  transform: (token) => {
    const key = normalizeWeightKey(tokenVal(token))
    return FONT_WEIGHT_VALUE_MAP[key] ?? tokenVal(token)
  },
})

// -----------------------------
// Formats
// -----------------------------
StyleDictionary.registerFormat({
  name: 'tw/v4-theme',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.map(
      (token) => `  --${token.name}: ${token.$value};`,
    )
    return [
      '/* Generated: Tailwind v4 theme (primitives, typography) */',
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

StyleDictionary.registerFormat({
  name: 'tw/semantic-inline',
  format: ({ dictionary }) => {
    const semanticColorTokens = dictionary.allTokens.filter(
      (t) =>
        t.filePath?.endsWith('semantic.light.json') && tokenType(t) === 'color',
    )

    const lines = semanticColorTokens
      .map((token) => ({
        key: `--color-${token.name}`,
        line: `  --color-${token.name}: var(--${token.name});`,
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((x) => x.line)

    return [
      '/* Generated: Tailwind v4 semantic inline aliases */',
      '@theme inline {',
      ...lines,
      '}',
      '',
    ].join('\n')
  },
})

StyleDictionary.registerFormat({
  name: 'tw/components-vars',
  format: ({ dictionary }) => {
    const unfilteredTokens = dictionary.unfilteredTokens ?? dictionary.tokens

    const lines = dictionary.allTokens
      .map((token) => {
        const originalValue = tokenOriginalVal(token)
        let value = token.$value

        const hasRef =
          typeof originalValue === 'string' && usesReferences(originalValue)

        if (hasRef) {
          const refs = getReferences(originalValue, unfilteredTokens, {
            usesDtcg: true,
            unfilteredTokens,
          })

          let v = originalValue
          refs.forEach((ref) => {
            const refPath = Array.isArray(ref.ref) ? ref.ref.join('.') : null
            if (!refPath) return
            v = v.replaceAll(`{${refPath}}`, `var(--${ref.name})`)
          })
          value = v
        } else if (typeof value === 'number') {
          // Components layout numbers should be CSS lengths
          value = `${value}px`
        }

        return {
          key: `--${token.name}`,
          line: `  --${token.name}: ${value};`,
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((x) => x.line)

    return [
      '/* Generated: component variables (consume theme & semantic only) */',
      ':root {',
      ...lines,
      '}',
      '',
    ].join('\n')
  },
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
  source: ['tokens/**/primitives.json', 'tokens/typography.json'],
  transforms: [
    'name/kebab',
    'name/typography-tailwind',
    'value/radius-px',
    'value/typography-px',
    'value/font-weight-number',
  ],
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

const semanticInlineSD = makeSD({
  source: ['tokens/**/primitives.json', 'tokens/semantic.light.json'],
  transforms: ['name/kebab'],
  files: [
    {
      destination: 'theme.inline.css',
      format: 'tw/semantic-inline',
      filter: (t) => t.filePath?.endsWith('semantic.light.json'),
    },
  ],
})

const componentsVarsSD = makeSD({
  // Include dependencies so references can be resolved.
  source: [
    'tokens/**/primitives.json',
    'tokens/typography.json',
    'tokens/semantic.light.json',
    'tokens/components.json',
  ],
  transforms: ['name/kebab', 'name/typography-tailwind'],
  files: [
    {
      destination: 'components.vars.css',
      format: 'tw/components-vars',
      filter: (t) => t.filePath?.endsWith('components.json'),
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
  semanticInlineSD.cleanAllPlatforms(),
  componentsVarsSD.cleanAllPlatforms(),
])

await Promise.all([
  themeSD.buildAllPlatforms(),
  semanticLightSD.buildAllPlatforms(),
  semanticDarkSD.buildAllPlatforms(),
  semanticInlineSD.buildAllPlatforms(),
  componentsVarsSD.buildAllPlatforms(),
])
