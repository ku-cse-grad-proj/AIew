import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="py-[80px] px-[24px] bg-white">
      <div className="max-w-[896px] mx-auto text-center">
        <h2 className="mb-[24px] text-[var(--color-primary)] text-[36px] font-[700] leading-[1.3]">
          Ready to Ace Your Next Interview?
        </h2>
        <p
          className="mb-[32px] text-[var(--color-neutral-subtext)]"
          style={{ fontSize: '1.125rem' }}
        >
          Start practicing today with personalized questions and AI-powered
          feedback. Join thousands of professionals who have improved their
          interview skills.
        </p>
        <div className="flex flex-col sm:flex-row gap-[16px] justify-center">
          <Link
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-[32px] py-[16px] rounded-lg inline-flex items-center justify-center gap-[8px] transition-colors shadow-lg"
            href={'/dashboard'}
          >
            Start Interview
            <ArrowRight className="w-[20px] h-[20px]" />
          </Link>
        </div>
      </div>
    </section>
  )
}
