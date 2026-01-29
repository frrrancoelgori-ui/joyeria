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
    <div className="luxury-card rounded-xl hover:shadow-luxury transition-all duration-300 overflow-hidden group hover:scale-105">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-all duration-300" />
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-gold-gradient text-charcoal-900 px-3 py-1 rounded-full text-xs font-bold border border-gold-600">
            ¡Últimas {product.stock}!
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            Agotado
          </div>
        )}
        {product.isCustomizable && (
          <div className="absolute top-2 left-2 bg-platinum-gradient text-charcoal-900 px-3 py-1 rounded-full text-xs font-bold border border-platinum-600">
            ✨ Personalizable
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-luxury text-lg font-semibold text-white group-hover:text-gold-500 transition-colors">
            {product.name}
          </h3>
          <span className="bg-gold-gradient text-charcoal-900 px-2 py-1 rounded-lg text-xs font-bold">
            {product.category}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-platinum-400">{product.branchName}</span>
          {product.certification && (
            <span className="bg-silver-gradient text-charcoal-900 px-2 py-1 rounded-lg text-xs font-bold">
              {product.certification}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-platinum-300">
          <div>Material: {product.material}</div>
          <div>Peso: {product.weight}g</div>
          {product.gemstone && <div>Gema: {product.gemstone}</div>}
          {product.size && <div>Tamaño: {product.size}</div>}
        </div>
        
        <p className="text-platinum-400 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gold-500 font-luxury">
              ${product.price.toLocaleString()}
            </span>
            <div className="flex items-center text-sm text-platinum-400">
              <Package className="h-4 w-4 mr-1 text-silver-400" />
              Stock: {product.stock}
            </div>
            {product.isCustomizable && product.craftingTime && (
              <div className="text-xs text-platinum-400">
                Tiempo: {product.craftingTime} días
              </div>
            )}
          </div>
          
          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="luxury-button px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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