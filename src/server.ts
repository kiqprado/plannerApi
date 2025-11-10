import 'dotenv/config';
import fastify from 'fastify'
import cors from '@fastify/cors'
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'

import { env } from './env'

import { createTrip } from './routes/create-trip'
import { updateTrip } from './routes/update-trip'
import { getTripDetails } from './routes/get-trip-details'

import { deleteTrip } from './routes/delete-trip'

import { confirmParticipants } from './routes/confirm-participant'
import { getParticipants } from './routes/get-participants'
import { getParticipant } from './routes/get-participant'
import { createParticipant } from './routes/create-participant'

import { deleteParticipant } from './routes/delete-participant';

import { createActivity } from './routes/create-activity'
import { getActivities } from './routes/get-activities'

import { deleteActivity } from './routes/delete-activity'

import { createLink } from './routes/create-link'
import { getLinks } from './routes/get-links'

import { deleteLink } from './routes/delete-link';

import { createInvite } from './routes/create-invite'

import { errorHandler } from './error-handler'


const app = fastify()

app.register(cors, {
  origin:  [
    "https://planner-web-lac.vercel.app",
    "http://localhost:3000"
  ]
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.register(createTrip)
app.register(deleteTrip)
app.register(updateTrip)
app.register(getTripDetails)
app.register(confirmParticipants)
app.register(getParticipants)
app.register(getParticipant)
app.register(createParticipant)
app.register(deleteParticipant)
app.register(createInvite)
app.register(createActivity)
app.register(getActivities)
app.register(deleteActivity)
app.register(createLink)
app.register(getLinks)
app.register(deleteLink)

const PORT = process.env.PORT || 3333

app.listen({
  port: env.PORT,
  host: '0.0.0.0'
}).then(() => {
  console.log(`Server running on ${PORT}.`)
})