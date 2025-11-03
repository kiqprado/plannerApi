import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClientError } from "../errors/client-error";

export async function updateTrip( app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch("/trips/:tripId", {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      querystring: z.object({
        participantId: z.string().uuid()
      }),
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date()
      })
    }
  }, async (req) => {
    const { tripId } = req.params
    const { participantId } = req.query
    const { destination, starts_at, ends_at } = req.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    })

    if(!trip) {
      throw new ClientError("404. Trip Not Found")
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { trip: true }
    })

    if(!participant) {
      throw new ClientError("404. Participant not found on Trip")
    }

    if(!participant.is_owner) {
      throw new ClientError("403. Only Trip owner can change details")
    }

    if(dayjs(starts_at).isBefore(new Date())) {
      throw new ClientError("400. Trip starts date must be in the future")
    }

    if(dayjs(ends_at).isBefore(starts_at)) {
      throw new ClientError("400. Trip end date must be after the start date")
    }

    const updateTrip = await prisma.trip.update({
      where: { id: tripId},
      data: {
        destination,
        starts_at,
        ends_at
      }
    })

    return ({ tripId: updateTrip.id, updateTrip})
  })
}