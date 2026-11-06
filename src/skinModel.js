import * as THREE from 'three'

/* Model hráča 1:1 ako v Minecrafte (64x64 skin vrátane druhej vrstvy) */
const R = (u, v, w, h, d) => ({
  top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
  right: [u, v + d, d, h], front: [u + d, v + d, w, h],
  left: [u + d + w, v + d, d, h], back: [u + 2 * d + w, v + d, w, h],
})

function mcBox(w, h, d, rects, S, material, infl = 0) {
  const g = new THREE.BoxGeometry((w + infl * 2) * S, (h + infl * 2) * S, (d + infl * 2) * S)
  const uv = g.attributes.uv
  ;[rects.left, rects.right, rects.top, rects.bottom, rects.front, rects.back].forEach((r, f) => {
    const [x, y, rw, rh] = r
    const u0 = x / 64, u1 = (x + rw) / 64, v0 = 1 - y / 64, v1 = 1 - (y + rh) / 64
    uv.setXY(f * 4, u0, v0); uv.setXY(f * 4 + 1, u1, v0); uv.setXY(f * 4 + 2, u0, v1); uv.setXY(f * 4 + 3, u1, v1)
  })
  return new THREE.Mesh(g, material)
}

export function prepTexture(t) {
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.generateMipmaps = false
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

export function buildPlayer(S, slim, tex) {
  const aw = slim ? 3 : 4
  const base = new THREE.MeshLambertMaterial({ map: tex })
  const over = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide })
  const root = new THREE.Group()
  const pivot = (x, y) => { const g = new THREE.Group(); g.position.set(x * S, y * S, 0); return g }
  const add = (g, w, h, d, u, v, ou, ov, cy, infl = 0.25) => {
    const a = mcBox(w, h, d, R(u, v, w, h, d), S, base); a.position.y = cy * S; g.add(a)
    const b = mcBox(w, h, d, R(ou, ov, w, h, d), S, over, infl); b.position.y = cy * S; g.add(b)
  }
  const legR = pivot(-2, 12), legL = pivot(2, 12)
  add(legR, 4, 12, 4, 0, 16, 0, 32, -6); add(legL, 4, 12, 4, 16, 48, 0, 48, -6)
  const body = pivot(0, 18)
  add(body, 8, 12, 4, 16, 16, 16, 32, 0)
  const armR = pivot(-(4 + aw / 2), 22), armL = pivot(4 + aw / 2, 22)
  add(armR, aw, 12, 4, 40, 16, 40, 32, -4); add(armL, aw, 12, 4, 32, 48, 48, 48, -4)
  const head = pivot(0, 24)
  add(head, 8, 8, 8, 0, 0, 32, 0, 4, 0.5)
  root.add(legR, legL, body, armR, armL, head)
  return { root, head, armL, armR, legL, legR, materials: [base, over] }
}
