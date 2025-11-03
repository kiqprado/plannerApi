import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"

import { z } from 'zod'
import { prisma } from "../lib/prisma"

import { ClientError } from "../errors/client-error"

export async function deleteActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete("/trips/:tripId/activities", {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        activityId: z.string().uuid()
      })
    }
  }, async (req, reply) => {
    const { tripId } = req.params
    const { activityId } = req.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId } 
    })

    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if(!trip) {
      throw new ClientError("Trip not found!", 404)
    }

    if(!activity) {
      throw new ClientError("Activity can`t be found on this Trip")
    }

    if(activity.trip_id !== tripId) {
      throw new ClientError("This current activity does not belong to this Trip", 403)
    }

    await prisma.activity.delete({
      where: { id: activityId }
    })

    return reply.status(204).send()
  })  
}
