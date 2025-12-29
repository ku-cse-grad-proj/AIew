import { register } from '@tokens-studio/sd-transforms'
import StyleDictionary from 'style-dictionary'

register(StyleDictionary)

// ------------------------------------------------------------------
// Transform: add px to radius (rounded) values
// ------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'value/radius-px',
  type: 'value',
  filter: (token) => {
    const isRadiusPath = token.path?.[0] === 'radius'
    return isRadiusPath && typeof token.$value === 'number'
  },
  transform: (token) => `${token.$value}px`,
})

// ------------------------------------------------------------------
// Format: Tailwind v4 @theme (primitives)
// ------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: 'tw/v4-theme-primitives',
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

const sd = new StyleDictionary({
  source: ['tokens/**/primitives.json'],
  preprocessors: ['tokens-studio'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      transforms: ['name/kebab', 'value/radius-px'],
      buildPath: 'src/styles/generated/',
      files: [
        {
          destination: 'theme.css',
          format: 'tw/v4-theme-primitives',
        },
      ],
    },
  },
})

await sd.cleanAllPlatforms()
await sd.buildAllPlatforms()
