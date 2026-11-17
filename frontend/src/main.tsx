import {lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter, useLocation} from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/orbitron/latin-500.css';
import '@fontsource/orbitron/latin-700.css';
import './styles.css';
import NasaRobot from './nasa/NasaRobot';
const Outpost = lazy(()=>import('./outpost/Outpost'));
const MoonGame = lazy(()=>import('./moon/MoonGame'));
const Legacy = lazy(()=>import('./App'));

function Experience() {
  const {pathname}=useLocation();
  return <Suspense fallback={<main className="page-shell">Preparing Shackleton Outpost…</main>}>
    {pathname==='/'||pathname==='/moon' ? <MoonGame/> : pathname==='/outpost' ? <Outpost/> : <Legacy/>}
  </Suspense>;
}

createRoot(document.getElementById('root')!).render(<HashRouter><Experience/><NasaRobot/></HashRouter>);
