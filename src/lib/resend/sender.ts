import { resend } from './client'

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  from?: string
}

const DEFAULT_FROM = 'Wolthers Travel <trips@trips.wolthers.com>'

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  from = DEFAULT_FROM
}: SendEmailOptions) {
  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    await delay(1000)
    return result
  } catch (error) {
    if (error instanceof Error && error.message.includes('rate limit')) {
      await delay(10_000)

      const retry = await resend.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      replyTo
      })

      if (retry.error) {
        throw new Error(retry.error.message)
      }

      await delay(1000)
      return retry
    }

    throw error
  }
}
