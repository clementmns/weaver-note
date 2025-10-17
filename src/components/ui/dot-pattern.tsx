"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useEffect, useId, useRef, useState } from "react";

/**
 *  DotPattern Component Props
 *
 * @param {number} [width=16] - The horizontal spacing between dots
 * @param {number} [height=16] - The vertical spacing between dots
 * @param {number} [x=0] - The x-offset of the entire pattern
 * @param {number} [y=0] - The y-offset of the entire pattern
 * @param {number} [cx=1] - The x-offset of individual dots
 * @param {number} [cy=1] - The y-offset of individual dots
 * @param {number} [cr=1] - The radius of each dot
 * @param {string} [className] - Additional CSS classes to apply to the SVG container
 * @param {boolean} [glow=false] - Whether dots should have a glowing animation effect
 * @param {number} [maxAnimatedDots=50] - Maximum number of dots to animate when glow is true
 */
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  glow?: boolean;
  maxAnimatedDots?: number;
  [key: string]: unknown;
}

/**
 * DotPattern Component
 *
 * A React component that creates an animated or static dot pattern background using SVG.
 * The pattern automatically adjusts to fill its container and can optionally display glowing dots.
 *
 * @component
 *
 * @see DotPatternProps for the props interface.
 *
 * @example
 * // Basic usage
 * <DotPattern />
 *
 * // With glowing effect and custom spacing
 * <DotPattern
 *   width={20}
 *   height={20}
 *   glow={true}
 *   maxAnimatedDots={30}
 *   className="opacity-50"
 * />
 *
 * @notes
 * - The component is client-side only ("use client")
 * - Automatically responds to container size changes
 * - When glow is enabled, only a subset of dots animate for better performance
 * - Uses Motion for animations on animated dots, static SVG circles for non-animated dots
 * - Dots color can be controlled via the text color utility classes
 * - Performance is optimized by limiting animated dots via maxAnimatedDots prop
 */

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  maxAnimatedDots = 50,
  ...props
}: DotPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const { staticDots, animatedDots } = React.useMemo(() => {
    const totalCols = Math.ceil(dimensions.width / width);
    const totalRows = Math.ceil(dimensions.height / height);
    const totalDots = totalCols * totalRows;

    const allDots = Array.from({ length: totalDots }, (_, i) => {
      const col = i % totalCols;
      const row = Math.floor(i / totalCols);
      return {
        x: col * width + cx,
        y: row * height + cy,
        key: `${col}-${row}`,
      };
    });

    if (!glow) {
      return { staticDots: allDots, animatedDots: [] };
    }

    const numAnimated = Math.min(maxAnimatedDots, totalDots);
    const animatedIndices = new Set<number>();

    while (
      animatedIndices.size < numAnimated &&
      animatedIndices.size < totalDots
    ) {
      animatedIndices.add(Math.floor(Math.random() * totalDots));
    }

    const staticDotsArray: typeof allDots = [];
    const animatedDotsArray: Array<
      (typeof allDots)[0] & { delay: number; duration: number }
    > = [];

    allDots.forEach((dot, index) => {
      if (animatedIndices.has(index)) {
        animatedDotsArray.push({
          ...dot,
          delay: Math.random() * 5,
          duration: Math.random() * 3 + 2,
        });
      } else {
        staticDotsArray.push(dot);
      }
    });

    return { staticDots: staticDotsArray, animatedDots: animatedDotsArray };
  }, [
    dimensions.width,
    dimensions.height,
    width,
    height,
    cx,
    cy,
    glow,
    maxAnimatedDots,
  ]);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {staticDots.map((dot) => (
        <circle
          key={dot.key}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill="currentColor"
          className="text-neutral-400/60"
        />
      ))}

      {animatedDots.map((dot) => (
        <motion.circle
          key={dot.key}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={`url(#${id}-gradient)`}
          className="text-neutral-400/60"
          initial={{ opacity: 0.2, scale: 1 }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            repeatType: "reverse",
            delay: dot.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}
