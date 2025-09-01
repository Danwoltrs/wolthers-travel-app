import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user information from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const vehicleId = params.id
    
    // Verify vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const setPrimary = formData.get('set_primary') === 'true'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxFileSize = 5 * 1024 * 1024 // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}` 
        }, { status: 400 })
      }
      
      if (file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `File too large: ${file.name}. Maximum size is 5MB` 
        }, { status: 400 })
      }
    }

    const uploadResults = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await uploadVehicleImage(supabase, vehicleId, file, i)
        uploadResults.push(result)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    if (uploadResults.length === 0) {
      return NextResponse.json({ 
        error: 'All uploads failed',
        errors 
      }, { status: 500 })
    }

    // Update vehicle with image URLs
    const imageUrls = uploadResults.map(r => r.publicUrl)
    
    // Get current vehicle data
    const { data: currentVehicle } = await supabase
      .from('vehicles')
      .select('image_url, gallery_images')
      .eq('id', vehicleId)
      .single()

    const currentGallery = currentVehicle?.gallery_images || []
    const newGallery = [...currentGallery, ...imageUrls]

    // Set primary image if requested or if no primary exists
    const shouldSetPrimary = setPrimary || !currentVehicle?.image_url
    const primaryImageUrl = shouldSetPrimary ? imageUrls[0] : currentVehicle?.image_url

    // Update vehicle record
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        image_url: primaryImageUrl,
        gallery_images: newGallery,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)

    if (updateError) {
      console.error('Error updating vehicle:', updateError)
      // Clean up uploaded files
      for (const result of uploadResults) {
        await supabase.storage.from('vehicle-images').remove([result.path])
      }
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        uploads: uploadResults,
        errors: errors.length > 0 ? errors : undefined,
        successCount: uploadResults.length,
        errorCount: errors.length,
        primaryImage: primaryImageUrl,
        galleryImages: newGallery
      }
    })

  } catch (error) {
    console.error('Error in vehicle image upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function uploadVehicleImage(
  supabase: any,
  vehicleId: string,
  file: File,
  index: number
): Promise<any> {
  // Generate unique filename
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `vehicles/${vehicleId}/${timestamp}-${index}-${randomSuffix}.${fileExtension}`

  // Upload file to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('vehicle-images')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (storageError) {
    throw new Error(`File upload failed: ${storageError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(storagePath)

  return {
    filename: sanitizedName,
    path: storagePath,
    publicUrl: publicUrl,
    size: file.size,
    type: file.type
  }
}

// DELETE endpoint to remove images
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
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

    const vehicleId = params.id
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Get current vehicle data
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('image_url, gallery_images')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Remove from gallery
    const currentGallery = vehicle.gallery_images || []
    const newGallery = currentGallery.filter((url: string) => url !== imageUrl)

    // Update primary image if needed
    let newPrimaryImage = vehicle.image_url
    if (vehicle.image_url === imageUrl) {
      newPrimaryImage = newGallery.length > 0 ? newGallery[0] : null
    }

    // Extract storage path from URL and delete from storage
    try {
      const urlParts = imageUrl.split('/vehicle-images/')
      if (urlParts.length > 1) {
        const storagePath = urlParts[1]
        await supabase.storage.from('vehicle-images').remove([storagePath])
      }
    } catch (storageError) {
      console.warn('Failed to delete from storage:', storageError)
    }

    // Update vehicle record
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        image_url: newPrimaryImage,
        gallery_images: newGallery,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        primaryImage: newPrimaryImage,
        galleryImages: newGallery
      }
    })

  } catch (error) {
    console.error('Error in vehicle image delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}