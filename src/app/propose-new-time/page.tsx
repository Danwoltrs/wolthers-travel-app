'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// We wrap the main component in Suspense to handle the initial render while useSearchParams is ready.
const ProposeNewTimePage = () => (
  <Suspense fallback={<LoadingState />}>
    <ProposeNewTimeContent />
  </Suspense>
);

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
      <h1 className="text-2xl font-bold text-gray-800">Loading available times...</h1>
      <p className="text-gray-600 mt-2">Please wait a moment.</p>
    </div>
  </div>
);

const ProposeNewTimeContent = () => {
  const searchParams = useSearchParams();
  const meetingId = searchParams.get('meetingId');

  const [isLoading, setIsLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; time: string }[]>([]);
  const [creatorContact, setCreatorContact] = useState<{ name: string; phone: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!meetingId) {
      setError('No meeting specified. Please use the link from your email.');
      setIsLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      try {
        const response = await fetch(`/api/availability?meetingId=${meetingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch available slots.');
        }
        const data = await response.json();
        setAvailableSlots(data.availableSlots || []);
        setCreatorContact(data.creatorContact || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [meetingId]);

  const handleSlotSelection = async (slot: { date: string; time: string }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/propose-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          newDate: slot.date,
          newTime: slot.time,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit new time proposal.');
      }

      setSelection(`Your proposal for ${new Date(slot.date + 'T00:00:00').toLocaleDateString()} at ${slot.time} has been sent.`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-700">An Error Occurred</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }
  
  if (selection) {
      return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-gray-800">Thank You!</h1>
            <p className="text-gray-600 mt-2">{selection}</p>
            <p className="text-gray-600 mt-2">The trip organizer has been notified of your proposed new time.</p>
        </div>
      </div>
      )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800">Propose a New Time</h1>
        <p className="text-gray-600 mt-2 mb-6">
          The original time was not convenient. Please select one of the available alternative slots below.
        </p>

        {availableSlots.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-700">Available Slots:</h2>
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotSelection(slot)}
                disabled={isSubmitting}
                className="w-full text-left p-4 bg-gray-100 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                <span className="font-semibold">{new Date(slot.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="ml-4 text-gray-700">at {slot.time}</span>
              </button>
            ))}
            {isSubmitting && <p className="text-gray-600 mt-4">Submitting your proposal...</p>}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Alternative Slots Found</h2>
            <p className="text-gray-600">
              Unfortunately, our automated search could not find any immediate alternative time slots.
            </p>
            <p className="text-gray-600 mt-4">
              Please contact the trip organizer, <strong>{creatorContact?.name || 'Wolthers Team'}</strong>, directly to arrange a new time.
            </p>
            {creatorContact?.phone && (
              <p className="text-gray-800 font-semibold mt-2">
                WhatsApp: {creatorContact.phone}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposeNewTimePage;