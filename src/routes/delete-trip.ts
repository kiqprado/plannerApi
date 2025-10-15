import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../lib/prisma'
import z from 'zod'

import { ClientError } from '../errors/client-error'

export async function deleteTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete("/trips/:tripId", {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      querystring: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params
    const { participantId } = req.query

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { participants: true } 
    })

    if(!trip) {
      throw new ClientError("Trip Not Found My Friend")
    }

    const owner = trip.participants.find(participant => participant.is_owner)

    if(!owner || owner.id !== participantId) {
      throw new ClientError("Only a Trip Owner can cancel this Trip.")
    }

    await prisma.trip.delete({
      where: { id: tripId}
    })

    return res.status(200).send({ message: "Trip has been canceled successfully!"})
  })
}