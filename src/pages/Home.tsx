import React, { useState } from 'react';
import { Search, Filter, MessageCircle, ShoppingCart as CartIcon, Diamond, Star, Award } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { useApp } from '../context/AppContext';
import { ScrollReveal, StaggerGroup, StaggerItem, Parallax } from '../components/ScrollReveal';

export function Home() {
  const { products, cart } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const materials = Array.from(new Set(products.map(p => p.material))).sort();
  const branches = Array.from(new Set(products.map(p => p.branchName))).sort();

  const filteredProducts = products
    .filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesMaterial = !selectedMaterial || product.material === selectedMaterial;
      const matchesBranch = !selectedBranch || product.branchName === selectedBranch;
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
          return Number(b.id) - Number(a.id);
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

    const phoneNumber = '+56941228089'; // ← ¡CAMBIAR POR EL NÚMERO REAL DE LA TIENDA!
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,rgba(234,179,8,0.08),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(234,179,8,0.05),transparent_50%)]" />

        <Parallax offset={40}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="text-center">
            <ScrollReveal delay={0.1}>
            <div className="flex items-center justify-center mb-6 gap-3 md:gap-5">
              <Diamond className="h-10 w-10 md:h-14 md:w-14 text-gold-500 animate-pulse" />
              <h1 className="font-luxury text-5xl md:text-7xl font-semibold text-gradient-gold tracking-wide drop-shadow-lg">
                Diamante Real
              </h1>
              <Diamond className="h-10 w-10 md:h-14 md:w-14 text-gold-500 animate-pulse" />
            </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
            <h2 className="text-xl md:text-3xl font-luxury text-platinum-200 mb-5 tracking-wide font-light">
              Joyería de Lujo • Desde 1998
            </h2>

            <p className="text-base md:text-xl text-platinum-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Anillos de compromiso, collares de diamantes, piezas únicas y personalizadas con certificación internacional.
            </p>
            </ScrollReveal>

            {/* Sellos de confianza */}
            <ScrollReveal delay={0.4}>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-full border border-gold-600/60">
                <Award className="h-5 w-5 text-gold-500 mr-2" />
                <span className="text-sm text-platinum-200">Certificación GIA</span>
              </div>
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-full border border-silver-600/50">
                <Star className="h-5 w-5 text-silver-400 mr-2" />
                <span className="text-sm text-platinum-200">+25 años</span>
              </div>
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-4 py-2.5 rounded-full border border-platinum-600/50">
                <Diamond className="h-5 w-5 text-platinum-400 mr-2" />
                <span className="text-sm text-platinum-200">Personalización</span>
              </div>
            </div>
            </ScrollReveal>

            {/* Búsqueda */}
            <ScrollReveal delay={0.55}>
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-platinum-400" />
                <input
                  type="text"
                  placeholder="Buscar joyas, anillos, diamantes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-charcoal-800/60 border border-platinum-700/40 rounded-xl text-lg focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                />
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
        </Parallax>
      </div>

     

      {/* Botón flotante WhatsApp */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 group">
          <button
            onClick={sendToWhatsApp}
            className="relative luxury-button p-4 md:p-5 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <MessageCircle className="h-7 w-7" />
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-1.5 shadow-lg">
              {cart.length}
            </div>
          </button>
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-charcoal-900 text-platinum-200 text-sm px-4 py-2 rounded-lg whitespace-nowrap shadow-xl">
              Consultar carrito por WhatsApp
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Productos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <ScrollReveal>
        <div className="luxury-card p-5 md:p-7 mb-8 rounded-2xl border border-platinum-900/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-gold-500" />
              <span className="font-luxury text-lg md:text-xl text-white">Filtros</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="luxury-button px-5 py-2.5 text-sm md:text-base"
            >
              {showFilters ? 'Ocultar' : 'Mostrar filtros'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="luxury-input py-3">
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} className="luxury-input py-3">
                <option value="">Todos los materiales</option>
                {materials.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="luxury-input py-3">
                <option value="">Todas las sucursales</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={priceRange.min}
                  onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
                  className="luxury-input py-3 w-full"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={priceRange.max}
                  onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
                  className="luxury-input py-3 w-full"
                />
              </div>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="luxury-input py-3">
                <option value="name">Nombre A–Z</option>
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
                className="luxury-button py-3 bg-red-900/40 hover:bg-red-900/60 border-red-700/50"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
        </ScrollReveal>

        {/* Resumen de resultados */}
        <ScrollReveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <p className="text-platinum-300">
            <span className="text-gold-400 font-semibold text-xl font-luxury">{filteredProducts.length}</span> productos encontrados
          </p>
          {cart.length > 0 && (
            <div className="flex items-center gap-2 text-gold-500 font-medium">
              <CartIcon className="h-5 w-5" />
              {cart.length} en carrito
            </div>
          )}
        </div>
        </ScrollReveal>

        {/* Productos - Carrusel en móvil + Grid en desktop */}
        {filteredProducts.length > 0 ? (
          <>
            {/* Carrusel solo visible en móvil (sm y menor) */}
            <div className="block sm:hidden">
              <Swiper
                modules={[Pagination, FreeMode]}
                spaceBetween={20}
                slidesPerView={1.2}
                freeMode={{ enabled: true, momentumRatio: 0.6 }}
                grabCursor={true}
                pagination={{ clickable: true, dynamicBullets: true }}
                className="pb-12 px-4"
              >
                {filteredProducts.map(product => (
                  <SwiperSlide key={product.id} className="!w-[82%]">
                    <ProductCard product={product} showAddToCart={true} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Grid visible en pantallas medianas y grandes */}
            <StaggerGroup className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
              {filteredProducts.map(product => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} showAddToCart={true} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="text-8xl mb-6 opacity-70">💎</div>
            <h3 className="font-luxury text-3xl text-gold-400 mb-4 font-semibold tracking-wide">Sin resultados</h3>
            <p className="text-platinum-400 text-lg max-w-md mx-auto">
              Prueba con otros términos o limpia los filtros para ver toda la colección
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}