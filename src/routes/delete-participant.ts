import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"

import { prisma } from "../lib/prisma"
import z from 'zod'

import { ClientError } from "../errors/client-error"

export async function deleteParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete("/participants/:participantId", {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (req, reply) => {
    const { participantId } = req.params

    const participant = await prisma.participant.findUnique({
      where: { id: participantId } 
    })

    if(!participant) {
      throw new ClientError("Participant not found on Trip", 404)
    }

    if(participant.is_owner) {
      throw new ClientError("Owner Trip cannot be removed on Trip.", 403)
    }

    await prisma.participant.delete({
      where: { id: participantId }
    })

    return reply.status(204).send()
  })
}