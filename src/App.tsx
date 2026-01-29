import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Branches } from './pages/Branches';
import { useApp } from './context/AppContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-luxury-gradient">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/ñoñito" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Dashboard />
                </>
              </ProtectedRoute>
            } />
            <Route path="/ñoñito/products" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Admin />
                </>
              </ProtectedRoute>
            } />
            <Route path="/ñoñito/categories" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Categories />
                </>
              </ProtectedRoute>
            } />
            <Route path="/ñoñito/branches" element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Branches />
                </>
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <>
                <Header />
                <Home />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;