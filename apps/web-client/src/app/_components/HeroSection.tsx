'use client'

import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-primary)] text-[var(--color-neutral-inverse)] py-[96px] px-[24px]">
      <div className="max-w-[1280px] mx-auto">
        <div className="max-w-[768px]">
          <h1 className="mb-[24px] text-[48px] font-[700] leading-[1.2]">
            Master Your Interview Skills with AI-Powered Practice
          </h1>
          <p className="mb-[32px] opacity-90" style={{ fontSize: '1.25rem' }}>
            Personalized questions, detailed feedback, and emotional analysis to
            help you ace your next interview.
          </p>
          <Link
            href="/dashboard"
            className="bg-[var(--color-secondary)] hover:bg-[var(--color-secondary-hover)] text-white px-[32px] py-[16px] rounded-lg inline-flex items-center gap-[8px] transition-colors shadow-lg"
          >
            Get Started
            <ArrowRight className="w-[20px] h-[20px]" />
          </Link>
        </div>
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Blob */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-[var(--color-secondary)] rounded-full blur-[120px] opacity-20 mix-blend-screen"
        />

        {/* Secondary Blob */}
        <motion.div
          animate={{
            scale: [1.2, 0.8, 1.2],
            x: [0, 100, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[100px] opacity-20 mix-blend-screen"
        />

        {/* Accent Blob */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 60, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
          className="absolute -bottom-[20%] right-[20%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] opacity-20 mix-blend-screen"
        />
      </div>
    </section>
  )
}
