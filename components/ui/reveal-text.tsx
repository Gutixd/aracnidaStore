'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface RevealTextProps {
  text?: string
  textColor?: string
  overlayColor?: string
  fontSize?: string
  letterDelay?: number
  overlayDelay?: number
  overlayDuration?: number
  springDuration?: number
}

export function RevealText({
  text = 'STUNNING',
  textColor = 'text-white',
  overlayColor = 'text-red-500',
  fontSize = 'text-[250px]',
  letterDelay = 0.08,
  overlayDelay = 0.05,
  overlayDuration = 0.4,
  springDuration = 600,
}: RevealTextProps) {
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    const lastLetterDelay = (text.length - 1) * letterDelay
    const totalDelay = lastLetterDelay * 1000 + springDuration
    const timer = setTimeout(() => setShowOverlay(true), totalDelay)
    return () => clearTimeout(timer)
  }, [text.length, letterDelay, springDuration])

  return (
    <div className="flex items-center justify-center relative">
      <div className="flex">
        {text.split('').map((letter, index) => (
          <motion.span
            key={index}
            className={`${fontSize} font-black tracking-tight relative overflow-hidden`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * letterDelay,
              type: 'spring',
              damping: 8,
              stiffness: 200,
              mass: 0.8,
            }}
          >
            <span className={`relative ${textColor}`}>
              {letter === ' ' ? ' ' : letter}
            </span>

            {showOverlay && (
              <motion.span
                className={`absolute inset-0 ${overlayColor} pointer-events-none`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  delay: index * overlayDelay,
                  duration: overlayDuration,
                  times: [0, 0.1, 0.7, 1],
                  ease: 'easeInOut',
                }}
              >
                {letter === ' ' ? ' ' : letter}
              </motion.span>
            )}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
