import { baseUrl, logoUrl } from './client'
import { delay, sendEmail } from './sender'
import { EmailTemplate, TripItineraryEmailData } from './types'

const normalizeForMatch = (value?: string): string => {
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

const getPossibleCompanyNames = (company: Record<string, any>): string[] => {
  const keys = [
    'fantasyName',
    'fantasy_name',
    'displayName',
    'display_name',
    'shortName',
    'short_name',
    'nickname',
    'companyName',
    'company_name',
    'legalName',
    'legal_name',
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

const stripLegalSuffixes = (name: string): string => {
  const withoutSuffixes = name
    .replace(/\b(LTDA\.?|Ltda\.?|Ltd\.?|S\.?A\.?|SA|A\/G|AG|LLC|INC\.?|Incorporated|Corp\.?|Corporation)\b/gi, '')
    .replace(/\b(Exportacao|Exportação|Importacao|Importação|Comercio|Comércio|Industria|Indústria|Agroindustrial|Agroindustrial\.?|Cooperativa|Cooperative)\b/gi, '')
    .replace(/[()]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return withoutSuffixes || name.trim()
}

const getCompanyDisplayName = (company: Record<string, any>): string => {
  const possibleNames = getPossibleCompanyNames(company)
  if (possibleNames.length === 0) {
    return 'Company'
  }

  const cleanedNames = possibleNames
    .map(name => stripLegalSuffixes(name))
    .filter(Boolean)

  if (cleanedNames.length === 0) {
    return stripLegalSuffixes(possibleNames[0]) || 'Company'
  }

  return cleanedNames.reduce((shortest, current) => {
    if (!shortest) return current
    return current.length < shortest.length ? current : shortest
  }, cleanedNames[0])
}

const normalizeRole = (role?: string): string => (role || '').toLowerCase().trim()

const isHostRole = (role?: string): boolean => normalizeRole(role).includes('host')

const getCompanyContactNames = (company: Record<string, any>): string[] => {
  const names = new Set<string>()

  const arrayKeys = [
    'representatives',
    'selectedContacts',
    'selected_contacts',
    'participants',
    'attendees',
    'contacts',
    'hosts'
  ]

  arrayKeys.forEach(key => {
    const list = company?.[key]
    if (Array.isArray(list)) {
      list.forEach(entry => {
        const value = entry?.name || entry?.full_name || entry?.fullName
        if (typeof value === 'string' && value.trim()) {
          names.add(value.trim())
        }
      })
    }
  })

  const directKeys = [
    'hostName',
    'host_name',
    'primaryContactName',
    'primary_contact_name',
    'contactName',
    'contact_name'
  ]

  directKeys.forEach(key => {
    const value = company?.[key]
    if (typeof value === 'string' && value.trim()) {
      names.add(value.trim())
    }
  })

  return Array.from(names)
}

const isHostCompanyEntry = (company: Record<string, any>): boolean => {
  if (!company) return false
  if (company.isHost) return true
  if (company.hostName || company.host_name) return true
  if (Array.isArray(company.hosts) && company.hosts.length > 0) return true

  const category = company.category || company.companyCategory || company.segment
  if (typeof category === 'string' && category.toLowerCase().includes('host')) {
    return true
  }

  const possibleRole = company.role || company.companyRole || company.type || ''
  if (typeof possibleRole === 'string' && possibleRole.toLowerCase().includes('host')) {
    return true
  }

  return false
}

const getCompanyContactRecipients = (company: Record<string, any>): Array<{ name: string; email: string }> => {
  const recipients = new Map<string, { name: string; email: string }>()

  const addRecipient = (name?: string, email?: string) => {
    if (!email) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    const key = trimmedEmail.toLowerCase()
    if (recipients.has(key)) return
    const displayName = (name && name.trim()) || trimmedEmail
    recipients.set(key, { name: displayName, email: trimmedEmail })
  }

  const candidateArrays = [
    'representatives',
    'selectedContacts',
    'selected_contacts',
    'participants',
    'attendees',
    'contacts',
    'hosts'
  ]

  candidateArrays.forEach(key => {
    const list = company?.[key]
    if (Array.isArray(list)) {
      list.forEach(entry => {
        const name = entry?.name || entry?.full_name || entry?.fullName || entry?.email
        addRecipient(name, entry?.email)
      })
    }
  })

  if (company.primaryContactEmail) {
    addRecipient(company.primaryContactName, company.primaryContactEmail)
  }

  if (company.contactEmail) {
    addRecipient(company.contactName || company.primaryContactName, company.contactEmail)
  }

  if (company.email) {
    addRecipient(company.fantasy_name || company.name || company.email, company.email)
  }

  return Array.from(recipients.values())
}

export function createTripItineraryTemplate(data: TripItineraryEmailData): EmailTemplate {
  const {
    tripTitle,
    tripAccessCode,
    tripStartDate,
    tripEndDate,
    createdBy,
    itinerary,
    participants,
    companies,
    vehicle,
    driver
  } = data

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startFormatted = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    const endFormatted = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    return `${startFormatted} - ${endFormatted}`
  }

  const formatLongDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startFormatted = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    const endFormatted = endDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    return `${startFormatted} - ${endFormatted}`
  }

  const formatDayLabel = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  type HostContactRecord = {
    normalizedNames: string[]
    contacts: string
    displayName: string
  }

  const buildHostContactRecords = (companiesList: Array<Record<string, any>>): HostContactRecord[] => {
    return companiesList.reduce<HostContactRecord[]>((records, company) => {
      const contactNames = getCompanyContactNames(company)
      if (contactNames.length === 0) {
        return records
      }

      const possibleNames = [
        ...getPossibleCompanyNames(company),
        getCompanyDisplayName(company)
      ]

      const normalizedNames = Array.from(new Set(possibleNames
        .map(name => normalizeForMatch(name))
        .filter(Boolean)))

      if (normalizedNames.length === 0) {
        return records
      }

      records.push({
        normalizedNames,
        contacts: contactNames.join(', '),
        displayName: getCompanyDisplayName(company)
      })

      return records
    }, [])
  }

  const getHostDisplay = (activity: any, hostCompanyContacts: HostContactRecord[]): string => {
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
          'hostName',
          'host_name',
          'hostNames',
          'host_names',
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
    collect(activity.host)
    collect(activity.hosts)
    collect(activity.hostNames)
    collect(activity.host_names)
    collect(activity.selectedHosts)
    collect(activity.selected_hosts)
    collect(activity.companyName)
    collect(activity.company_name)
    collect(activity.company)
    collect(activity.hostCompany)
    collect(activity.host_company)

    const directHosts = Array.from(hostNames).join(', ')
    if (directHosts) {
      return directHosts
    }

    if (!hostCompanyContacts.length) {
      return ''
    }

    const candidateStrings = new Set<string>()
    const candidateProps = [
      'companyName',
      'company_name',
      'company',
      'hostCompany',
      'host_company'
    ]

    candidateProps.forEach(prop => {
      const value = (activity as any)?.[prop]
      if (!value) return

      if (typeof value === 'string') {
        if (value.trim()) {
          candidateStrings.add(value.trim())
        }
        return
      }

      if (typeof value === 'object') {
        getPossibleCompanyNames(value).forEach(name => candidateStrings.add(name))
      }
    })

    if (activity.title) {
      candidateStrings.add(activity.title)
    }

    if (activity.location) {
      candidateStrings.add(activity.location)
    }

    if (activity.description) {
      candidateStrings.add(activity.description)
    }

    const normalizedCandidates = Array.from(candidateStrings)
      .map(value => normalizeForMatch(value))
      .filter(Boolean)

    const normalizedTitle = normalizeForMatch(activity.title)
    const normalizedLocation = normalizeForMatch(activity.location)

    for (const record of hostCompanyContacts) {
      const { normalizedNames, contacts } = record
      const hasMatch = normalizedNames.some(name => {
        if (!name) return false
        if (normalizedCandidates.includes(name)) return true
        if (normalizedTitle && normalizedTitle.includes(name)) return true
        if (normalizedLocation && normalizedLocation.includes(name)) return true
        return false
      })

      if (hasMatch) {
        return contacts
      }
    }

    return ''
  }

  const shouldShowHost = (activity: { type?: string; title: string }): boolean => {
    const normalizedType = activity.type?.toLowerCase()
    if (normalizedType) {
      if (['meeting', 'visit', 'client_visit', 'host_visit', 'company_visit', 'site_visit'].some(type => normalizedType.includes(type))) {
        return true
      }

      if (['travel', 'drive', 'transfer', 'transport', 'flight'].some(type => normalizedType.includes(type))) {
        return false
      }
    }

    return /visit|meeting/i.test(activity.title)
  }

  const renderActivityLine = (
    activity: { time: string; title: string; duration?: string; hostName?: string; type?: string },
    hostCompanyContacts: HostContactRecord[]
  ) => {
    const showHost = shouldShowHost(activity)
    const hostDisplay = getHostDisplay(activity, hostCompanyContacts) || ''
    const hostStatus = showHost ? (hostDisplay ? `Host ${hostDisplay}` : 'Host to be confirmed') : ''
    const durationText = activity.duration ? ` (${activity.duration})` : ''
    const hostSuffix = hostStatus ? ` - ${hostStatus}` : ''

    return `${activity.time} - ${activity.title}${durationText}${hostSuffix}`
  }

  const subject = `${tripTitle} - ${formatDateRange(tripStartDate, tripEndDate)}`
  const tripUrl = `${baseUrl}/trips/${tripAccessCode}`

  const companiesList = Array.isArray(companies) ? companies : []
  const hostCompanyEntries = companiesList.filter(company => isHostCompanyEntry(company as Record<string, any>))
  const guestCompanyEntries = companiesList.filter(company => !isHostCompanyEntry(company as Record<string, any>))
  const hostContactRecords = buildHostContactRecords(hostCompanyEntries)

  const isWolthersStaff = (participant: { role?: string }) => {
    const role = normalizeRole(participant.role)
    return role === 'staff' || role === 'wolthers_staff' || role.includes('wolthers')
  }

  const wolthersStaff = participants
    .filter(isWolthersStaff)
    .map(participant => participant.name.split(' ')[0])
    .join(', ')

  const independentGuests = participants
    .filter(participant => !isWolthersStaff(participant) && !isHostRole(participant.role))
    .map(participant => participant.name.split(' ')[0])

  const guestCompanies = guestCompanyEntries.map(company => {
    const companyRecord = company as Record<string, any>
    const attendeeNames = getCompanyContactNames(companyRecord)
    const firstNames = Array.from(new Set(attendeeNames
      .map(name => name.split(' ')[0])
      .filter(Boolean)))

    return {
      displayName: getCompanyDisplayName(companyRecord),
      attendees: firstNames.length > 0 ? firstNames.join(', ') : 'Guests to be confirmed'
    }
  })

  const itineraryHtml = itinerary.map((day, index) => {
    const dayHeading = `Day ${index + 1} - ${formatDayLabel(day.date)}`
    const activitiesHtml = day.activities
      .map(activity => `<p class="activity-line">&nbsp;&nbsp;&nbsp;&nbsp;${renderActivityLine(activity, hostContactRecords)}</p>`)
      .join('')

    return `
      <p class="day-line">${dayHeading}</p>
      ${activitiesHtml}
    `
  }).join('')

  const logisticsLines: string[] = []
  if (vehicle) {
    const vehicleDetails = `${vehicle.make} ${vehicle.model}`.trim()
    const license = vehicle.licensePlate ? ` (License ${vehicle.licensePlate})` : ''
    if (vehicleDetails) {
      logisticsLines.push(`Vehicle: ${vehicleDetails}${license}`)
    }
  }
  if (driver) {
    const driverLine = driver.phone ? `${driver.name} (${driver.phone})` : driver.name
    logisticsLines.push(`Driver: ${driverLine}`)
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Itinerary</title>
        <style>
          body {
            margin: 0;
            padding: 28px 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            color: #1f2a21;
            background-color: #ffffff;
            font-size: 14px;
            line-height: 1.4;
          }
          .email-container {
            max-width: 640px;
            margin: 0 auto;
            padding: 24px 16px;
          }
          .logo {
            display: block;
            margin: 0 auto 24px;
            width: 150px;
            height: auto;
          }
          .card {
            background: #ffffff;
            border-radius: 18px;
            border: 1px solid #d9e2dc;
            box-shadow: 0 12px 32px rgba(15, 33, 23, 0.08);
            padding: 32px;
          }
          .email-title {
            margin: 0;
            text-align: center;
            font-size: 22px;
            font-weight: 600;
            color: #16442f;
          }
          .trip-link {
            color: #16442f;
            text-decoration: none;
            font-weight: 600;
          }
          .trip-link:hover {
            text-decoration: underline;
          }
          .meta {
            text-align: center;
            margin: 16px 0 20px;
            color: #324135;
          }
          .meta p {
            margin: 4px 0;
          }
          .divider {
            height: 1px;
            background: rgba(22, 68, 47, 0.12);
            margin: 18px 0 24px;
          }
          .section-heading {
            margin: 0 0 8px;
            font-weight: 600;
            color: #16442f;
          }
          .info-line {
            margin: 2px 0;
            color: #1f2a21;
          }
          .separator {
            height: 1px;
            background: rgba(22, 68, 47, 0.12);
            margin: 20px 0;
          }
          .itinerary {
            margin-top: 8px;
          }
          .day-line {
            margin: 12px 0 4px;
            font-weight: 600;
            color: #1a3326;
          }
          .day-line:first-of-type {
            margin-top: 0;
          }
          .activity-line {
            margin: 2px 0;
            color: #1f2a21;
            font-size: 14px;
          }
          .activity-line:last-of-type {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 0;
            color: #3d4a40;
            font-size: 13px;
            text-align: center;
          }
          .footer p {
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="card">
            <img src="${logoUrl}" alt="Wolthers & Associates" class="logo" />
            <h1 class="email-title">${tripTitle} · Trip key: ${tripAccessCode}</h1>
            <p style="text-align: center; margin: 10px 0 0;">
              <a href="${tripUrl}" class="trip-link" target="_blank" rel="noopener noreferrer">View trip</a>
            </p>
            <div class="meta">
              <p>${formatLongDateRange(tripStartDate, tripEndDate)}</p>
              <p>Organized by ${createdBy}</p>
            </div>

            <div class="divider"></div>

            <div>
              <p class="section-heading">Travel Party</p>
              ${wolthersStaff ? `<p class="info-line"><strong>Wolthers:</strong> ${wolthersStaff}</p>` : ''}
              ${guestCompanies.length > 0 ? guestCompanies.map(company => `
                <p class="info-line"><strong>${company.displayName}:</strong> ${company.attendees || 'Guests to be confirmed'}</p>
              `).join('') : ''}
              ${independentGuests.length > 0 ? `<p class="info-line"><strong>Guests:</strong> ${independentGuests.join(', ')}</p>` : ''}

              ${logisticsLines.length > 0 ? `
                <div class="separator"></div>
                <p class="section-heading">Transport</p>
                ${logisticsLines.map(line => `<p class="info-line">${line}</p>`).join('')}
              ` : ''}
            </div>

            <div class="separator"></div>

            <div class="itinerary">
              <p class="section-heading">Itinerary</p>
              ${itineraryHtml}
            </div>

            <div class="separator"></div>

            <div class="footer">
              <p>We look forward to seeing you, and wish you a great travel.</p>
              <p>For updates, please contact ${createdBy}.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  const textLines: string[] = [
    `${tripTitle} · Trip key: ${tripAccessCode}`,
    `View trip: ${tripUrl}`,
    formatLongDateRange(tripStartDate, tripEndDate),
    `Organized by ${createdBy}`,
    '',
    'Travel Party:'
  ]

  if (wolthersStaff) {
    textLines.push(`Wolthers: ${wolthersStaff}`)
  }

  guestCompanies.forEach(company => {
    const attendeeText = company.attendees || 'Guests to be confirmed'
    textLines.push(`${company.displayName}: ${attendeeText}`)
  })

  if (independentGuests.length > 0) {
    textLines.push(`Guests: ${independentGuests.join(', ')}`)
  }

  if (logisticsLines.length > 0) {
    textLines.push('', 'Transport:')
    logisticsLines.forEach(line => textLines.push(line))
  }

  textLines.push('', 'Itinerary:')

  itinerary.forEach((day, index) => {
    textLines.push(`Day ${index + 1} - ${formatDayLabel(day.date)}`)

    day.activities.forEach(activity => {
      const baseLine = renderActivityLine(activity, hostContactRecords)
      textLines.push(`    ${baseLine}`)
    })
  })

  textLines.push('', 'We look forward to seeing you, and wish you a great travel.', `For assistance, contact ${createdBy}.`)

  const text = textLines.join('\n')

  return { subject, html, text }
}

export async function sendTripItineraryEmails(data: TripItineraryEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripItineraryTemplate(data)
  const participantRecipients = (data.participants || [])
    .filter(participant => participant?.email)
    .filter(participant => !isHostRole(participant.role))
    .map(participant => ({
      name: participant.name,
      email: participant.email
    }))

  const companyRecipients = (data.companies || [])
    .filter(company => !isHostCompanyEntry(company as Record<string, any>))
    .flatMap(company => getCompanyContactRecipients(company as Record<string, any>))

  const recipientMap = new Map<string, { name: string; email: string }>()

  const registerRecipient = (recipient: { name: string; email: string }) => {
    if (!recipient?.email) return
    const trimmedEmail = recipient.email.trim()
    if (!trimmedEmail) return
    const key = trimmedEmail.toLowerCase()
    if (recipientMap.has(key)) return
    const displayName = (recipient.name && recipient.name.trim()) || trimmedEmail
    recipientMap.set(key, { name: displayName, email: trimmedEmail })
  }

  participantRecipients.forEach(registerRecipient)
  companyRecipients.forEach(registerRecipient)

  const recipients = Array.from(recipientMap.values())

  const errors: string[] = []

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    try {
      await sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      if (i < recipients.length - 1) {
        await delay(2000)
      }
    } catch (error) {
      errors.push(`${recipient.name} (${recipient.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    success: errors.length === 0,
    errors
  }
}
