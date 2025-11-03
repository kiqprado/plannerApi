import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"

import { z } from 'zod'
import { env } from '../env'

import nodemailer from 'nodemailer'

import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from "../lib/mail"
import { ClientError } from "../errors/client-error";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email(),
        emails_to_invite: z.array(z.string().email())
      })
    }
  }, async (req) => {
    const { 
      destination, 
      starts_at, 
      ends_at, 
      owner_name, 
      owner_email, 
      emails_to_invite } = req.body

    if(dayjs(starts_at).isBefore(new Date())) {
      throw new ClientError("Invalid Trip starts date.")
    }

    if(dayjs(ends_at).isBefore(starts_at)) {
      throw new ClientError("Invalid Trip ends date.")
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        starts_at,
        ends_at,
        participants: {
          createMany: {
            data: [{
              name: owner_name,
              email: owner_email,
              is_owner: true,
              is_confirmed: true,
            },
            ...emails_to_invite.map(email => {
              return { email }
            })
          ]
          }
        }
      },
      include: {
        participants: true
      }
    })

    const formattedStartDate = dayjs(starts_at).format('LL')
    const formattedEndDate = dayjs(ends_at).format('LL')

    const mail = await getMailClient()

    const owner = trip.participants.find(p => p.is_owner)!

    const ownerMessage = await mail.sendMail({
      from: {
        name: 'Equipe Plann.Er',
        address: 'team@Plann.er.com'
      },
      to: owner.email,
      subject: `Viagem para ${destination} em ${formattedStartDate}, criada!`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Olá ${owner_name}. Sua viagem para <strong>${destination}</strong> nas datas <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
          <p></p>
          <a href="${env.WEB_BASE_URL}/trips/${trip.id}?participantId=${owner.id}">📌 Ver detalhes da viagem</a>
          <p></p>
          <p></p>
          <p>Att. Equipe Plann.Er</p>
        </div>
      `.trim()
    })

    await Promise.all(trip.participants.
      filter(p => !p.is_owner).
      map(async (participant) => {
        const confirmLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm` //Confirma o participante no back
        const manualConfirmLink = `${env.WEB_BASE_URL}/participants/${participant.id}/manual-confirm`
        const detailsLink = `${env.WEB_BASE_URL}/trips/${trip.id}?participantId=${participant.id}`
        
        const message = await mail.sendMail({
          from: {
            name: 'Equipe Plann.Er',
            address: 'team@Plann.er.com'
          },
          to: participant.email,
          subject: `Convite para ${destination} em ${formattedStartDate}`,
          html: `
            <div>
              <p></p>
              <p>Olá, você acaba de receber um convite de viagem para <strong>${destination}</strong> em (${formattedStartDate} até ${formattedEndDate})
              </p>
              <p></p>
              <a href="${confirmLink}">✅ Confirme sua presença com 1 clique</a>
              <p>ou caso prefira</p>
              <p></p>
              <p>
              <a href="${manualConfirmLink}">🏷️ Confirmar informando os dados (indicado).</a>
              </p>
              <p></p>
              <p>Veja os dados da viagem em:</p>
              <a href="${detailsLink}">📌 Ver detalhes da viagem</a>
              <p></p>
              <p></p>
              <p>Att. Equipe Plann.Er</p>
            </div>
          `.trim()
        })

        console.table([
          { to: participant.email, url: nodemailer.getTestMessageUrl(message) }
        ])
      }))

    console.log("Owner Email:", nodemailer.getTestMessageUrl(ownerMessage))
    
    return {
      tripId: trip.id,
      participantId: owner.id
    }
  })
}