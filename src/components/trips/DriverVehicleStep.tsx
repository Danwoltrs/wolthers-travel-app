import React, { useEffect, useState } from 'react'
import type { TripFormData } from './TripCreationModal'
import type { User, Vehicle } from '@/types'

interface Props {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function DriverVehicleStep({ formData, updateFormData }: Props) {
  const [drivers, setDrivers] = useState<User[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetch('/api/users/drivers').then(r => r.json())
        const v = await fetch('/api/fleet/vehicles').then(r => r.json())
        setDrivers(d.drivers || [])
        setVehicles(v.vehicles || [])
      } catch (err) {
        console.error('Failed loading drivers/vehicles', err)
      }
    }
    load()
  }, [])

  const driverOptions: User[] = [...drivers]
  ;(formData.wolthersStaff || []).forEach(s => {
    if (!driverOptions.some(d => d.id === s.id)) driverOptions.push(s)
  })

  const handleDriverChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const user = driverOptions.find(u => u.id === id)
    updateFormData({ drivers: user ? [user] : [] })
    const tripId = (formData as any).tripId
    if (tripId && user) {
      await fetch('/api/trips/drivers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, userId: id })
      })
    }
  }

  const handleInvite = async () => {
    const name = inviteName.trim()
    const email = inviteEmail.trim()
    if (!name || !email) return
    const tripId = (formData as any).tripId
    try {
      const res = await fetch('/api/trips/drivers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, name, email })
      })
      const data = await res.json()
      if (data.user) {
        setDrivers(prev => [...prev, data.user])
        updateFormData({ drivers: [data.user] })
      }
    } catch (err) {
      console.error('Invite driver failed', err)
    }
    setShowInvite(false)
    setInviteName('')
    setInviteEmail('')
  }

  const handleVehicleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const tripId = (formData as any).tripId
    if (val === 'rental') {
      updateFormData({ selectedVehicleId: undefined, rentalVehicle: { provider: '', pickup: '', dropoff: '' } })
    } else {
      updateFormData({ selectedVehicleId: val, rentalVehicle: null })
      if (tripId) {
        await fetch('/api/trips/vehicles/basic-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId, vehicleId: val })
        })
      }
    }
  }

  const handleRentalChange = async (field: 'provider' | 'pickup' | 'dropoff', value: string) => {
    const rental = { ...(formData.rentalVehicle || { provider: '', pickup: '', dropoff: '' }), [field]: value }
    updateFormData({ rentalVehicle: rental, selectedVehicleId: undefined })
    const tripId = (formData as any).tripId
    if (tripId) {
      await fetch('/api/trips/vehicles/basic-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, rental })
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Driver</label>
        <select
          value={formData.drivers[0]?.id || ''}
          onChange={handleDriverChange}
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
        >
          <option value="">Select driver</option>
          {driverOptions.map(d => (
            <option key={d.id} value={d.id}>
              {d.fullName || d.email}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="text-sm text-emerald-600 hover:underline"
        >
          Invite Driver
        </button>
        {showInvite && (
          <div className="border p-4 rounded-md space-y-2">
            <input
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              placeholder="Name"
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Email"
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleInvite}
                className="px-3 py-1 bg-emerald-600 text-white rounded"
              >
                Send Invite
              </button>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Vehicle</label>
        <select
          value={formData.selectedVehicleId || (formData.rentalVehicle ? 'rental' : '')}
          onChange={handleVehicleChange}
          className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
        >
          <option value="">Select vehicle</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.model} {v.licensePlate ? `(${v.licensePlate})` : ''}
            </option>
          ))}
          <option value="rental">Rental</option>
        </select>
        {formData.rentalVehicle && (
          <div className="space-y-2">
            <input
              value={formData.rentalVehicle.provider}
              onChange={e => handleRentalChange('provider', e.target.value)}
              placeholder="Provider"
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <input
              type="datetime-local"
              value={formData.rentalVehicle.pickup}
              onChange={e => handleRentalChange('pickup', e.target.value)}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
            />
            <input
              type="datetime-local"
              value={formData.rentalVehicle.dropoff}
              onChange={e => handleRentalChange('dropoff', e.target.value)}
              className="w-full border rounded-md p-2 bg-white dark:bg-gray-800"
            />
          </div>
        )}
      </div>
    </div>
  )
}
