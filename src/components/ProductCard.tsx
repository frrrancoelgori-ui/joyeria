import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Product } from '../types/Product';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const { addToCart } = useApp();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div 
      className="
        luxury-card 
        rounded-xl 
        overflow-hidden 
        flex flex-col 
        h-full 
        bg-gradient-to-b from-charcoal-900 to-charcoal-950 
        border border-platinum-900/20 
        shadow-luxury-sm 
        transition-all duration-300
      "
    >
      {/* Imagen con overlay y badges */}
      <div className="relative overflow-hidden aspect-[4/3] bg-black/30">
        <img
          src={product.image}
          alt={product.name}
          className="
            w-full h-full 
            object-cover 
            transition-transform duration-700 
            ease-out 
            group-hover:scale-105
          "
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />

        {/* Badges superiores */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {product.stock <= 5 && product.stock > 0 && (
            <div className="bg-gold-gradient text-charcoal-900 px-3 py-1 rounded-full text-xs font-bold border border-gold-600/70 shadow-sm">
              ¡Últimas {product.stock}!
            </div>
          )}
          {product.stock === 0 && (
            <div className="bg-red-700/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              Agotado
            </div>
          )}
        </div>

        {product.isCustomizable && (
          <div className="absolute top-3 left-3 bg-platinum-gradient text-charcoal-900 px-3 py-1 rounded-full text-xs font-bold border border-platinum-600/60 shadow-sm">
            ✨ Personalizable
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-luxury text-lg font-semibold text-white line-clamp-2 flex-1 group-hover:text-gold-400 transition-colors">
            {product.name}
          </h3>
          <span className="bg-gold-gradient text-charcoal-900 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-platinum-400">{product.branchName}</span>
          {product.certification && (
            <span className="bg-silver-gradient text-charcoal-900 px-2 py-1 rounded-lg text-xs font-bold">
              {product.certification}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs text-platinum-300">
          <div>Material: {product.material}</div>
          <div>Peso: {product.weight}g</div>
          {product.gemstone && <div>Gema: {product.gemstone}</div>}
          {product.size && <div>Tamaño: {product.size}</div>}
        </div>

        <p className="text-platinum-400 text-sm mb-5 line-clamp-2 flex-grow">
          {product.description}
        </p>

        {/* Precio + botón */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gold-500 font-luxury">
              ${product.price.toLocaleString()}
            </span>
            <div className="flex items-center text-xs text-platinum-400 mt-1">
              <Package className="h-4 w-4 mr-1.5 text-silver-400" />
              Stock: {product.stock}
            </div>
            {product.isCustomizable && product.craftingTime && (
              <div className="text-xs text-platinum-400 mt-0.5">
                Tiempo: {product.craftingTime} días
              </div>
            )}
          </div>

          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="
                luxury-button 
                px-5 py-2.5 
                rounded-lg 
                text-sm 
                flex items-center gap-2 
                transition-all duration-300 
                disabled:opacity-50 
                disabled:cursor-not-allowed 
                hover:scale-105 
                active:scale-95
              "
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