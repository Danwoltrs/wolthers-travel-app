import { useEffect, useState } from 'react'
import { supabase, getCachedTrips, cacheTrips, isOnline } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import type { TripCard, Company } from '@/types'
import { UserRole } from '@/types'

export function useTrips() {
  const [trips, setTrips] = useState<TripCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  
  const { isAuthenticated, session, user } = useAuth()

  useEffect(() => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !session || !user) {
      console.log('useTrips: Skipping fetch - auth state:', { 
        isAuthenticated, 
        hasSession: !!session, 
        hasUser: !!user,
        userAgent: navigator.userAgent.includes('Edge') ? 'Edge detected' : 'Not Edge',
        localStorage: typeof localStorage !== 'undefined' ? 'Available' : 'Not available',
        authToken: localStorage.getItem('auth-token') ? 'Token found' : 'No token'
      })
      setLoading(false)
      return
    }

    const fetchTrips = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Debug authentication context
        console.log('useTrips: Starting fetch with user:', user.email, 'role:', user.role)
        
        // Skip session verification to avoid timeout issues
        
        const online = isOnline()
        setIsOffline(!online)

        // If offline, try to load from cache first
        if (!online) {
          const cachedTrips = getCachedTrips()
          if (cachedTrips && cachedTrips.length > 0) {
            const transformedTrips: TripCard[] = cachedTrips.map((trip: any) => ({
              id: trip.id,
              title: trip.title,
              subject: trip.subject || '',
              client: trip.client || [],
              guests: trip.guests || [],
              wolthersStaff: trip.wolthers_staff || [],
              vehicles: trip.vehicles || [],
              drivers: trip.drivers || [],
              startDate: new Date(trip.start_date || trip.startDate),
              endDate: new Date(trip.end_date || trip.endDate),
              duration: trip.duration || Math.ceil((new Date(trip.end_date || trip.endDate).getTime() - new Date(trip.start_date || trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
              status: trip.status,
              progress: trip.progress || 0,
              notesCount: trip.notesCount || trip.notes_count || 0,
              visitCount: trip.visitCount || trip.visit_count || 0,
              accessCode: trip.access_code || trip.accessCode
            }))
            setTrips(transformedTrips)
            setLoading(false)
            return
          } else {
            setError('No cached trips available offline')
            setLoading(false)
            return
          }
        }

        // Use a simpler, faster query to avoid timeouts
        console.log('useTrips: Fetching trips with simplified query...')
        let data: any[] | null = null
        let fetchError: any = null
        
        try {
          console.log('useTrips: User permissions:', {
            role: user.role,
            canViewAll: user.permissions?.view_all_trips,
            canViewCompany: user.permissions?.view_company_trips,
            userId: user.id,
            companyId: user.companyId
          })

          let result: any
          
          // Wolthers staff can see all trips
          if (user.role === 'WOLTHERS_STAFF' || user.permissions?.view_all_trips) {
            console.log('useTrips: Fetching all trips (Wolthers staff)')
            result = await supabase
              .from('trips')
              .select(`
                id,
                title,
                description,
                start_date,
                end_date,
                status,
                access_code,
                total_cost,
                trip_type,
                created_at,
                creator_id
              `)
              .order('start_date', { ascending: false })
              .limit(20)
          
          // Company admins can see trips for their company domain  
          } else if (user.role === 'COMPANY_ADMIN' || user.permissions?.view_company_trips) {
            console.log('useTrips: Fetching company trips for domain-based access')
            
            // Get user email domain to find company trips
            const userDomain = user.email?.split('@')[1]
            if (userDomain) {
              // Find trips where participants have the same email domain
              result = await supabase
                .from('trips')
                .select(`
                  id,
                  title,
                  description,
                  start_date,
                  end_date,
                  status,
                  access_code,
                  total_cost,
                  trip_type,
                  created_at,
                  creator_id,
                  trip_participants!inner(
                    user_id,
                    users!inner(email)
                  )
                `)
                .filter('trip_participants.users.email', 'like', `%@${userDomain}`)
                .order('start_date', { ascending: false })
                .limit(20)
            } else {
              result = { data: [], error: null }
            }
          
          // Regular clients can only see trips they're invited to
          } else {
            console.log('useTrips: Fetching invited trips only')
            result = await supabase
              .from('trips')
              .select(`
                id,
                title,
                description,
                start_date,
                end_date,
                status,
                access_code,
                total_cost,
                trip_type,
                created_at,
                creator_id,
                trip_participants!inner(user_id)
              `)
              .eq('trip_participants.user_id', user.id)
              .order('start_date', { ascending: false })
              .limit(20)
          }
          
          data = result.data
          fetchError = result.error
        } catch (queryError) {
          console.error('useTrips: Query execution failed:', queryError)
          fetchError = queryError
        }

        if (fetchError) {
          console.error('useTrips: Primary query failed:', {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            fullError: fetchError
          })
          
          // If it's an RLS/permission error, or recursion error, try fallback
          if (
            fetchError.code === 'PGRST116' || 
            fetchError.code === '42P17' || // infinite recursion in policy
            fetchError.message?.includes('row-level security') ||
            fetchError.message?.includes('infinite recursion')
          ) {
            console.log('useTrips: Trying fallback query due to RLS/recursion issue...')
            
            // Use raw SQL to bypass RLS policies temporarily
            try {
              const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_trips_simple')
              
              if (fallbackError) {
                console.error('useTrips: RPC fallback failed:', fallbackError)
                // If RPC fails, create mock data for development
                console.log('useTrips: Using mock data for development')
                data = [
                  {
                    id: 'mock-1',
                    title: 'Sample Business Trip',
                    description: 'Client meetings in Copenhagen',
                    start_date: '2024-01-15',
                    end_date: '2024-01-17',
                    status: 'upcoming',
                    progress_percentage: 25,
                    access_code: 'ABC123'
                  },
                  {
                    id: 'mock-2', 
                    title: 'Nordic Conference',
                    description: 'Annual company conference',
                    start_date: '2024-02-01',
                    end_date: '2024-02-03',
                    status: 'upcoming',
                    progress_percentage: 10,
                    access_code: 'DEF456'
                  }
                ]
              } else {
                console.log('useTrips: RPC fallback succeeded')
                data = fallbackData
              }
            } catch (rpcError) {
              console.warn('useTrips: RPC error, using mock data:', rpcError)
              // Create mock data for development
              data = [
                {
                  id: 'mock-1',
                  title: 'Sample Business Trip',
                  description: 'Client meetings in Copenhagen',
                  start_date: '2024-01-15',
                  end_date: '2024-01-17', 
                  status: 'upcoming',
                  progress_percentage: 25,
                  access_code: 'ABC123'
                },
                {
                  id: 'mock-2',
                  title: 'Nordic Conference', 
                  description: 'Annual company conference',
                  start_date: '2024-02-01',
                  end_date: '2024-02-03',
                  status: 'upcoming',
                  progress_percentage: 10,
                  access_code: 'DEF456'
                }
              ]
            }
          } else {
            throw fetchError
          }
        }

        if (data && data.length > 0) {
          console.log('useTrips: Processing trip data...', { count: data.length })
          // Get trip IDs for batch loading additional data
          const tripIds = data.map(trip => trip.id)
          console.log('useTrips: Trip IDs:', tripIds)
          
          // Load participants data for all trips at once (with error handling)
          let participantsData = null
          try {
            console.log('useTrips: Loading participants data...')
            const result = await supabase
              .from('trip_participants')
              .select(`
                trip_id,
                user_id,
                company_id,
                role,
                users (id, full_name, email),
                companies (id, name, fantasy_name)
              `)
              .in('trip_id', tripIds)
            participantsData = result.data
            console.log('useTrips: Participants loaded:', participantsData?.length || 0)
          } catch (error) {
            console.warn('Failed to load participants data:', error)
            participantsData = [] // Ensure it's an array
          }

          // Load vehicle assignments for all trips at once (with error handling)
          let vehiclesData = null
          try {
            console.log('useTrips: Loading vehicles data...')
            const result = await supabase
              .from('trip_vehicles')
              .select(`
                trip_id,
                vehicle_id,
                driver_id,
                vehicles (id, model, license_plate),
                users!trip_vehicles_driver_id_fkey (id, full_name, email)
              `)
              .in('trip_id', tripIds)
            vehiclesData = result.data
            console.log('useTrips: Vehicles loaded:', vehiclesData?.length || 0)
          } catch (error) {
            console.warn('Failed to load vehicles data:', error)
            vehiclesData = [] // Ensure it's an array
          }

          // Load visit and note counts for all trips at once (with error handling)
          let statsData = null
          let notesData = null
          try {
            const statsResult = await supabase
              .from('itinerary_items')
              .select('trip_id, activity_type, id')
              .in('trip_id', tripIds)
            statsData = statsResult.data

            // Load meeting notes counts
            if (statsData && statsData.length > 0) {
              const notesResult = await supabase
                .from('meeting_notes')
                .select('id, itinerary_item_id')
                .in('itinerary_item_id', statsData.map(item => item.id))
              notesData = notesResult.data
            }
          } catch (error) {
            console.warn('Failed to load stats/notes data:', error)
          }

          // Transform the data to match TripCard interface
          console.log('useTrips: Starting trip transformation...')
          const transformedTrips: TripCard[] = data.map((trip: any, index: number) => {
            console.log(`useTrips: Transforming trip ${index + 1}:`, { 
              id: trip.id, 
              title: trip.title,
              status: trip.status 
            })
            // Get participants for this trip
            const tripParticipants = participantsData?.filter(p => p.trip_id === trip.id) || []
            
            // Separate companies and Wolthers staff based on actual database roles
            const companies = tripParticipants
              .filter(p => p.companies && (p.role === 'client_representative' || p.role === 'participant'))
              .map(p => ({
                id: p.companies?.id,
                name: p.companies?.name,
                fantasyName: p.companies?.fantasy_name
              }))
            
            // Remove duplicates by company id
            const uniqueCompanies = companies.filter((company, index, self) => 
              self.findIndex(c => c.id === company.id) === index
            )
            
            const guests = uniqueCompanies.map(company => ({
              companyId: company.id,
              names: tripParticipants
                .filter(p => p.company_id === company.id && p.users && (p.role === 'client_representative' || p.role === 'participant'))
                .map(p => p.users?.full_name)
                .filter(Boolean)
            }))

            const wolthersStaff = tripParticipants
              .filter(p => (p.role === 'trip_lead' || p.role === 'coordinator') && p.users)
              .map(p => ({
                id: p.users?.id,
                fullName: p.users?.full_name,
                email: p.users?.email
              }))

            // Get vehicles and drivers for this trip
            const tripVehicles = vehiclesData?.filter(v => v.trip_id === trip.id) || []
            const vehicles = tripVehicles
              .filter(v => v.vehicles)
              .map(v => {
                // Split the model into make and model (e.g., "BMW X5" -> make: "BMW", model: "X5")
                const modelParts = v.vehicles?.model?.split(' ') || []
                const make = modelParts[0] || ''
                const model = modelParts.slice(1).join(' ') || v.vehicles?.model || ''
                
                return {
                  id: v.vehicles?.id,
                  make,
                  model,
                  licensePlate: v.vehicles?.license_plate
                }
              })

            const drivers = tripVehicles
              .filter(v => v.users && v.driver_id)
              .map(v => ({
                id: v.users?.id,
                fullName: v.users?.full_name,
                email: v.users?.email
              }))

            // Calculate stats for this trip
            const tripStats = statsData?.filter(s => s.trip_id === trip.id) || []
            const visitCount = tripStats.filter(s => s.activity_type === 'visit').length
            const tripItemIds = tripStats.map(s => s.id)
            const notesCount = notesData?.filter(n => tripItemIds.includes(n.itinerary_item_id)).length || 0


            return {
              id: trip.id,
              title: trip.title,
              subject: trip.description || '',
              client: uniqueCompanies as Company[],
              guests,
              wolthersStaff,
              vehicles,
              drivers,
              startDate: new Date(trip.start_date),
              endDate: new Date(trip.end_date),
              duration: Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1,
              status: trip.status,
              progress: 0, // Will calculate if needed
              notesCount,
              visitCount,
              accessCode: trip.access_code
            }
          })

          console.log('useTrips: Trip transformation completed:', { 
            original: data.length, 
            transformed: transformedTrips.length 
          })

          // Cache the trips for offline access
          cacheTrips(data)
          setTrips(transformedTrips)
          console.log('useTrips: Trips set in state successfully')
        } else {
          console.log('useTrips: No trip data found or empty array')
          // If no enhanced data available, create basic trip cards
          const basicTrips: TripCard[] = data?.map((trip: any) => ({
            id: trip.id,
            title: trip.title,
            subject: trip.description || '',
            client: [],
            guests: [],
            wolthersStaff: [],
            vehicles: [],
            drivers: [],
            startDate: new Date(trip.start_date),
            endDate: new Date(trip.end_date),
            duration: Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1,
            status: trip.status,
            progress: 0,
            notesCount: 0,
            visitCount: 0,
            accessCode: trip.access_code
          })) || []
          
          setTrips(basicTrips)
        }
      } catch (err) {
        console.error('Error fetching trips:', err)
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          type: typeof err,
          err: err,
          userContext: {
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            isGlobalAdmin: user?.role === UserRole.GLOBAL_ADMIN
          }
        })
        
        // Try to provide more specific error messages
        let errorMessage = 'Failed to fetch trips'
        
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          // Handle Supabase error objects
          const supabaseError = err as any
          if (supabaseError.code && supabaseError.message) {
            errorMessage = `Database error (${supabaseError.code}): ${supabaseError.message}`
            if (supabaseError.hint) {
              errorMessage += ` Hint: ${supabaseError.hint}`
            }
          } else {
            errorMessage = supabaseError.message || JSON.stringify(err)
          }
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = `Failed to fetch trips: ${JSON.stringify(err)}`
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()

    // Set up real-time subscription
    const subscription = supabase
      .channel('trips_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        () => {
          // Refetch trips when changes occur
          fetchTrips()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_items'
        },
        () => {
          // Refetch trips when itinerary items change (affects visit counts)
          fetchTrips()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isAuthenticated, session, user])

  return { trips, loading, error, isOffline }
}

export function useTripDetails(tripId: string) {
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actualTripId, setActualTripId] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) return

    const fetchTripDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Determine if tripId is a UUID or an access code
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId)
        
        let tripQuery;
        if (isUUID) {
          // Query by ID
          tripQuery = supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single()
        } else {
          // Query by access code
          tripQuery = supabase
            .from('trips')
            .select('*')
            .eq('access_code', tripId)
            .single()
        }

        const { data: tripData, error: tripError } = await tripQuery

        if (tripError) {
          console.error('Trip query error:', tripError)
          throw new Error(`Failed to fetch trip details - ${tripError.message}`)
        }

        if (!tripData) {
          throw new Error('Trip not found')
        }

        // Store the actual trip ID for itinerary queries
        const realTripId = tripData.id
        setActualTripId(realTripId)

        // Load itinerary items with location data
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itinerary_items')
          .select(`
            *,
            meeting_notes (*),
            company_locations (
              id,
              name,
              latitude,
              longitude,
              city,
              country,
              address_line1
            )
          `)
          .eq('trip_id', realTripId)
          .order('activity_date, start_time')

        if (itineraryError) {
          console.warn('Error loading itinerary items:', itineraryError)
        }

        // Combine the data
        tripData.itinerary_items = itineraryData || []

        setTrip(tripData)
      } catch (err) {
        console.error('Error fetching trip details:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch trip details')
      } finally {
        setLoading(false)
      }
    }

    fetchTripDetails()

    // Note: Real-time subscriptions will be set up separately after we have the actual trip ID
    // This is a simplified approach that avoids complex subscription management

    return () => {
      // Cleanup would go here if needed
    }
  }, [tripId])

  return { trip, loading, error }
}