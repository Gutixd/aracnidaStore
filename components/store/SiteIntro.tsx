'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RevealText } from '@/components/ui/reveal-text'

const SESSION_KEY = 'aracnida-intro-shown'
const VISIBLE_MS = 2400

export function SiteIntro() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setShow(true)

    const timer = setTimeout(() => setShow(false), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1e3d 60%, #0a0a0a 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <RevealText
            text="ARACNIDASTORE"
            textColor="text-white"
            overlayColor="text-[#c0392b]"
            fontSize="text-[13vw] sm:text-[9vw] md:text-[6vw]"
            letterDelay={0.06}
            overlayDelay={0.04}
            overlayDuration={0.4}
            springDuration={500}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
