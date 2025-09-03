import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Function to ensure the documents bucket exists
async function ensureDocumentsBucket(supabase: ReturnType<typeof createClient>) {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return false
    }

    const documentsBucket = buckets?.find(bucket => bucket.id === 'documents')
    
    if (!documentsBucket) {
      console.log('📁 Documents bucket not found, attempting to create...')
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/webp',
          'image/avif',
          'image/svg+xml',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv'
        ],
        fileSizeLimit: 52428800 // 50MB
      })

      if (createError) {
        console.error('Error creating documents bucket:', createError)
        return false
      }

      console.log('✅ Documents bucket created successfully')
    }

    return true
  } catch (error) {
    console.error('Error ensuring documents bucket:', error)
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params
    
    console.log('🔵 Logo Upload API: Company ID:', resolvedParams.id)

    // Authentication check
    const authHeader = request.headers.get('authorization')
    let currentUser = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const { user } = await response.json()
          currentUser = user
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }

    if (!currentUser) {
      try {
        const cookieHeader = request.headers.get('cookie')
        const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
          headers: { cookie: cookieHeader || '' }
        })
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          if (sessionData.authenticated) {
            currentUser = sessionData.user
          }
        }
      } catch (error) {
        console.error('Cookie auth failed:', error)
      }
    }

    // Authorization check - Wolthers staff can upload for any company, external admins for their own
    if (currentUser) {
      console.log('🔵 Logo Upload API: Current user:', {
        email: currentUser.email,
        is_global_admin: currentUser.is_global_admin,
        company_id: currentUser.company_id,
        user_type: currentUser.user_type
      })
      
      const isWolthersStaff = currentUser.is_global_admin || currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      const isExternalAdmin = currentUser.user_type === 'admin' && currentUser.company_id === resolvedParams.id
      
      console.log('🔵 Logo Upload API: Authorization check:', {
        isWolthersStaff,
        isExternalAdmin,
        companyIdMatch: currentUser.company_id === resolvedParams.id
      })
      
      if (!isWolthersStaff && !isExternalAdmin) {
        return NextResponse.json(
          { error: 'Access denied. You can only upload logos for your own company.' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type - now includes AVIF and SVG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, AVIF, or SVG).' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Please upload an image smaller than 5MB.' },
        { status: 400 }
      )
    }

    // Ensure documents bucket exists
    const bucketReady = await ensureDocumentsBucket(supabase)
    if (!bucketReady) {
      console.error('Failed to ensure documents bucket exists')
      return NextResponse.json(
        { error: 'Storage configuration error. Please try again later.' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `company-logos/${resolvedParams.id}/${timestamp}.${fileExtension}`

    console.log('🔵 Logo Upload API: Uploading file:', {
      fileName,
      fileSize: file.size,
      fileType: file.type
    })

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('🔴 Logo Upload API: Upload error:', {
        error: uploadError,
        fileName,
        companyId: resolvedParams.id,
        fileType: file.type,
        fileSize: file.size
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload file'
      if (uploadError.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please contact support.'
      } else if (uploadError.message?.includes('File size')) {
        errorMessage = 'File size exceeds limit. Please upload a smaller image.'
      } else if (uploadError.message?.includes('mime type')) {
        errorMessage = 'File type not supported. Please upload a valid image file.'
      }
      
      return NextResponse.json(
        { error: errorMessage, details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    const logoUrl = publicUrlData.publicUrl

    console.log('✅ Logo Upload API: File uploaded successfully:', {
      fileName,
      logoUrl,
      companyId: resolvedParams.id
    })

    // Update company record with logo URL
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({ 
        logo_url: logoUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([fileName])
      
      return NextResponse.json(
        { error: 'Failed to update company logo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logoUrl,
      company: updatedCompany
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params

    // Authentication and authorization (same as POST)
    const authHeader = request.headers.get('authorization')
    let currentUser = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/auth/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const { user } = await response.json()
          currentUser = user
        }
      } catch (error) {
        console.error('Token verification failed:', error)
      }
    }

    if (!currentUser) {
      try {
        const cookieHeader = request.headers.get('cookie')
        const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
          headers: { cookie: cookieHeader || '' }
        })
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          if (sessionData.authenticated) {
            currentUser = sessionData.user
          }
        }
      } catch (error) {
        console.error('Cookie auth failed:', error)
      }
    }

    if (currentUser) {
      const isWolthersStaff = currentUser.is_global_admin || currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      const isExternalAdmin = currentUser.user_type === 'admin' && currentUser.company_id === resolvedParams.id
      
      if (!isWolthersStaff && !isExternalAdmin) {
        return NextResponse.json(
          { error: 'Access denied. You can only remove logos from your own company.' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current company logo URL
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('logo_url')
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Remove logo URL from database
    const { error: updateError } = await supabase
      .from('companies')
      .update({ 
        logo_url: null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', resolvedParams.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to remove logo' },
        { status: 500 }
      )
    }

    // Clean up file from storage if it exists
    if (company.logo_url) {
      try {
        const fileName = company.logo_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('documents').remove([`company-logos/${resolvedParams.id}/${fileName}`])
        }
      } catch (storageError) {
        console.warn('Failed to delete logo file from storage:', storageError)
        // Continue anyway - the database update is more important
      }
    }

    return NextResponse.json({
      message: 'Logo removed successfully'
    })

  } catch (error) {
    console.error('Logo deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}