import { describe, it, expect } from 'vitest'
import {
  sanitizeHtmlContent,
  sanitizeContentForStorage,
  sanitizeContentForDisplay,
} from '@/lib/sanitize'

describe('sanitizeHtmlContent', () => {
  it('strips script tags', () => {
    expect(sanitizeHtmlContent('<script>alert(1)</script>')).toBe('')
  })

  it('strips onerror handlers on img tags', () => {
    const result = sanitizeHtmlContent('<img onerror="alert(1)" src="x">')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('strips onmouseover handlers', () => {
    const result = sanitizeHtmlContent('<div onmouseover="alert(1)">text</div>')
    expect(result).not.toContain('onmouseover')
  })

  it('strips onclick handlers', () => {
    const result = sanitizeHtmlContent('<button onclick="alert(1)">click</button>')
    expect(result).not.toContain('onclick')
  })

  it('strips javascript: URLs in href', () => {
    // eslint-disable-next-line no-script-url
    const result = sanitizeHtmlContent('<a href="javascript:alert(1)">link</a>')
    expect(result).not.toContain('javascript:')
  })

  it('preserves safe HTML tags', () => {
    const safe = '<p>Hello <strong>world</strong> and <em>italic</em></p>'
    expect(sanitizeHtmlContent(safe)).toBe(safe)
  })

  it('preserves links with valid href', () => {
    const link = '<a href="https://example.com">link</a>'
    expect(sanitizeHtmlContent(link)).toBe(link)
  })

  it('preserves lists', () => {
    const list = '<ul><li>item 1</li><li>item 2</li></ul>'
    expect(sanitizeHtmlContent(list)).toBe(list)
  })

  it('strips nested XSS inside allowed tags', () => {
    const result = sanitizeHtmlContent('<p><script>alert(1)</script>safe text</p>')
    expect(result).toBe('<p>safe text</p>')
  })

  it('handles empty string', () => {
    expect(sanitizeHtmlContent('')).toBe('')
  })

  it('handles very long strings', () => {
    const long = '<p>' + 'a'.repeat(10_000) + '</p>'
    const result = sanitizeHtmlContent(long)
    expect(result).toBe(long)
  })

  it('strips data: URLs in href', () => {
    const result = sanitizeHtmlContent('<a href="data:text/html,<script>alert(1)</script>">x</a>')
    expect(result).not.toContain('data:')
  })

  it('strips svg with embedded script', () => {
    const result = sanitizeHtmlContent('<svg><script>alert(1)</script></svg>')
    expect(result).not.toContain('script')
  })
})

describe('named exports', () => {
  it('sanitizeContentForStorage is the same function', () => {
    expect(sanitizeContentForStorage).toBe(sanitizeHtmlContent)
  })

  it('sanitizeContentForDisplay is the same function', () => {
    expect(sanitizeContentForDisplay).toBe(sanitizeHtmlContent)
  })
})
