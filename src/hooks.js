import { useEffect, useRef, useState } from 'react'

export function useInView(opts = { threshold: 0.15 }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, opts)
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, seen]
}

export function useCountUp(target, run, dur = 1400) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf, t0
    const tick = (t) => {
      t0 ??= t
      const p = Math.min((t - t0) / dur, 1)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, target])
  return n
}
