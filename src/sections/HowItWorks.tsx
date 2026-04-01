import { Wallet, Users, ArrowRightLeft, FileText, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Wallet,
    title: 'Connect Once',
    description: 'Connect with Cartridge, Argent, or Braavos once in the header. That same account powers circles, swap, DCA, lending, and logs.',
    color: '#FF6B6B',
  },
  {
    number: '02',
    icon: Users,
    title: 'Join or Create',
    description: 'Browse existing circles or create your own. Set the monthly amount, member count, and collateral ratio from one shared app flow.',
    color: '#4ECDC4',
  },
  {
    number: '03',
    icon: ArrowRightLeft,
    title: 'Swap or Schedule DCA',
    description: 'Use StarkZap v2 routes inside CircleSave to swap assets or create recurring DCA orders without leaving your connected wallet session.',
    color: '#FFE66D',
  },
  {
    number: '04',
    icon: FileText,
    title: 'Track Everything',
    description: 'Circle activity and StarkZap actions are visible in profile and logs, with transaction status and Voyager links for quick verification.',
    color: '#96CEB4',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-[#FEFAE0] relative overflow-hidden">
      <div className="page-shell relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="animate-fade-in inline-block px-5 py-2.5 bg-[#4ECDC4] border-[3px] border-black mb-4">
            <span className="font-black text-base uppercase tracking-wider text-white">How It Works</span>
          </div>
          <h2 className="animate-fade-in stagger-1 text-4xl md:text-5xl font-black mb-4">
            Start Saving in{' '}
            <span className="text-[#4ECDC4]">4 Simple Steps</span>
          </h2>
          <p className="animate-fade-in stagger-2 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Getting started with CircleSave is easy. Follow these steps to move from community savings into
            live StarkZap actions without switching accounts or tools.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className={`relative animate-fade-in stagger-${index + 3}`}>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(100%-0.35rem)] top-16 z-0 hidden h-[3px] w-10 bg-black lg:block xl:w-12">
                  <ArrowRight className="absolute -right-1 -top-2.5 h-6 w-6 text-black" />
                </div>
              )}
              
              {/* Step Card */}
              <div className="neo-card p-7 relative z-10 h-full">
                {/* Step Number */}
                <div 
                  className="absolute -top-3 -left-3 w-12 h-12 border-[3px] border-black flex items-center justify-center font-black text-lg"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-white">{step.number}</span>
                </div>

                {/* Icon */}
                <div 
                  className="w-16 h-16 border-[3px] border-black flex items-center justify-center mb-5 mt-4 mx-auto"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black text-center mb-3">{step.title}</h3>
                <p className="text-gray-600 font-medium text-center text-base leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="animate-fade-in stagger-7 text-center mt-12">
          <p className="text-lg font-medium text-gray-600 mb-4">
            Ready to start your savings journey?
          </p>
          <a 
            href="/circles" 
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#FF6B6B] text-white font-black text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
