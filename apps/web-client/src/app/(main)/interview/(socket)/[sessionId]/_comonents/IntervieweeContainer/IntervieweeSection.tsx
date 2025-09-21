export default function IntervieweeSection({
  children,
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) {
  return (
    <section
      className={`w-full h-full p-24 flex flex-col bg-neutral-card rounded-[20px] shadow-box ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}
