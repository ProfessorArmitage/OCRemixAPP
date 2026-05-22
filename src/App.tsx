import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout           from './components/Layout'
import PWAUpdatePrompt  from './components/PWAUpdatePrompt'
import Home        from './pages/Home'
import Catalog     from './pages/Catalog'
import Browse      from './pages/Browse'
import Library     from './pages/Library'
import Player      from './pages/Player'
import Profile     from './pages/Profile'
import RemixDetail from './pages/RemixDetail'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PWAUpdatePrompt />
      <Routes>
        <Route element={<Layout />}>
          <Route index             element={<Home />}        />
          <Route path="catalog"    element={<Catalog />}     />
          <Route path="browse"     element={<Browse />}      />
          <Route path="library"    element={<Library />}     />
          <Route path="player"     element={<Player />}      />
          <Route path="profile"    element={<Profile />}     />
          <Route path="remix/:id"  element={<RemixDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
