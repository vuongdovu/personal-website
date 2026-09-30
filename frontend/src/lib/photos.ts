import { Pool } from 'pg'
import type { PhotoResponse } from '@/lib/ApiTypes'
import { createMinioClient } from '@/lib/db'

const globalForPhotos = globalThis as typeof globalThis & { photoPool?: Pool }

const pool = globalForPhotos.photoPool ?? new Pool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME ?? 'postgres',
    max: 5,
    connectionTimeoutMillis: 5000,
})

if (process.env.NODE_ENV !== 'production') globalForPhotos.photoPool = pool

export const PAGE_SIZE = 10

const IMAGE_FILE = /\.(?:jpe?g|png|webp|gif|avif)$/i

type PhotoRow = {
    id: string
    title: string
    caption: string
    taken_on: string | null
    created_at: Date
    updated_at: Date
    tags: string[]
    object_key: string
}

export async function getPhotoPage(page: number) {
    const objects: { name: string; lastModified: Date }[] = []
    const bucket = process.env.MINIO_BUCKET ?? 'photos'

    for await (const object of createMinioClient().listObjectsV2(bucket, '', true)) {
        if (object.name && IMAGE_FILE.test(object.name)) {
            objects.push({ name: object.name, lastModified: object.lastModified })
        }
    }

    const keys = objects.map((object) => object.name)
    const rows = keys.length
        ? (await pool.query<PhotoRow>(
            `SELECT id::text, title, caption, taken_on::text, created_at, updated_at, tags, object_key
             FROM photos WHERE object_key = ANY($1::text[])`,
            [keys],
        )).rows
        : []
    const metadata = new Map(rows.map((row) => [row.object_key, row]))
    const photos: PhotoResponse[] = objects.map((object) => {
        const row = metadata.get(object.name)
        return {
            id: row?.id ?? object.name,
            title: row?.title ?? object.name.split('/').pop() ?? object.name,
            caption: row?.caption ?? '',
            taken_on: row?.taken_on ?? null,
            created_at: row?.created_at ?? object.lastModified,
            updated_at: row?.updated_at ?? object.lastModified,
            tags: row?.tags ?? [],
            s3Url: `/archive/photo/${object.name.split('/').map(encodeURIComponent).join('/')}`,
        }
    })

    photos.sort((a, b) => {
        const aDate = a.taken_on ? Date.parse(a.taken_on) : a.created_at.getTime()
        const bDate = b.taken_on ? Date.parse(b.taken_on) : b.created_at.getTime()
        return bDate - aDate || a.id.localeCompare(b.id)
    })

    const total = photos.length
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    return {
        photos: photos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        total,
        currentPage,
        pageCount,
    }
}
