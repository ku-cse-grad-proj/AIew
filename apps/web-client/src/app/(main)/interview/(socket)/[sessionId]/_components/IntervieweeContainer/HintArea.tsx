export default function HintArea({
  ...props
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{props.children}</div>
}
