import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface TripChange {
  tripId: string
  changeType: 'activity_added' | 'activity_deleted' | 'activity_modified' | 'time_changed' | 'location_changed' | 'participant_added' | 'participant_removed'
  changeData: any
  oldData?: any
  affectedParticipants?: string[] // Email addresses
  createdBy?: string // User ID
}

/**
 * Track a change to a trip for end-of-day notifications
 */
export async function trackTripChange(change: TripChange): Promise<{ success: boolean; error?: string }> {
  try {
    // Create Supabase client with service role for background operations
    const supabase = createServerSupabaseClient()

    // If no specific affected participants provided, get all trip participants
    let affectedParticipants = change.affectedParticipants
    
    if (!affectedParticipants || affectedParticipants.length === 0) {
      const { data: participants } = await supabase
        .from('trip_participants')
        .select(`
          users:user_id (
            email
          )
        `)
        .eq('trip_id', change.tripId)

      if (participants && participants.length > 0) {
        affectedParticipants = participants
          .map((p: any) => p.users?.email)
          .filter(Boolean)
      }
    }

    // Insert the change record
    const { error } = await supabase
      .from('trip_changes')
      .insert({
        trip_id: change.tripId,
        change_type: change.changeType,
        change_data: change.changeData,
        old_data: change.oldData,
        affected_participants: affectedParticipants,
        created_by: change.createdBy
      })

    if (error) {
      console.error('❌ [Trip Change Tracker] Failed to track change:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ [Trip Change Tracker] Tracked ${change.changeType} for trip ${change.tripId}`)
    return { success: true }

  } catch (error) {
    console.error('❌ [Trip Change Tracker] Exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Track activity addition
 */
export async function trackActivityAdded(
  tripId: string, 
  activity: any, 
  createdBy?: string,
  affectedParticipants?: string[]
) {
  return trackTripChange({
    tripId,
    changeType: 'activity_added',
    changeData: {
      title: activity.title,
      time: activity.start_time || activity.time,
      location: activity.location || activity.address,
      duration: activity.duration,
      description: `New activity "${activity.title}" added to the trip`
    },
    affectedParticipants,
    createdBy
  })
}

/**
 * Track activity deletion
 */
export async function trackActivityDeleted(
  tripId: string, 
  activity: any, 
  createdBy?: string,
  affectedParticipants?: string[]
) {
  return trackTripChange({
    tripId,
    changeType: 'activity_deleted',
    changeData: {
      title: activity.title,
      time: activity.start_time || activity.time,
      location: activity.location || activity.address,
      description: `Activity "${activity.title}" was removed from the trip`
    },
    affectedParticipants,
    createdBy
  })
}

/**
 * Track activity modification
 */
export async function trackActivityModified(
  tripId: string, 
  newActivity: any, 
  oldActivity: any, 
  createdBy?: string,
  affectedParticipants?: string[]
) {
  const changeType = getSpecificChangeType(newActivity, oldActivity)
  
  return trackTripChange({
    tripId,
    changeType,
    changeData: {
      title: newActivity.title,
      time: newActivity.start_time || newActivity.time,
      location: newActivity.location || newActivity.address,
      duration: newActivity.duration,
      description: generateChangeDescription(newActivity, oldActivity)
    },
    oldData: {
      title: oldActivity.title,
      time: oldActivity.start_time || oldActivity.time,
      location: oldActivity.location || oldActivity.address,
      duration: oldActivity.duration
    },
    affectedParticipants,
    createdBy
  })
}

/**
 * Track participant addition
 */
export async function trackParticipantAdded(
  tripId: string, 
  participant: any, 
  createdBy?: string
) {
  return trackTripChange({
    tripId,
    changeType: 'participant_added',
    changeData: {
      name: participant.full_name || participant.name,
      email: participant.email,
      role: participant.role,
      description: `${participant.full_name || participant.name} was added to the trip`
    },
    affectedParticipants: [participant.email], // Notify the new participant
    createdBy
  })
}

/**
 * Track participant removal
 */
export async function trackParticipantRemoved(
  tripId: string, 
  participant: any, 
  createdBy?: string
) {
  return trackTripChange({
    tripId,
    changeType: 'participant_removed',
    changeData: {
      name: participant.full_name || participant.name,
      email: participant.email,
      role: participant.role,
      description: `${participant.full_name || participant.name} was removed from the trip`
    },
    affectedParticipants: [], // Don't notify the removed participant
    createdBy
  })
}

// Helper functions

function getSpecificChangeType(newActivity: any, oldActivity: any): 'activity_modified' | 'time_changed' | 'location_changed' {
  const timeChanged = (newActivity.start_time || newActivity.time) !== (oldActivity.start_time || oldActivity.time)
  const locationChanged = (newActivity.location || newActivity.address) !== (oldActivity.location || oldActivity.address)
  
  if (timeChanged && !locationChanged) {
    return 'time_changed'
  } else if (locationChanged && !timeChanged) {
    return 'location_changed'
  } else {
    return 'activity_modified'
  }
}

function generateChangeDescription(newActivity: any, oldActivity: any): string {
  const changes = []
  
  if (newActivity.title !== oldActivity.title) {
    changes.push(`title changed from "${oldActivity.title}" to "${newActivity.title}"`)
  }
  
  const newTime = newActivity.start_time || newActivity.time
  const oldTime = oldActivity.start_time || oldActivity.time
  if (newTime !== oldTime) {
    changes.push(`time changed from ${oldTime} to ${newTime}`)
  }
  
  const newLocation = newActivity.location || newActivity.address
  const oldLocation = oldActivity.location || oldActivity.address
  if (newLocation !== oldLocation) {
    changes.push(`location changed from "${oldLocation}" to "${newLocation}"`)
  }
  
  if (newActivity.duration !== oldActivity.duration) {
    changes.push(`duration changed from ${oldActivity.duration} to ${newActivity.duration}`)
  }
  
  if (changes.length === 0) {
    return `Activity "${newActivity.title}" was updated`
  }
  
  return `Activity "${newActivity.title}" updated: ${changes.join(', ')}`
}

/**
 * Get pending changes for a trip (useful for testing)
 */
export async function getPendingChanges(tripId: string): Promise<any[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('trip_changes')
    .select('*')
    .eq('trip_id', tripId)
    .is('notified_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [Trip Change Tracker] Failed to get pending changes:', error)
    return []
  }

  return data || []
}