import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { ClientError } from "../errors/client-error";

export async function getParticipant( app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId', {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (req) => {
    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        trip: {
          select: {
            id: true,
            destination: true,
            starts_at: true,
            ends_at: true
          }
        }
      }
    })

    if(!participant) {
      throw new ClientError(`Participant ${participant} not found`)
    }

    return { 
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        is_owner: participant.is_owner,
        is_confirmed: participant.is_confirmed,
        trip_id: participant.trip.id
      },
      trip: participant.trip
    }
  })
}