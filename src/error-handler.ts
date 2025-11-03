import type { FastifyInstance } from "fastify"
import { ClientError } from "./errors/client-error"
import { ZodError } from "zod"

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler  = (error, req, reply) => {
  if(error instanceof ZodError) {
    return reply.status(400).send({
      statuscode: 400,
      error: "ValidationError",
      message: "Invalid Input",
      details: error.flatten().fieldErrors
    })
  }

  if(error instanceof ClientError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: "ClientError",
      message: error.message
    })
  }

  console.error("💥 Internal Server Error:", error)

  return reply.status(500).send({
    statusCode: 500,
    error: "InternalServerError",
    message: "Something went wrong on the Server"
  })
}