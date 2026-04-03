import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  useApproveMember,
  useCircleDetail,
  useCompleteCircle,
  useContribute,
  useDistributePot,
  useEmergencyWithdraw,
  useJoinCircle,
  useRejectMember,
  useRequestJoinCircle,
  useStartCircle,
} from '@/hooks/useCircle';
import { useWallet } from '@/hooks/useWallet';
import { CircleRequestsPanel } from '@/components/circles/CircleRequestsPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  formatAmount,
  formatAddress,
  getCategoryColor,
  getCategoryLabel,
  getCircleTypeLabel,
  getVoyagerContractUrl,
} from '@/lib/constants';
import { getCircleSpotsLeft, isCircleFull, isCircleReadyToStart } from '@/lib/circleState';
import type { CircleJoinRequest } from '@/types';
import { toast } from 'sonner';

function getStatusClasses(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/14 text-emerald-300';
    case 'COMPLETED':
      return 'bg-sky-500/14 text-sky-300';
    case 'FAILED':
      return 'bg-rose-500/14 text-rose-300';
    default:
      return 'bg-amber-500/14 text-amber-300';
  }
}

function SuccessToast({ label, voyagerUrl }: { label: string; voyagerUrl: string }) {
  return (
    <div>
      {label}{' '}
      <a href={voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
        View on Voyager
      </a>
    </div>
  );
}

export function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const circleId = id ? decodeURIComponent(id) : '';
  const { isConnected } = useWallet();
  const {
    circle,
    members,
    pendingRequests,
    hasPendingRequest,
    isLoading,
    error,
    isMember,
    isCreator,
    refetch,
  } = useCircleDetail(circleId);

  const { joinCircle, isSubmitting: joining } = useJoinCircle();
  const { requestJoinCircle, isSubmitting: requestingJoin } = useRequestJoinCircle();
  const { contribute, isSubmitting: contributing } = useContribute();
  const { startCircle: startCircleAction, isSubmitting: starting } = useStartCircle();
  const { distributePot, isSubmitting: distributing } = useDistributePot();
  const { completeCircle, isSubmitting: completing } = useCompleteCircle();
  const { emergencyWithdraw, isSubmitting: withdrawingEmergency } = useEmergencyWithdraw();
  const { approveMember } = useApproveMember();
  const { rejectMember } = useRejectMember();

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingRequestAction, setActingRequestAction] = useState<'approve' | 'reject' | null>(null);
  const schedulePreview = useMemo(
    () => Array.from({ length: Math.min(circle?.maxMembers ?? 0, 6) }, (_, index) => {
      const month = index + 1;
      return {
        month,
        state:
          month < (circle?.currentMonth ?? 0)
            ? 'Done'
            : month === (circle?.currentMonth ?? 0) && circle?.status === 'ACTIVE'
              ? 'Current'
              : 'Upcoming',
      };
    }),
    [circle?.currentMonth, circle?.maxMembers, circle?.status],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
            Loading circle
          </h2>
        </section>
      </div>
    );
  }

  if (!circle || error) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Circle not found
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error || 'This circle is unavailable right now.'}</p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/circles">Back to circles</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const collateralAmount = (circle.monthlyAmount * BigInt(circle.collateralRatio)) / 100n;
  const progress = (circle.currentMembers / circle.maxMembers) * 100;
  const spotsLeft = getCircleSpotsLeft(circle);
  const categoryColor = getCategoryColor(circle.category);
  const categoryLabel = getCategoryLabel(circle.category);
  const circleTypeLabel = getCircleTypeLabel(circle.circleType);
  const isApprovalRequired = circle.circleType === 1;
  const readyToStart = isCircleReadyToStart(circle);

  const canJoinDirect = !isCreator && !isMember && circle.status === 'PENDING' && spotsLeft > 0 && !isApprovalRequired;
  const canRequestJoin = !isCreator && !isMember && circle.status === 'PENDING' && spotsLeft > 0 && isApprovalRequired && !hasPendingRequest;
  const canContribute = isMember && circle.status === 'ACTIVE';
  const canStart = isCreator && readyToStart;
  const canManageRequests = isCreator && isApprovalRequired && circle.status === 'PENDING';
  const canDistribute = circle.status === 'ACTIVE' && (isCreator || isMember);
  const canComplete = circle.status === 'ACTIVE' && isCreator;
  const canEmergencyWithdraw = circle.status === 'FAILED' && isMember;
  const creatorWaitingForMembers = isCreator && circle.status === 'PENDING' && !isCircleFull(circle);
  const waitingForCreatorToStart = !isCreator && circle.status === 'PENDING' && isCircleFull(circle);
  const memberPreview = members.slice(0, 6);
  const remainingMembers = Math.max(members.length - memberPreview.length, 0);

  const ensureConnected = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    return true;
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `${circle.id}`;
    const shareData = {
      title: `${circle.name} on CircleSave`,
      text: `Join the "${circle.name}" savings circle on CircleSave.`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        toast.success('Circle shared');
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
        toast.success('Circle link copied');
        return;
      }
    } catch {
      // fall through
    }

    toast.error('Sharing is not available in this browser');
  };

  const handleJoin = async () => {
    if (!ensureConnected()) return;

    const outcome = await joinCircle(circle.contractAddress);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Joined the circle." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleOpenRequestDialog = () => {
    if (!ensureConnected()) return;
    setRequestDialogOpen(true);
  };

  const handleSubmitJoinRequest = async () => {
    if (!ensureConnected()) return;

    const outcome = await requestJoinCircle(circle.contractAddress, requestMessage);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Join request submitted." voyagerUrl={outcome.voyagerUrl} />);
    setRequestMessage('');
    setRequestDialogOpen(false);
    await refetch();
  };

  const handleContribute = async () => {
    if (!ensureConnected()) return;

    const outcome = await contribute(circle.contractAddress, circle.monthlyAmount);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Contribution submitted." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleStart = async () => {
    if (!ensureConnected()) return;

    const outcome = await startCircleAction(circle.contractAddress);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Circle started." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleDistribute = async () => {
    if (!ensureConnected()) return;

    const outcome = await distributePot(circle.contractAddress);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Distribution submitted." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleComplete = async () => {
    if (!ensureConnected()) return;

    const outcome = await completeCircle(circle.contractAddress);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Circle completed." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleEmergencyWithdraw = async () => {
    if (!ensureConnected()) return;

    const outcome = await emergencyWithdraw(circle.contractAddress);
    if (!outcome.ok) {
      toast.error(outcome.error);
      return;
    }

    toast.success(<SuccessToast label="Emergency exit submitted." voyagerUrl={outcome.voyagerUrl} />);
    await refetch();
  };

  const handleApproveRequest = async (request: CircleJoinRequest) => {
    if (!ensureConnected()) return;

    setActingRequestId(request.id);
    setActingRequestAction('approve');
    try {
      const outcome = await approveMember(request.circleAddress, request.applicantAddress);

      if (!outcome.ok) {
        toast.error(outcome.error);
        return;
      }

      toast.success(<SuccessToast label="Request approved." voyagerUrl={outcome.voyagerUrl} />);
      await refetch();
    } finally {
      setActingRequestId(null);
      setActingRequestAction(null);
    }
  };

  const handleRejectRequest = async (request: CircleJoinRequest) => {
    if (!ensureConnected()) return;

    setActingRequestId(request.id);
    setActingRequestAction('reject');
    try {
      const outcome = await rejectMember(request.circleAddress, request.applicantAddress);

      if (!outcome.ok) {
        toast.error(outcome.error);
        return;
      }

      toast.success(<SuccessToast label="Request rejected." voyagerUrl={outcome.voyagerUrl} />);
      await refetch();
    } finally {
      setActingRequestId(null);
      setActingRequestAction(null);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="neo-panel p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
              >
                {categoryLabel}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusClasses(circle.status)}`}>
                {circle.status}
              </span>
              <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:border-white/10 dark:bg-white/6">
                {circleTypeLabel}
              </span>
              {hasPendingRequest ? (
                <span className="rounded-full bg-[#A48DFF]/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                  Request sent
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 truncate font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-foreground md:text-[1.55rem]">
              {circle.name}
            </h2>
            {circle.description ? (
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{circle.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={getVoyagerContractUrl(circle.contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white/72 px-3.5 text-sm font-semibold text-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Voyager
            </a>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Members', value: `${circle.currentMembers}/${circle.maxMembers}` },
            { label: 'Spots left', value: spotsLeft },
            { label: 'Monthly', value: formatAmount(circle.monthlyAmount) },
            { label: 'Collateral', value: formatAmount(collateralAmount) },
          ].map((item) => (
            <div key={item.label} className="rounded-[16px] border border-black/10 bg-black/[0.03] px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="neo-chip">
            <Users className="h-3.5 w-3.5" />
            Creator {formatAddress(circle.creator)}
          </div>
          <div className="neo-chip">Total pot {formatAmount(circle.monthlyAmount * BigInt(circle.maxMembers))}</div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Membership fill</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="neo-progress">
            <div className="neo-progress-bar bg-[linear-gradient(90deg,#B5F36B,#7CC8FF)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className="rounded-full bg-white/8 px-4 py-3 text-muted-foreground"
          >
            {circle.currentMonth > 0 ? `Round ${circle.currentMonth}` : 'Pending launch'}
          </span>
          {canJoinDirect ? (
            <Button onClick={handleJoin} disabled={joining}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Join circle
            </Button>
          ) : null}
          {canRequestJoin ? (
            <Button onClick={handleOpenRequestDialog} disabled={requestingJoin}>
              <Send className="h-4 w-4" />
              Request access
            </Button>
          ) : null}
          {canContribute ? (
            <Button variant="outline" onClick={handleContribute} disabled={contributing}>
              {contributing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Contribute {formatAmount(circle.monthlyAmount)}
            </Button>
          ) : null}
          {canStart ? (
            <Button variant="outline" onClick={handleStart} disabled={starting}>
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start circle
            </Button>
          ) : null}
          {canDistribute ? (
            <Button variant="outline" onClick={handleDistribute} disabled={distributing}>
              {distributing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              Distribute
            </Button>
          ) : null}
          {canEmergencyWithdraw ? (
            <Button variant="destructive" onClick={handleEmergencyWithdraw} disabled={withdrawingEmergency}>
              {withdrawingEmergency ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Emergency exit
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {isMember ? (
            <div className="rounded-[20px] bg-emerald-500/14 px-4 py-3 text-emerald-300">You are a member of this circle.</div>
          ) : null}
          {creatorWaitingForMembers ? (
            <div className="rounded-[20px] bg-amber-500/14 px-4 py-3 text-amber-300">
              Waiting for the final {spotsLeft} member slot{spotsLeft === 1 ? '' : 's'}.
            </div>
          ) : null}
          {readyToStart && isCreator ? (
            <div className="rounded-[20px] bg-[#B5F36B]/14 px-4 py-3 text-foreground">
              All spots are filled. Start the first round when ready.
            </div>
          ) : null}
          {waitingForCreatorToStart ? (
            <div className="rounded-[20px] bg-white/8 px-4 py-3 text-muted-foreground">
              The circle is full and waiting for the creator to start it.
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="neo-panel p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Members
              </p>
              <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                Current roster
              </h3>
            </div>
            <Users className="h-5 w-5 text-[#7AE7C7]" />
          </div>

          <div className="space-y-3">
            {memberPreview.map((member, index) => (
              <div key={member.address} className="flex items-center justify-between gap-3 rounded-[22px] border border-black/10 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white/72 text-sm font-semibold backdrop-blur-xl dark:border-white/10 dark:bg-white/8">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{formatAddress(member.address)}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {member.paymentsMade} paid • {member.paymentsLate} late
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatAmount(member.collateralLocked)}</p>
                  {member.hasReceivedPot ? (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-500/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Received
                    </span>
                  ) : null}
                </div>
              </div>
            ))}

            {memberPreview.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-10 text-center text-sm text-muted-foreground dark:border-white/10">
                No members yet.
              </div>
            ) : null}

            {remainingMembers > 0 ? (
              <div className="rounded-[20px] bg-white/6 px-4 py-3 text-sm text-muted-foreground">
                +{remainingMembers} more member{remainingMembers === 1 ? '' : 's'} in the contract roster
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-4">
          {canManageRequests ? (
            <section className="neo-panel p-4 md:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Approvals
                  </p>
                  <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                    Pending requests
                  </h3>
                </div>
                <div className="neo-chip">{pendingRequests.length}</div>
              </div>

              <CircleRequestsPanel
                requests={pendingRequests.slice(0, 3)}
                actingRequestId={actingRequestId}
                actingRequestAction={actingRequestAction}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                showCircleName={false}
                compact
              />
            </section>
          ) : null}

          <section className="neo-panel p-4 md:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Schedule
                </p>
                <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                  Round preview
                </h3>
              </div>
              <Wallet className="h-5 w-5 text-[#7CC8FF]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {schedulePreview.map((item) => (
                <div key={item.month} className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Month {item.month}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-foreground">{item.state}</p>
                </div>
              ))}
            </div>

            {circle.maxMembers > schedulePreview.length ? (
              <p className="mt-4 text-sm text-muted-foreground">
                +{circle.maxMembers - schedulePreview.length} more rounds in the full rotation
              </p>
            ) : null}
          </section>

          {(canComplete || canEmergencyWithdraw) ? (
            <section className="neo-panel p-4 md:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Recovery
                  </p>
                  <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.04em] text-foreground">
                    Advanced actions
                  </h3>
                </div>
                <ShieldAlert className="h-5 w-5 text-[#FF6B6B]" />
              </div>

              <div className="space-y-3">
                {canComplete ? (
                  <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-foreground">Complete circle</p>
                    <p className="mt-1 text-sm text-muted-foreground">Use only if the rotation is fully finished.</p>
                    <Button variant="outline" onClick={handleComplete} disabled={completing} className="mt-4">
                      {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Complete
                    </Button>
                  </div>
                ) : null}

                {canEmergencyWithdraw ? (
                  <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-4">
                    <p className="text-sm font-semibold text-rose-100">Emergency withdrawal</p>
                    <p className="mt-1 text-sm text-rose-100/75">Exit a failed circle and reclaim collateral.</p>
                    <Button variant="destructive" onClick={handleEmergencyWithdraw} disabled={withdrawingEmergency} className="mt-4">
                      {withdrawingEmergency ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Withdraw
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="overflow-hidden rounded-[28px] border border-black/10 bg-white/92 p-0 shadow-[0_32px_80px_-38px_rgba(15,23,42,0.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0f15] dark:shadow-[0_34px_90px_-40px_rgba(0,0,0,0.92)] sm:max-w-lg">
          <div className="p-6">
            <DialogHeader className="text-left">
              <DialogTitle>Request access</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                Add a short note for the circle creator.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Collateral required
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatAmount(collateralAmount)}</p>
              </div>

              <div>
                <Label htmlFor="request-message" className="mb-2 block text-sm font-semibold">Message</Label>
                <Textarea
                  id="request-message"
                  value={requestMessage}
                  onChange={(event) => setRequestMessage(event.target.value)}
                  placeholder="I’d like to join this circle."
                  className="min-h-[120px]"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitJoinRequest} disabled={requestingJoin}>
                  {requestingJoin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send request
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
