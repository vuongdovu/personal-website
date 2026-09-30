import { Readable } from 'node:stream'
import { createMinioClient } from '@/lib/db'

export const runtime = 'nodejs'

const IMAGE_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ key: string[] }> },
) {
    const segments = (await params).key
    if (!segments.length || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
        return new Response('Not found', { status: 404 })
    }

    const key = segments.join('/')
    const extension = key.split('.').pop()?.toLowerCase() ?? ''
    const contentType = IMAGE_TYPES[extension]
    if (!contentType) return new Response('Not found', { status: 404 })

    try {
        const object = await createMinioClient().getObject(process.env.MINIO_BUCKET ?? 'photos', key)
        return new Response(Readable.toWeb(object) as ReadableStream, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
            },
        })
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'NoSuchKey') {
            return new Response('Not found', { status: 404 })
        }
        console.error('Could not load archive photo', key, error)
        return new Response('Could not load photo', { status: 502 })
    }
}
