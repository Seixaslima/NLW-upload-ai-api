import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline)

const KB = 1024
const MB = 1024 * KB

export async function uploadVideoRoute(app: FastifyInstance) {

  app.register(fastifyMultipart, {
    limits: {
      fieldSize: 25 * MB
    }
  })

  app.post('/videos', async (req, reply) => {
    const data = await req.file()
    
    if(!data) return reply.status(400).send({error: "missing file input"})

    const extension = path.extname(data.filename)

    console.log(extension)

    if(extension !== ".mp3") return reply.status(400).send({error: "invalid input type. mp3 only"})

    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadName = `${fileBaseName}_${randomUUID()}${extension}`

    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video = await prisma.video.create({
      data: {
        nome: data.filename,
        path: uploadDestination,  
      }
    })

    return reply.status(200).send({video})
  })
}