const paths = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  server: <><rect x="2" y="3" width="20" height="8" rx="2" /><rect x="2" y="13" width="20" height="8" rx="2" /><path d="M6 7h.01M6 17h.01M10 7h4M10 17h4" /></>,
  headset: <><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z" /><path d="M19 17v1a3 3 0 0 1-3 3h-3" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" /></>,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
  ticket: <><path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" /><path d="M13 5v2M13 11v2M13 17v2" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
  refresh: <><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></>,
  island: <><path d="M3 14h18l-3 4a3 3 0 0 1-2.4 1.2H8.4A3 3 0 0 1 6 18z" /><path d="M12 14V7M12 7c-2-3-5-2-6-1 2 0 3 1 6 1zM12 7c2-3 5-2 6-1-2 0-3 1-6 1z" /></>,
  mountain: <><path d="m3 20 6-11 4 6 3-4 5 9z" /><path d="m9 9 1.5 2.5L12 10" /></>,
  pickaxe: <><path d="m5 19 8.5-8.5" /><path d="M11 5c4-1.5 8 .5 10 4-3-2-6-2.5-9-1zM15.5 11.5c1.5 3 1 6-1 9" /></>,
  tree: <><path d="M12 22v-5M12 17H6l3-5H6l6-8 6 8h-3l3 5z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  play: <path d="M7 4v16l13-8z" fill="currentColor" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m4 12 5 5L20 6" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  bed: <><path d="M2 18V6M2 14h20v4M22 18v-5a3 3 0 0 0-3-3h-7v4" /><circle cx="7" cy="11" r="2" /></>,
  swords: <><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /><path d="M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-4 4M3 19l2 2" /></>,
  cube: <><path d="m12 2 9 5v10l-9 5-9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></>,
  home: <path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  discord: <><path d="M7.5 5.5c3-1.2 6-1.2 9 0 2 3 3 6 3.2 10.5-1.4 1.2-3 2-4.6 2.5l-1-1.8c.6-.2 1.2-.5 1.7-.8M7.5 5.5C5.5 8.5 4.5 11.5 4.3 16c1.4 1.2 3 2 4.6 2.5l1-1.8c-.6-.2-1.2-.5-1.7-.8" /><circle cx="9.3" cy="12" r="1.3" /><circle cx="14.7" cy="12" r="1.3" /></>,
  news: <><rect x="3" y="4" width="16" height="16" rx="2" /><path d="M7 8h8M7 12h8M7 16h5M19 8h2v10a2 2 0 0 1-2 2" /></>,
  up: <path d="M12 20V5M5 12l7-7 7 7" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  link: <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />,
  chev: <path d="m6 9 6 6 6-6" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2" /></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  undo: <path d="M3 7v6h6M3 13a9 9 0 1 0 3-7" />,
  chart: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
  gamepad: <><rect x="2" y="6" width="20" height="12" rx="6" /><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" /></>,
}

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg className={'ico ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
