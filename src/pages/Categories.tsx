import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tag, Package, DollarSign, ShoppingBag, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../components/ScrollReveal';

export function Categories() {
  const { products } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; count: number; stock: number; value: number; products: typeof products }>();
    for (const p of products) {
      const key = p.category || 'Sin Categoría';
      if (!map.has(key)) {
        map.set(key, { name: key, count: 0, stock: 0, value: 0, products: [] });
      }
      const cat = map.get(key)!;
      cat.count++;
      cat.stock += p.stock;
      cat.value += p.price * p.stock;
      cat.products.push(p);
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [products]);

  const totalValue = categories.reduce((sum, c) => sum + c.value, 0);
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);
  const totalStock = categories.reduce((sum, c) => sum + c.stock, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
            Gestión de Categorías
          </h1>
          <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
            Vista general del catálogo por categoría
          </p>
        </div>

        {/* Summary Stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <SummaryCard icon={Tag} label="Categorías" value={categories.length} />
            <SummaryCard icon={Package} label="Productos" value={totalProducts} />
            <SummaryCard icon={ShoppingBag} label="Stock Total" value={totalStock} />
            <SummaryCard icon={DollarSign} label="Valor Total" value={`$${totalValue.toLocaleString()}`} gold />
          </div>
        </ScrollReveal>

        {/* Category Cards */}
        {categories.length === 0 ? (
          <div className="luxury-card rounded-xl p-12 text-center">
            <Tag className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
            <p className="text-platinum-400">No hay categorías disponibles</p>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <StaggerItem key={cat.name}>
                <button
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className="luxury-card rounded-xl overflow-hidden w-full text-left hover:border-gold-500/40 transition-all duration-300"
                >
                  <div className="h-1.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30">
                          <Tag className="h-5 w-5 text-gold-400" />
                        </div>
                        <h3 className="font-luxury text-lg sm:text-xl font-semibold text-white">
                          {cat.name}
                        </h3>
                      </div>
                      {cat.products.some(p => p.isCustomizable) && (
                        <Sparkles className="h-4 w-4 text-gold-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <Package className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                        <p className="text-xl font-luxury font-semibold text-white">{cat.count}</p>
                        <p className="text-xs text-platinum-500">Productos</p>
                      </div>
                      <div className="text-center">
                        <ShoppingBag className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                        <p className="text-xl font-luxury font-semibold text-white">{cat.stock}</p>
                        <p className="text-xs text-platinum-500">Stock</p>
                      </div>
                      <div className="text-center">
                        <DollarSign className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                        <p className="text-xl font-luxury font-semibold text-gold-400">
                          ${(cat.value / 1000).toFixed(1)}k
                        </p>
                        <p className="text-xs text-platinum-500">Valor</p>
                      </div>
                    </div>

                    {/* Mini bar showing stock distribution */}
                    <div className="space-y-1.5">
                      {cat.products.slice(0, 3).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <span className="text-platinum-400 truncate flex-1">{p.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            p.stock === 0
                              ? 'bg-red-500/15 text-red-300'
                              : p.stock <= 5
                              ? 'bg-gold-500/15 text-gold-300'
                              : 'bg-green-500/15 text-green-300'
                          }`}>
                            {p.stock}
                          </span>
                        </div>
                      ))}
                      {cat.products.length > 3 && (
                        <p className="text-xs text-platinum-500 pt-1">
                          +{cat.products.length - 3} productos más...
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-platinum-400">
                        {selectedCategory === cat.name ? 'Ocultar detalles' : 'Ver detalles'}
                      </span>
                      <TrendingUp className="h-3.5 w-3.5 text-platinum-500" />
                    </div>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}

        {/* Expanded Category Detail */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="luxury-card rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="h-5 w-5 text-gold-400" />
                <h3 className="font-luxury text-lg font-semibold text-gradient-gold">
                  {selectedCategory} — Detalle de Productos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider hidden sm:table-cell">Material</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Precio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-platinum-700/15">
                    {categories.find(c => c.name === selectedCategory)?.products.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="h-10 w-10 object-cover rounded-lg border border-platinum-700/30 flex-shrink-0" />
                            <span className="text-sm text-white truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-platinum-300 hidden sm:table-cell">{p.material}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gold-400 whitespace-nowrap">${p.price.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${
                            p.stock === 0
                              ? 'bg-red-500/15 text-red-300 border-red-500/30'
                              : p.stock <= 5
                              ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                              : 'bg-green-500/15 text-green-300 border-green-500/30'
                          }`}>
                            {p.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function SummaryCard({ icon: Icon, label, value, gold }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="luxury-card p-4 sm:p-5 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">{label}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-luxury font-semibold mt-1 truncate ${gold ? 'text-gold-400' : 'text-white'}`}>
            {value}
          </p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gold-400" />
        </div>
      </div>
    </div>
  );
}
