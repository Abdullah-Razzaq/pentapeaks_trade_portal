"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// 15 minutes total limit
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
// Show warning 60 seconds before limit
const WARNING_THRESHOLD_MS = 60 * 1000;

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const lastInteractionTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    lastInteractionTime.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setTimeLeft(60);
    }
  }, [showWarning]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Auto-logout error", e);
    } finally {
      router.push("/login?reason=timeout");
    }
  }, [router]);

  useEffect(() => {
    // Initialize the interaction time on mount
    if (lastInteractionTime.current === 0) {
      lastInteractionTime.current = Date.now();
    }

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    
    // Only register interactions if the warning modal isn't showing
    // If it is showing, user must explicitly click "Stay Logged In"
    const interactionListener = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach(event => window.addEventListener(event, interactionListener, { passive: true }));

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastInteractionTime.current;
      
      const timeRemaining = INACTIVITY_LIMIT_MS - elapsed;

      if (timeRemaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        handleLogout();
      } else if (timeRemaining <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(timeRemaining / 1000));
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, interactionListener));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showWarning, resetTimer, handleLogout]);

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expiring Soon</h2>
            <p className="text-sm text-gray-600 mb-6">
              You have been inactive. For your security, your session will automatically expire in <span className="font-bold text-red-500">{timeLeft} seconds</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={resetTimer}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
