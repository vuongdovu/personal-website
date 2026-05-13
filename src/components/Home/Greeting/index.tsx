"use client"

import { useState, useEffect, useRef } from "react";
import { Socials } from "@/components/general/Socials";

const words = ["volleyball", "web dev", "weightlifting", "eating", "agentic AI", "gaming"]

export function Greeting() {
    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '2rem',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div>
                <h1 style={{ fontSize: '2rem', margin: '0 0 1rem 0', fontFamily: 'Arial, sans-serif' }}>Hi my name is Vuong 👋</h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '1.5rem' }}>
                    <span style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}>I&apos;m interested in </span> 
                    <RotatingText />
                </div>
            </div>
            <Socials size="lg" variant="default" direction="row" gap={16} />
        </div>
    );
}

function RotatingText() {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const currentWord = words[currentIdx];
    
    useEffect(() => {
        const typeSpeed = 80;
        const deleteSpeed = 40;
        const pauseDuration = 1500;
        
        const tick = () => {
            if (phase === 'typing') {
                if (displayedText.length < currentWord.length) {
                    setDisplayedText(currentWord.slice(0, displayedText.length + 1));
                    timeoutRef.current = setTimeout(tick, typeSpeed);
                } else {
                    timeoutRef.current = setTimeout(() => {
                        setPhase('pausing');
                    }, pauseDuration);
                }
            } else if (phase === 'pausing') {
                setPhase('deleting');
                timeoutRef.current = setTimeout(tick, 100);
            } else if (phase === 'deleting') {
                if (displayedText.length > 0) {
                    setDisplayedText(displayedText.slice(0, -1));
                    timeoutRef.current = setTimeout(tick, deleteSpeed);
                } else {
                    setCurrentIdx((prev) => (prev + 1) % words.length);
                    setPhase('typing');
                }
            }
        };
        
        timeoutRef.current = setTimeout(tick, phase === 'typing' && displayedText.length === 0 ? 500 : 50);
        
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [displayedText, phase, currentIdx]);

    return (
        <span style={{ 
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            fontSize: '1.5rem',
        }}>
            {displayedText}
            <span style={{ 
                display: 'inline-block',
                width: '3px',
                height: '1.2em',
                backgroundColor: '#667eea',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
            }} />
        </span>
    );
}