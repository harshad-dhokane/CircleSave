import { Link } from 'react-router-dom';
import type { Circle } from '@/types';
import { Button } from '@/components/ui/button';
import { Wallet, Users, Lock, ArrowRight, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { 
  formatAmount, 
  getCategoryColor, 
  getCategoryLabel,
} from '@/lib/constants';

interface CircleCardProps {
  circle: Circle;
}

export function CircleCard({ circle }: CircleCardProps) {
  const progress = (circle.currentMembers / circle.maxMembers) * 100;
  const spotsLeft = circle.maxMembers - circle.currentMembers;
  const collateralAmount = (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
  const categoryColor = getCategoryColor(circle.category);
  const categoryLabel = getCategoryLabel(circle.category);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-400 text-black';
      case 'COMPLETED': return 'bg-blue-400 text-white';
      case 'FAILED': return 'bg-red-400 text-white';
      default: return 'bg-yellow-400 text-black';
    }
  };

  return (
    <div className="neo-card group flex h-full min-w-0 flex-col overflow-hidden p-6">
      <div
        className="mb-5 h-3 w-24 border-[2px] border-black transition-all duration-200 group-hover:w-32"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border-[2px] border-black"
          style={{ backgroundColor: categoryColor, color: '#1a1a1a' }}
        >
          {categoryLabel}
        </div>
        <div className={`px-3 py-1.5 text-xs font-black border-[2px] border-black uppercase tracking-wider ${getStatusStyle(circle.status)}`}>
          {circle.status}
        </div>
      </div>

      <h3 className="mb-2 text-[1.7rem] font-black leading-tight transition-colors group-hover:text-[#FF6B6B]">
        {circle.name}
      </h3>

      <p className="mb-2 text-[15px] font-medium text-gray-600">
        by <span className="font-bold text-black">{circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}</span>
      </p>

      <p className="mb-5 line-clamp-2 text-[15px] leading-relaxed text-black/70">
        {circle.description || `A ${categoryLabel.toLowerCase()} savings circle with ${circle.maxMembers} slots and on-chain collateral coordination.`}
      </p>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center min-w-0">
          <Wallet className="w-5 h-5 mx-auto mb-1 text-[#4ECDC4]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">Monthly</p>
          <p className="mt-1 text-[1.1rem] font-black leading-tight break-words">{formatAmount(circle.monthlyAmount)}</p>
        </div>
        <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center min-w-0">
          <Users className="w-5 h-5 mx-auto mb-1 text-[#FF6B6B]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">Members</p>
          <p className="mt-1 text-[1.1rem] font-black leading-tight">{circle.currentMembers}/{circle.maxMembers}</p>
        </div>
        <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center min-w-0">
          <Lock className="w-5 h-5 mx-auto mb-1 text-[#FFE66D]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">Collateral</p>
          <p className="mt-1 text-[1.1rem] font-black leading-tight break-words">{formatAmount(collateralAmount)}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3">
        <div className="flex items-center justify-between gap-3 border-[2px] border-black bg-white px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#4ECDC4]" />
            <span className="text-xs font-black uppercase tracking-[0.08em] leading-tight">Why it stands out</span>
          </div>
          <span className="shrink-0 text-sm font-black">{circle.collateralRatio / 100}x cover</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-[2px] border-black bg-white px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#FF6B6B]" />
            <span className="text-xs font-black uppercase tracking-[0.08em] leading-tight">Join pressure</span>
          </div>
          <span className="shrink-0 text-sm font-black">
            {spotsLeft === 0 ? 'Filled' : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`}
          </span>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-sm font-bold">
          <span>Membership Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="neo-progress">
          <div
            className="neo-progress-bar bg-[#4ECDC4]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {spotsLeft > 0 && spotsLeft <= 3 && (
        <div className="mb-5 flex items-center gap-2 border-[2px] border-black bg-[#FF6B6B] px-3 py-2.5">
          <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
          <span className="text-base font-black text-white">
            Only {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!
          </span>
        </div>
      )}

      <div className="mt-auto">
        <Link to={`/circles/${circle.id}`}>
          <Button
            className={`w-full font-black border-[2px] border-black transition-all text-[15px] py-2.5
              ${spotsLeft === 0 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-[#FF6B6B] text-white hover:bg-[#ff5252] shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5'
              }`}
            disabled={spotsLeft === 0}
          >
            {spotsLeft === 0 ? (
              'Circle Full'
            ) : spotsLeft <= 2 ? (
              <>
                Join Now <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                View Details <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}
