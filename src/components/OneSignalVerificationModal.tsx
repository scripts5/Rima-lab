import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { oneSignalManager } from '../lib/oneSignalService';

const DIALOG_SHOWN_STORAGE_KEY = 'onesignal_integration_dialog_shown';

interface OneSignalVerificationModalProps {
  onPermissionRequested?: (granted: boolean) => void;
}

export const OneSignalVerificationModal: React.FC<OneSignalVerificationModalProps> = ({
  onPermissionRequested,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null | undefined>(undefined);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);

  // Retain the push subscription observer for the lifetime of this component
  const observerCleanupRef = useRef<(() => void) | null>(null);
  const hasCheckedInitialRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if dialog was already shown/acknowledged in previous sessions
    const alreadyShown = typeof window !== 'undefined' && localStorage.getItem(DIALOG_SHOWN_STORAGE_KEY) === 'true';

    // Helper to evaluate subscription ID
    const evaluateSubscription = (id: string | null | undefined) => {
      setSubscriptionId(id);
      const isRegistered = Boolean(id && !id.startsWith('local-'));

      if (isRegistered) {
        console.log('[OneSignal] Push subscription registered with server-assigned ID:', id);
      }

      // On Web, show the verification modal once initialized if not already shown
      if (!alreadyShown && !hasCheckedInitialRef.current) {
        hasCheckedInitialRef.current = true;
        setIsOpen(true);
      }
    };

    // Initialize OneSignal and setup observer
    oneSignalManager
      .initialize()
      .then(() => {
        // Register Push Subscription Observer immediately
        const cleanup = oneSignalManager.addPushSubscriptionObserver((newId) => {
          evaluateSubscription(newId);
        });
        observerCleanupRef.current = cleanup;

        // Evaluate the current subscription ID immediately at observer-registration time
        const currentId = oneSignalManager.getPushSubscriptionId();
        evaluateSubscription(currentId);

        // Check if permission is already granted
        setIsPermissionGranted(oneSignalManager.hasPushPermission());
      })
      .catch((err) => {
        console.warn('[OneSignal] Observer initialization notice:', err);
      });

    return () => {
      if (observerCleanupRef.current) {
        observerCleanupRef.current();
        observerCleanupRef.current = null;
      }
    };
  }, []);

  const handleGotIt = async () => {
    try {
      localStorage.setItem(DIALOG_SHOWN_STORAGE_KEY, 'true');
    } catch {}

    setIsOpen(false);

    // Request push notification permission on tap
    const granted = await oneSignalManager.requestPushPermission();
    setIsPermissionGranted(granted);
    if (onPermissionRequested) {
      onPermissionRequested(granted);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="onesignal-verification-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onesignal-dialog-title"
    >
      <div
        id="onesignal-verification-modal-card"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-neutral-950 p-6 shadow-2xl text-white sm:p-7"
      >
        {/* Header Icon */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Bell className="h-6 w-6" />
          </div>
          <button
            id="btn-close-onesignal-modal"
            onClick={handleGotIt}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Required Title */}
        <h2 id="onesignal-dialog-title" className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2">
          Your OneSignal SDK integration is complete!
        </h2>

        {/* Required Message */}
        <p className="text-sm leading-relaxed text-neutral-300 mb-6">
          You can now send Push Notifications &amp; In-App Messages through OneSignal. Tap below to enable push
          notifications.
        </p>

        {/* Real-time Registration Badge if server-assigned ID exists */}
        {subscriptionId && !subscriptionId.startsWith('local-') && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Subscription ID: {subscriptionId}</span>
          </div>
        )}

        {/* Required Single Button: "Got it" */}
        <div className="mt-2">
          <button
            id="btn-onesignal-got-it"
            type="button"
            onClick={handleGotIt}
            className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-neutral-950 hover:bg-amber-400 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-center"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneSignalVerificationModal;
