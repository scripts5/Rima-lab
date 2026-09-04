import OneSignal from 'react-onesignal';

/**
 * OneSignal App ID for RimaLab
 */
export const ONESIGNAL_APP_ID = '25b8716e-b579-4734-944c-b3aab8880227';

/**
 * Centralized OneSignal Manager
 * Wraps all OneSignal SDK interactions behind a single, typed interface.
 */
class OneSignalManager {
  private initialized = false;
  private initializingPromise: Promise<void> | null = null;

  /**
   * Initialize the OneSignal Web SDK
   */
  public async initialize(appId: string = ONESIGNAL_APP_ID): Promise<void> {
    if (this.initialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      try {
        const isLocalhost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        await OneSignal.init({
          appId,
          serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/push/onesignal/' },
          allowLocalhostAsSecureOrigin: isLocalhost,
        });

        this.initialized = true;
        console.log('[OneSignal] Initialized successfully with App ID:', appId);
      } catch (err) {
        console.warn('[OneSignal] Initialization error:', err);
      } finally {
        this.initializingPromise = null;
      }
    })();

    return this.initializingPromise;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Login user with external ID
   */
  public async login(externalId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    try {
      await OneSignal.login(externalId);
    } catch (err) {
      console.warn('[OneSignal] login error:', err);
    }
  }

  /**
   * Logout current user
   */
  public async logout(): Promise<void> {
    if (!this.initialized) return;
    try {
      await OneSignal.logout();
    } catch (err) {
      console.warn('[OneSignal] logout error:', err);
    }
  }

  /**
   * Set user email subscription
   */
  public setEmail(email: string): void {
    if (!this.initialized) return;
    try {
      OneSignal.User.addEmail(email);
    } catch (err) {
      console.warn('[OneSignal] setEmail error:', err);
    }
  }

  /**
   * Set user SMS number subscription
   */
  public setSmsNumber(number: string): void {
    if (!this.initialized) return;
    try {
      OneSignal.User.addSms(number);
    } catch (err) {
      console.warn('[OneSignal] setSmsNumber error:', err);
    }
  }

  /**
   * Set custom user tag
   */
  public setTag(key: string, value: string): void {
    if (!this.initialized) return;
    try {
      OneSignal.User.addTag(key, value);
    } catch (err) {
      console.warn('[OneSignal] setTag error:', err);
    }
  }

  /**
   * Control debug logging level
   */
  public setLogLevel(level: 'trace' | 'debug' | 'info' | 'warn' | 'error'): void {
    try {
      OneSignal.Debug.setLogLevel(level);
    } catch (err) {
      console.warn('[OneSignal] setLogLevel error:', err);
    }
  }

  /**
   * Request Push Permission (only driven by user action)
   */
  public async requestPushPermission(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    try {
      return await OneSignal.Notifications.requestPermission();
    } catch (err) {
      console.warn('[OneSignal] requestPushPermission error:', err);
      return false;
    }
  }

  /**
   * Get current push subscription ID
   */
  public getPushSubscriptionId(): string | null | undefined {
    if (!this.initialized) return undefined;
    try {
      return OneSignal.User.PushSubscription.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if device is registered with a real server-assigned subscription ID
   */
  public isRegistered(): boolean {
    const id = this.getPushSubscriptionId();
    return Boolean(id && !id.startsWith('local-'));
  }

  /**
   * Check if push notifications are supported by browser
   */
  public isPushSupported(): boolean {
    try {
      return OneSignal.Notifications.isPushSupported();
    } catch {
      return false;
    }
  }

  /**
   * Check current push notification permission status
   */
  public hasPushPermission(): boolean {
    try {
      return OneSignal.Notifications.permission;
    } catch {
      return false;
    }
  }

  /**
   * Register a push subscription observer.
   * Returns a cleanup unregister function.
   */
  public addPushSubscriptionObserver(callback: (id: string | null | undefined) => void): () => void {
    const listener = () => {
      const currentId = this.getPushSubscriptionId();
      callback(currentId);
    };

    try {
      OneSignal.User.PushSubscription.addEventListener('change', listener);
    } catch (e) {
      console.warn('[OneSignal] Failed to add PushSubscription observer:', e);
    }

    return () => {
      try {
        OneSignal.User.PushSubscription.removeEventListener('change', listener);
      } catch {}
    };
  }
}

export const oneSignalManager = new OneSignalManager();
export default oneSignalManager;
