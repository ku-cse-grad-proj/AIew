import { cva, type VariantProps } from 'class-variance-authority'

import {
  stateLayerBase,
  stateLayerDisabled,
  stateLayerDisabledOverlay,
  stateLayerInteraction,
} from '../stateLayer'

export const buttonLinkStyleDefaults = {
  variant: 'primary',
  size: 'md',
  disabled: false,
} as const

export const buttonLinkStyles = cva(
  [
    // base
    'inline-flex items-center justify-center select-none',
    'transition-colors',

    // state layer 기본 스타일
    ...stateLayerBase,
    // interaction 엔진
    ...stateLayerInteraction,
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-(--button-link-primary-bg)',
          'text-(--button-link-primary-text)',

          // StateLayer의 hover/active/disabled 색상 변수들을 override
          '[--overlay-hover:var(--button-link-primary-hover)]',
          '[--overlay-press:var(--button-link-primary-press)]',
          '[--overlay-disabled:var(--button-link-primary-disabled)]',
        ],

        secondary: [
          'bg-(--button-link-secondary-bg)',
          'text-(--button-link-secondary-text)',

          '[--overlay-hover:var(--button-link-secondary-hover)]',
          '[--overlay-press:var(--button-link-secondary-press)]',
          '[--overlay-disabled:var(--button-link-secondary-disabled)]',
        ],

        outline: [
          'ring-1 ring-inset',
          'ring-(--button-link-outline-text)',

          'bg-(--button-link-outline-bg)',
          'text-(--button-link-outline-text)',

          'hover:ring-0',
          'active:ring-0',

          '[--overlay-hover:var(--button-link-outline-hover)]',
          '[--overlay-press:var(--button-link-outline-press)]',
          '[--overlay-disabled:var(--button-link-outline-disabled)]',
        ],
      },

      size: {
        md: [
          'h-(--button-link-sizes-md-height)',
          'px-(--button-link-sizes-md-padding-x)',
          'py-(--button-link-sizes-md-padding-y)',

          'rounded-(--button-link-sizes-md-radius)',
          'before:rounded-(--button-link-sizes-md-radius)',

          'text-(length:--button-link-sizes-md-font-size)',
          'font-(--button-link-sizes-md-font-weight)',
        ],

        lg: [
          'h-(--button-link-sizes-lg-height)',
          'px-(--button-link-sizes-lg-padding-x)',
          'py-(--button-link-sizes-lg-padding-y)',

          'rounded-(--button-link-sizes-lg-radius)',
          'before:rounded-(--button-link-sizes-lg-radius)',

          'text-(length:--button-link-sizes-lg-font-size)',
          'font-(--button-link-sizes-lg-font-weight)',
        ],
      },

      disabled: {
        true: [...stateLayerDisabled, ...stateLayerDisabledOverlay],
        false: '',
      },
    },

    defaultVariants: buttonLinkStyleDefaults,
  },
)

export type ButtonLinkStyleProps = VariantProps<typeof buttonLinkStyles>
