'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Users, 
  Upload, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  FileText,
  Eye
} from 'lucide-react'

interface Visit {
  id: string
  tripTitle: string
  tripCode: string
  startDate: string
  endDate: string
  status: 'pending' | 'confirmed' | 'declined' | 'completed'
  wolthersTeam: Array<{
    name: string
    role?: string
  }>
  organizer: {
    name: string
    email: string
  }
}

export default function HostDashboardPage() {
  const [user, setUser] = useState(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication and load dashboard data
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // TODO: Replace with actual API calls
      setUser({
        name: 'Maria Santos',
        company: 'Veloso Green Coffee',
        email: 'maria@velosocoffee.com',
        role: 'Host Partner'
      })

      // Mock visits data
      setVisits([
        {
          id: '1',
          tripTitle: 'SCTA Brazil Coffee Origins Tour',
          tripCode: 'SCTA-2025',
          startDate: '2025-03-15',
          endDate: '2025-03-18',
          status: 'pending',
          wolthersTeam: [
            { name: 'Daniel Wolthers', role: 'Managing Director' },
            { name: 'Svenn Wolthers', role: 'Operations Manager' }
          ],
          organizer: {
            name: 'Daniel Wolthers',
            email: 'daniel@wolthers.com'
          }
        },
        {
          id: '2',
          tripTitle: 'Coffee Cupping & Quality Assessment',
          tripCode: 'CCQ-2024',
          startDate: '2024-11-20',
          endDate: '2024-11-22',
          status: 'completed',
          wolthersTeam: [
            { name: 'Tom Sullivan', role: 'Coffee Specialist' }
          ],
          organizer: {
            name: 'Daniel Wolthers',
            email: 'daniel@wolthers.com'
          }
        }
      ])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisitResponse = async (visitId: string, response: 'accept' | 'decline') => {
    try {
      // TODO: Implement visit response API
      console.log(`${response}ing visit ${visitId}`)
      
      // Update local state
      setVisits(prev => 
        prev.map(visit => 
          visit.id === visitId 
            ? { ...visit, status: response === 'accept' ? 'confirmed' : 'declined' }
            : visit
        )
      )
    } catch (error) {
      console.error('Failed to respond to visit:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    }

    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      declined: XCircle,
      completed: CheckCircle
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const pendingVisits = visits.filter(v => v.status === 'pending')
  const upcomingVisits = visits.filter(v => v.status === 'confirmed')
  const completedVisits = visits.filter(v => v.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
                <p className="text-gray-600">{user?.company}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingVisits.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Visits</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingVisits.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedVisits.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{visits.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Visit Confirmations */}
        {pendingVisits.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8 border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                Pending Visit Confirmations
              </h2>
              <p className="text-sm text-gray-600 mt-1">Please confirm or decline these visit requests</p>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingVisits.map(visit => (
                <div key={visit.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{visit.tripTitle}</h3>
                      <p className="text-sm text-gray-500">Trip Code: {visit.tripCode}</p>
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(visit.startDate).toLocaleDateString()} - {new Date(visit.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {visit.wolthersTeam.length} team members visiting
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Wolthers Team Members:</h4>
                    <div className="flex flex-wrap gap-2">
                      {visit.wolthersTeam.map((member, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {member.name}{member.role && ` - ${member.role}`}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Organized by:</span> {visit.organizer.name}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVisitResponse(visit.id, 'decline')}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-1 inline" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleVisitResponse(visit.id, 'accept')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1 inline" />
                        Accept Visit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Visits */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              All Visits
            </h2>
            <p className="text-sm text-gray-600 mt-1">Complete history of your visits with Wolthers & Associates</p>
          </div>
          <div className="divide-y divide-gray-200">
            {visits.map(visit => (
              <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{visit.tripTitle}</h3>
                  {getStatusBadge(visit.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(visit.startDate).toLocaleDateString()} - {new Date(visit.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {visit.wolthersTeam.length} team members
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {visit.organizer.name}
                  </div>
                </div>
                
                {visit.status === 'confirmed' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Presentation Materials
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-6 text-white">
            <Upload className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Upload Materials</h3>
            <p className="text-sm opacity-90 mb-4">Upload presentations and meeting materials for upcoming visits.</p>
            <button className="text-white hover:bg-white/20 px-4 py-2 rounded-md transition-colors">
              Get Started →
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-6 text-white">
            <BarChart3 className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Visit Analytics</h3>
            <p className="text-sm opacity-90 mb-4">View insights and analytics about your hosting partnership.</p>
            <button className="text-white hover:bg-white/20 px-4 py-2 rounded-md transition-colors">
              View Analytics →
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
            <Users className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Guest Information</h3>
            <p className="text-sm opacity-90 mb-4">Access detailed profiles and preferences of visiting guests.</p>
            <button className="text-white hover:bg-white/20 px-4 py-2 rounded-md transition-colors">
              View Guests →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}