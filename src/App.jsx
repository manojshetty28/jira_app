import { Routes, Route } from 'react-router-dom'
import SpacesPage from './components/SpacesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SpacesPage />} />
    </Routes>
  )
}

export default App
