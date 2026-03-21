import sanitizeHtmlLib from 'sanitize-html'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'div', 'span', 'hr',
]

const ALLOWED_ATTRIBUTES: sanitizeHtmlLib.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  div: ['class'],
  span: ['class'],
  p: ['class'],
}

const SANITIZE_OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ['http', 'https', 'mailto'],
}

/**
 * Sanitize HTML content to prevent XSS.
 * Used both at write-time (before DB storage) and read-time (before rendering).
 */
export function sanitizeHtmlContent(dirty: string): string {
  return sanitizeHtmlLib(dirty, SANITIZE_OPTIONS)
}

// Named exports matching usage sites — both call the same sanitizer
export const sanitizeContentForStorage = sanitizeHtmlContent
export const sanitizeContentForDisplay = sanitizeHtmlContent
