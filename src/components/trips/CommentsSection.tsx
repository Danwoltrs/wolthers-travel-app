'use client'

import React, { useState } from 'react'
import { Star, MessageSquare, Send, Eye, EyeOff, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogs } from '@/hooks/use-modal'

interface Review {
  id: string
  author: string
  company: string
  rating: number
  comment: string
  timestamp: Date
  isPublic: boolean
}

interface CommentsProps {
  tripId: string
}

export default function CommentsSection({ tripId }: CommentsProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const { alert } = useDialogs()
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      author: 'John Smith',
      company: 'Acme Coffee Co.',
      rating: 5,
      comment: 'Excellent trip! The farm visits were incredibly insightful and well-organized.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isPublic: true
    },
    {
      id: '2',
      author: 'Sarah Johnson',
      company: 'Bean & Beyond',
      rating: 4,
      comment: 'Great experience overall. Would love to see more time at each location.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isPublic: false
    }
  ])

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim() || rating === 0) {
      await alert(
        'Please provide both a rating and comment before submitting.',
        'Incomplete Review',
        'warning'
      )
      return
    }

    const newReview: Review = {
      id: Date.now().toString(),
      author: 'Current User', // Replace with actual user name
      company: 'Your Company', // Replace with actual company
      rating,
      comment: comment.trim(),
      timestamp: new Date(),
      isPublic
    }

    setReviews(prev => [newReview, ...prev])
    
    // Reset form
    setRating(0)
    setComment('')
    setIsPublic(false)
    
    await alert(
      'Your review has been submitted successfully! Thank you for your feedback.',
      'Review Submitted',
      'success'
    )
  }

  const renderStars = (value: number, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            className={cn(
              size,
              interactive && 'cursor-pointer hover:scale-110 transition-transform',
              star <= (interactive ? (hoverRating || rating) : value)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            )}
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            disabled={!interactive}
          >
            <Star className={size} />
          </button>
        ))}
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Comments & Reviews
          </h2>
        </div>
        
        {reviews.length > 0 && (
          <div className="flex items-center space-x-2">
            {renderStars(averageRating)}
            <span className="text-sm text-gray-600">
              ({averageRating.toFixed(1)})
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Leave a Review</h3>
        
        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          {renderStars(rating, true, 'w-6 h-6')}
        </div>

        {/* Comment */}
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comment *
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Share your thoughts about this trip..."
          />
        </div>

        {/* Public Option */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make this review public
            </label>
          </div>
          
          {isPublic && (
            <div className="flex items-center text-xs text-blue-600">
              <Eye className="w-4 h-4 mr-1" />
              Will appear on wolthers.com/trip-reviews
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Submit Review</span>
        </button>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Reviews ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {review.author}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      from {review.company}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {renderStars(review.rating)}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {review.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {review.isPublic ? (
                    <div className="flex items-center text-xs text-green-600">
                      <Eye className="w-3 h-3 mr-1" />
                      Public
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-gray-500">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Private
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Post-Trip Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Actions</h3>
        
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
            Generate Summary Email
          </button>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Export All Attachments
          </button>
          
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
            AI Meeting Summary
          </button>
          
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            Archive Trip
          </button>
        </div>
      </div>
    </div>
  )
}