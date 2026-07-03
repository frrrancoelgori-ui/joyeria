import React from 'react';
import { ShoppingCart, Package, Sparkles } from 'lucide-react';
import { Product } from '../types/Product';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const { addToCart } = useApp();

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product);
  };

  return (
    <div className="group luxury-card rounded-2xl overflow-hidden flex flex-col h-full transition-all duration-500 hover:-translate-y-1">
      {/* Imagen */}
      <div className="relative overflow-hidden aspect-[4/3] bg-black/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent opacity-60" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {product.stock <= 5 && product.stock > 0 && (
            <div className="bg-gold-gradient text-charcoal-950 px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-gold">
              ¡Últimas {product.stock}!
            </div>
          )}
          {product.stock === 0 && (
            <div className="bg-red-700/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              Agotado
            </div>
          )}
        </div>

        {product.isCustomizable && (
          <div className="absolute top-3 left-3 bg-platinum-gradient text-charcoal-950 px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Personalizable
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-luxury text-lg sm:text-xl font-semibold text-white line-clamp-2 flex-1 group-hover:text-gold-300 transition-colors duration-300">
            {product.name}
          </h3>
          <span className="bg-gold-500/10 text-gold-300 px-2.5 py-1 rounded-lg text-xs font-medium tracking-wide border border-gold-500/20 shrink-0">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs text-platinum-400">
          <span className="font-light">{product.branchName}</span>
          {product.certification && (
            <span className="bg-silver-500/10 text-silver-300 px-2 py-1 rounded-lg text-xs font-medium border border-silver-500/20">
              {product.certification}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-xs text-platinum-400 font-light">
          <div>Material: <span className="text-platinum-300">{product.material}</span></div>
          <div>Peso: <span className="text-platinum-300">{product.weight}g</span></div>
          {product.gemstone && <div>Gema: <span className="text-platinum-300">{product.gemstone}</span></div>}
          {product.size && <div>Tamaño: <span className="text-platinum-300">{product.size}</span></div>}
        </div>

        <p className="text-platinum-400 text-sm font-light mb-5 line-clamp-2 flex-grow leading-relaxed">
          {product.description}
        </p>

        {/* Precio + botón */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-platinum-700/15">
          <div className="flex flex-col">
            <span className="font-luxury text-2xl sm:text-3xl font-semibold text-gradient-gold">
              ${product.price?.toLocaleString() ?? '—'}
            </span>
            <div className="flex items-center text-xs text-platinum-400 mt-1 font-light">
              <Package className="h-3.5 w-3.5 mr-1.5 text-silver-400" />
              Stock: {product.stock ?? '?'}
            </div>
            {product.isCustomizable && product.craftingTime && (
              <div className="text-xs text-platinum-400 mt-0.5 font-light">
                Elaboración: {product.craftingTime} días
              </div>
            )}
          </div>

          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="luxury-button px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
