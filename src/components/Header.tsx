import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, Settings, LogOut, BarChart3, Diamond } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Swal from 'sweetalert2';

export function Header() {
  const { cart, isAuthenticated, logout } = useApp();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/ñoñito');
  
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Serás redirigido a la tienda principal',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        window.location.href = '/';
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has salido del panel de administración',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  return (
    <header className="bg-charcoal-900 border-b-2 border-gold-500 shadow-luxury sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <Diamond className="h-8 w-8 text-gold-500 group-hover:text-gold-400 transition-colors animate-pulse" />
            <span className="font-luxury text-xl font-bold text-gradient-gold group-hover:text-gold-400 transition-colors">
              Diamante Real
            </span>
          </Link>

          <nav className="flex items-center space-x-6">
            {!isAdmin ? (
              <>
                <Link
                  to="/cart"
                  className="relative flex items-center text-platinum-300 hover:text-gold-500 transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gold-gradient text-charcoal-900 text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Inicio
                </Link>
                <Link
                  to="/login"
                  className="flex items-center text-platinum-400 hover:text-gold-500 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/ñoñito"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/ñoñito/products"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Productos
                </Link>
                <Link
                  to="/ñoñito/categories"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Categorías
                </Link>
                <Link
                  to="/ñoñito/branches"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Sucursales
                </Link>
                <Link
                  to="/"
                  className="text-platinum-300 hover:text-gold-500 transition-colors font-medium"
                >
                  Ver Tienda
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}