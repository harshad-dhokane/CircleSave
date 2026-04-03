import { Link } from 'react-router-dom';
import { Award, Medal, TrendingUp, Trophy } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useReputation';
import { Button } from '@/components/ui/button';
import { LEVEL_COLORS } from '@/lib/constants';
import type { LeaderboardEntry } from '@/hooks/useReputation';
import { cn } from '@/lib/utils';

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['#B5F36B', '#7CC8FF', '#FFB457'];

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[16px] border border-black/10 bg-white/68 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  const RankIcon = rankIcons[index];
  const rankColor = rankColors[index];

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-[22px] border border-black/10 bg-black/[0.03] p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_64px_-38px_rgba(0,0,0,0.82)]',
        index === 0 && 'xl:-translate-y-1',
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10"
          style={{ backgroundColor: `${rankColor}26`, color: rankColor, boxShadow: `0 0 18px -6px ${rankColor}66` }}
        >
          <RankIcon className="h-5 w-5" />
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ backgroundColor: `${rankColor}18`, borderColor: `${rankColor}55`, color: rankColor }}
        >
          #{index + 1}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-black/10 bg-white/68 font-display text-3xl font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/[0.06]">
          ?
        </div>
        <h3 className="mt-4 font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
          Open ranking spot
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Join, contribute, and complete circles to start showing up in the live reputation leaderboard.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetricTile label="Circles" value="-" />
          <MetricTile label="Score" value="-" />
        </div>
      </div>
    </div>
  );
}

function LeaderCard({
  leader,
  index,
}: {
  leader: LeaderboardEntry;
  index: number;
}) {
  const RankIcon = rankIcons[index];
  const rankColor = rankColors[index];
  const levelColor = LEVEL_COLORS[leader.level] || '#9CA3AF';

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-[22px] border border-black/10 bg-black/[0.03] p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_64px_-38px_rgba(0,0,0,0.82)]',
        index === 0 && 'xl:-translate-y-1',
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10"
          style={{ backgroundColor: `${rankColor}26`, color: rankColor, boxShadow: `0 0 18px -6px ${rankColor}66` }}
        >
          <RankIcon className="h-5 w-5" />
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ backgroundColor: `${rankColor}18`, borderColor: `${rankColor}55`, color: rankColor }}
        >
          #{index + 1}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-black/10 bg-white/68 font-display text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground dark:border-white/10 dark:bg-white/[0.06]">
          {leader.address.slice(2, 4).toUpperCase()}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h3 className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
            {leader.address.slice(0, 6)}...{leader.address.slice(-4)}
          </h3>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ backgroundColor: `${levelColor}20`, borderColor: `${levelColor}45`, color: levelColor }}
          >
            {leader.level}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetricTile label="Circles" value={leader.circlesJoined} />
          <MetricTile label="Score" value={leader.reputationScore} />
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4.5 w-4.5" style={{ color: rankColor }} />
          <span>{leader.reputationScore} REP</span>
        </div>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { leaders, isLoading } = useLeaderboard();
  const topLeaders = Array.from({ length: 3 }, (_, index) => leaders[index] ?? null);

  if (isLoading) {
    return (
      <section className="neo-panel p-5 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-28 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-10 w-64 rounded-2xl bg-black/10 dark:bg-white/10" />
          <div className="grid gap-4 xl:grid-cols-3">
            {topLeaders.map((_, index) => (
              <div
                key={index}
                className="h-72 rounded-[22px] border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/5"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const hasLeaders = leaders.length > 0;

  return (
    <section className="neo-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#7CC8FF]/24 bg-[#7CC8FF]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
            <Trophy className="h-3.5 w-3.5" />
            Community Ranking
          </span>
          <h2 className="mt-3 font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground md:text-[2.15rem]">
            Leaderboard
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {hasLeaders
              ? 'The top wallets are ranked by on-chain circle participation and reputation score from the current deployment.'
              : 'No ranked wallets are available yet. Join, contribute, and complete circles to populate the leaderboard from live contract reads.'}
          </p>
        </div>

        {hasLeaders ? (
          <div className="neo-chip">{leaders.length} ranked wallets</div>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/circles">Open Circles</Link>
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {topLeaders.map((leader, index) => (
          leader ? (
            <LeaderCard key={leader.address} leader={leader} index={index} />
          ) : (
            <PlaceholderCard key={`placeholder-${index}`} index={index} />
          )
        ))}
      </div>
    </section>
  );
}
