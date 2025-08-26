interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  text: string
  children: React.ReactNode
}

export function Label({
  text,
  children,
  className = '',
  ...props
}: LabelProps) {
  return (
    <label className={`block  ${className}`} {...props}>
      <span className="block text-black leading-normal">{text}</span>
      {children}
    </label>
  )
}
