export function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-[var(--color-neutral-inverse)] py-[32px] px-[24px]">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-neutral-background text-4xl font-bold">
            AIew
          </span>
        </div>

        <p className="opacity-80">
          © 2025 KONKUK UNIVERSITY. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
