export type PhotoResponse = {
    id: string
    title: string
    caption: string
    updated_at: Date
    created_at: Date
    tags: [string]
    s3Url: string
}