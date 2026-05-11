import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Encrypt from './pages/Encrypt'
import Decrypt from './pages/Decrypt'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]"></div>
      </div>

      {/* TopNavBar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-32 pb-32 md:pb-24 px-margin-mobile md:px-margin-desktop relative z-10 w-full max-w-container-max mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/encrypt" element={<Encrypt />} />
          <Route path="/decrypt" element={<Decrypt />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
