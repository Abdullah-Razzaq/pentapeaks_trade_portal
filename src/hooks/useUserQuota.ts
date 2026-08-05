import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function useUserQuota() {
  const [downloadsToday, setDownloadsToday] = useState<number>(0);
  const [planType, setPlanType] = useState<string>('trial');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Fetch true database state from backend
  const fetchQuota = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setDownloadsToday(data.user.downloads_today ?? 0);
          setSubscriptionExpiresAt(data.user.subscription_expires_at ?? null);
          setResetsAt(data.user.resetsAt ?? null);
          setPlanType(data.user.plan_type ?? 'trial');
        }
      }
    } catch (err) {
      console.error("Failed to sync download quota:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch quota every time user switches tabs/routes
  useEffect(() => {
    const init = async () => { await fetchQuota(); };
    init();
  }, [pathname, fetchQuota]);

  const planLimit = planType === 'premium' ? 10 : (planType === 'pro' ? 10 : 2);
  const downloadsRemaining = Math.max(0, planLimit - downloadsToday);

  return {
    downloadsToday,
    downloadsRemaining,
    planLimit,
    planType,
    refreshQuota: fetchQuota,
    subscriptionExpiresAt,
    resetsAt,
    isLoading
  };
}
