/**
 * State Layer의 기본 스타일
 *
 * container 위에 위치하는 overlay 레이어(::before)를 통해
 * hover/active/disabled 등의 상태를 표현한다.
 */

// container 위에 위치하는 state layer의 기본 스타일
export const stateLayerBase = [
  // container
  'relative overflow-hidden',

  // state layer (::before)
  'before:content-[""] before:absolute before:inset-0 before:pointer-events-none',
  'before:bg-transparent',
  'before:opacity-0 before:transition-opacity',

  // 상태 발생 시 overlay가 보이도록 (opacity만 공통으로 올림)
  'hover:before:opacity-100',
  'active:before:opacity-100',
] as const

/**
 * 기본 interaction 엔진
 * (색상은 --overlay-hover / --overlay-press로 주입받음)
 */
export const stateLayerInteraction = [
  'hover:before:bg-(--overlay-hover)',
  'active:before:bg-(--overlay-press)',
] as const

/** disabled 시 상호작용 차단 */
export const stateLayerDisabled = ['pointer-events-none'] as const

/**
 * disabled overlay
 * (색상은 --overlay-disabled로 주입받고, 항상 보이게)
 */
export const stateLayerDisabledOverlay = [
  'before:bg-(--overlay-disabled)',
  'before:opacity-100',
] as const
