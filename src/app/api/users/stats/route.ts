import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user statistics from database
    const [usersResult, companiesResult, tripsResult] = await Promise.all([
      // Total users by type
      supabase
        .from('users')
        .select('user_type')
        .not('user_type', 'is', null),
      
      // Total companies by category
      supabase
        .from('companies')
        .select('category, client_type'),
      
      // Trip statistics  
      supabase
        .from('trips')
        .select('status, estimated_budget, total_cost')
    ])

    if (usersResult.error) {
      console.error('Error fetching user stats:', usersResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch user statistics', details: usersResult.error.message },
        { status: 500 }
      )
    }

    if (companiesResult.error) {
      console.error('Error fetching company stats:', companiesResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch company statistics', details: companiesResult.error.message },
        { status: 500 }
      )
    }

    if (tripsResult.error) {
      console.error('Error fetching trip stats:', tripsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch trip statistics', details: tripsResult.error.message },
        { status: 500 }
      )
    }

    // Process user statistics
    const users = usersResult.data || []
    const userStats = {
      total: users.length,
      wolthersStaff: users.filter(u => u.user_type === 'wolthers_staff').length,
      admin: users.filter(u => u.user_type === 'admin').length,
      guest: users.filter(u => u.user_type === 'guest').length,
      external: users.filter(u => u.user_type === 'external').length
    }

    // Process company statistics
    const companies = companiesResult.data || []
    const companyStats = {
      total: companies.length,
      importers: companies.filter(c => 
        c.category?.includes('importer') || c.client_type?.includes('importer')
      ).length,
      roasters: companies.filter(c => 
        c.category?.includes('roaster') || c.client_type?.includes('roaster')
      ).length,
      exporters: companies.filter(c => 
        c.category?.includes('exporter') || c.client_type?.includes('exporter')
      ).length,
      producers: companies.filter(c => 
        c.category?.includes('producer') || c.client_type?.includes('producer')
      ).length,
      cooperatives: companies.filter(c => 
        c.category?.includes('cooperative') || c.client_type?.includes('cooperative')
      ).length
    }

    // Process trip statistics
    const trips = tripsResult.data || []
    const tripStats = {
      total: trips.length,
      planning: trips.filter(t => t.status === 'planning').length,
      confirmed: trips.filter(t => t.status === 'confirmed').length,
      ongoing: trips.filter(t => t.status === 'ongoing').length,
      completed: trips.filter(t => t.status === 'completed').length,
      cancelled: trips.filter(t => t.status === 'cancelled').length,
      totalBudget: trips.reduce((sum, t) => sum + (t.estimated_budget || 0), 0),
      totalSpent: trips.reduce((sum, t) => sum + (t.total_cost || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        users: userStats,
        companies: companyStats,
        trips: tripStats,
        summary: {
          isEmpty: users.length === 0 && companies.length === 0 && trips.length === 0,
          hasUsers: users.length > 0,
          hasCompanies: companies.length > 0,
          hasTrips: trips.length > 0
        }
      },
      message: userStats.total === 0 && companyStats.total === 0 && tripStats.total === 0
        ? 'No data found. Start by adding users, companies, or trips.'
        : `Found ${userStats.total} users, ${companyStats.total} companies, ${tripStats.total} trips`
    })
  } catch (error) {
    console.error('Error in user stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}