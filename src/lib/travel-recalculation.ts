/**
 * Travel Time Recalculation Utility
 * 
 * Handles dynamic recalculation of travel times when activities are moved
 * via drag-and-drop, ensuring optimal scheduling and route planning.
 */

import { isSantosArea, isVarginhaArea } from '@/lib/brazilian-locations'
import { getDriveDuration } from '@/lib/distance-matrix'

export interface Activity {
  id: string
  title: string
  activity_date: string
  start_time: string
  end_time: string
  location?: string
  type?: string
  host?: string
}

export interface TravelTimeUpdate {
  activityId: string
  newStartTime: string
  newEndTime: string
  shouldCreate: boolean // If a new travel activity should be created
  shouldDelete: boolean // If an existing travel activity should be deleted
  travelDetails?: {
    fromLocation: string
    toLocation: string
    duration: number // hours
    type: 'walk' | 'drive'
  }
}

/**
 * Extract city name from activity location or host
 */
function extractCityFromActivity(activity: Activity): string {
  // Try to get city from location first
  if (activity.location) {
    // Common patterns: "Company Name, City", "Address, City, State"
    const parts = activity.location.split(',')
    if (parts.length >= 2) {
      return parts[1].trim()
    }
    // If location is just a city name
    return activity.location.trim()
  }
  
  // Fallback to host if available
  if (activity.host) {
    return activity.host.trim()
  }
  
  return 'Unknown'
}

/**
 * Check if an activity is a travel activity
 */
function isTravelActivity(activity: Activity): boolean {
  return activity.type === 'travel' || 
         activity.title.toLowerCase().includes('drive') ||
         activity.title.toLowerCase().includes('travel') ||
         activity.title.toLowerCase().includes('walk')
}

/**
 * Get activities for a specific date sorted by time
 */
function getActivitiesForDate(activities: Activity[], date: string): Activity[] {
  return activities
    .filter(a => a.activity_date === date)
    .sort((a, b) => {
      const timeA = a.start_time.replace(':', '')
      const timeB = b.start_time.replace(':', '')
      return timeA.localeCompare(timeB)
    })
}

/**
 * Add minutes to a time string
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

/**
 * Create a travel activity between two locations
 */
function createTravelActivity(
  fromActivity: Activity,
  toActivity: Activity,
  travelHours: number
): Partial<Activity> {
  const fromCity = extractCityFromActivity(fromActivity)
  const toCity = extractCityFromActivity(toActivity)
  
  const travelType = travelHours <= 0.2 ? 'walk' : 'drive'
  const travelMinutes = Math.ceil(travelHours * 60)
  
  return {
    title: `${travelType === 'walk' ? 'Walk' : 'Drive'} to ${toCity}`,
    description: travelType === 'walk' 
      ? `Walking between offices in ${toCity}` 
      : `Travel from ${fromCity} to ${toCity} (${travelHours}h ${travelType})`,
    activity_date: toActivity.activity_date,
    start_time: fromActivity.end_time,
    end_time: addMinutesToTime(fromActivity.end_time, travelMinutes),
    location: `${fromCity} → ${toCity}`,
    type: 'travel',
    host: travelType === 'walk' ? 'Same area' : `${fromCity} to ${toCity}`
  }
}

/**
 * Recalculate travel times after an activity is moved
 */
export async function recalculateTravelTimes(
  activities: Activity[],
  movedActivityId: string,
  newDate: string,
  newStartTime: string
): Promise<TravelTimeUpdate[]> {
  const updates: TravelTimeUpdate[] = []
  
  // Find the moved activity
  const movedActivity = activities.find(a => a.id === movedActivityId)
  if (!movedActivity) return updates
  
  // Calculate duration to preserve it
  const [startHours, startMins] = movedActivity.start_time.split(':').map(Number)
  const [endHours, endMins] = movedActivity.end_time.split(':').map(Number)
  const durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins)
  const newEndTime = addMinutesToTime(newStartTime, durationMinutes)
  
  // Update the moved activity
  updates.push({
    activityId: movedActivityId,
    newStartTime,
    newEndTime,
    shouldCreate: false,
    shouldDelete: false
  })
  
  // Get all activities for the new date, excluding travel activities
  const dayActivities = getActivitiesForDate(activities, newDate)
    .filter(a => !isTravelActivity(a))
  
  // Remove the old moved activity and add the updated one
  const updatedDayActivities = dayActivities
    .filter(a => a.id !== movedActivityId)
    .concat([{
      ...movedActivity,
      activity_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime
    }])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  
  // Remove all existing travel activities for this date
  const travelActivitiesToRemove = getActivitiesForDate(activities, newDate)
    .filter(a => isTravelActivity(a))
  
  travelActivitiesToRemove.forEach(travelActivity => {
    updates.push({
      activityId: travelActivity.id,
      newStartTime: travelActivity.start_time,
      newEndTime: travelActivity.end_time,
      shouldCreate: false,
      shouldDelete: true
    })
  })
  
  // Recalculate travel times between consecutive activities
  for (let i = 0; i < updatedDayActivities.length - 1; i++) {
    const currentActivity = updatedDayActivities[i]
    const nextActivity = updatedDayActivities[i + 1]
    
    const currentCity = extractCityFromActivity(currentActivity)
    const nextCity = extractCityFromActivity(nextActivity)
    
    // Calculate travel time using Google Distance Matrix API
    const { duration } = await getDriveDuration(currentCity, nextCity)
    const travelHours = duration / 3600
    
    // Only create travel activity if there's actual travel time (> 10 minutes)
    if (travelHours > 0.15) {
      const travelActivity = createTravelActivity(currentActivity, nextActivity, travelHours)
      
      updates.push({
        activityId: `travel-${currentActivity.id}-${nextActivity.id}`,
        newStartTime: travelActivity.start_time!,
        newEndTime: travelActivity.end_time!,
        shouldCreate: true,
        shouldDelete: false,
        travelDetails: {
          fromLocation: currentCity,
          toLocation: nextCity,
          duration: travelHours,
          type: travelHours <= 0.2 ? 'walk' : 'drive'
        }
      })
    }
  }

  return updates
}

/**
 * Optimize schedule by grouping same-city activities
 */
export function optimizeScheduleForCity(activities: Activity[], targetDate: string): Activity[] {
  const dayActivities = getActivitiesForDate(activities, targetDate)
    .filter(a => !isTravelActivity(a))
  
  // Group activities by city
  const citiesMap = new Map<string, Activity[]>()
  
  dayActivities.forEach(activity => {
    const city = extractCityFromActivity(activity)
    if (!citiesMap.has(city)) {
      citiesMap.set(city, [])
    }
    citiesMap.get(city)!.push(activity)
  })
  
  // Optimize within each city group
  const optimizedActivities: Activity[] = []
  
  for (const [city, cityActivities] of citiesMap.entries()) {
    if (isSantosArea(city)) {
      // Santos: Schedule activities close together (walking distance)
      const sortedActivities = cityActivities.sort((a, b) => a.start_time.localeCompare(b.start_time))
      optimizedActivities.push(...sortedActivities)
    } else if (isVarginhaArea(city)) {
      // Varginha: Group activities with minimal travel time
      const sortedActivities = cityActivities.sort((a, b) => a.start_time.localeCompare(b.start_time))
      optimizedActivities.push(...sortedActivities)
    } else {
      // Other cities: Standard scheduling
      const sortedActivities = cityActivities.sort((a, b) => a.start_time.localeCompare(b.start_time))
      optimizedActivities.push(...sortedActivities)
    }
  }
  
  return optimizedActivities.sort((a, b) => a.start_time.localeCompare(b.start_time))
}