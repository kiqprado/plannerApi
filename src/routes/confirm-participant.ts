import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { z } from 'zod'
import { env } from '../env'

import { prisma } from "../lib/prisma";

import { ClientError } from "../errors/client-error";

export async function confirmParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get("/participants/:participantId/confirm", {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (req, reply) => {
    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where: {
        id: participantId
      }
    })

    if(!participant) {
      throw new ClientError('Participant not found.')
    }

    if(participant.is_confirmed) {
      return reply.redirect(`${env.WEB_BASE_URL}/participants/${participant.id}/confirmed?tripId=${participant.trip_id}`)
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: { is_confirmed: true}
    })

    return reply.redirect(`${env.WEB_BASE_URL}/participants/${participant.id}/confirmed?tripId=${participant.trip_id}`)
  })

  app.withTypeProvider<ZodTypeProvider>().patch("/participants/:participantId/confirm", {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      }),
      body: z.object({
        name: z.string().min(2, "Escreva seu nome completo"),
        email: z.string().email("Email inválido")
      })
    }
  }, async (req, reply) => {
    const { participantId } = req.params
    const { name, email } = req.body

    const participant = await prisma.participant.findUnique({ 
      where: { id: participantId },
      include: { trip: true }
    })

    if(!participant) {
      throw new ClientError("Participant not Found!")
    }

    if(participant.is_confirmed) {
      return reply.status(409).send({
        message: "The current Participant is already confirmed on trip.",
        tripId: participant.trip.id
      })
    }

    if(participant.email !== email) {
      throw new ClientError("O email informado não corresponde ao convite enviado ao email.")
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: { 
        name, 
        is_confirmed: true
      }
    })

    return reply.send({ ok: true, tripId: participant.trip.id})
  })
}