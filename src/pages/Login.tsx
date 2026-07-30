import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Diamond } from 'lucide-react';

import { useApp } from '../context/AppContext';

export function Login() {
  const { isAuthenticated, loginWithCredentials, storeSettings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/ñoñito" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await loginWithCredentials(username, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-black flex items-center justify-center px-4 py-8">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative luxury-card p-8 sm:p-10 rounded-2xl max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
          >
            <Diamond className="h-10 w-10 text-gold-400" />
          </motion.div>
          <h1 className="font-luxury text-3xl font-semibold text-gradient-gold tracking-wide mb-2">
            {storeSettings.storeName}
          </h1>
          <div className="luxury-divider w-20 mx-auto mb-4" />
          <p className="text-platinum-300 font-light tracking-wide">Panel de Administración</p>
          <p className="text-platinum-500 text-sm mt-2 font-light">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-platinum-300 mb-2 tracking-wide">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="luxury-input w-full py-3 px-4 rounded-lg"
              placeholder="Ingresa tu usuario"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-platinum-300 mb-2 tracking-wide">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="luxury-input w-full py-3 px-4 pr-12 rounded-lg"
                placeholder="Ingresa tu contraseña"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-platinum-400 hover:text-gold-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="luxury-button w-full py-3 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-charcoal-950"></div>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Acceder</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="/"
            className="text-platinum-400 hover:text-gold-400 transition-colors text-sm font-light tracking-wide"
          >
            ← Volver a la tienda
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
