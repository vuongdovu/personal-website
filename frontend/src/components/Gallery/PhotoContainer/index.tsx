'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

import styles from './PhotoContainer.module.css'

type PhotoContainerProps = {
    s3Url: string
    alt?: string
}

export function PhotoContainer({ s3Url, alt = 'Gallery photo' }: PhotoContainerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [rotation, setRotation] = useState(0)
    const thumbnailStyle = {
        '--thumbnail-rotation': `${rotation}deg`,
    } as CSSProperties

    useEffect(() => {
        const animationFrame = window.requestAnimationFrame(() => {
            const direction = Math.random() < 0.5 ? -1 : 1
            const angle = 0.35 + Math.random() * 10
            setRotation(Number((direction * angle).toFixed(2)))
        })

        return () => window.cancelAnimationFrame(animationFrame)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false)
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    return (
        <div className={styles.container}>
            <button
                type="button"
                className={styles.thumbnail}
                style={thumbnailStyle}
                onClick={() => setIsOpen(true)}
                aria-label={`View ${alt} full size`}
            >
                <span className={styles.photoWindow}>
                    <Image
                        src={s3Url}
                        alt={alt}
                        fill
                        className={styles.thumbnailImage}
                        sizes="(max-width: 640px) 76vw, 25rem"
                    />
                </span>
            </button>

            {isOpen && (
                <div
                    className={styles.lightbox}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Full-size view of ${alt}`}
                    onClick={() => setIsOpen(false)}
                >
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close full-size photo"
                        autoFocus
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>

                    <div
                        className={styles.fullImage}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Image
                            src={s3Url}
                            alt={alt}
                            fill
                            className={styles.fullImageContent}
                            sizes="100vw"
                            priority
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
