import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { EmailService, TripCancellationEmailData } from '@/lib/email-service'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('='.repeat(60))
    console.log('DELETE /api/trips/[id]/delete called at', new Date().toISOString())
    
    let user: any = null
    
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      
      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()
        
        if (userData) {
          user = userData
          console.log('👤 User authenticated:', userData.email)
        }
      } catch (jwtError) {
        // Try Supabase session
        const supabase = createSupabaseServiceClient()
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser(token)
          if (supabaseUser) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()
            if (userData) {
              user = userData
            }
          }
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const resolvedParams = await params
    const tripId = resolvedParams.id
    console.log('Trip ID to delete:', tripId)
    
    const supabase = createSupabaseServiceClient()
    
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, users!creator_id(id, email, company_id)')
      .eq('id', tripId)
      .single()
    
    if (tripError || !trip) {
      console.error('Trip not found:', tripError)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    console.log('Found trip:', trip.title, 'Status:', trip.status, 'Creator:', trip.creator_id)
    
    // Authorization: creator, global admin, or company admin
    const canDelete = 
      trip.creator_id === user.id ||
      user.is_global_admin === true ||
      (user.user_type === 'company_admin' && user.company_id === trip.users?.company_id)
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    
    // Allow deletion of any trip status when cancelling
    // Note: The UI already confirmed this is a cancellation with user consent
    console.log(`Deleting trip with status: ${trip.status}`)
    
    // FIRST: Get data needed for email notifications BEFORE deletion
    console.log('📧 [Trip Cancellation] Fetching notification data before deletion...')
    
    // Get trip participants for email notifications (fetch before deletion)
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('users(id, email, full_name, name)')
      .eq('trip_id', tripId)
    
    // Get company contacts from trip activities (fetch before deletion)  
    const { data: activities } = await supabase
      .from('activities')
      .select('host, location, title')
      .eq('trip_id', tripId)
    
    // SECOND: Delete related data (cascading delete)
    console.log('🗑️ Deleting related trip data...')
    
    // Delete activities (modern approach)
    await supabase.from('activities').delete().eq('trip_id', tripId)
    console.log('✅ Activities deleted')
    
    // Delete trip participants
    await supabase.from('trip_participants').delete().eq('trip_id', tripId)
    console.log('✅ Trip participants deleted')
    
    // Delete trip vehicles
    await supabase.from('trip_vehicles').delete().eq('trip_id', tripId)
    console.log('✅ Trip vehicles deleted')
    
    // Delete itinerary items (legacy support)
    await supabase.from('itinerary_items').delete().eq('trip_id', tripId)
    console.log('✅ Itinerary items deleted')
    
    // Delete trip hotels
    await supabase.from('trip_hotels').delete().eq('trip_id', tripId)
    console.log('✅ Trip hotels deleted')
    
    // Delete trip flights
    await supabase.from('trip_flights').delete().eq('trip_id', tripId)
    console.log('✅ Trip flights deleted')
    
    // Delete trip meetings and their attendees
    const { data: meetings } = await supabase.from('trip_meetings').select('id').eq('trip_id', tripId)
    if (meetings && meetings.length > 0) {
      // Delete meeting attendees first
      for (const meeting of meetings) {
        await supabase.from('meeting_attendees').delete().eq('meeting_id', meeting.id)
      }
      // Delete meetings
      await supabase.from('trip_meetings').delete().eq('trip_id', tripId)
    }
    console.log('✅ Trip meetings and attendees deleted')
    
    // Delete any drafts
    await supabase.from('trip_drafts').delete().eq('trip_id', tripId)
    console.log('✅ Trip drafts deleted')
    
    // Finally delete the trip
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
    
    if (deleteError) {
      console.error('Failed to delete trip:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete trip: ${deleteError.message}` },
        { status: 500 }
      )
    }
    
    // THIRD: Send real cancellation email notifications using Resend
    try {
      console.log('📧 [Trip Cancellation] Sending email notifications via Resend...')
      
      // Format trip dates
      const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const endDate = new Date(trip.end_date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const tripDates = startDate === endDate ? startDate : `${startDate} - ${endDate}`
      
      const emailPromises: Promise<any>[] = []
      
      // Send emails to Wolthers staff participants
      if (participants && participants.length > 0) {
        for (const p of participants) {
          if (p.users && p.users.email) {
            const emailData: TripCancellationEmailData = {
              email: p.users.email,
              name: p.users.full_name || p.users.name || 'Team Member',
              tripTitle: trip.title,
              tripDates,
              cancelledBy: user.full_name || user.name || 'Administrator',
              originalStartDate: trip.start_date,
              originalEndDate: trip.end_date
            }
            
            console.log(`   📤 Sending to Staff: ${emailData.name} (${emailData.email})`)
            emailPromises.push(EmailService.sendTripCancellationEmail(emailData))
          }
        }
      }
      
      // Extract host companies from activity titles and find host users
      if (activities && activities.length > 0) {
        console.log(`   🔍 Analyzing ${activities.length} activities for host companies...`)
        
        // Extract company names from activity titles like "Visit COOXUPE" → "COOXUPE"
        const hostCompanyNames = new Set<string>()
        
        activities.forEach(activity => {
          if (activity.title) {
            const title = activity.title.trim()
            
            // Match patterns like "Visit [COMPANY]", "Meeting with [COMPANY]", etc.
            const visitMatch = title.match(/^Visit\s+(.+)$/i)
            const meetingMatch = title.match(/^Meeting\s+(?:with\s+)?(.+)$/i)
            
            if (visitMatch) {
              const companyName = visitMatch[1].trim()
              hostCompanyNames.add(companyName)
              console.log(`   🏢 Found host from visit: "${companyName}"`)
            } else if (meetingMatch) {
              const companyName = meetingMatch[1].trim()
              hostCompanyNames.add(companyName)
              console.log(`   🏢 Found host from meeting: "${companyName}"`)
            }
          }
        })
        
        // Also check the host field (legacy support)
        const legacyHosts = activities.map(a => a.host).filter(Boolean)
        legacyHosts.forEach(host => {
          hostCompanyNames.add(host)
          console.log(`   🏢 Found legacy host: "${host}"`)
        })
        
        console.log(`   📊 Total unique host companies found: ${hostCompanyNames.size}`)
        
        // Find users registered to these host companies
        for (const hostName of hostCompanyNames) {
          try {
            console.log(`   🔎 Searching for users at host company: "${hostName}"`)
            
            // Find users by company name or fantasy name  
            const { data: hostUsers, error: hostError } = await supabase
              .from('users')
              .select(`
                email, 
                full_name, 
                companies!inner(name, fantasy_name)
              `)
              .or(`companies.name.ilike.%${hostName}%,companies.fantasy_name.ilike.%${hostName}%`)
              .not('email', 'is', null)
            
            if (hostError) {
              console.error(`   ❌ Error finding users for ${hostName}:`, hostError)
              continue
            }
            
            if (hostUsers && hostUsers.length > 0) {
              for (const hostUser of hostUsers) {
                if (hostUser.email) {
                  const emailData: TripCancellationEmailData = {
                    email: hostUser.email,
                    name: hostUser.full_name || 'Host Representative',
                    tripTitle: trip.title,
                    tripDates,
                    cancelledBy: user.full_name || user.name || 'Wolthers Team',
                    originalStartDate: trip.start_date,
                    originalEndDate: trip.end_date
                  }
                  
                  const companyName = hostUser.companies?.fantasy_name || hostUser.companies?.name || hostName
                  console.log(`   📤 Sending to Host User: ${hostUser.full_name} at ${companyName} (${hostUser.email})`)
                  emailPromises.push(EmailService.sendTripCancellationEmail(emailData))
                }
              }
            } else {
              console.log(`   ⚠️ No registered users found for host company: ${hostName}`)
            }
          } catch (error) {
            console.error(`   ❌ Error processing host company ${hostName}:`, error)
          }
        }
      }
      
      // Send all emails in parallel
      const emailResults = await Promise.allSettled(emailPromises)
      const successCount = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failCount = emailResults.length - successCount
      
      console.log(`📧 Email notifications sent: ${successCount} successful, ${failCount} failed`)
      
      if (failCount > 0) {
        emailResults.forEach((result, index) => {
          if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
            console.error(`   ❌ Email ${index + 1} failed:`, result.status === 'rejected' ? result.reason : result.value.error)
          }
        })
      }
      
    } catch (emailError) {
      console.error('Warning: Email notification process failed:', emailError)
      // Don't fail the deletion if email fails - trip cancellation is more important
    }
    
    console.log('✅ Trip deleted successfully')
    return NextResponse.json({ 
      success: true, 
      message: 'Trip cancelled and deleted successfully. Email notifications sent to participants and hosts.' 
    })
    
  } catch (error) {
    console.error('Delete trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}