import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendTripItineraryEmails, sendHostVisitConfirmationEmail } from '@/lib/resend'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!

const normalizeText = (value?: string): string => {
  if (!value) return ''
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  } catch (error) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }
}

const stripCompanySuffixes = (value?: string): string => {
  if (!value) return ''
  return value
    .replace(/\b(LTDA\.?|Ltda\.?|Ltd\.?|S\.?A\.?|SA|A\/G|AG|LLC|INC\.?|Incorporated|Corp\.?|Corporation)\b/gi, '')
    .replace(/\b(Exportacao|Exportação|Importacao|Importação|Comercio|Comércio|Industria|Indústria|Agroindustrial|Cooperativa|Holdings?)\b/gi, '')
    .replace(/[()]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const getPossibleCompanyNames = (company: any): string[] => {
  const keys = [
    'fantasy_name',
    'fantasyName',
    'display_name',
    'displayName',
    'nickname',
    'short_name',
    'shortName',
    'companyName',
    'company_name',
    'legal_name',
    'legalName',
    'name'
  ]

  const names = new Set<string>()
  keys.forEach(key => {
    const value = company?.[key]
    if (typeof value === 'string' && value.trim()) {
      names.add(value.trim())
    }
  })

  return Array.from(names)
}

const getCompanyDisplayLabel = (company: any): string => {
  const possibleNames = getPossibleCompanyNames(company)
  if (possibleNames.length === 0) return 'Company'

  const cleaned = possibleNames
    .map(name => stripCompanySuffixes(name))
    .filter(Boolean)

  if (cleaned.length === 0) {
    return stripCompanySuffixes(possibleNames[0]) || 'Company'
  }

  return cleaned.reduce((shortest, current) => {
    if (!shortest) return current
    return current.length < shortest.length ? current : shortest
  }, cleaned[0])
}

const isLikelyHostCompany = (company: any): boolean => {
  if (!company) return false
  if (company.isHost || company.is_host) return true
  if (company.hostName || company.host_name) return true
  if (Array.isArray(company.hosts) && company.hosts.length > 0) return true

  const role = normalizeText(company.role || company.companyRole || company.type)
  if (role.includes('host')) return true

  const category = normalizeText(company.category || company.companyCategory || company.segment)
  if (category.includes('host')) return true

  return false
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Create Trip API] Starting trip creation...')
    
    // Authentication
    const authCookie = request.cookies.get('auth-token')
    if (!authCookie) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(authCookie.value, JWT_SECRET) as { userId: string }
    const userId = decoded.userId

    console.log('✅ [Create Trip API] User authenticated:', userId)

    const supabase = createServerSupabaseClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, companies(name)')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [Create Trip API] User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('👤 [Create Trip API] User found:', user.email)

    // Parse request body
    const tripData = await request.json()
    console.log('📝 [Create Trip API] Trip data received:', {
      title: tripData.title,
      type: tripData.tripType,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      staffCount: tripData.participants?.length || 0,
      companiesCount: tripData.companies?.length || 0,
      activitiesCount: tripData.activities?.length || 0,
      generatedActivitiesCount: tripData.generatedActivities?.length || 0,
      hasVehicle: !!tripData.vehicle,
      hasDriver: !!tripData.driver,
      hasVehicles: !!(tripData.vehicles?.length),
      hasDrivers: !!(tripData.drivers?.length)
    })

    // Debug log the full structure for critical data
    if (tripData.generatedActivities?.length > 0) {
      console.log('📅 [Create Trip API] Generated activities sample:', tripData.generatedActivities.slice(0, 2))
    }
    if (tripData.participants?.length > 0) {
      console.log('👥 [Create Trip API] Participants sample:', tripData.participants.slice(0, 2))
    }

    // Generate access code with priority system (same as progressive save)
    let accessCode = tripData.accessCode
    console.log('🎫 [Create Trip API] Access code generation - analyzing priority sources:')
    console.log('  - tripData.accessCode (predefined):', tripData.accessCode)
    console.log('  - Request body accessCode:', tripData.accessCode)
    
    // Priority 1: Use predefined accessCode if provided (for SCTA-25, NCA-26, BLASER-SEP25, etc.)
    if (tripData.accessCode && typeof tripData.accessCode === 'string' && tripData.accessCode.trim()) {
      accessCode = tripData.accessCode.trim()
      console.log('✅ [Create Trip API] Using predefined accessCode:', accessCode)
    }
    // Priority 2: Generate if no predefined code found
    else {
      console.log('🔄 [Create Trip API] No predefined code found, generating...')
      
      // Import the same logic as progressive save
      const { makeTripSlug } = await import('@/lib/tripCodeGenerator')
      
      const companies = tripData.companies || []
      const startDate = new Date(tripData.startDate || new Date())
      
      // Use the same business logic as progressive save
      const baseSlug = makeTripSlug({
        trip_type: mapTripType(tripData.tripType || 'business'),
        companies: companies,
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
        code: null, // No predefined code
        title: tripData.title
      })
      
      // Ensure uniqueness using database function
      try {
        const { data: uniqueSlug } = await supabase
          .rpc('generate_unique_trip_slug', {
            base_slug: baseSlug,
            creator_user_id: userId
          })
        
        accessCode = uniqueSlug || baseSlug
        console.log('✅ [Create Trip API] Generated unique code:', accessCode)
      } catch (error) {
        console.warn('⚠️ [Create Trip API] Database slug generation failed, using fallback:', error)
        // Fallback to simple generation
        const codeBase = tripData.title ? tripData.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() : 'TRIP'
        const dateCode = new Date().getMonth().toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0')
        const randomCode = Math.floor(Math.random() * 999).toString().padStart(3, '0')
        accessCode = `${codeBase}_${dateCode}_${randomCode}`
        console.log('⚠️ [Create Trip API] Using fallback code:', accessCode)
      }
    }
    
    console.log('🎫 [Create Trip API] Final access code to use:', accessCode)

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: tripData.title,
        access_code: accessCode,
        trip_type: tripData.tripType,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        creator_id: userId,
        status: 'confirmed', // Mark as confirmed since all data is being added
        completion_step: 6, // Mark as completed since all data is being added
        step_data: {
          basicInfo: {
            title: tripData.title,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            type: tripData.tripType
          },
          participants: tripData.participants || [],
          companies: tripData.companies || [],
          activities: tripData.activities || [],
          accommodation: tripData.accommodation,
          transportation: tripData.transportation,
          vehicle: tripData.vehicle,
          driver: tripData.driver
        }
      })
      .select()
      .single()

    if (tripError) {
      console.error('❌ [Create Trip API] Failed to create trip:', tripError)
      return NextResponse.json({ 
        error: 'Failed to create trip', 
        details: tripError.message 
      }, { status: 500 })
    }

    console.log('✅ [Create Trip API] Trip created:', trip.id)
    
    // Force update status and completion_step to override database defaults
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        status: 'confirmed', // Override default 'planning'
        completion_step: 6   // Override default 0
      })
      .eq('id', trip.id)

    if (updateError) {
      console.error('⚠️ [Create Trip API] Failed to update status/completion:', updateError)
    } else {
      console.log('✅ [Create Trip API] Updated trip status to confirmed and completion_step to 6')
    }

    // Create trip participants for Wolthers staff
    if (tripData.participants && tripData.participants.length > 0) {
      const participantInserts = tripData.participants.map((participant: any) => ({
        trip_id: trip.id,
        user_id: participant.id,
        role: 'staff',
        email_sent: false,
        participation_start_date: tripData.startDate,
        participation_end_date: tripData.endDate
      }))

      const { error: participantsError } = await supabase
        .from('trip_participants')
        .insert(participantInserts)

      if (participantsError) {
        console.error('⚠️ [Create Trip API] Failed to add participants:', participantsError)
        console.error('⚠️ [Create Trip API] Participant insert data sample:', participantInserts.slice(0, 2))
        // Don't fail the trip creation, but log the error for debugging
      } else {
        console.log('✅ [Create Trip API] Added trip participants:', participantInserts.length)
      }
    }

    // Create external company participants (hosts/guests)
    if (tripData.companies && tripData.companies.length > 0) {
      for (const company of tripData.companies) {
        // Handle selected contacts from multiple fields to support legacy data
        const contacts = company.selectedContacts || company.participants || company.representatives || []
        const isHostCompany = company.isHost || company.role === 'host'

        if (contacts && contacts.length > 0) {
          console.log(`👤 [Create Trip API] Creating participants for ${company.name || company.fantasy_name}:`, contacts.length)

          for (const contact of contacts) {
            if (!contact?.email && !isHostCompany) {
              console.warn(`⚠️ [Create Trip API] Skipping guest without email for ${company.name || company.fantasy_name}`)
              continue
            }

            // Try to find existing user first
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', contact.email)
              .single()

            let participantUserId = existingUser?.id

            // If no existing user, create a guest entry with UUID
            if (!participantUserId) {
              participantUserId = crypto.randomUUID()
            }

            const role = isHostCompany ? 'host' : 'guest'

            const participantData = {
              trip_id: trip.id,
              user_id: participantUserId,
              role,
              email_sent: false,
              participation_start_date: tripData.startDate,
              participation_end_date: tripData.endDate,
              guest_name: existingUser ? null : (contact.name || contact.full_name || contact.fullName || contact.email || 'Guest'),
              guest_email: existingUser ? null : contact.email || null,
              guest_company: existingUser ? null : (company.name || company.fantasy_name),
              company_id: company.id
            }

            const { error: participantError } = await supabase
              .from('trip_participants')
              .insert(participantData)

            if (participantError) {
              console.error(`⚠️ [Create Trip API] Failed to add participant ${contact.name || contact.email}:`, participantError)
              // Don't fail the trip creation, just log the error
            } else {
              console.log(`✅ [Create Trip API] Added ${role} ${contact.name || contact.email || 'Representative'} for ${company.name || company.fantasy_name}`)
            }
          }
        }
      }
      console.log('✅ [Create Trip API] Processed external company participants')
    }

    // Create calendar activities - use generatedActivities from calendar step
    const activitiesToCreate = tripData.generatedActivities || tripData.activities || []
    if (activitiesToCreate.length > 0) {
      console.log('📅 [Create Trip API] Creating calendar activities:', activitiesToCreate.length)
      
      const activityInserts = activitiesToCreate.map((activity: any) => ({
        trip_id: trip.id,
        title: activity.title,
        description: activity.description || '',
        activity_date: activity.activity_date || new Date(activity.start_time).toISOString().split('T')[0],
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: activity.location || '',
        type: activity.type || 'meeting',
        activity_type: activity.activity_type || activity.type || 'meeting',
        priority_level: activity.priority || 'medium',
        notes: activity.notes || '',
        visibility_level: activity.visibility_level || 'all',
        is_confirmed: activity.is_confirmed || false,
        company_id: activity.company_id || null,
        company_name: activity.company_name || null,
        host: activity.host || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activityInserts)

      if (activitiesError) {
        console.error('❌ [Create Trip API] Failed to create calendar activities:', activitiesError)
        console.error('❌ [Create Trip API] Activity insert data sample:', activityInserts.slice(0, 2))
        // Don't fail the trip creation, but log the error for debugging
      } else {
        console.log('✅ [Create Trip API] Created calendar activities successfully')
      }
    }

    // Create vehicle assignments - handle both single and array formats
    const vehicles = tripData.vehicles || (tripData.vehicle ? [tripData.vehicle] : [])
    const drivers = tripData.drivers || (tripData.driver ? [tripData.driver] : [])
    
    if (vehicles.length > 0 || drivers.length > 0) {
      console.log('🚗 [Create Trip API] Creating vehicle/driver assignments...', { 
        vehicles: vehicles.length, 
        drivers: drivers.length 
      })
      
      const vehicleInserts = []
      
      // If we have both vehicles and drivers, pair them up
      if (vehicles.length > 0 && drivers.length > 0) {
        const maxLength = Math.max(vehicles.length, drivers.length)
        for (let i = 0; i < maxLength; i++) {
          const vehicle = vehicles[i % vehicles.length]
          const driver = drivers[i % drivers.length]
          
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: vehicle.id,
            driver_id: driver.id,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } else if (vehicles.length > 0) {
        // Only vehicles, no drivers
        for (const vehicle of vehicles) {
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: vehicle.id,
            driver_id: null,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } else if (drivers.length > 0) {
        // Only drivers, no vehicles
        for (const driver of drivers) {
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: null,
            driver_id: driver.id,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
      
      if (vehicleInserts.length > 0) {
        const { error: vehicleError } = await supabase
          .from('trip_vehicles')
          .insert(vehicleInserts)
        
        if (vehicleError) {
          console.error('⚠️ [Create Trip API] Failed to create vehicle/driver assignments:', vehicleError)
          console.error('⚠️ [Create Trip API] Vehicle insert data sample:', vehicleInserts.slice(0, 2))
          // Don't fail the trip creation, but log the error for debugging
        } else {
          console.log('✅ [Create Trip API] Vehicle/driver assignments created successfully')
        }
      }
    }

    // Send trip itinerary emails and host invitations
    try {
      console.log('📧 [Create Trip API] Preparing itinerary email data...')

      const formatTime = (timeValue: string | undefined, fallbackDate: string | null = null) => {
        if (!timeValue) return ''
        try {
          if (timeValue.includes('T')) {
            const parsed = new Date(timeValue)
            if (!isNaN(parsed.getTime())) {
              return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }
          }

          const referenceDate = fallbackDate || tripData.startDate || new Date().toISOString().split('T')[0]
          const parsed = new Date(`${referenceDate}T${timeValue}`)
          if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
        } catch (error) {
          console.warn('⚠️ [Create Trip API] Failed to format time value:', timeValue, error)
        }
        return timeValue
      }

      const rawActivities = (activitiesToCreate.length > 0
        ? activitiesToCreate
        : (tripData.generatedActivities || tripData.activities || [])) as any[]

      const extractHostName = (activity: any): string | undefined => {
        const hostNames = new Set<string>()

        const collect = (value: any) => {
          if (!value) return

          if (typeof value === 'string') {
            const trimmed = value.trim()
            if (trimmed) {
              hostNames.add(trimmed)
            }
            return
          }

          if (Array.isArray(value)) {
            value.forEach(item => collect(item))
            return
          }

          if (typeof value === 'object') {
            const possibleKeys = [
              'name',
              'full_name',
              'fullName',
              'companyName',
              'company_name',
              'fantasy_name',
              'display_name',
              'legal_name'
            ]

            possibleKeys.forEach(key => {
              if (value[key]) {
                collect(value[key])
              }
            })
          }
        }

        collect(activity.hostName)
        collect(activity.host_name)
        collect(activity.host)
        collect(activity.hosts)
        collect(activity.selectedHosts)
        collect(activity.selected_hosts)
        collect(activity.company_name)
        collect(activity.company)
        collect(activity.company?.name)
        collect(activity.company?.fantasy_name)
        collect(activity.company?.display_name)
        collect(activity.company?.legal_name)
        collect(activity.hostCompany)
        collect(activity.host_company)

        const names = Array.from(hostNames)
        return names.length > 0 ? names.join(', ') : undefined
      }

      const itineraryMap = new Map<string, any[]>()
      for (const activity of rawActivities) {
        const activityDate = activity.activity_date || (activity.start_time ? new Date(activity.start_time).toISOString().split('T')[0] : null)
        if (!activityDate) continue
        if (!itineraryMap.has(activityDate)) {
          itineraryMap.set(activityDate, [])
        }
        itineraryMap.get(activityDate)!.push(activity)
      }

      const itinerary = Array.from(itineraryMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, activities]) => ({
          date,
          activities: activities
            .sort((a: any, b: any) => {
              const aTime = new Date(a.start_time || `${a.activity_date}T00:00:00`).getTime()
              const bTime = new Date(b.start_time || `${b.activity_date}T00:00:00`).getTime()
              return aTime - bTime
            })
            .map((activity: any) => ({
              time: formatTime(activity.start_time, activity.activity_date),
              title: activity.title,
              location: activity.location,
              duration: activity.duration_minutes ? `${activity.duration_minutes} minutes` : undefined,
              hostName: extractHostName(activity),
              type: activity.activity_type || activity.type
            }))
        }))

      const staffParticipants = (tripData.participants || []).map((p: any) => ({
        name: p.full_name || p.name || p.fullName || 'Wolthers Staff',
        email: p.email,
        role: 'staff'
      })).filter((participant: any) => participant.email)

      const guestCompanies = (tripData.companies || []).filter((company: any) => !isLikelyHostCompany(company))

      const primaryVehicle = vehicles[0]
      const primaryDriver = drivers[0] || tripData.vehicleAssignments?.[0]?.driver

      const emailData = {
        tripTitle: trip.title,
        tripAccessCode: trip.access_code,
        tripStartDate: trip.start_date,
        tripEndDate: trip.end_date,
        createdBy: user.full_name,
        itinerary,
        participants: staffParticipants,
        companies: guestCompanies.map((company: any) => {
          const contactArrays = [
            company.representatives,
            company.selectedContacts,
            company.selected_contacts,
            company.participants,
            company.attendees,
            company.contacts
          ].filter(Array.isArray)

          const representatives = contactArrays
            .flat() as any[]

          const uniqueContacts = new Map<string, { name: string; email: string }>()

          representatives.forEach(contact => {
            if (!contact) return
            const email = (contact.email || '').trim()
            if (!email) return
            const key = email.toLowerCase()
            if (uniqueContacts.has(key)) return
            const name = contact.name || contact.full_name || contact.fullName || email
            uniqueContacts.set(key, { name, email })
          })

          return {
            name: getCompanyDisplayLabel(company),
            fantasyName: company.fantasy_name || company.fantasyName,
            representatives: Array.from(uniqueContacts.values())
          }
        }),
        vehicle: primaryVehicle ? {
          make: primaryVehicle.make || primaryVehicle.model?.split(' ')[0] || primaryVehicle.model || 'Vehicle',
          model: primaryVehicle.model || primaryVehicle.name || primaryVehicle.make,
          licensePlate: primaryVehicle.license_plate || primaryVehicle.licensePlate
        } : undefined,
        driver: primaryDriver ? {
          name: primaryDriver.full_name || primaryDriver.fullName || primaryDriver.name,
          phone: primaryDriver.phone || primaryDriver.whatsapp
        } : undefined
      }

      const emailResult = await sendTripItineraryEmails(emailData)

      if (emailResult.success) {
        console.log('✅ [Create Trip API] Itinerary emails sent successfully to staff and guests')
      } else {
        console.error('⚠️ [Create Trip API] Some itinerary emails failed:', emailResult.errors)
      }

      const hostCompanies = (tripData.hostCompanies && tripData.hostCompanies.length > 0)
        ? tripData.hostCompanies
        : (tripData.companies || []).filter((company: any) => isLikelyHostCompany(company))

      if (hostCompanies && hostCompanies.length > 0) {
        console.log('📧 [Create Trip API] Sending host visit confirmation emails...')

        const visitingGuests = guestCompanies
          .map((company: any) => getCompanyDisplayLabel(company))
          .filter(Boolean)

        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL
          || (process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : 'https://trips.wolthers.com')

        for (const hostCompany of hostCompanies) {
          const representatives = (hostCompany.representatives || hostCompany.selectedContacts || [])
            .filter((rep: any) => rep.email)

          if (representatives.length === 0) continue

          const hostNameNormalized = normalizeText(hostCompany.fantasy_name || hostCompany.name)

          const hostDisplayLabel = getCompanyDisplayLabel(hostCompany)

          const hostActivities = rawActivities
            .filter((activity: any) => {
              const titleNormalized = normalizeText(activity.title || '')
              const companyNameNormalized = normalizeText(activity.company_name || activity.company?.name)
              const byId = activity.company_id && hostCompany.id && activity.company_id === hostCompany.id
              const byName = hostNameNormalized && (
                titleNormalized.includes(hostNameNormalized) || companyNameNormalized.includes(hostNameNormalized)
              )
              return byId || byName
            })
            .sort((a: any, b: any) => new Date(a.start_time || `${a.activity_date}T00:00:00`).getTime() - new Date(b.start_time || `${b.activity_date}T00:00:00`).getTime())

          const primaryActivity = hostActivities[0]
          const visitDateRaw = primaryActivity?.activity_date
            || (primaryActivity?.start_time ? new Date(primaryActivity.start_time).toISOString().split('T')[0] : null)
            || tripData.startDate
          const visitDateIso = visitDateRaw ? new Date(visitDateRaw).toISOString() : new Date(trip.start_date).toISOString()
          const visitTimeFormatted = primaryActivity?.start_time
            ? formatTime(primaryActivity.start_time, primaryActivity.activity_date)
            : '09:00'

          for (const representative of representatives) {
            try {
              const confirmationToken = crypto.randomUUID()
              const yesUrl = `${appBaseUrl}/api/visits/confirm?tripCode=${encodeURIComponent(trip.access_code)}&hostEmail=${encodeURIComponent(representative.email)}&response=accept&token=${confirmationToken}`
              const noUrl = `${appBaseUrl}/api/visits/confirm?tripCode=${encodeURIComponent(trip.access_code)}&hostEmail=${encodeURIComponent(representative.email)}&response=decline&token=${confirmationToken}`

              const hostEmailData = {
                hostName: representative.name || representative.full_name || representative.fullName || representative.email,
                companyName: hostCompany.name || hostCompany.fantasy_name,
                companyFantasyName: hostCompany.fantasy_name || hostDisplayLabel,
                visitDate: visitDateIso,
                visitTime: visitTimeFormatted,
                guests: visitingGuests,
                inviterName: user.full_name,
                inviterEmail: user.email,
                yesUrl,
                noUrl,
                tripTitle: trip.title,
                tripAccessCode: trip.access_code
              }

              await sendHostVisitConfirmationEmail(representative.email, hostEmailData)
              console.log(`✅ [Create Trip API] Sent visit confirmation to ${representative.email} for ${hostCompany.name || hostCompany.fantasy_name}`)

              // Rate limiting delay
              await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (hostEmailError) {
              console.error(`❌ [Create Trip API] Failed to send visit confirmation to ${representative.email}:`, hostEmailError)
            }
          }
        }
      }

    } catch (emailError) {
      console.error('❌ [Create Trip API] Email sending failed:', emailError)
      // Don't fail the trip creation if emails fail
    }

    console.log('🎉 [Create Trip API] Trip creation completed successfully!')

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        access_code: trip.access_code,
        continueUrl: `/trips/${trip.access_code}`
      }
    })

  } catch (error) {
    console.error('💥 [Create Trip API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to map trip types for slug generation
function mapTripType(tripType: string): 'conference' | 'event' | 'business' | 'client_visit' {
  switch (tripType?.toLowerCase()) {
    case 'conference':
    case 'convention':
      return 'conference'
    case 'event':
      return 'event'
    case 'client_visit':
    case 'client-visit':
      return 'client_visit'
    case 'business':
    default:
      return 'business'
  }
}
