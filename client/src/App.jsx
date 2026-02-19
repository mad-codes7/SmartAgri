/**
 * SmartAgri AI - Main Application
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recommend from './pages/Recommend';
import Market from './pages/Market';
import Weather from './pages/Weather';
import Crops from './pages/Crops';
import Schemes from './pages/Schemes';
import History from './pages/History';
import DiseaseDetection from './pages/DiseaseDetection';
import FarmMap from './pages/FarmMap';
import Profile from './pages/Profile';
import './index.css';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recommend" element={<Recommend />} />
              <Route path="/market" element={<Market />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/crops" element={<Crops />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/history" element={<History />} />
              <Route path="/disease" element={<DiseaseDetection />} />
              <Route path="/map" element={<FarmMap />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
