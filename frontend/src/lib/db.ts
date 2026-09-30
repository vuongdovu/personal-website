import { Client } from 'minio'

export function createMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error('MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY must be set')
  }

  const address = new URL(`http://${endpoint}`)
  const client = new Client({
    endPoint: address.hostname,
    port: address.port ? Number(address.port) : undefined,
    useSSL: process.env.MINIO_SECURE !== 'false',
    accessKey,
    secretKey,
    retryOptions: { disableRetry: true },
  })
  return client
}
