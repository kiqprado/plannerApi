import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env } from '../env'

export async function getMailClient() {
  const isProd = env.NODE_ENV === 'production'

  if(!isProd) {
    const account = await nodemailer.createTestAccount()

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    })

    return {
      async sendMail(options: any) {
        const info = await transporter.sendMail(options)
        const url = nodemailer.getTestMessageUrl(info)

        console.log('📨 Email (preview dev):', url)
        return info
      }
    }
  }

  const resend =  new Resend(env.RESEND_API_KEY)

  return {
    async sendMail({ from, to, subject, html}: any) {
      const response = await resend.emails.send({
        from: `${from.name} <${from.adress}>`,
        to,
        subject,
        html
      })

      console.log('📨 Email enviado via Resend:', response)

      return response
    }
  }
  
}
