import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';
import { MQTTProvider } from './context/MQTTContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <MQTTProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route path="weather" element={<div className="text-white p-6 text-xl">Weather Module (Detailed View Coming Soon)</div>} />
              <Route path="ai" element={<div className="text-white p-6 text-xl">AI Core Module (Detailed View Coming Soon)</div>} />
              <Route path="hardware" element={<div className="text-white p-6 text-xl">Hardware Module (Detailed View Coming Soon)</div>} />
              <Route path="analytics" element={<div className="text-white p-6 text-xl">Analytics Module (Detailed View Coming Soon)</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#020617',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#020617',
              },
            }
          }}
        />
      </MQTTProvider>
    </ThemeProvider>
  );
}

export default App;
