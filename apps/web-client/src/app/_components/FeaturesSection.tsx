import {
  FileText,
  BarChart3,
  LayoutDashboard,
  List,
  TrendingUp,
  Smile,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Personalized Questions',
    description:
      'Get customized interview questions based on your resume and portfolio for targeted practice.',
  },
  {
    icon: BarChart3,
    title: 'Detailed Reports',
    description:
      'Receive comprehensive feedback including overall performance, question-by-question analysis, and emotional metrics.',
  },
  {
    icon: LayoutDashboard,
    title: 'Performance Dashboard',
    description:
      'Track your recent interviews, reports, and trends in one centralized dashboard.',
  },
  {
    icon: List,
    title: 'Report History',
    description:
      'Access and review all your previous interview reports with easy search and filtering.',
  },
  {
    icon: TrendingUp,
    title: 'Visual Progress Tracking',
    description:
      'See your improvement over time with interactive graphs and score trends.',
  },
  {
    icon: Smile,
    title: 'Emotion Tracking',
    description:
      'Analyze your facial expressions during interviews to understand your emotional state and receive insights through visual graphs.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-[80px] px-[24px] bg-white">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-[64px]">
          <h2 className="mb-[16px] text-[var(--color-primary)] text-[36px] font-[700] leading-[1.3]">
            Everything You Need to Succeed
          </h2>
          <p
            className="text-[var(--color-neutral-subtext)] max-w-[672px] mx-auto"
            style={{ fontSize: '1.125rem' }}
          >
            Our AI-powered platform provides comprehensive tools to help you
            prepare for any interview with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[32px]">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-neutral-background p-[32px] rounded-xl hover:shadow-[var(--shadow-box)] transition-shadow"
              >
                <div className="w-[56px] h-[56px] bg-[var(--color-primary)] rounded-lg flex items-center justify-center mb-[20px]">
                  <Icon className="w-[28px] h-[28px] text-white" />
                </div>
                <h3 className="mb-[12px] text-[var(--color-primary)] text-[24px] font-[600] leading-[1.4]">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-neutral-subtext)]">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
