import type { VariantProps } from 'class-variance-authority'
import Link from 'next/link'

import { buttonLinkStyleDefaults, buttonLinkStyles } from './ButtonLink.styles'

import { cn } from '@/lib/utils'

export interface ButtonLinkProps extends VariantProps<typeof buttonLinkStyles> {
  href: string
  children: React.ReactNode
  className?: string
}

export function ButtonLink({
  href,
  children = 'Button Link',
  variant = buttonLinkStyleDefaults.variant,
  size = buttonLinkStyleDefaults.size,
  disabled = buttonLinkStyleDefaults.disabled,
  className,
}: ButtonLinkProps) {
  const styles = cn(buttonLinkStyles({ variant, size, disabled }), className)

  // disabled 링크는 <span>으로 렌더링
  if (disabled) {
    return (
      <span className={styles} aria-disabled="true">
        {children}
      </span>
    )
  }

  return (
    <Link href={href} className={styles}>
      <span className="z-10">{children}</span>
    </Link>
  )
}
