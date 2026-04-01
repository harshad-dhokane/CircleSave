import { useParams, Link } from 'react-router-dom';
import { useCircleDetail, useJoinCircle, useContribute, useStartCircle } from '@/hooks/useCircle';
import { useWallet } from '@/hooks/useWallet';
import { CircleFundingStudio } from '@/components/circles/CircleFundingStudio';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Wallet, 
  Lock, 
  ArrowLeft, 
  Share2, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { 
  formatAmount, 
  getCategoryColor, 
  getCategoryLabel,
  getCircleTypeLabel,
  getVoyagerContractUrl,
} from '@/lib/constants';
import { toast } from 'sonner';

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isConnected } = useWallet();
  const { circle, members, isLoading, error, isMember, isCreator, refetch } = useCircleDetail(id || '');
  const { joinCircle, isSubmitting: joining } = useJoinCircle();
  const { contribute, isSubmitting: contributing } = useContribute();
  const { startCircle: startCircleAction, isSubmitting: starting } = useStartCircle();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-[#FF6B6B]" />
          <p className="font-bold text-gray-600 text-lg">Loading circle from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!circle || error) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-28 h-28 bg-gray-200 border-[3px] border-black mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-black mb-3">Circle Not Found</h2>
          <p className="text-gray-600 mb-6 text-lg">{error || "The circle you're looking for doesn't exist."}</p>
          <Link to="/circles">
            <Button className="neo-button-primary">Browse Circles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const collateralAmount = (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
  const progress = (circle.currentMembers / circle.maxMembers) * 100;
  const spotsLeft = circle.maxMembers - circle.currentMembers;
  const categoryColor = getCategoryColor(circle.category);
  const categoryLabel = getCategoryLabel(circle.category);
  const circleTypeLabel = getCircleTypeLabel(circle.circleType);
  const canJoin = !isMember && circle.status === 'PENDING' && spotsLeft > 0;
  const canContribute = isMember && circle.status === 'ACTIVE';
  const canStart = isCreator && circle.status === 'PENDING' && circle.currentMembers >= 2;

  const handleJoin = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    const result = await joinCircle(circle.contractAddress);
    if (result) {
      toast.success(
        <div>
          Successfully joined the circle!{' '}
          <a href={result.voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
            View on Voyager →
          </a>
        </div>
      );
      refetch();
    }
  };

  const handleContribute = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    const result = await contribute(circle.contractAddress, circle.monthlyAmount);
    if (result) {
      toast.success(
        <div>
          Contribution successful!{' '}
          <a href={result.voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
            View on Voyager →
          </a>
        </div>
      );
      refetch();
    }
  };

  const handleStart = async () => {
    const result = await startCircleAction(circle.contractAddress);
    if (result) {
      toast.success(
        <div>
          Circle started!{' '}
          <a href={result.voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
            View on Voyager →
          </a>
        </div>
      );
      refetch();
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? window.location.href
      : `${circle.id}`;
    const shareData = {
      title: `${circle.name} on CircleSave`,
      text: `Join the "${circle.name}" savings circle on CircleSave.`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        toast.success('Circle shared successfully');
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Circle link copied to clipboard');
        return;
      }
    } catch {
      // Fall through to the manual copy fallback below.
    }

    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast.success('Circle link copied to clipboard');
      return;
    }

    toast.error('Sharing is not available in this browser');
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      {/* Back Button */}
      <div className="page-shell py-5">
        <Link 
          to="/circles" 
          className="inline-flex items-center gap-2 font-bold text-gray-600 hover:text-black transition-colors text-base"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Circles
        </Link>
      </div>

      {/* Hero Section */}
      <div className="content-divider-bottom bg-white border-b-[2px] border-black">
        <div className="page-shell py-8 md:py-9">
          {/* Header */}
          <div className="animate-fade-in flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="px-4 py-2 text-sm font-black border-[2px] border-black uppercase tracking-wider"
                style={{ backgroundColor: categoryColor }}
              >
                {categoryLabel}
              </div>
              <div className={`px-4 py-2 text-sm font-black border-[2px] border-black uppercase tracking-wider
                ${circle.status === 'ACTIVE' ? 'bg-green-400 text-black' : 
                  circle.status === 'COMPLETED' ? 'bg-blue-400 text-white' :
                  circle.status === 'FAILED' ? 'bg-red-400 text-white' :
                  'bg-yellow-400 text-black'}`}>
                {circle.status}
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={getVoyagerContractUrl(circle.contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border-[2px] border-black bg-white hover:bg-gray-50 transition-colors"
                title="View on Voyager"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="p-3 border-[2px] border-black bg-white hover:bg-gray-50 transition-colors"
                title="Share circle"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="animate-fade-in stagger-1 text-4xl md:text-5xl font-black mb-4">{circle.name}</h1>
          <p className="animate-fade-in stagger-2 text-xl text-gray-600 mb-6 max-w-2xl">{circle.description}</p>

          {/* Creator */}
          <div className="animate-fade-in stagger-2 flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-[#FEFAE0] border-[2px] border-black flex items-center justify-center font-bold text-lg">
              {circle.creator.slice(2, 4)}
            </div>
            <div>
              <p className="text-base text-gray-600">Created by</p>
              <p className="font-bold text-base">{circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}</p>
            </div>
            <div className="ml-6 flex items-center gap-2 px-4 py-2 bg-[#FEFAE0] border-[2px] border-black">
              <span className="text-base font-bold">{circleTypeLabel}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Wallet, color: '#4ECDC4', label: 'Monthly', value: formatAmount(circle.monthlyAmount), sub: '' },
              { icon: Users, color: '#FF6B6B', label: 'Members', value: `${circle.currentMembers}/${circle.maxMembers}`, sub: `${spotsLeft} spots left` },
              { icon: Lock, color: '#FFE66D', label: 'Collateral', value: formatAmount(collateralAmount), sub: `(${circle.collateralRatio/100}x)` },
              { icon: TrendingUp, color: '#96CEB4', label: 'Total Pot', value: formatAmount(circle.monthlyAmount * BigInt(circle.maxMembers)), sub: '' },
            ].map((stat, index) => (
              <div key={stat.label} className={`animate-fade-in stagger-${index + 3} bg-[#FEFAE0] border-[2px] border-black p-5 text-center`}>
                <stat.icon className="w-7 h-7 mx-auto mb-2" style={{ color: stat.color }} />
                <p className="text-xs font-bold text-gray-600 uppercase">{stat.label}</p>
                <p className="text-2xl font-black mt-1">{stat.value}</p>
                {stat.sub && <p className="text-sm text-gray-500">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-10 animate-fade-in stagger-5">
            <div className="flex justify-between text-base font-bold mb-2">
              <span>Membership Progress</span>
              <span>{Math.round(progress)}% Full</span>
            </div>
            <div className="neo-progress">
              <div 
                className="neo-progress-bar bg-[#4ECDC4]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-in stagger-6">
            {canJoin && (
              <Button 
                onClick={handleJoin}
                disabled={joining}
                className="neo-button-primary text-lg px-10 py-7"
              >
                {joining ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Joining...</>
                ) : (
                  `Join Circle (Lock ${formatAmount(collateralAmount)})`
                )}
              </Button>
            )}
            
            {canContribute && (
              <Button 
                onClick={handleContribute}
                disabled={contributing}
                className="neo-button-secondary text-lg px-10 py-7"
              >
                {contributing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  `Contribute ${formatAmount(circle.monthlyAmount)}`
                )}
              </Button>
            )}
            
            {canStart && (
              <Button 
                onClick={handleStart}
                disabled={starting}
                className="neo-button-accent text-lg px-10 py-7"
              >
                {starting ? 'Starting...' : 'Start Circle'}
              </Button>
            )}
            
            {isMember && (
              <div className="flex items-center gap-2 px-5 py-3 bg-green-400 border-[3px] border-black">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold text-base">You're a member!</span>
              </div>
            )}
            
            {spotsLeft === 0 && !isMember && (
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-300 border-[3px] border-black">
                <AlertCircle className="w-6 h-6" />
                <span className="font-bold text-base">Circle is full</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="page-shell py-8 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Tabs defaultValue="members" className="w-full animate-fade-in">
            <TabsList className="sticky top-[5.8rem] z-20 mb-8 w-full justify-start rounded-none border-[2px] border-black bg-white p-1 shadow-[0_4px_0px_0px_#1a1a1a]">
              <TabsTrigger 
                value="members" 
                className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5"
              >
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger 
                value="starkzap"
                className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5"
              >
                <ArrowRightLeft className="w-5 h-5 mr-1" />
                StarkZap
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="rounded-none font-bold text-base data-[state=active]:bg-black data-[state=active]:text-white px-6 py-2.5"
              >
                Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <div className="neo-card p-8">
                <h3 className="text-2xl font-black mb-6">Circle Members</h3>
                {members.length > 0 ? (
                  <div className="divide-y-[2px] divide-black">
                    {members.map((member, index) => (
                      <div key={member.address} className={`flex items-center gap-4 py-5 animate-fade-in stagger-${Math.min(index + 1, 8)}`}>
                        <div className="w-12 h-12 bg-[#FEFAE0] border-[3px] border-black flex items-center justify-center font-bold text-lg">
                          {index + 1}
                        </div>
                        <div className="w-14 h-14 bg-gray-200 border-[3px] border-black flex items-center justify-center">
                          <span className="font-bold text-xl">
                            {member.address.slice(2, 4)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate">
                            {member.address.slice(0, 6)}...{member.address.slice(-4)}
                          </p>
                          <p className="text-base text-gray-600">
                            {member.paymentsMade} payments • {member.paymentsLate} late
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-base">{formatAmount(member.collateralLocked)}</p>
                          <p className="text-sm text-gray-600">Collateral locked</p>
                        </div>
                        {member.hasReceivedPot && (
                          <div className="px-3 py-1.5 bg-green-400 border-[2px] border-black">
                            <span className="text-xs font-bold">Received</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8 text-lg">No members yet. Be the first to join!</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="starkzap">
              <div className="space-y-6">
                {(canJoin || canContribute) ? (
                  <CircleFundingStudio
                    circleAddress={circle.contractAddress}
                    circleLabel={circle.name}
                    action={canJoin ? 'join' : 'contribute'}
                    requiredStrkAmount={canJoin ? collateralAmount : circle.monthlyAmount}
                  />
                ) : (
                  <div className="border-[2px] border-black bg-[#FEFAE0] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-2xl font-black">StarkZap Funding Studio</h3>
                        <p className="mt-1 text-[15px] text-gray-600">
                          The integrated funding rail unlocks when you can join or contribute. Until then,
                          you can still use the dedicated swap, DCA, lending, and logs workspaces with the same wallet session.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link to="/swap">
                          <Button className="neo-button-primary">
                            Open Swap
                          </Button>
                        </Link>
                        <Link to="/lending">
                          <Button variant="outline" className="border-[2px] border-black">
                            Open Lending
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schedule">
              <div className="neo-card p-8">
                <h3 className="text-2xl font-black mb-6">Payment Schedule</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: circle.maxMembers }, (_, i) => (
                    <div 
                      key={i} 
                      className={`border-[3px] border-black p-5 animate-fade-in stagger-${Math.min(i + 1, 6)} ${
                        i < circle.currentMonth ? 'bg-green-100' : 'bg-[#FEFAE0]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-lg">Month {i + 1}</span>
                        {i < circle.currentMonth && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <p className="text-base text-gray-600">
                        {i < circle.currentMonth 
                          ? 'Completed' 
                          : i === circle.currentMonth 
                            ? 'Current month' 
                            : 'Upcoming'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <aside className="neo-sticky-rail space-y-5">
            <div className="neo-panel p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="neo-chip bg-[#FFE66D]">Circle Summary</div>
                <a
                  href={getVoyagerContractUrl(circle.contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4"
                >
                  Voyager
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-3">
                <div className="border-[2px] border-black bg-[#FEFAE0] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Monthly Contribution</p>
                  <p className="mt-2 text-3xl font-black">{formatAmount(circle.monthlyAmount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-[2px] border-black bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Locked Collateral</p>
                    <p className="mt-2 text-xl font-black">{formatAmount(collateralAmount)}</p>
                  </div>
                  <div className="border-[2px] border-black bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.08em] text-black/55">Open Spots</p>
                    <p className="mt-2 text-xl font-black">{spotsLeft}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-black">
                  <span>Membership Fill</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="neo-progress">
                  <div className="neo-progress-bar bg-[#4ECDC4]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {canJoin && (
                  <Button onClick={handleJoin} disabled={joining} className="neo-button-primary w-full justify-center">
                    {joining ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Joining...</> : 'Join Circle'}
                  </Button>
                )}
                {canContribute && (
                  <Button onClick={handleContribute} disabled={contributing} className="neo-button-secondary w-full justify-center">
                    {contributing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : `Contribute ${formatAmount(circle.monthlyAmount)}`}
                  </Button>
                )}
                {canStart && (
                  <Button onClick={handleStart} disabled={starting} className="neo-button-accent w-full justify-center">
                    {starting ? 'Starting...' : 'Start Circle'}
                  </Button>
                )}
                <Button type="button" onClick={handleShare} variant="outline" className="w-full border-[2px] border-black">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Circle
                </Button>
              </div>
            </div>

            <div className="neo-panel p-6">
              <h3 className="text-xl font-black">Fund This Position</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/65">
                Use the same wallet session to route into STRK, automate a buy schedule, or keep idle balance productive while this circle fills.
              </p>
              <div className="mt-5 space-y-3">
                <Link to="/swap" className="block border-[2px] border-black bg-[#4ECDC4] px-4 py-3 font-black">
                  Open Swap
                </Link>
                <Link to="/dca" className="block border-[2px] border-black bg-[#FFE66D] px-4 py-3 font-black">
                  Open DCA
                </Link>
                <Link to="/lending" className="block border-[2px] border-black bg-[#96CEB4] px-4 py-3 font-black">
                  Open Lending
                </Link>
                <Link to="/logs" className="block border-[2px] border-black bg-white px-4 py-3 font-black">
                  View Logs
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
