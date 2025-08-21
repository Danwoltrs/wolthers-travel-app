import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST - Share document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: documentId } = params
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const shareData = await request.json()
    const {
      emails = [],
      userIds = [],
      accessLevel = 'view',
      expirationDate,
      message,
      allowExternalSharing = false,
      shareWithCompany = false,
      shareWithTripParticipants = false
    } = shareData

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select(`
        *,
        companies:supplier_id (
          id,
          name,
          email
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check share permissions
    if (!await hasShareAccess(supabase, user.id, document)) {
      return NextResponse.json({ error: 'Share access denied' }, { status: 403 })
    }

    const shareResults = []
    const errors = []

    // Share with specific users by ID
    if (userIds.length > 0) {
      for (const userId of userIds) {
        try {
          const result = await shareWithUser(supabase, {
            documentId,
            userId,
            sharedBy: user.id,
            accessLevel,
            expirationDate,
            message
          })
          shareResults.push(result)
        } catch (error) {
          errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // Share with users by email
    if (emails.length > 0) {
      for (const email of emails) {
        try {
          const result = await shareWithEmail(supabase, {
            documentId,
            email,
            sharedBy: user.id,
            accessLevel,
            expirationDate,
            message,
            allowExternalSharing
          })
          shareResults.push(result)
        } catch (error) {
          errors.push({
            email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    // Share with supplier company
    if (shareWithCompany && document.supplier_id) {
      try {
        const result = await shareWithCompany(supabase, {
          documentId,
          companyId: document.supplier_id,
          sharedBy: user.id,
          accessLevel,
          expirationDate,
          message
        })
        shareResults.push(result)
      } catch (error) {
        errors.push({
          company: document.companies?.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Share with trip participants
    if (shareWithTripParticipants && document.trip_id) {
      try {
        const result = await shareWithTripParticipants(supabase, {
          documentId,
          tripId: document.trip_id,
          sharedBy: user.id,
          accessLevel,
          expirationDate,
          message
        })
        shareResults.push(result)
      } catch (error) {
        errors.push({
          trip: document.trip_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update document sharing status
    await supabase
      .from('company_documents')
      .update({
        is_shared: true,
        shared_by: user.id,
        shared_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Log sharing action
    await supabase
      .from('company_access_logs')
      .insert([{
        company_id: document.company_id,
        user_id: user.id,
        document_id: documentId,
        action_type: 'share',
        action_details: {
          shared_with_count: shareResults.length,
          access_level: accessLevel,
          share_types: {
            users: userIds.length,
            emails: emails.length,
            company: shareWithCompany,
            trip_participants: shareWithTripParticipants
          },
          expires_at: expirationDate
        }
      }])

    return NextResponse.json({
      success: true,
      data: {
        shareResults,
        errors: errors.length > 0 ? errors : undefined,
        successCount: shareResults.length,
        errorCount: errors.length
      }
    })

  } catch (error) {
    console.error('Error in document share API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get document sharing status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: documentId } = params
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get document and sharing information
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select(`
        *,
        companies:supplier_id (name),
        users:shared_by (full_name, email)
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get sharing permissions for this document
    const { data: permissions, error: permError } = await supabase
      .from('document_permissions')
      .select(`
        *,
        users (
          id,
          full_name,
          email,
          companies (name)
        )
      `)
      .eq('document_id', documentId)

    if (permError) {
      console.error('Error fetching permissions:', permError)
    }

    // Get recent access logs
    const { data: accessLogs, error: logError } = await supabase
      .from('company_access_logs')
      .select(`
        *,
        users (full_name, email)
      `)
      .eq('document_id', documentId)
      .eq('action_type', 'view')
      .order('created_at', { ascending: false })
      .limit(10)

    const sharingInfo = {
      isShared: document.is_shared,
      sharedBy: document.users ? {
        name: document.users.full_name,
        email: document.users.email
      } : null,
      sharedDate: document.shared_date,
      accessLevel: document.access_level,
      visibleToCompany: document.visible_to_company,
      visibleToParticipants: document.visible_to_participants,
      permissions: permissions?.map((perm: any) => ({
        userId: perm.user_id,
        userName: perm.users?.full_name,
        userEmail: perm.users?.email,
        userCompany: perm.users?.companies?.name,
        accessLevel: perm.access_level,
        grantedBy: perm.granted_by,
        grantedAt: perm.created_at,
        expiresAt: perm.expires_at
      })) || [],
      recentViews: accessLogs?.map((log: any) => ({
        userId: log.user_id,
        userName: log.users?.full_name,
        userEmail: log.users?.email,
        viewedAt: log.created_at,
        ipAddress: log.ip_address
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: {
        document: {
          id: document.id,
          name: document.file_name,
          supplier: document.companies?.name
        },
        sharing: sharingInfo
      }
    })

  } catch (error) {
    console.error('Error getting sharing info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke document sharing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: documentId } = params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const revokeAll = searchParams.get('revoke_all') === 'true'
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check permissions
    if (!await hasShareAccess(supabase, user.id, document)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (revokeAll) {
      // Revoke all sharing permissions
      const { error: revokeError } = await supabase
        .from('document_permissions')
        .delete()
        .eq('document_id', documentId)

      if (revokeError) {
        return NextResponse.json(
          { error: 'Failed to revoke sharing' },
          { status: 500 }
        )
      }

      // Update document sharing status
      await supabase
        .from('company_documents')
        .update({
          is_shared: false,
          visible_to_company: false,
          visible_to_participants: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      // Log action
      await supabase
        .from('company_access_logs')
        .insert([{
          company_id: document.company_id,
          user_id: user.id,
          document_id: documentId,
          action_type: 'share_revoke',
          action_details: {
            revoke_type: 'all',
            revoked_by: user.id
          }
        }])

      return NextResponse.json({
        success: true,
        data: {
          message: 'All sharing permissions revoked'
        }
      })

    } else if (userId) {
      // Revoke sharing for specific user
      const { error: revokeError } = await supabase
        .from('document_permissions')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId)

      if (revokeError) {
        return NextResponse.json(
          { error: 'Failed to revoke user access' },
          { status: 500 }
        )
      }

      // Log action
      await supabase
        .from('company_access_logs')
        .insert([{
          company_id: document.company_id,
          user_id: user.id,
          document_id: documentId,
          action_type: 'share_revoke',
          action_details: {
            revoke_type: 'user',
            revoked_user_id: userId,
            revoked_by: user.id
          }
        }])

      return NextResponse.json({
        success: true,
        data: {
          message: 'User access revoked'
        }
      })

    } else {
      return NextResponse.json(
        { error: 'Must specify user_id or revoke_all=true' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error revoking document sharing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function hasShareAccess(supabase: any, userId: string, document: any): Promise<boolean> {
  try {
    // Check if user is Wolthers staff or document creator
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_global_admin')
      .eq('id', userId)
      .single()

    if (user?.is_global_admin || user?.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') {
      return true
    }

    if (document.created_by === userId) {
      return true
    }

    return false

  } catch (error) {
    console.error('Error checking share access:', error)
    return false
  }
}

async function shareWithUser(
  supabase: any,
  options: {
    documentId: string
    userId: string
    sharedBy: string
    accessLevel: string
    expirationDate?: string
    message?: string
  }
) {
  // Check if permission already exists
  const { data: existingPerm } = await supabase
    .from('document_permissions')
    .select('id')
    .eq('document_id', options.documentId)
    .eq('user_id', options.userId)
    .single()

  if (existingPerm) {
    // Update existing permission
    const { data: permission, error } = await supabase
      .from('document_permissions')
      .update({
        access_level: options.accessLevel,
        expires_at: options.expirationDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPerm.id)
      .select()
      .single()

    if (error) throw error
    return { type: 'user_updated', userId: options.userId, permission }

  } else {
    // Create new permission
    const { data: permission, error } = await supabase
      .from('document_permissions')
      .insert([{
        document_id: options.documentId,
        user_id: options.userId,
        access_level: options.accessLevel,
        granted_by: options.sharedBy,
        expires_at: options.expirationDate,
        share_message: options.message
      }])
      .select()
      .single()

    if (error) throw error

    // Send notification (if email service is configured)
    if (options.message) {
      await sendShareNotification(supabase, {
        userId: options.userId,
        documentId: options.documentId,
        message: options.message,
        sharedBy: options.sharedBy
      })
    }

    return { type: 'user_shared', userId: options.userId, permission }
  }
}

async function shareWithEmail(
  supabase: any,
  options: {
    documentId: string
    email: string
    sharedBy: string
    accessLevel: string
    expirationDate?: string
    message?: string
    allowExternalSharing: boolean
  }
) {
  // Check if user exists in system
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', options.email)
    .single()

  if (existingUser) {
    // Share with existing user
    return await shareWithUser(supabase, {
      ...options,
      userId: existingUser.id
    })

  } else if (options.allowExternalSharing) {
    // Create external sharing link or guest access
    const { data: externalShare, error } = await supabase
      .from('document_external_shares')
      .insert([{
        document_id: options.documentId,
        email: options.email,
        access_level: options.accessLevel,
        shared_by: options.sharedBy,
        expires_at: options.expirationDate,
        share_token: generateShareToken(),
        share_message: options.message
      }])
      .select()
      .single()

    if (error) throw error

    // Send external share email
    await sendExternalShareEmail(supabase, {
      email: options.email,
      documentId: options.documentId,
      shareToken: externalShare.share_token,
      message: options.message,
      sharedBy: options.sharedBy
    })

    return { type: 'external_shared', email: options.email, share: externalShare }

  } else {
    throw new Error(`User with email ${options.email} not found and external sharing is disabled`)
  }
}

async function shareWithCompany(
  supabase: any,
  options: {
    documentId: string
    companyId: string
    sharedBy: string
    accessLevel: string
    expirationDate?: string
    message?: string
  }
) {
  // Update document to be visible to company
  const { data: document, error: updateError } = await supabase
    .from('company_documents')
    .update({
      visible_to_company: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', options.documentId)
    .select()
    .single()

  if (updateError) throw updateError

  // Get all company users and create permissions
  const { data: companyUsers, error: usersError } = await supabase
    .from('users')
    .select('id')
    .eq('company_id', options.companyId)

  if (usersError) throw usersError

  const permissions = []
  for (const user of companyUsers) {
    const { data: permission, error: permError } = await supabase
      .from('document_permissions')
      .insert([{
        document_id: options.documentId,
        user_id: user.id,
        company_id: options.companyId,
        access_level: options.accessLevel,
        granted_by: options.sharedBy,
        expires_at: options.expirationDate,
        share_message: options.message
      }])
      .select()
      .single()

    if (!permError) {
      permissions.push(permission)
    }
  }

  return { type: 'company_shared', companyId: options.companyId, permissions }
}

async function shareWithTripParticipants(
  supabase: any,
  options: {
    documentId: string
    tripId: string
    sharedBy: string
    accessLevel: string
    expirationDate?: string
    message?: string
  }
) {
  // Update document to be visible to participants
  const { data: document, error: updateError } = await supabase
    .from('company_documents')
    .update({
      visible_to_participants: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', options.documentId)
    .select()
    .single()

  if (updateError) throw updateError

  // Get all trip participants and create permissions
  const { data: participants, error: participantsError } = await supabase
    .from('trip_participants')
    .select('user_id')
    .eq('trip_id', options.tripId)

  if (participantsError) throw participantsError

  const permissions = []
  for (const participant of participants) {
    const { data: permission, error: permError } = await supabase
      .from('document_permissions')
      .insert([{
        document_id: options.documentId,
        user_id: participant.user_id,
        access_level: options.accessLevel,
        granted_by: options.sharedBy,
        expires_at: options.expirationDate,
        share_message: options.message
      }])
      .select()
      .single()

    if (!permError) {
      permissions.push(permission)
    }
  }

  return { type: 'trip_shared', tripId: options.tripId, permissions }
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}

async function sendShareNotification(
  supabase: any,
  options: {
    userId: string
    documentId: string
    message: string
    sharedBy: string
  }
) {
  try {
    // This would integrate with your notification system
    console.log('Sending share notification:', options)
    // Implementation would depend on your notification infrastructure
  } catch (error) {
    console.error('Failed to send share notification:', error)
  }
}

async function sendExternalShareEmail(
  supabase: any,
  options: {
    email: string
    documentId: string
    shareToken: string
    message?: string
    sharedBy: string
  }
) {
  try {
    // This would integrate with your email service
    console.log('Sending external share email:', options)
    // Implementation would depend on your email service (SendGrid, etc.)
  } catch (error) {
    console.error('Failed to send external share email:', error)
  }
}