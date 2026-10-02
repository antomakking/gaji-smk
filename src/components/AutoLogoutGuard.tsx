import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

interface AutoLogoutGuardProps {
  isAuthenticated: boolean;
  onLogout: (isTimeout?: boolean) => void;
  timeoutMinutes?: number; // Default 15 minutes
  warningSeconds?: number; // Default 60 seconds warning before logout
}

export const AutoLogoutGuard: React.FC<AutoLogoutGuardProps> = ({
  isAuthenticated,
  onLogout,
  timeoutMinutes = 15,
  warningSeconds = 60,
}) => {
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(warningSeconds);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningSeconds * 1000;

  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Reset activity timestamp
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningModal) {
      setShowWarningModal(false);
    }
  }, [showWarningModal]);

  // Handle explicit extend session by user
  const handleExtendSession = () => {
    resetActivity();
    setShowWarningModal(false);
  };

  // Setup global event listeners for user activity
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarningModal(false);
      return;
    }

    lastActivityRef.current = Date.now();

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel',
    ];

    let lastThrottledTime = 0;
    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle activity updates to once every 1000ms
      if (now - lastThrottledTime > 1000) {
        lastThrottledTime = now;
        if (!showWarningModal) {
          lastActivityRef.current = now;
        }
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, { passive: true });
    });

    // Check inactivity every 2 seconds
    timerCheckIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeLeft = timeoutMs - elapsed;

      if (timeLeft <= 0) {
        // Time is up -> Trigger auto-logout
        setShowWarningModal(false);
        if (timerCheckIntervalRef.current) clearInterval(timerCheckIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        onLogout(true);
      } else if (timeLeft <= warningMs) {
        // Show warning modal and sync countdown
        setShowWarningModal(true);
        setRemainingSeconds(Math.max(1, Math.ceil(timeLeft / 1000)));
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 2000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
      if (timerCheckIntervalRef.current) clearInterval(timerCheckIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, onLogout, showWarningModal, timeoutMs, warningMs]);

  // Separate interval for smooth 1-second countdown when modal is visible
  useEffect(() => {
    if (showWarningModal && isAuthenticated) {
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setRemainingSeconds(remaining);

        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setShowWarningModal(false);
          onLogout(true);
        }
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
  }, [showWarningModal, isAuthenticated, onLogout, timeoutMs]);

  if (!isAuthenticated || !showWarningModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 transform animate-in zoom-in-95 duration-150">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-200">
              Keamanan Sesi Aplikasi (15 Menit)
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Sesi Anda Akan Segera Berakhir!
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem mendeteksi tidak ada aktivitas keyboard atau mouse selama 14 menit.
            </p>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-emerald-100/60 border border-emerald-200/80 text-center space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">
            Logout otomatis dalam:
          </span>
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-white border border-emerald-300 shadow-sm">
            <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-800 tracking-wider">
              00:{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Demi melindungi data sensitif penggajian SMK IT Ibnul Qayyim, sesi akan dikunci otomatis jika tidak ada konfirmasi.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onLogout(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sekarang</span>
          </button>
          
          <button
            type="button"
            onClick={handleExtendSession}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Saya Masih Aktif (Perpanjang Sesi)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
