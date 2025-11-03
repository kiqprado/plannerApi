import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"

import { z } from 'zod'

import { prisma } from "../lib/prisma"

import { ClientError } from "../errors/client-error"

export async function deleteLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete("/trips/:tripId/links", {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        linkId: z.string().uuid()
      })
    }
  }, async (req, reply) => {
    const { tripId } = req.params
    const { linkId } = req.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    })
    const link = await prisma.links.findUnique({
      where: { id: linkId }
    })

    if(!trip) {
      throw new ClientError("Trip not found!", 404)
    }

    if(!link) {
      throw new ClientError("Link not found!", 404)
    }

    if(link.trip_id !== tripId) {
      throw new ClientError("This link does not belong to this Trip.", 400)
    }

    await prisma.links.delete({
      where: { id: linkId }
    })

    return reply.status(204).send()
  })
}