import { useEffect, useState } from 'react'

/* jednoduchý hash router (funguje v XAMPP bez .htaccess)
   #/admin-team        AdminTeam
   #/novinky           zoznam noviniek
   #/novinky/<slug>    jeden článok
   všetko ostatné      domovská stránka */
const parse = (h) => {
  if (h.startsWith('#/admin-team')) return { name: 'admin' }
  if (h === '#/admin' || h.startsWith('#/admin/')) return { name: 'panel' }
  if (h.startsWith('#/profil')) return { name: 'profile' }
  if (h.startsWith('#/heslo')) return { name: 'password' }
  if (h.startsWith('#/novinky/')) return { name: 'post', slug: decodeURIComponent(h.slice(10)) }
  if (h.startsWith('#/novinky')) return { name: 'news' }
  return { name: 'home' }
}

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const f = () => setH(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h
}

export const useRoute = () => parse(useHash()).name
export const useSlug = () => parse(useHash()).slug

export function navigate(to, slug) {
  if (to === 'admin') location.hash = '/admin-team'
  else if (to === 'news') location.hash = '/novinky'
  else if (to === 'panel') location.hash = '/admin'
  else if (to === 'profile') location.hash = '/profil'
  else if (to === 'password') location.hash = '/heslo'
  else if (to === 'post') location.hash = '/novinky/' + slug
  else location.hash = ''
}

export function scrollToSection(id) {
  const doScroll = () => {
    if (id === 'top') scrollTo({ top: 0, behavior: 'smooth' })
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  if (id === 'admin') { navigate('admin'); return }
  if (parse(location.hash).name !== 'home') { navigate('home'); setTimeout(doScroll, 220) } else doScroll()
}
