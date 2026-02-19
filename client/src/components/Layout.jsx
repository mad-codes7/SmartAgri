/**
 * SmartAgri AI - App Layout with Sidebar + Chatbot
 */
import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" />
                <div className="loading-text">Loading SmartAgri AI...</div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                <span style={{ fontWeight: 700, color: 'var(--green-800)', fontSize: '1rem' }}>
                    🌾 SmartAgri AI
                </span>
                <div style={{ width: 40 }} />
            </header>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="main-content">
                <Outlet />
            </main>

            <Chatbot />
        </div>
    );
}
