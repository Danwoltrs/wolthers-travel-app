/**
 * Utility functions for processing and summarizing notes
 */

interface NoteContent {
  html?: string
  plainText?: string
  media?: Array<{
    id: string
    type: string
    content: string
    timestamp?: number
    description?: string
    relativeTime?: string
  }>
}

interface Note {
  id: string
  content: NoteContent
  created_at: string
  created_by_name?: string
}

/**
 * Extract meaningful text content from note HTML
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return ''
  
  // Remove HTML tags but preserve structure
  let text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return text
}

/**
 * Generate a concise summary of note content
 */
export function generateNoteSummary(note: Note, maxLength: number = 100): string {
  const content = note.content
  
  // Extract main text content
  let mainText = ''
  if (content.plainText && content.plainText.trim()) {
    mainText = content.plainText.trim()
  } else if (content.html) {
    mainText = extractTextFromHTML(content.html)
  }
  
  // Extract transcript content if available
  const transcripts = content.media?.filter(m => m.type === 'transcript') || []
  const transcriptText = transcripts.map(t => t.content).join(' ')
  
  // Combine main text and transcript
  let combinedText = mainText
  if (transcriptText && transcriptText.trim()) {
    if (combinedText) {
      combinedText += ' | Transcript: ' + transcriptText
    } else {
      combinedText = 'Transcript: ' + transcriptText
    }
  }
  
  // If still no content, try to extract from HTML templates
  if (!combinedText && content.html) {
    // Look for template content (5W1H, etc.)
    const templateMatch = content.html.match(/<h3[^>]*>([^<]+)<\/h3>/)
    if (templateMatch) {
      combinedText = templateMatch[1]
      
      // Try to extract key insights from template
      const insights = extractTemplateInsights(content.html)
      if (insights.length > 0) {
        combinedText += ': ' + insights.slice(0, 2).join(', ')
      }
    }
  }
  
  if (!combinedText) {
    return 'Note from ' + new Date(note.created_at).toLocaleDateString()
  }
  
  // Truncate to max length
  if (combinedText.length > maxLength) {
    combinedText = combinedText.substring(0, maxLength) + '...'
  }
  
  return combinedText
}

/**
 * Extract key insights from structured templates like 5W1H
 */
function extractTemplateInsights(html: string): string[] {
  const insights: string[] = []
  
  // Extract content from colored boxes (template fields)
  const boxMatches = html.match(/<div style="[^"]*background:[^"]*"[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g)
  if (boxMatches) {
    boxMatches.forEach(match => {
      const textMatch = match.match(/<p[^>]*>([^<]+)<\/p>/)
      if (textMatch && textMatch[1].trim()) {
        insights.push(textMatch[1].trim())
      }
    })
  }
  
  return insights
}

/**
 * Generate summary for transcript content
 */
export function generateTranscriptSummary(transcripts: Array<{ content: string, relativeTime?: string }>): string {
  if (!transcripts || transcripts.length === 0) return ''
  
  const totalContent = transcripts.map(t => t.content).join(' ')
  const duration = transcripts[transcripts.length - 1]?.relativeTime
  
  let summary = totalContent.length > 80 
    ? totalContent.substring(0, 80) + '...' 
    : totalContent
    
  if (duration) {
    summary += ` (${duration})`
  }
  
  return summary
}

/**
 * Check if note has media content (transcripts, images, etc.)
 */
export function hasMediaContent(note: Note): boolean {
  return note.content.media && note.content.media.length > 0
}

/**
 * Get media summary for display
 */
export function getMediaSummary(note: Note): string {
  const media = note.content.media || []
  if (media.length === 0) return ''
  
  const transcripts = media.filter(m => m.type === 'transcript')
  const others = media.filter(m => m.type !== 'transcript')
  
  const parts: string[] = []
  
  if (transcripts.length > 0) {
    const totalDuration = transcripts[transcripts.length - 1]?.relativeTime
    parts.push(`${transcripts.length} transcript${transcripts.length > 1 ? 's' : ''}${totalDuration ? ` (${totalDuration})` : ''}`)
  }
  
  if (others.length > 0) {
    parts.push(`${others.length} attachment${others.length > 1 ? 's' : ''}`)
  }
  
  return parts.join(', ')
}

/**
 * Format note summary for display in collapsed state
 */
export function formatNotePreview(note: Note): {
  summary: string
  hasTranscript: boolean
  mediaInfo: string
  timeAgo: string
} {
  const summary = generateNoteSummary(note, 120)
  const hasTranscript = note.content.media?.some(m => m.type === 'transcript') || false
  const mediaInfo = getMediaSummary(note)
  const timeAgo = formatTimeAgo(note.created_at)
  
  return {
    summary,
    hasTranscript,
    mediaInfo,
    timeAgo
  }
}

/**
 * Format relative time
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins > 0 ? `${diffMins} min${diffMins > 1 ? 's' : ''} ago` : 'Just now'
  }
}