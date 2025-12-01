'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon, Link2, Cloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type UploadMethod = 'file' | 'url' | 'google'

interface ImageUploadProps {
  label?: string
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
  bucket?: string
  folder?: string
  maxSizeMB?: number
  aspectRatio?: string
  className?: string
}

export default function ImageUpload({
  label = 'Upload Image',
  currentImageUrl,
  onImageUploaded,
  bucket = 'images',
  folder = 'uploads',
  maxSizeMB = 5,
  aspectRatio,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('file')
  const [imageUrl, setImageUrl] = useState('')
  const [googleImageId, setGoogleImageId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Convert Google Drive ID to direct image URL
  const getGoogleDriveImageUrl = (fileId: string): string => {
    // Remove any extra text and extract just the ID
    const cleanId = fileId.trim().split('/').pop() || fileId
    return `https://drive.google.com/uc?export=view&id=${cleanId}`
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onImageUploaded(publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onImageUploaded('')
    setImageUrl('')
    setGoogleImageId('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(imageUrl)
      setPreviewUrl(imageUrl)
      onImageUploaded(imageUrl)
      toast.success('Image URL set successfully')
    } catch (error) {
      toast.error('Invalid URL format')
    }
  }

  const handleGoogleIdSubmit = () => {
    if (!googleImageId.trim()) {
      toast.error('Please enter a valid Google Drive image ID')
      return
    }

    const imageUrl = getGoogleDriveImageUrl(googleImageId)
    setPreviewUrl(imageUrl)
    onImageUploaded(imageUrl)
    toast.success('Google Drive image set successfully')
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <Label>{label}</Label>}

      {/* Upload Method Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          className={`pb-2 px-3 text-sm font-medium transition-colors border-b-2 ${
            uploadMethod === 'file'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setUploadMethod('file')}
        >
          <Upload className="h-4 w-4 inline mr-1" />
          Upload File
        </button>
        <button
          type="button"
          className={`pb-2 px-3 text-sm font-medium transition-colors border-b-2 ${
            uploadMethod === 'url'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setUploadMethod('url')}
        >
          <Link2 className="h-4 w-4 inline mr-1" />
          Image URL
        </button>
        <button
          type="button"
          className={`pb-2 px-3 text-sm font-medium transition-colors border-b-2 ${
            uploadMethod === 'google'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setUploadMethod('google')}
        >
          <Cloud className="h-4 w-4 inline mr-1" />
          Google Drive
        </button>
      </div>

      <div className="flex items-start gap-4">
        {/* Preview */}
        {previewUrl ? (
          <div className="relative group">
            <div
              className={`overflow-hidden rounded-lg border-2 border-gray-200 ${
                aspectRatio ? `aspect-${aspectRatio}` : 'w-32 h-32'
              }`}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 ${
              aspectRatio ? `aspect-${aspectRatio}` : 'w-32 h-32'
            }`}
          >
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Input Method */}
        <div className="flex-1 space-y-2">
          {uploadMethod === 'file' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Max size: {maxSizeMB}MB • JPG, PNG, GIF, WebP
              </p>
            </>
          )}

          {uploadMethod === 'url' && (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUrlSubmit}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Set Image URL
              </Button>
              <p className="text-xs text-muted-foreground">
                Enter a direct URL to an image hosted online
              </p>
            </div>
          )}

          {uploadMethod === 'google' && (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Google Drive file ID or share link"
                value={googleImageId}
                onChange={(e) => setGoogleImageId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoogleIdSubmit()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGoogleIdSubmit}
              >
                <Cloud className="h-4 w-4 mr-2" />
                Use Google Drive Image
              </Button>
              <p className="text-xs text-muted-foreground">
                Enter Google Drive file ID or paste share link
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
