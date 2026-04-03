import { Link } from 'react-router-dom';
import { Github, MessageCircle, Send, Twitter, Users } from 'lucide-react';
import { footerLinkGroups } from '@/lib/navigation';

type FooterLink = {
  label: string;
  to: string;
};

function FooterNavLink({ link }: { link: FooterLink }) {
  return (
    <Link
      to={link.to}
      className="block w-fit text-sm leading-6 text-white/58 transition-colors hover:text-white"
    >
      {link.label}
    </Link>
  );
}

const socialLinks = [
  {
    href: 'https://x.com/harsshadd',
    icon: Twitter,
    label: 'Twitter',
  },
  {
    href: 'https://github.com/harshad-dhokane',
    icon: Github,
    label: 'GitHub',
  },
  {
    href: 'https://discord.gg/q6cY4QwH',
    icon: MessageCircle,
    label: 'Discord',
  },
  {
    href: 'https://t.me/+919604647941',
    icon: Send,
    label: 'Telegram',
  },
] as const;

export function Footer() {
  return (
    <footer className="pb-10 pt-6 sm:pb-12">
      <div className="page-shell">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[#05070c] px-6 py-8 text-white shadow-[0_34px_100px_-38px_rgba(0,0,0,0.92)] sm:px-8 sm:py-10 lg:px-10">
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.8fr))] xl:gap-8">
            <div className="md:col-span-2 xl:col-span-1 xl:pr-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                    CircleSave
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Management Workspace
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-white/58 sm:text-[15px]">
                A cleaner operating shell for savings circles, StarkZap-powered routing, DCA, lending, and wallet activity on Starknet.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Product</p>
              <div className="flex flex-col items-start gap-2.5">
                {footerLinkGroups.product.map((link) => (
                  <FooterNavLink key={link.label} link={link} />
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Resources</p>
              <div className="flex flex-col items-start gap-2.5">
                {footerLinkGroups.resources.map((link) => (
                  <FooterNavLink key={link.label} link={link} />
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Legal</p>
              <div className="flex flex-col items-start gap-2.5">
                {footerLinkGroups.legal.map((link) => (
                  <FooterNavLink key={link.label} link={link} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-3 border-t border-white/10 pt-6 text-sm text-white/45 md:grid-cols-2 md:items-center">
            <p>Built on Starknet for circles, routing, and operational transparency.</p>
            <p className="md:text-right">© 2026 CircleSave. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
