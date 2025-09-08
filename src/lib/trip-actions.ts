'use server'

import { revalidateTag } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

// Finalize or create a trip and revalidate caches
export async function createTrip(tripId: string, userId: string) {
  const supabase = createSupabaseServiceClient()
  // Touch the trip record to ensure updated_at changes and data is persisted
  const { data, error } = await supabase
    .from('trips')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag('trips')
  revalidateTag(`trips:user:${userId}`)
  return data
}

// Cancel a trip by setting its status to cancelled and revalidating caches
export async function cancelTrip(tripId: string, userId: string) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', tripId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag('trips')
  revalidateTag(`trips:user:${userId}`)
  return { success: true }
}
