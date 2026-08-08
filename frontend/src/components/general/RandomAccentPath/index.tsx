"use client";

import { useEffect, useState } from "react";

type Point = {
  x: number;
  y: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInteger(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function createRandomPath() {
  const points: Point[] = [{ x: -80, y: randomBetween(80, 720) }];
  const loopCount = randomInteger(1, 3);
  const sectionWidth = 1040 / loopCount;

  for (let loop = 0; loop < loopCount; loop++) {
    const sectionStart = 80 + loop * sectionWidth;
    const centerX = sectionStart + randomBetween(sectionWidth * 0.35, sectionWidth * 0.65);
    const centerY = randomBetween(130, 670);
    const radiusX = Math.min(randomBetween(55, 145), sectionWidth * 0.32);
    const radiusY = randomBetween(50, 130);
    const rotation = randomBetween(-0.85, 0.85);
    const direction = Math.random() < 0.5 ? -1 : 1;
    const samples = randomInteger(10, 16);
    const startAngle = Math.PI + randomBetween(-0.35, 0.35);
    const asymmetry = randomBetween(-0.22, 0.22);

    // Loose approach points keep each loop connected to the larger gesture.
    points.push(
      {
        x: centerX - radiusX * randomBetween(1.5, 2.1),
        y: centerY + randomBetween(-140, 140),
      },
      {
        x: centerX - radiusX * randomBetween(0.9, 1.2),
        y: centerY + randomBetween(-28, 28),
      },
    );

    for (let step = 0; step <= samples; step++) {
      const progress = step / samples;
      const angle = startAngle + direction * progress * Math.PI * 2;
      const pulse = 1 + asymmetry * Math.sin(angle * 2 + rotation);
      const localX = Math.cos(angle) * radiusX * pulse;
      const localY = Math.sin(angle) * radiusY * (2 - pulse);

      points.push({
        x: centerX + localX * Math.cos(rotation) - localY * Math.sin(rotation),
        y: centerY + localX * Math.sin(rotation) + localY * Math.cos(rotation),
      });
    }

    points.push({
      x: centerX + radiusX * randomBetween(1.1, 1.7),
      y: centerY + randomBetween(-140, 140),
    });
  }

  points.push(
    { x: 1120, y: randomBetween(60, 740) },
    { x: 1280, y: randomBetween(80, 720) },
  );

  return catmullRomToBezier(points);
}

function catmullRomToBezier(points: Point[]) {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };

    const control2 = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    };

    path += `
      C ${control1.x} ${control1.y},
        ${control2.x} ${control2.y},
        ${next.x} ${next.y}
    `;
  }

  return path;
}

export function RandomAccentLine() {
  const [path, setPath] = useState("");

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setPath(createRandomPath());
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  if (!path) return null;

  return (
    <svg
      className="accentLine"
      viewBox="0 0 1200 800"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
