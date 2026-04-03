import { useEffect, useMemo, useState } from 'react';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { useWallet } from '@/hooks/useWallet';
import { addressesEqual } from '@/lib/address';
import {
  getSubmittedStarkZapActivity,
  getSubmittedStarkZapActivityKey,
  removeSubmittedStarkZapActivity,
  subscribeSubmittedStarkZapActivity,
} from '@/lib/starkzapSubmittedActivity';
import type { StarkZapLogEntry } from '@/lib/starkzapLogs';

export function useMyStarkZapActivity() {
  const { address } = useWallet();
  const {
    logs,
    error,
    hasConfiguredRegistry,
    isLoading,
    lastUpdatedAt,
    refresh,
  } = useStarkZapLogs();
  const [submittedActivity, setSubmittedActivity] = useState<StarkZapLogEntry[]>(
    () => getSubmittedStarkZapActivity(),
  );

  useEffect(() => {
    const syncSubmittedActivity = () => {
      setSubmittedActivity(getSubmittedStarkZapActivity());
    };

    syncSubmittedActivity();
    return subscribeSubmittedStarkZapActivity(syncSubmittedActivity);
  }, []);

  const confirmedActivity = useMemo(() => {
    if (!address) {
      return [];
    }

    return logs.filter((entry) => addressesEqual(entry.account, address));
  }, [address, logs]);

  const activity = useMemo(() => {
    if (!address) {
      return [];
    }

    const merged = new Map<string, StarkZapLogEntry>();

    submittedActivity
      .filter((entry) => addressesEqual(entry.account, address))
      .forEach((entry) => {
        merged.set(getSubmittedStarkZapActivityKey(entry), entry);
      });

    confirmedActivity.forEach((entry) => {
      merged.set(getSubmittedStarkZapActivityKey(entry), entry);
    });

    return [...merged.values()].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }, [address, confirmedActivity, submittedActivity]);

  useEffect(() => {
    const confirmedKeys = confirmedActivity.map((entry) => getSubmittedStarkZapActivityKey(entry));

    if (confirmedKeys.length > 0) {
      removeSubmittedStarkZapActivity(confirmedKeys);
    }
  }, [confirmedActivity]);

  return {
    activity,
    confirmedActivity,
    logs,
    error,
    hasConfiguredRegistry,
    isLoading,
    lastUpdatedAt,
    refresh,
  };
}
