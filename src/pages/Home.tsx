import React, { useState } from 'react';
import { Search, Filter, MessageCircle, ShoppingCart as CartIcon, Diamond, Star, Award } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { useApp } from '../context/AppContext';

export function Home() {
  const { products, cart } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const categories = Array.from(new Set(products.map(p => p.category)));
  const materials = Array.from(new Set(products.map(p => p.material)));
  const branches = Array.from(new Set(products.map(p => p.branchName)));

  const filteredProducts = products
    .filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
      const matchesMaterial = selectedMaterial === '' || product.material === selectedMaterial;
      const matchesBranch = selectedBranch === '' || product.branchName === selectedBranch;
      const matchesPrice =
        (priceRange.min === '' || product.price >= Number(priceRange.min)) &&
        (priceRange.max === '' || product.price <= Number(priceRange.max));

      return matchesSearch && matchesCategory && matchesMaterial && matchesBranch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return Number(b.id) - Number(a.id); // funciona si los ids son numéricos como strings
        default:
          return 0;
      }
    });

  const sendToWhatsApp = () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    let message = '¡Hola! Me interesan estos productos de Diamante Real:\n\n';

    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   • Cantidad: ${item.quantity}\n`;
      message += `   • Precio: $${item.product.price.toLocaleString()}\n`;
      message += `   • Material: ${item.product.material}\n`;
      message += `   • Sucursal: ${item.product.branchName}\n`;
      if (item.product.gemstone) {
        message += `   • Gemas: ${item.product.gemstone}\n`;
      }
      if (item.product.isCustomizable) {
        message += `   • ✨ Personalizable (${item.product.craftingTime} días)\n`;
      }
      message += `   • Subtotal: $${(item.product.price * item.quantity).toLocaleString()}\n\n`;
    });

    message += `*TOTAL: $${total.toLocaleString()}*\n\n`;
    message += 'Me gustaría recibir más información sobre estos productos y conocer las opciones de pago y entrega. ¡Gracias!';

    const phoneNumber = '1234567890'; // ← CAMBIA ESTE NÚMERO POR EL REAL DE LA TIENDA
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-luxury-gradient">
      {/* Hero Section */}
      <div className="relative bg-luxury-gradient overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gold-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-silver-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-platinum-500 rounded-full opacity-5 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Diamond className="h-12 w-12 text-gold-500 mr-4 animate-pulse" />
              <h1 className="font-luxury text-4xl md:text-6xl font-bold text-gradient-gold text-shadow-gold">
                Diamante Real
              </h1>
              <Diamond className="h-12 w-12 text-gold-500 ml-4 animate-pulse" />
            </div>

            <h2 className="text-2xl md:text-3xl font-luxury text-platinum-200 mb-4">
              Joyería de Lujo desde 1998
            </h2>

            <p className="text-lg md:text-xl text-platinum-300 mb-8 max-w-3xl mx-auto">
              Descubre nuestra exclusiva colección de joyas premium. Anillos de compromiso, collares de diamantes y
              piezas personalizadas con certificación internacional.
            </p>

            {/* Badges de calidad */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center bg-black bg-opacity-30 px-4 py-2 rounded-full border border-gold-500">
                <Award className="h-5 w-5 text-gold-500 mr-2" />
                <span className="text-platinum-200 text-sm">Certificación GIA</span>
              </div>
              <div className="flex items-center bg-black bg-opacity-30 px-4 py-2 rounded-full border border-silver-500">
                <Star className="h-5 w-5 text-silver-400 mr-2" />
                <span className="text-platinum-200 text-sm">25+ Años de Experiencia</span>
              </div>
              <div className="flex items-center bg-black bg-opacity-30 px-4 py-2 rounded-full border border-platinum-500">
                <Diamond className="h-5 w-5 text-platinum-400 mr-2" />
                <span className="text-platinum-200 text-sm">Piezas Personalizadas</span>
              </div>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-platinum-400 h-6 w-6" />
                <input
                  type="text"
                  placeholder="Buscar anillos, collares, aretes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 luxury-input rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Características */}
      <div className="py-16 bg-charcoal-900 border-y-2 border-gold-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 glow-gold">
                <Diamond className="h-10 w-10 text-charcoal-900" />
              </div>
              <h3 className="font-luxury text-xl font-semibold text-gold-500 mb-2">Diamantes Certificados</h3>
              <p className="text-platinum-300">Todos nuestros diamantes cuentan con certificación GIA internacional</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-silver-gradient rounded-full flex items-center justify-center mx-auto mb-4 glow-silver">
                <Award className="h-10 w-10 text-charcoal-900" />
              </div>
              <h3 className="font-luxury text-xl font-semibold text-silver-400 mb-2">Garantía de por Vida</h3>
              <p className="text-platinum-300">Garantía completa en manufactura y mantenimiento gratuito</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-platinum-gradient rounded-full flex items-center justify-center mx-auto mb-4 glow-platinum">
                <Star className="h-10 w-10 text-charcoal-900" />
              </div>
              <h3 className="font-luxury text-xl font-semibold text-platinum-400 mb-2">Diseño Personalizado</h3>
              <p className="text-platinum-300">Creamos piezas únicas según tus especificaciones y gustos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante WhatsApp */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={sendToWhatsApp}
            className="luxury-button p-4 rounded-full shadow-luxury flex items-center justify-center space-x-2 animate-pulse hover:scale-105 transition-transform"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="hidden sm:inline font-medium">Consultar por WhatsApp ({cart.length})</span>
          </button>
        </div>
      )}

      {/* Filtros y Productos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="luxury-card p-6 mb-8 rounded-xl">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="h-5 w-5 text-gold-500" />
            <span className="text-white font-medium font-luxury">Filtros avanzados</span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gold-500 hover:text-gold-400 font-medium transition-colors"
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="luxury-input px-3 py-2 rounded-lg"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="luxury-input px-3 py-2 rounded-lg"
              >
                <option value="">Todos los materiales</option>
                {materials.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="luxury-input px-3 py-2 rounded-lg"
              >
                <option value="">Todas las sucursales</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>

              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Precio mín"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full luxury-input px-3 py-2 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Precio máx"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full luxury-input px-3 py-2 rounded-lg"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="luxury-input px-3 py-2 rounded-lg"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price-low">Precio: menor → mayor</option>
                <option value="price-high">Precio: mayor → menor</option>
                <option value="newest">Más recientes</option>
              </select>

              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedMaterial('');
                  setSelectedBranch('');
                  setPriceRange({ min: '', max: '' });
                  setSortBy('name');
                  setSearchTerm('');
                }}
                className="luxury-button px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Resumen de resultados */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-platinum-300 font-medium">
            Mostrando <span className="text-gold-500 font-bold">{filteredProducts.length}</span> de{' '}
            <span className="text-gold-500 font-bold">{products.length}</span> productos
          </p>
          {cart.length > 0 && (
            <div className="flex items-center space-x-2 text-gold-500">
              <CartIcon className="h-5 w-5" />
              <span className="font-medium">{cart.length} en carrito</span>
            </div>
          )}
        </div>

        {/* Grid de productos */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gold-500 text-7xl mb-6">💎</div>
            <h3 className="font-luxury text-3xl text-white mb-3">No encontramos resultados</h3>
            <p className="text-platinum-400 text-lg">Prueba ajustando los filtros o buscando otro término</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}