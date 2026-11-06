import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildPlayer, prepTexture } from './skinModel.js'
import { paintSkin, humans } from './Scene3D.jsx'

export default function SkinViewer({ url, slim = false, mode = 'walk', className = '' }) {
  const canvasRef = useRef(null)
  const st = useRef({ mode, slim, url })
  const api = useRef(null)
  st.current.mode = mode

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = canvas.parentElement
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 400)
    camera.position.set(0, 20, 78); camera.lookAt(0, 16, 0)
    scene.add(new THREE.AmbientLight(0xfff0d8, 1.5))
    const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(-30, 50, 60); scene.add(sun)
    const rim = new THREE.PointLight(0xe8b02e, 1800, 200); rim.position.set(40, 10, -40); scene.add(rim)

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(15, 16, 1.4, 48), new THREE.MeshLambertMaterial({ color: 0x2a1c0c }))
    disc.position.y = -0.7; scene.add(disc)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(15.5, 0.35, 8, 64), new THREE.MeshBasicMaterial({ color: 0xe8b02e }))
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; scene.add(ring)

    const holder = new THREE.Group(); scene.add(holder)
    const a = { renderer, scene, camera, holder, player: null, tex: null, yaw: 0.5, vel: 0, drag: false, lx: 0, ready: false }
    api.current = a

    const size = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      renderer.setSize(w, h, false); camera.aspect = w / h
      camera.position.z = w / h < 0.8 ? 96 : 78
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size); ro.observe(wrap)

    const down = (e) => { a.drag = true; a.lx = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing' }
    const move = (e) => { if (a.drag) { a.vel = (e.clientX - a.lx) * 0.012; a.yaw += a.vel; a.lx = e.clientX } }
    const up = () => { a.drag = false; canvas.style.cursor = 'grab' }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(wrap)

    const clock = new THREE.Clock()
    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      if (!a.drag) { a.yaw += a.vel; a.vel *= 0.92; if (Math.abs(a.vel) < 0.002) a.yaw += 0.006 }
      holder.rotation.y = a.yaw
      const p = a.player
      if (p) {
        const m = st.current.mode
        const sw = Math.sin(t * 5)
        p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0); p.legL.rotation.x = 0; p.legR.rotation.x = 0; p.head.rotation.set(0, 0, 0)
        if (m === 'walk') {
          p.armL.rotation.x = sw * 0.7; p.armR.rotation.x = -sw * 0.7; p.legL.rotation.x = -sw * 0.8; p.legR.rotation.x = sw * 0.8
          p.root.position.y = Math.abs(Math.cos(t * 5)) * 0.5
        } else if (m === 'wave') {
          p.armR.rotation.z = 2.5 + Math.sin(t * 8) * 0.35; p.armL.rotation.x = Math.sin(t * 1.5) * 0.05
          p.head.rotation.y = Math.sin(t * 2) * 0.25; p.root.position.y = 0
        } else {
          p.armL.rotation.z = -0.05 - Math.sin(t * 1.6) * 0.04; p.armR.rotation.z = 0.05 + Math.sin(t * 1.6) * 0.04
          p.head.rotation.y = Math.sin(t * 0.8) * 0.3; p.head.rotation.x = Math.sin(t * 1.1) * 0.06
          p.root.position.y = Math.sin(t * 1.6) * 0.1
        }
      }
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up)
      renderer.dispose(); api.current = null
    }
  }, [])

  useEffect(() => {
    const a = api.current
    if (!a) return
    let dead = false
    const apply = (tex) => {
      if (dead || !api.current) return
      prepTexture(tex)
      if (a.player) a.holder.remove(a.player.root)
      a.tex?.dispose()
      a.tex = tex
      a.player = buildPlayer(1, slim, tex)
      a.holder.add(a.player.root)
    }
    const fallback = () => apply(paintSkin(humans.steve).tex)
    if (!url) { fallback(); return () => { dead = true } }
    new THREE.TextureLoader().load(url, apply, undefined, fallback)
    return () => { dead = true }
  }, [url, slim])

  return <canvas ref={canvasRef} className={'sv-canvas ' + className} />
}
