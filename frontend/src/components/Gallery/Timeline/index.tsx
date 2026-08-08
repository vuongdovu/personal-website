'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { PhotoResponse } from '@/lib/ApiTypes'
import { PhotoContainer } from '../PhotoContainer'
import styles from './Timeline.module.css'

type TimelineProps = {
    photos: PhotoResponse[]
}

export function Timeline({ photos }: TimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null)
    const firstPhotoSectionRef = useRef<HTMLLIElement>(null)
    const animationFrameRef = useRef<number | null>(null)
    const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [activePhotoIndex, setActivePhotoIndex] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)
    const [photoSectionHeight, setPhotoSectionHeight] = useState(0)

    useEffect(() => {
        const firstPhotoSection = firstPhotoSectionRef.current

        if (!firstPhotoSection) return

        const updatePhotoSectionHeight = () => {
            const measuredHeight = firstPhotoSection.getBoundingClientRect().height

            if (measuredHeight > 0) setPhotoSectionHeight(measuredHeight)
        }

        updatePhotoSectionHeight()
        const resizeObserver = new ResizeObserver(updatePhotoSectionHeight)
        resizeObserver.observe(firstPhotoSection)

        return () => resizeObserver.disconnect()
    }, [photos.length])

    const updateActivePhoto = useCallback(() => {
        const timeline = timelineRef.current

        if (!timeline || photos.length === 0 || photoSectionHeight === 0) return

        const timelineTop = timeline.getBoundingClientRect().top + window.scrollY
        const distanceIntoTimeline = Math.max(0, window.scrollY - timelineTop)
        const nextIndex = Math.min(
            photos.length - 1,
            Math.floor(distanceIntoTimeline / photoSectionHeight),
        )

        setActivePhotoIndex((currentIndex) => (
            currentIndex === nextIndex ? currentIndex : nextIndex
        ))
    }, [photoSectionHeight, photos.length])

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolling(true)

            if (scrollEndTimeoutRef.current !== null) {
                clearTimeout(scrollEndTimeoutRef.current)
            }

            scrollEndTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false)
                scrollEndTimeoutRef.current = null
            }, 700)

            if (animationFrameRef.current !== null) return

            animationFrameRef.current = window.requestAnimationFrame(() => {
                updateActivePhoto()
                animationFrameRef.current = null
            })
        }

        updateActivePhoto()
        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', updateActivePhoto)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', updateActivePhoto)

            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }

            if (scrollEndTimeoutRef.current !== null) {
                clearTimeout(scrollEndTimeoutRef.current)
            }
        }
    }, [updateActivePhoto])

    if (photos.length === 0) return null

    const activePhoto = photos[activePhotoIndex]
    const timelineStyle = {
        '--photo-section-height': `${photoSectionHeight}px`,
        '--timeline-section-count': photos.length,
    } as CSSProperties

    return (
        <div ref={timelineRef} className={styles.timeline} style={timelineStyle}>
            <ul className={styles.photoList}>
                {photos.map((photo, index) => (
                    <li
                        ref={index === 0 ? firstPhotoSectionRef : undefined}
                        className={styles.photoSection}
                        key={photo.id}
                    >
                        <PhotoContainer s3Url={photo.s3Url} alt={photo.title} />
                    </li>
                ))}
            </ul>

            <aside
                className={styles.scrollDate}
                data-visible={isScrolling}
                aria-hidden={!isScrolling}
                aria-live="polite"
                aria-atomic="true"
            >
                <span className={styles.dateTick} aria-hidden="true" />
                <DateCard date={activePhoto.created_at} />
            </aside>
        </div>
    )
}

function DateCard({ date }: { date: Date | string }) {
    const parsedDate = date instanceof Date ? date : new Date(date)
    const formattedDate = Number.isNaN(parsedDate.getTime())
        ? String(date)
        : new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(parsedDate)

    return <time className={styles.dateCard}>{formattedDate}</time>
}
