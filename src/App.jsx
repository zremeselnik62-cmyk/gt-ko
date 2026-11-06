import { useEffect, useState } from 'react'
import Scene3D from './Scene3D.jsx'
import Loader from './Loader.jsx'
import Icon from './Icon.jsx'
import AdminTeam from './AdminTeam.jsx'
import AdminPanel from './AdminPanel.jsx'
import { ProfilePage, PasswordPage } from './AccountPages.jsx'
import { AuthModal } from './Account.jsx'
import { News, NewsList, Post } from './News.jsx'
import { useRoute } from './route.js'
import MiniGames from './Minigames.jsx'
import { Background, Nav, Hero, Marquee, Manifesto, Steps, Roadmap, FAQ, Community, Footer } from './components.jsx'

export default function App() {
  const [prog, setProg] = useState(0)
  const [top, setTop] = useState(false)
  const route = useRoute()
  useEffect(() => {
    document.title = route === 'admin' ? 'AdminTeam · GameTeam' : route === 'news' ? 'Novinky · GameTeam' : route === 'post' ? 'Novinky · GameTeam' : route === 'panel' ? 'Admin panel · GameTeam' : route === 'profile' ? 'Profil · GameTeam' : route === 'password' ? 'Změnit heslo · GameTeam' : 'GameTeam — Minecraft komunita je zpět'
    document.documentElement.style.scrollBehavior = 'auto'
    scrollTo(0, 0)
    document.documentElement.style.scrollBehavior = ''
  }, [route])
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      setProg(h > 0 ? scrollY / h : 0); setTop(scrollY > 600)
    }
    on(); addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <Loader />
      <div className="progress" style={{ transform: `scaleX(${prog})` }} />
      <Background />
      <Nav />
      <main>
        {route === 'admin' ? <AdminTeam /> : route === 'news' ? <NewsList /> : route === 'post' ? <Post /> : route === 'panel' ? <AdminPanel /> : route === 'profile' ? <ProfilePage /> : route === 'password' ? <PasswordPage /> : (
          <>
        <Hero />
        <Marquee />
        <Manifesto />
        <Steps />
        <MiniGames />
        <Roadmap />
        <News />
        <FAQ />
        <Community />
      </>
        )}
      </main>
      <Footer />
      <AuthModal />
      <Scene3D />
      <button className={`to-top ${top ? 'show' : ''}`} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Nahoru">
        <svg className="tt-ring" viewBox="0 0 56 56" aria-hidden="true">
          <circle className="tt-track" cx="28" cy="28" r="25" />
          <circle className="tt-bar" cx="28" cy="28" r="25" style={{ strokeDashoffset: 157 - 157 * prog }} />
        </svg>
        <span className="tt-face"><Icon name="up" size={22} className="tt-ico" /></span>
        <span className="tt-label">NAHORU</span>
      </button>
    </>
  )
}
