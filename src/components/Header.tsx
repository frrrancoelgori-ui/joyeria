import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, Settings, LogOut, BarChart3, Diamond } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Swal from 'sweetalert2';

export function Header() {
  const { cart, isAuthenticated, logout, storeSettings } = useApp();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/ñoñito');

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Serás redirigido a la tienda principal',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#D4AF37',
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

  const navLinkClass = "relative text-platinum-300 hover:text-gold-400 transition-colors duration-300 font-light tracking-wide text-sm after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full";

  return (
    <header className="bg-charcoal-950/95 border-b border-gold-500/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              {storeSettings.logoUrl ? (
                <img src={storeSettings.logoUrl} alt="logo" className="h-7 w-7 sm:h-8 sm:w-8 object-cover rounded-lg border border-gold-500/30" />
              ) : (
                <Diamond className="h-7 w-7 sm:h-8 sm:w-8 text-gold-400 transition-transform duration-500 group-hover:rotate-180" />
              )}
              <div className="absolute inset-0 bg-gold-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
              {storeSettings.storeName}
            </span>
          </Link>

          <nav className="flex items-center space-x-4 sm:space-x-6">
            {!isAdmin ? (
              <>
                <Link
                  to="/cart"
                  className="relative flex items-center text-platinum-300 hover:text-gold-400 transition-colors duration-300"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gold-gradient text-charcoal-950 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold font-sans">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link to="/" className={navLinkClass}>
                  Inicio
                </Link>
                <Link
                  to="/login"
                  className="flex items-center text-platinum-400 hover:text-gold-400 transition-colors duration-300"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/ñoñito" className={navLinkClass}>
                  Dashboard
                </Link>
                <Link to="/ñoñito/products" className={navLinkClass}>
                  Productos
                </Link>
                <Link to="/ñoñito/categories" className={navLinkClass}>
                  Categorías
                </Link>
                <Link to="/ñoñito/branches" className={navLinkClass}>
                  Sucursales
                </Link>
                <Link to="/ñoñito/customers" className={navLinkClass}>
                  Clientes
                </Link>
                <Link to="/ñoñito/sales" className={navLinkClass}>
                  Ventas
                </Link>
                <Link to="/ñoñito/settings" className={navLinkClass}>
                  Configuración
                </Link>
                <Link to="/" className={navLinkClass}>
                  Ver Tienda
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400/80 hover:text-red-300 transition-colors duration-300"
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
