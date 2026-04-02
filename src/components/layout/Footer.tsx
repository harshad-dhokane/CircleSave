import { Link } from 'react-router-dom';
import { Users, Github, Twitter, MessageCircle, Heart, Send } from 'lucide-react';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const footerLinks = {
  product: [
    { label: 'Discover Circles', href: '/circles' },
    { label: 'Create Circle', href: '/circles/create' },
    { label: 'Swap', href: '/swap' },
    { label: 'Batching', href: '/batching' },
    { label: 'DCA', href: '/dca' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leaderboard', href: '/leaderboard' },
  ],
  resources: [
    { label: 'Help Center', href: '/sdk' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Smart Contracts', href: '/contracts' },
    { label: 'API', href: '/api' },
  ],
  community: [
    { label: 'Discord', href: 'https://discord.gg/q6cY4QwH', external: true },
    { label: 'Twitter', href: 'https://x.com/harsshadd', external: true },
    { label: 'GitHub', href: 'https://github.com/harshad-dhokane', external: true },
    { label: 'Telegram', href: 'https://t.me/+919604647941', external: true },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Risk Disclosure', href: '/risk-disclosure' },
  ],
};

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[15px] text-gray-400 hover:text-white transition-colors font-medium"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link
      to={link.href}
      className="text-[15px] text-gray-400 hover:text-white transition-colors font-medium"
    >
      {link.label}
    </Link>
  );
}

const socialLinks: Array<{ href: string; icon: typeof Twitter; hoverClassName: string; label: string }> = [
  {
    href: 'https://x.com/harsshadd',
    icon: Twitter,
    hoverClassName: 'hover:bg-[#FF6B6B] hover:border-[#FF6B6B]',
    label: 'Twitter',
  },
  {
    href: 'https://github.com/harshad-dhokane',
    icon: Github,
    hoverClassName: 'hover:bg-[#4ECDC4] hover:border-[#4ECDC4]',
    label: 'GitHub',
  },
  {
    href: 'https://discord.gg/q6cY4QwH',
    icon: MessageCircle,
    hoverClassName: 'hover:bg-[#FFE66D] hover:border-[#FFE66D] hover:text-black',
    label: 'Discord',
  },
  {
    href: 'https://t.me/+919604647941',
    icon: Send,
    hoverClassName: 'hover:bg-[#DDA0DD] hover:border-[#DDA0DD]',
    label: 'Telegram',
  },
];

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="page-shell py-16 md:py-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:gap-12 lg:grid-cols-[1.35fr_1.35fr_1fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#FF6B6B] border-[3px] border-white flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black">
                Circle<span className="text-[#FF6B6B]">Save</span>
              </span>
            </Link>
            <p className="max-w-sm text-base leading-relaxed text-gray-400 mb-6">
              Community savings circles plus StarkZap-powered swap, DCA, lending, and shared wallet activity on StarkNet.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className={`w-10 h-10 bg-white/10 border-[2px] border-white/20 flex items-center justify-center transition-colors ${item.hoverClassName}`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-black mb-4 text-[#FF6B6B]">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map(link => (
                <li key={link.label}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-4 text-[#4ECDC4]">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map(link => (
                <li key={link.label}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-4 text-[#FFE66D]">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map(link => (
                <li key={link.label}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-4 text-[#DDA0DD]">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map(link => (
                <li key={link.label}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-base flex items-center gap-1">
            Built with <Heart className="w-4 h-4 text-[#FF6B6B] fill-[#FF6B6B]" /> on StarkNet
          </p>
          <p className="text-gray-400 text-base">
            © 2026 CircleSave. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
