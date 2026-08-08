import { Timeline } from '@/components/Gallery/Timeline'
import type { PhotoResponse } from '@/lib/ApiTypes'

const PHOTO_URL = 'https://vuongdovu-376129857525-us-east-2-an.s3.us-east-2.amazonaws.com/media/photos/IMG_1307.JPG'

const photos: PhotoResponse[] = [
    {
        id: 'mock-photo-1',
        title: 'Summer afternoon',
        caption: 'Timeline test photo one',
        created_at: new Date('2026-07-21T12:00:00Z'),
        updated_at: new Date('2026-07-21T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-2',
        title: 'Spring memory',
        caption: 'Timeline test photo two',
        created_at: new Date('2026-04-12T12:00:00Z'),
        updated_at: new Date('2026-04-12T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-3',
        title: 'Winter light',
        caption: 'Timeline test photo three',
        created_at: new Date('2026-01-05T12:00:00Z'),
        updated_at: new Date('2026-01-05T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-4',
        title: 'Autumn walk',
        caption: 'Timeline test photo four',
        created_at: new Date('2025-10-18T12:00:00Z'),
        updated_at: new Date('2025-10-18T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-5',
        title: 'Late summer',
        caption: 'Timeline test photo five',
        created_at: new Date('2025-08-02T12:00:00Z'),
        updated_at: new Date('2025-08-02T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-6',
        title: 'Early spring',
        caption: 'Timeline test photo six',
        created_at: new Date('2025-03-16T12:00:00Z'),
        updated_at: new Date('2025-03-16T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
    {
        id: 'mock-photo-7',
        title: 'New year',
        caption: 'Timeline test photo seven',
        created_at: new Date('2025-01-01T12:00:00Z'),
        updated_at: new Date('2025-01-01T12:00:00Z'),
        tags: ['mock'],
        s3Url: PHOTO_URL,
    },
]

export default function Gallery() {
    return <Timeline photos={photos} />
}
