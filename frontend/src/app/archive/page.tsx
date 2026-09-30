import Link from 'next/link'
import { Suspense } from 'react'
import { Timeline } from '@/components/Gallery/Timeline'
import { createMinioClient } from '@/lib/db'
import { getPhotoPage, PAGE_SIZE } from '@/lib/photos'

async function MinioStatus() {
    let message: string

    try {
        const buckets = await createMinioClient().listBuckets()
        message = `MinIO connected. ${buckets.length} ${buckets.length === 1 ? 'bucket' : 'buckets'} visible.`
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        message = `MinIO check failed: ${reason}`
    }

    return <p role="status">{message}</p>
}

export default async function Gallery({
    searchParams,
}: {
    searchParams: Promise<{ page?: string | string[] }>
}) {
    const rawPage = (await searchParams).page
    const parsedPage = typeof rawPage === 'string' ? Number(rawPage) : 1
    const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const { photos, total, currentPage, pageCount } = await getPhotoPage(requestedPage)

    return (
        <>
            {process.env.NODE_ENV === 'development' && (
                <div className="mx-auto max-w-5xl px-4 py-3 text-sm">
                    <Suspense fallback={<p role="status">Checking MinIO connection…</p>}>
                        <MinioStatus />
                    </Suspense>
                </div>
            )}
            {photos.length > 0 ? (
                <Timeline key={currentPage} photos={photos} />
            ) : (
                <p className="mx-auto max-w-5xl px-4 py-12">No photos are in the bucket yet.</p>
            )}
            {total > 0 && (
                <nav aria-label="Archive pages" className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-8">
                    <div>
                        <p>Page {currentPage} of {pageCount}</p>
                        <p>{total} {total === 1 ? 'photo' : 'photos'} · {PAGE_SIZE} per page</p>
                    </div>
                    <div className="flex gap-4">
                        {currentPage > 1 && (
                            <Link href={`/archive?page=${currentPage - 1}`}>Previous</Link>
                        )}
                        {currentPage < pageCount && (
                            <Link href={`/archive?page=${currentPage + 1}`}>Next</Link>
                        )}
                    </div>
                </nav>
            )}
        </>
    )
}
