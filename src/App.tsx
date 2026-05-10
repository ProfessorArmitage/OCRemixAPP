import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout   from './components/Layout'
import Home     from './pages/Home'
import Catalog  from './pages/Catalog'
import Library  from './pages/Library'
import Player   from './pages/Player'
import Profile  from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route index          element={<Home />}    />
          <Route path="catalog" element={<Catalog />} />
          <Route path="library" element={<Library />} />
          <Route path="player"  element={<Player />}  />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
