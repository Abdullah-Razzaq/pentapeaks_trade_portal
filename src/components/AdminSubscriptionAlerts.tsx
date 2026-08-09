"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Subscription = {
  id: number;
  subscription_name: string;
  start_date: string;
  renew_date: string;
  alert_date: string;
  is_active: boolean;
};

export default function AdminSubscriptionAlerts() {
  const [alerts, setAlerts] = useState<Subscription[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_sub_alert_dismissed") === "true") return;
    
    fetch("/api/admin/subscriptions/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
          setShowModal(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("admin_sub_alert_dismissed", "true");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-center gap-3">
          <div className="bg-red-100 text-red-600 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-900">Subscription Renewals Due!</h2>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4 font-medium">
            Attention: The following subscriptions are renewing within 2 days! Check your plans.
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {alerts.map((sub) => (
              <div key={sub.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">{sub.subscription_name}</h4>
                  <p className="text-sm text-red-600 font-medium">Renews: {new Date(sub.renew_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={handleDismiss}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
          >
            Dismiss
          </button>
          <Link 
            href="/dashboard/admin/subscriptions"
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Manage Subscriptions
          </Link>
        </div>
      </div>
    </div>
  );
}
