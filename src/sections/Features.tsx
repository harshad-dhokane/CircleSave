import { Users, Shield, Zap, TrendingUp, Lock, Globe } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Community First',
    description: 'Join circles with friends, family, or like-minded savers. Build trust together and achieve your financial goals.',
    color: '#FF6B6B',
    rotation: -2,
  },
  {
    icon: Shield,
    title: 'Fully Secure',
    description: 'Collateral-backed participation ensures everyone gets their turn. Smart contracts protect your funds.',
    color: '#4ECDC4',
    rotation: 2,
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Receive your savings pot instantly when it\'s your turn. No waiting, no delays.',
    color: '#FFE66D',
    rotation: -1,
  },
  {
    icon: TrendingUp,
    title: 'Build Reputation',
    description: 'Earn badges and level up as you participate. Your on-chain history speaks for itself.',
    color: '#96CEB4',
    rotation: 1,
  },
  {
    icon: Lock,
    title: 'Collateral Protected',
    description: 'Members lock STRK as security. If someone defaults, their collateral covers the loss.',
    color: '#45B7D1',
    rotation: -2,
  },
  {
    icon: Globe,
    title: 'Swap + DCA Ready',
    description: 'Use StarkZap v2 inside the same app session to swap funds or set recurring DCA orders before or during your circle journey.',
    color: '#DDA0DD',
    rotation: 2,
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 neo-dots-bg opacity-20" />
      
      <div className="page-shell relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="animate-fade-in inline-block px-5 py-2.5 bg-[#FFE66D] border-[3px] border-black mb-4">
            <span className="font-black text-base uppercase tracking-wider">Why CircleSave?</span>
          </div>
          <h2 className="animate-fade-in stagger-1 text-4xl md:text-5xl font-black mb-4">
            Everything You Need to{' '}
            <span className="text-[#FF6B6B]">Save Together</span>
          </h2>
          <p className="animate-fade-in stagger-2 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our platform provides all the tools you need to create, join, and manage 
            savings circles with complete transparency, plus live StarkZap swap and DCA actions in the same wallet flow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`neo-card p-7 relative overflow-hidden group animate-fade-in stagger-${index + 1}`}
              style={{ transform: `rotate(${feature.rotation}deg)` }}
            >
              {/* Icon */}
              <div 
                className="w-16 h-16 border-[3px] border-black flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: feature.color }}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-black mb-3">{feature.title}</h3>
              <p className="text-base text-gray-600 font-medium leading-relaxed">{feature.description}</p>

              {/* Decorative Corner */}
              <div 
                className="absolute -bottom-4 -right-4 w-16 h-16 border-[3px] border-black opacity-20"
                style={{ backgroundColor: feature.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
