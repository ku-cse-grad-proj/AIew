import { CTASection } from './_components/CtaSection'
import { FeatureShowcase } from './_components/FeatureShowcase'
import { FeaturesSection } from './_components/FeaturesSection'
import { Footer } from './_components/Footer'
import { Header } from './_components/Header'
import { HeroSection } from './_components/HeroSection'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FeatureShowcase />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
