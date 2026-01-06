import { withThemeByClassName } from '@storybook/addon-themes'
import type { Decorator, Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import React from 'react'

export const decorators: Decorator[] = [
  // theme 토글 -> .dark 클래스 추가해 다크모드 적용
  withThemeByClassName({
    themes: {
      light: '',
      dark: 'dark',
    },
    defaultTheme: 'light',
  }),
  // 위 방식은 story에만 적용되고 docs에는 적용이 안되므로,
  // .docs-story에 배경색을 강제로 넣어 다크모드 적용
  (Story) => {
    if (typeof document !== 'undefined') {
      const STYLE_ID = 'sb-docs-story-bg'
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style')
        style.id = STYLE_ID
        style.textContent = `.docs-story { background-color: var(--color-surface-primary) !important; }`
        document.head.appendChild(style)
      }
    }

    return React.createElement(Story)
  },
]

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
