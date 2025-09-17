import React from 'react';

const VisitConfirmedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mt-4">
          Thank You for Confirming!
        </h1>
        <p className="text-gray-600 mt-2">
          Your response has been successfully recorded. We look forward to the visit.
        </p>
        <p className="text-sm text-gray-500 mt-6">
          You can now close this window.
        </p>
      </div>
    </div>
  );
};

export default VisitConfirmedPage;
