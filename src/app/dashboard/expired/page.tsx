import React from 'react';

export const metadata = {
  title: "Subscription Expired - Pentapeaks Trade Portal",
};

export default function ExpiredPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 shadow-sm text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Subscription Expired</h2>
        <p className="text-gray-600 mb-6">
          Your account subscription has expired. You have been temporarily locked out of the dashboard features.
        </p>
        <p className="text-sm text-gray-500 font-medium">
          Please contact your administrator to renew your access to the portal.
        </p>
      </div>
    </div>
  );
}
