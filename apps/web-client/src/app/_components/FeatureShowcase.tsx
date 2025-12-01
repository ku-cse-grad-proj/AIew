'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

const showcases = [
  {
    tag: 'Dashboard',
    title: 'Comprehensive Performance Dashboard',
    description:
      "Monitor your recent interviews, reports, and performance trends at a glance. Understand how you're using the service and track your progress over time.",
    images: ['/landing/dashboard.svg'],
    reverse: false,
  },
  {
    tag: 'Personalized Practice',
    title: 'AI-Powered Custom Questions',
    description:
      'Create interviews tailored to your profile. Upload your resume and portfolio to receive questions specifically designed for your background and target role.',
    images: ['/landing/interview_create.svg', '/landing/interview.svg'],
    reverse: true,
  },
  {
    tag: 'Detailed Analysis',
    title: 'In-Depth Feedback Reports',
    description:
      'Get comprehensive reports for every completed interview including overall feedback, question-by-question scoring, performance graphs, and emotional analysis from video recordings.',
    images: [
      '/landing/reports.svg',
      '/landing/reports_question.svg',
      '/landing/reports_question_graph.svg',
    ],
    reverse: false,
  },
]

function FeatureItem({
  showcase,
}: {
  showcase: (typeof showcases)[0]
  index: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    <div
      ref={containerRef}
      className="h-auto relative"
      style={
        {
          height: `${Math.max(1.5, showcase.images.length) * 100}vh`,
        } as React.CSSProperties
      }
    >
      <div className="sticky top-0 h-screen flex flex-col lg:flex-row items-center overflow-hidden">
        <div className="max-w-[1280px] mx-auto w-full h-full flex flex-col lg:flex-row">
          <div
            className={cn(
              'flex flex-col lg:flex-row gap-[24px] lg:gap-[48px] items-center w-full h-full justify-center',
              showcase.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row',
            )}
          >
            {/* Text Content */}
            <div className="flex-none lg:flex-1 w-full px-[24px] pt-[80px] lg:pt-0 z-10">
              <div className="inline-block px-[16px] py-[6px] bg-[var(--color-secondary)] text-white rounded-full mb-[16px]">
                {showcase.tag}
              </div>
              <h2 className="mb-[16px] lg:mb-[24px] text-[var(--color-primary)] text-[28px] lg:text-[36px] font-[700] leading-[1.3]">
                {showcase.title}
              </h2>
              <p className="text-[var(--color-neutral-subtext)] text-[1rem] lg:text-[1.125rem]">
                {showcase.description}
              </p>
            </div>

            {/* Image Stack */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center px-[24px] pb-[24px] lg:pb-0">
              {/* Ghost Element for Height */}
              <div className="invisible relative z-[-1] w-full flex justify-center">
                <div className="relative overflow-hidden rounded-lg w-full max-w-[600px] shadow-[var(--shadow-box)]">
                  <img
                    src={showcase.images[0]}
                    alt="ghost"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {showcase.images.map((img, imgIndex) => {
                const step = 1 / showcase.images.length
                const start = step * imgIndex
                const end = step * (imgIndex + 1)

                // Determine opacity based on index
                let opacity

                if (showcase.images.length === 1) {
                  // Single image: Always visible
                  opacity = useTransform(scrollYProgress, [0, 1], [1, 1])
                } else if (imgIndex === 0) {
                  // First image: Starts visible, fades out as second image enters fully
                  // It stays visible for its duration, then fades out
                  opacity = useTransform(
                    scrollYProgress,
                    [start, end - step * 0.2, end],
                    [1, 1, 0],
                  )
                } else if (imgIndex === showcase.images.length - 1) {
                  // Last image: Fades in, then stays visible
                  opacity = useTransform(
                    scrollYProgress,
                    [start, start + step * 0.2],
                    [0, 1],
                  )
                } else {
                  // Middle images: Fade in, stay, fade out
                  opacity = useTransform(
                    scrollYProgress,
                    [start, start + step * 0.2, end - step * 0.2, end],
                    [0, 1, 1, 0],
                  )
                }

                return (
                  <motion.div
                    key={imgIndex}
                    style={{ opacity }}
                    className="absolute inset-0 flex items-center justify-center px-[24px]"
                  >
                    <div className="relative overflow-hidden rounded-lg w-full max-w-[600px] shadow-[var(--shadow-box)]">
                      <img
                        src={img}
                        alt={`${showcase.title} - view ${imgIndex + 1}`}
                        className="w-full h-auto"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeatureShowcase() {
  return (
    <section id="how-it-works" className="bg-[var(--color-neutral-background)]">
      {showcases.map((showcase, index) => (
        <FeatureItem key={index} showcase={showcase} index={index} />
      ))}
    </section>
  )
}
