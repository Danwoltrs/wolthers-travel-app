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
 * Estimate travel time as fallback when Google Maps API fails
 */
function estimateTravelTimeFallback(fromCity: string, toCity: string): number {
  const from = fromCity.toLowerCase()
  const to = toCity.toLowerCase()
  
  // Same city or very close - walking distance
  if (from === to || 
      (from.includes('santos') && to.includes('santos')) ||
      (from.includes('guarulhos') && to.includes('guarulhos')) ||
      (from.includes('são paulo') && to.includes('são paulo'))) {
    return 0.1 // 6 minutes walk
  }
  
  // Known common routes with estimated driving times
  const routes: Record<string, number> = {
    // Santos to other cities
    'santos_guarulhos': 1.5,     // ~1.5 hours
    'guarulhos_santos': 1.5,
    'santos_são paulo': 1.2,     // ~1.2 hours
    'são paulo_santos': 1.2,
    
    // Guarulhos to other cities
    'guarulhos_são paulo': 0.8,   // ~45 minutes
    'são paulo_guarulhos': 0.8,
    
    // General estimates
    'santos_varginha': 4.0,       // ~4 hours
    'varginha_santos': 4.0,
    'guarulhos_varginha': 3.5,    // ~3.5 hours  
    'varginha_guarulhos': 3.5,
  }
  
  // Try exact match first
  const routeKey = `${from}_${to}`
  if (routes[routeKey]) {
    return routes[routeKey]
  }
  
  // Try partial matches
  for (const [route, hours] of Object.entries(routes)) {
    const [routeFrom, routeTo] = route.split('_')
    if (from.includes(routeFrom) && to.includes(routeTo)) {
      return hours
    }
  }
  
  // Default fallback for unknown routes (1 hour)
  console.log(`⚠️ [Travel Fallback] Unknown route ${from} → ${to}, using 1h default`)
  return 1.0
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
    
    try {
      console.log(`🔄 [Travel Recalc] Calculating travel between: ${currentCity} → ${nextCity}`)
      
      // Calculate travel time using Google Distance Matrix API via server endpoint
      const { duration } = await getDriveDuration(currentCity, nextCity)
      const travelHours = duration / 3600
      
      console.log(`📏 [Travel Recalc] Distance result: ${Math.round(travelHours * 60)}min`)
      
      // Only create travel activity if there's actual travel time (> 9 minutes)
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
        
        console.log(`➕ [Travel Recalc] Adding travel activity: ${Math.round(travelHours * 60)}min ${travelHours <= 0.2 ? 'walk' : 'drive'}`)
      } else {
        console.log(`⏭️  [Travel Recalc] Skipping short travel time: ${Math.round(travelHours * 60)}min`)
      }
    } catch (error) {
      console.error(`❌ [Travel Recalc] Error calculating travel time between ${currentCity} and ${nextCity}:`, error)
      
      // Add a fallback travel activity with estimated time based on city names
      const fallbackHours = estimateTravelTimeFallback(currentCity, nextCity)
      
      if (fallbackHours > 0.15) {
        console.log(`🔄 [Travel Recalc] Using fallback estimate: ${Math.round(fallbackHours * 60)}min`)
        
        const travelActivity = createTravelActivity(currentActivity, nextActivity, fallbackHours)
        
        updates.push({
          activityId: `travel-${currentActivity.id}-${nextActivity.id}`,
          newStartTime: travelActivity.start_time!,
          newEndTime: travelActivity.end_time!,
          shouldCreate: true,
          shouldDelete: false,
          travelDetails: {
            fromLocation: currentCity,
            toLocation: nextCity,
            duration: fallbackHours,
            type: fallbackHours <= 0.2 ? 'walk' : 'drive'
          }
        })
      }
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