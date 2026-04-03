import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { CircleCard } from '@/components/circles/CircleCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCircles, useUserCircles } from '@/hooks/useCircle';
import { useWallet } from '@/hooks/useWallet';
import { addressesEqual } from '@/lib/address';
import { getCircleSpotsLeft, isCircleReadyToStart } from '@/lib/circleState';
import {
  CircleCategory,
  formatAddress,
  formatAmount,
  getCategoryLabel,
  getCircleTypeLabel,
} from '@/lib/constants';
import { getCirclePath } from '@/lib/routes';
import type { Circle } from '@/types';

const CATEGORIES = [
  { value: '0', label: getCategoryLabel(CircleCategory.FRIENDS) },
  { value: '1', label: getCategoryLabel(CircleCategory.FAMILY) },
  { value: '2', label: getCategoryLabel(CircleCategory.COWORKERS) },
  { value: '3', label: getCategoryLabel(CircleCategory.NEIGHBORS) },
  { value: '4', label: getCategoryLabel(CircleCategory.INTEREST) },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Needs Review' },
];

function CirclePreviewDialog({
  circle,
  onOpenChange,
}: {
  circle: Circle | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!circle) return null;

  const collateralAmount = (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
  const spotsLeft = getCircleSpotsLeft(circle);
  const readyToStart = isCircleReadyToStart(circle);
  const availability = circle.status === 'PENDING'
    ? readyToStart
      ? 'Ready to launch'
      : `${spotsLeft} open slot${spotsLeft === 1 ? '' : 's'}`
    : circle.status === 'ACTIVE'
      ? 'In progress'
      : circle.status === 'COMPLETED'
        ? 'Completed'
        : 'Needs review';

  return (
    <Dialog open={Boolean(circle)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pr-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:border-white/10 dark:bg-white/6 dark:text-white/72">
              {getCategoryLabel(circle.category)}
            </span>
            <span className="rounded-full border border-[#B5F36B]/24 bg-[#B5F36B]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
              {circle.status}
            </span>
          </div>
          <DialogTitle className="mt-2 text-[1.9rem] tracking-[-0.05em]">
            {circle.name}
          </DialogTitle>
          <DialogDescription>
            {circle.description || 'This circle does not have a longer description yet.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Monthly amount', formatAmount(circle.monthlyAmount)],
            ['Members', `${circle.currentMembers}/${circle.maxMembers}`],
            ['Collateral', formatAmount(collateralAmount)],
            ['Access', getCircleTypeLabel(circle.circleType)],
            ['Creator', formatAddress(circle.creator)],
            ['Availability', availability],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-2 sm:justify-between">
          <Button variant="outline" asChild>
            <Link to="/circles/create">
              <Plus className="h-4 w-4" />
              Create Circle
            </Link>
          </Button>
          <Button asChild>
            <Link to={getCirclePath(circle.id)}>
              Open Circle
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CirclesPage() {
  const { circles, isLoading, error } = useCircles();
  const { circles: userCircles, isLoading: isUserCirclesLoading } = useUserCircles();
  const { address } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'created' | 'joined'>('all');
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  const joinedCircleIds = useMemo(
    () => new Set(
      userCircles
        .filter((circle) => !addressesEqual(circle.creator, address))
        .map((circle) => circle.id),
    ),
    [address, userCircles],
  );

  const circleStats = {
    total: circles.length,
    started: circles.filter((circle) => circle.status === 'ACTIVE').length,
    pending: circles.filter((circle) => circle.status === 'PENDING').length,
  };

  const filteredCircles = useMemo(
    () => circles.filter((circle) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = circle.name.toLowerCase().includes(query)
        || circle.description.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || circle.category.toString() === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || circle.status === selectedStatus;
      const matchesOwnership = ownershipFilter === 'all'
        || (ownershipFilter === 'created' && addressesEqual(circle.creator, address))
        || (ownershipFilter === 'joined' && joinedCircleIds.has(circle.id));

      return matchesSearch && matchesCategory && matchesStatus && matchesOwnership;
    }),
    [address, circles, joinedCircleIds, ownershipFilter, searchQuery, selectedCategory, selectedStatus],
  );

  const sortedCircles = [...filteredCircles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'almostFull':
        return (b.currentMembers / b.maxMembers) - (a.currentMembers / a.maxMembers);
      case 'lowestAmount':
        return Number(a.monthlyAmount - b.monthlyAmount);
      case 'highestAmount':
        return Number(b.monthlyAmount - a.monthlyAmount);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('newest');
    setOwnershipFilter('all');
  };

  const activeFilterCount = Number(Boolean(searchQuery))
    + Number(selectedCategory !== 'all')
    + Number(selectedStatus !== 'all')
    + Number(sortBy !== 'newest')
    + Number(ownershipFilter !== 'all');
  const showLoading = isLoading || (ownershipFilter === 'joined' && Boolean(address) && isUserCirclesLoading);

  return (
    <div className="space-y-4 pb-4">
      <section className="neo-panel p-4">
        <div className="mb-4 grid gap-3 border-b border-black/8 pb-4 dark:border-white/10 sm:grid-cols-3">
          {[
            { label: 'Total circles', value: circleStats.total },
            { label: 'Started', value: circleStats.started },
            { label: 'Pending', value: circleStats.pending },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search circles"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-11"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full xl:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full xl:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="almostFull">Almost Full</SelectItem>
                <SelectItem value="lowestAmount">Lowest Amount</SelectItem>
                <SelectItem value="highestAmount">Highest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            <Button
              size="sm"
              variant={ownershipFilter === 'created' ? 'default' : 'outline'}
              onClick={() => setOwnershipFilter((current) => current === 'created' ? 'all' : 'created')}
              disabled={!address}
            >
              My Circles
            </Button>
            <Button
              size="sm"
              variant={ownershipFilter === 'joined' ? 'default' : 'outline'}
              onClick={() => setOwnershipFilter((current) => current === 'joined' ? 'all' : 'joined')}
              disabled={!address}
            >
              Joined By Me
            </Button>
            <div className="neo-chip">
              <SlidersHorizontal className="h-4 w-4" />
              {sortedCircles.length} results
            </div>
            <Button size="sm" asChild>
              <Link to="/circles/create">
                <Plus className="h-4 w-4" />
                Create Circle
              </Link>
            </Button>
          </div>

          {activeFilterCount > 0 ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </section>

      {showLoading ? (
        <section className="neo-panel p-10 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
            Loading circles
          </h3>
        </section>
      ) : error ? (
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] border border-rose-500/20 bg-rose-500/10 text-rose-500">
            <X className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
            Unable to load circles
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </section>
      ) : sortedCircles.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sortedCircles.map((circle, index) => (
            <div key={circle.id} className={`animate-fade-in stagger-${Math.min(index + 1, 6)}`}>
              <CircleCard
                circle={circle}
                variant="compact"
                onSelect={setSelectedCircle}
              />
            </div>
          ))}
        </section>
      ) : (
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] border border-black/10 bg-white/72 text-muted-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">
            No circles in this view
          </h3>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {circles.length === 0 ? (
              <Button asChild>
                <Link to="/circles/create">
                  <Plus className="h-4 w-4" />
                  Create First Circle
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </section>
      )}

      <CirclePreviewDialog
        circle={selectedCircle}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCircle(null);
          }
        }}
      />
    </div>
  );
}
