"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Navbar.module.css";

export function Navbar() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    const tabs = [
        {
            label: "home",
            url: "/"
        },
        {
            label: "archive",
            url: "/archive"
        }
    ]

    function handlePress(url: string) {
        router.push(url);
        setMenuOpen(false);
    }

    return (
        <nav className={styles.navbar}>
            <a href="/" className={styles.logo}>vuongdovu</a>
            <div className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.url}
                        onClick={() => handlePress(tab.url)}
                        className={styles.navLink}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <button
                className={styles.menuButton}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {menuOpen ? (
                        <path d="M6 6l12 12M6 18L18 6" />
                    ) : (
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>
        </nav>
    );
}