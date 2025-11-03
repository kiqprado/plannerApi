import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { z } from 'zod'
import { env } from '../env'
import nodemailer from 'nodemailer'

import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'

import { ClientError } from '../errors/client-error'

export async function createParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch("/trips/:tripId/participants", {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
    }
  }, async (req) => {
    const { tripId } = req.params
    const { name, email } = req.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: true }
    })

    if(!trip) {
      throw new ClientError("Trip cannot be found")
    }

    const owner = trip.participants.find(e => e.is_owner)
    const existingEmail = trip.participants.find(e => e.email === email)

    if(!owner) {
      throw new ClientError("Only Trip Owner can make changes")
    }

    if(existingEmail) {
      throw new ClientError("Email already invited on this Trip")
    }

    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        trip_id: trip.id
      }
    })

    const formattedStartDate = dayjs(trip.starts_at).format("LL")
    const formattedEndDate = dayjs(trip.ends_at).format("LL")

    const mail = await getMailClient()

    const confirmLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`
    const manualConfirmLink = `${env.WEB_BASE_URL}/participants/${participant.id}/manual-confirm`
    const detailsLink = `${env.WEB_BASE_URL}/trips/${trip.id}?participantId=${participant.id}`

    const message = await mail.sendMail({
      from: { name: "Equipe Plann.Er", address: "team@Plann.er.com" },
      to: participant.email,
      subject: `Convite para viagem: ${trip.destination}`,
      html: `
        <div>
          <p>Você foi adicionado à viagem para <strong>${trip.destination}</strong>
          (${formattedStartDate} até ${formattedEndDate}).</p>
          <a href="${confirmLink}">✅ Confirme sua presença com 1 clique</a>
          <p>ou</p>
          <a href="${manualConfirmLink}">🏷️ Confirmar informando os dados (indicado).</a>
          <p></p>
          <a href="${detailsLink}">📌 Ver detalhes da viagem</a>
        </div>
      `.trim()
    })
    
    console.table([{ to: participant.email, url: nodemailer.getTestMessageUrl(message) }])

    return {
      message: "Participant added successfully.",
      participantId: participant.id
    }
  })
}