import { useLeaderboard } from '@/hooks/useReputation';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { LEVEL_COLORS } from '@/lib/constants';
import type { LeaderboardEntry } from '@/hooks/useReputation';

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function Leaderboard() {
  const { leaders, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <section className="py-24 bg-white">
        <div className="page-shell">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 w-1/3 mx-auto" />
            <div className="h-4 bg-gray-200 w-1/2 mx-auto" />
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (leaders.length === 0) {
    return (
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 neo-stripes opacity-50" />
        <div className="page-shell relative z-10">
          <div className="text-center mb-16">
            <div className="animate-fade-in inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] border-[3px] border-black mb-4">
              <Trophy className="w-5 h-5" />
              <span className="font-black text-base uppercase tracking-wider">Live On-Chain Ranking</span>
            </div>
            <h2 className="animate-fade-in stagger-1 text-4xl md:text-5xl font-black mb-4">
              Community{' '}
              <span className="text-[#FFD700]">Leaderboard</span>
            </h2>
            <p className="animate-fade-in stagger-2 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              No ranked wallets are available yet because this Sepolia deployment has not accumulated enough circle activity.
              Join, contribute, and create circles to populate the leaderboard from live contract reads.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((rank, index) => {
              const RankIcon = rankIcons[rank - 1];
              const rankColor = rankColors[rank - 1];
              
              return (
                <div 
                  key={rank}
                  className={`neo-card p-7 relative animate-scale-in stagger-${index + 3}`}
                  style={{ 
                    transform: rank === 1 ? 'scale(1.05)' : 'scale(1)',
                    zIndex: rank === 1 ? 10 : 1 
                  }}
                >
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 border-[3px] border-black flex items-center justify-center"
                    style={{ backgroundColor: rankColor }}
                  >
                    <RankIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="mt-8 mb-4 flex justify-center">
                    <div className="w-24 h-24 border-[3px] border-black bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl font-black text-gray-400">?</span>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-black text-gray-400">This could be you</h3>
                    <span className="inline-block px-4 py-1.5 text-sm font-black border-[2px] border-gray-300 mt-2 bg-gray-100">
                      Join a Circle
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center">
                      <p className="text-xs font-bold text-gray-600">Circles</p>
                      <p className="text-xl font-black text-gray-400">—</p>
                    </div>
                    <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center">
                      <p className="text-xs font-bold text-gray-600">Score</p>
                      <p className="text-xl font-black text-gray-400">—</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 neo-stripes opacity-50" />
      <div className="page-shell relative z-10">
        <div className="text-center mb-16">
          <div className="animate-fade-in inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] border-[3px] border-black mb-4">
            <Trophy className="w-5 h-5" />
            <span className="font-black text-base uppercase tracking-wider">Top Savers</span>
          </div>
          <h2 className="animate-fade-in stagger-1 text-4xl md:text-5xl font-black mb-4">
            Community{' '}
            <span className="text-[#FFD700]">Leaderboard</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {leaders.slice(0, 3).map((leader: LeaderboardEntry, index: number) => {
            const RankIcon = rankIcons[index];
            const rankColor = rankColors[index];
            const levelColor = LEVEL_COLORS[leader.level] || '#9CA3AF';
            
            return (
              <div key={leader.address} className={`neo-card p-7 relative animate-scale-in stagger-${index + 2}`}
                style={{ transform: index === 0 ? 'scale(1.05)' : 'scale(1)', zIndex: index === 0 ? 10 : 1 }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 border-[3px] border-black flex items-center justify-center"
                  style={{ backgroundColor: rankColor }}>
                  <RankIcon className="w-7 h-7 text-white" />
                </div>
                <div className="mt-8 mb-4 flex justify-center">
                  <div className="w-24 h-24 border-[3px] border-black bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl font-black">
                      {leader.address.slice(2, 4)}
                    </span>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-black">{leader.address.slice(0, 6)}...{leader.address.slice(-4)}</h3>
                  <span className="inline-block px-4 py-1.5 text-sm font-black border-[2px] border-black mt-2"
                    style={{ backgroundColor: levelColor }}>
                    {leader.level}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center">
                    <p className="text-xs font-bold text-gray-600">Circles</p>
                    <p className="text-xl font-black">{leader.circlesJoined}</p>
                  </div>
                  <div className="bg-[#FEFAE0] border-[2px] border-black p-3 text-center">
                    <p className="text-xs font-bold text-gray-600">Score</p>
                    <p className="text-xl font-black">{leader.reputationScore}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#4ECDC4]" />
                  <span className="font-bold text-base">{leader.reputationScore} REP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
