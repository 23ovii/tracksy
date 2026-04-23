import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Callback from './pages/Callback.jsx';

function App() {
  return (
    <div className="min-h-screen bg-spotify-bg text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
