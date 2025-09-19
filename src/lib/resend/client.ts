import { Resend } from 'resend'

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  return 'https://trips.wolthers.com'
}

export const resend = new Resend(process.env.RESEND_API_KEY)
export const baseUrl = resolveBaseUrl()
export const logoUrl = `${baseUrl}/images/logos/wolthers-logo-green.png`

export { resolveBaseUrl }
