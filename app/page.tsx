import MarketingCards from '@/components/homepage/marketing-cards';
import Pricing from '@/components/homepage/pricing';
import SideBySide from '@/components/homepage/side-by-side';
import PageWrapper from '@/components/wrapper/page-wrapper';
import FloatingCTA from '@/components/homepage/floating-cta';
import FAQ from '@/components/homepage/faq';
import HeroSection from '@/components/homepage/hero-section';
import { SecurityFeatures } from '@/components/homepage/security-features';

export default function Home() {
  return (
    <PageWrapper>
      <section id="hero" className="w-full min-h-screen pt-24">
        <HeroSection />
      </section>
      
      <section id="benefits" className="flex py-24 md:py-16 w-full justify-center items-center px-4 sm:px-6">
        <SideBySide />
      </section>
      
      <section id="tech-stack" className="flex flex-col w-full justify-center items-center px-4 sm:px-6">
        <MarketingCards />
      </section>
      
      <section id="security" className="w-full py-24 md:py-16">
        <SecurityFeatures />
      </section>
      
      <section id="pricing" className="flex justify-center items-center w-full py-24 md:py-16 min-h-[600px] px-4 sm:px-6">
        <div className="w-full max-w-6xl mx-auto">
          <Pricing />
        </div>
      </section>
      
      <section id="faq" className="flex justify-center items-center w-full py-24 md:py-24 px-4 sm:px-6">
        <FAQ />
      </section>
      
      <FloatingCTA />
    </PageWrapper>
  );
}
