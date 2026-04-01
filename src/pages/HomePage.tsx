import { Hero } from '@/sections/Hero';
import { StarkZapShowcase } from '@/sections/StarkZapShowcase';
import { Features } from '@/sections/Features';
import { HowItWorks } from '@/sections/HowItWorks';
import { Leaderboard } from '@/sections/Leaderboard';
import { CircleCard } from '@/components/circles/CircleCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCircles } from '@/hooks/useCircle';

export function HomePage() {
  const { circles } = useCircles();
  const featuredCircles = circles.slice(0, 3);

  return (
    <div>
      <Hero />
      <StarkZapShowcase />
      <Features />
      <HowItWorks />
      
      {/* Featured Circles Section */}
      <section className="py-24 bg-[#FEFAE0] relative">
        <div className="absolute inset-0 neo-dots-bg opacity-20" />
        
        <div className="page-shell relative z-10">
          <div className="animate-fade-in flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B6B] border-[3px] border-black mb-4">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="font-black text-base uppercase tracking-wider text-white">Featured</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black">
                Trending <span className="text-[#FF6B6B]">Circles</span>
              </h2>
            </div>
            <Link to="/circles">
              <Button 
                variant="outline" 
                className="hidden sm:flex items-center gap-2 border-[3px] border-black font-black text-base shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all px-6 py-3"
              >
                View All <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCircles.map((circle, index) => (
              <div key={circle.id} className={`animate-fade-in stagger-${index + 2}`}>
                <CircleCard circle={circle} />
              </div>
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link to="/circles">
              <Button 
                variant="outline" 
                className="border-[3px] border-black font-black text-base"
              >
                View All Circles <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Leaderboard />
      
      {/* CTA Section */}
      <section className="py-24 bg-[#4ECDC4] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="page-shell relative z-10">
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute left-10 top-10 h-16 w-16 rotate-12 bg-white/20" />
            <div className="absolute right-12 bottom-10 h-24 w-24 -rotate-12 bg-white/20" />
            <div className="absolute right-1/4 top-1/2 h-12 w-12 rotate-45 bg-white/20" />
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h2 className="animate-fade-in text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 text-stroke">
              Ready to Save, Swap, and Automate?
            </h2>
            <p className="animate-fade-in stagger-1 text-xl md:text-2xl text-white/90 mb-10 font-medium">
              Start with a circle, open a live swap, or create a DCA order from the same
              connected wallet and keep every action visible on-chain.
            </p>
            <div className="animate-fade-in stagger-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/circles">
                <Button className="neo-button-primary bg-white text-black hover:bg-gray-100 text-lg px-10 py-7">
                  Explore Circles
                </Button>
              </Link>
              <Link to="/swap">
                <Button className="neo-button-accent text-lg px-10 py-7">
                  Open Swap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
