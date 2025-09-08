'use server'

import { revalidateTag } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { sendTripNotification } from '@/lib/send-trip-notification'

// Finalize or create a trip and revalidate caches
export async function createTrip(tripId: string, userId: string, clientMutationId?: string) {
  const supabase = createSupabaseServiceClient()

  if (clientMutationId) {
    const { error: mutationError } = await supabase
      .from('mutations')
      .insert({ id: clientMutationId, user_id: userId, operation: 'create_trip' })
      .select('id')
      .single()
    if (mutationError) {
      if (mutationError.code === '23505') {
        return null
      }
      throw new Error(mutationError.message)
    }
  }

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
  await sendTripNotification({ type: 'created', tripId })
  return data
}

// Cancel a trip by setting its status to cancelled and revalidating caches
export async function cancelTrip(tripId: string, userId: string, clientMutationId?: string) {
  const supabase = createSupabaseServiceClient()

  if (clientMutationId) {
    const { error: mutationError } = await supabase
      .from('mutations')
      .insert({ id: clientMutationId, user_id: userId, operation: 'cancel_trip' })
      .select('id')
      .single()
    if (mutationError) {
      if (mutationError.code === '23505') {
        return { success: true }
      }
      throw new Error(mutationError.message)
    }
  }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', tripId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag('trips')
  revalidateTag(`trips:user:${userId}`)
  await sendTripNotification({ type: 'cancelled', tripId })
  return { success: true }
}
