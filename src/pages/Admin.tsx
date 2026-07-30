import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard as Edit2, Trash2, Package, DollarSign, ShoppingBag, X, Search, Sparkles, AlertTriangle, Save, Check, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, ProductStatus } from '../types/Product';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../components/ScrollReveal';

type ProductFormData = Omit<Product, 'id'> & {
  price: string;
  stock: string;
  weight: string;
  craftingTime: string;
  additionalImages: string[];
  status: string;
};

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  image: '',
  additionalImages: [],
  category: '',
  stock: '',
  material: '',
  weight: '',
  size: '',
  gemstone: '',
  certification: '',
  branchId: '',
  branchName: '',
  isCustomizable: false,
  craftingTime: '',
  status: 'available',
};

export function Admin() {
  const { products, branches, addProduct, updateProduct, deleteProduct } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [inlineStock, setInlineStock] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesBranch = !branchFilter || p.branchId === branchFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const branch = branches.find(b => b.id === formData.branchId);
    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      image: formData.image,
      additionalImages: formData.additionalImages,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      material: formData.material,
      weight: parseFloat(formData.weight) || 0,
      size: formData.size,
      gemstone: formData.gemstone || undefined,
      certification: formData.certification || undefined,
      branchId: formData.branchId,
      branchName: branch?.name || formData.branchName,
      isCustomizable: formData.isCustomizable,
      craftingTime: formData.isCustomizable ? parseInt(formData.craftingTime) || 1 : undefined,
      status: (formData.status || 'available') as ProductStatus,
    };

    if (editingProduct) {
      await updateProduct({ ...productData, id: editingProduct.id });
    } else {
      await addProduct(productData);
    }

    setSaving(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingProduct(null);
    setNewImageUrl('');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      additionalImages: product.additionalImages || [],
      category: product.category,
      stock: product.stock.toString(),
      material: product.material,
      weight: product.weight.toString(),
      size: product.size,
      gemstone: product.gemstone || '',
      certification: product.certification || '',
      branchId: product.branchId,
      branchName: product.branchName,
      isCustomizable: product.isCustomizable,
      craftingTime: product.craftingTime?.toString() || '',
      status: product.status || 'available',
    });
    setShowForm(true);
  };

  const saveInlineStock = async (productId: string) => {
    const newStock = parseInt(inlineStock[productId]);
    if (isNaN(newStock)) return;
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === newStock) {
      setInlineStock(prev => { const c = { ...prev }; delete c[productId]; return c; });
      return;
    }
    setSavingStock(productId);
    await updateProduct({ ...product, stock: newStock });
    setSavingStock(null);
    setInlineStock(prev => { const c = { ...prev }; delete c[productId]; return c; });
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter(p => p.stock <= 5).length;

  const stockBadge = (stock: number) => {
    if (stock === 0) return 'bg-red-500/20 text-red-300 border-red-500/40';
    if (stock <= 5) return 'bg-gold-500/20 text-gold-300 border-gold-500/40';
    return 'bg-green-500/20 text-green-300 border-green-500/40';
  };

  const statusBadge = (status: string) => {
    if (status === 'sold') return 'bg-red-500/15 text-red-300 border-red-500/30';
    if (status === 'reserved') return 'bg-gold-500/15 text-gold-300 border-gold-500/30';
    return 'bg-green-500/15 text-green-300 border-green-500/30';
  };

  const statusLabel = (status: string) => {
    if (status === 'sold') return 'Vendido';
    if (status === 'reserved') return 'Reservado';
    return 'Disponible';
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (url && !formData.additionalImages.includes(url)) {
      setFormData({ ...formData, additionalImages: [...formData.additionalImages, url] });
      setNewImageUrl('');
    }
  };

  const removeImageUrl = (url: string) => {
    setFormData({ ...formData, additionalImages: formData.additionalImages.filter(u => u !== url) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
              Gestión de Productos
            </h1>
            <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
              Administra el catálogo de joyería
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData(emptyForm);
              setShowForm(true);
            }}
            className="luxury-button w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Stats Cards */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <StatCard icon={Package} label="Productos" value={totalProducts} />
            <StatCard icon={ShoppingBag} label="Stock Total" value={totalStock} />
            <StatCard icon={DollarSign} label="Valor" value={`$${totalValue.toLocaleString()}`} gold />
            <StatCard icon={AlertTriangle} label="Stock Bajo" value={lowStock} />
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal>
          <div className="luxury-card p-3 sm:p-4 md:p-5 rounded-xl mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-platinum-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="luxury-input w-full pl-10 pr-3 py-2.5 rounded-lg"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="luxury-input py-2.5 px-3 rounded-lg"
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="luxury-input py-2.5 px-3 rounded-lg"
              >
                <option value="">Todas las sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </ScrollReveal>

        {/* Status filter row */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
          {['', 'available', 'sold', 'reserved'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                  : 'border-platinum-700/30 text-platinum-400 hover:bg-white/5'
              }`}
            >
              {s === '' ? 'Todos' : s === 'available' ? 'Disponibles' : s === 'sold' ? 'Vendidos' : 'Reservados'}
            </button>
          ))}
        </div>

        {/* Products Table — Desktop */}
        <div className="luxury-card rounded-xl overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30 border-b border-platinum-700/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">Categoría</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">Material</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden xl:table-cell">Sucursal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden xl:table-cell">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gold-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-700/20">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <Package className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
                      <p className="text-platinum-400">No se encontraron productos</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded-lg mr-4 border border-platinum-700/30 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white flex items-center gap-2">
                              <span className="truncate">{product.name}</span>
                              {product.isCustomizable && (
                                <Sparkles className="h-3 w-3 text-gold-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-platinum-400 truncate max-w-[200px]">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="px-2.5 py-1 text-xs font-medium bg-gold-500/10 text-gold-300 rounded-lg border border-gold-500/30">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-platinum-300">{product.material}</span>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-platinum-300">{product.branchName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gold-400">
                          ${product.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inlineStock[product.id] !== undefined ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={inlineStock[product.id]}
                              onChange={e => setInlineStock({ ...inlineStock, [product.id]: e.target.value })}
                              className="luxury-input w-16 py-1 px-2 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => saveInlineStock(product.id)}
                              disabled={savingStock === product.id}
                              className="p-1 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                            >
                              {savingStock === product.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setInlineStock(prev => { const c = { ...prev }; delete c[product.id]; return c; })}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setInlineStock({ ...inlineStock, [product.id]: product.stock.toString() })}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all hover:scale-105 ${stockBadge(product.stock)}`}
                            title="Click para editar"
                          >
                            {product.stock}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${statusBadge(product.status || 'available')}`}>
                          {statusLabel(product.status || 'available')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-silver-400 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products — Mobile Cards */}
        <StaggerGroup className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="luxury-card rounded-xl p-8 text-center">
              <Package className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
              <p className="text-platinum-400">No se encontraron productos</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <StaggerItem key={product.id}>
                <div className="luxury-card rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 object-cover rounded-lg border border-platinum-700/30 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                        {product.isCustomizable && (
                          <Sparkles className="h-3 w-3 text-gold-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-platinum-400 line-clamp-2 mt-0.5">{product.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gold-500/10 text-gold-300 rounded border border-gold-500/30">
                          {product.category}
                        </span>
                        <span className="text-xs text-platinum-400">{product.material}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusBadge(product.status || 'available')}`}>
                          {statusLabel(product.status || 'available')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gold-400">
                            ${product.price.toLocaleString()}
                          </span>
                          {inlineStock[product.id] !== undefined ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inlineStock[product.id]}
                                onChange={e => setInlineStock({ ...inlineStock, [product.id]: e.target.value })}
                                className="luxury-input w-14 py-1 px-2 rounded text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() => saveInlineStock(product.id)}
                                disabled={savingStock === product.id}
                                className="p-1 text-green-400"
                              >
                                {savingStock === product.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => setInlineStock(prev => { const c = { ...prev }; delete c[product.id]; return c; })}
                                className="p-1 text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setInlineStock({ ...inlineStock, [product.id]: product.stock.toString() })}
                              className={`px-2 py-0.5 text-xs font-medium rounded border ${stockBadge(product.stock)}`}
                            >
                              Stock: {product.stock}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-silver-400 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerGroup>
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Fixed Header */}
              <div className="flex-shrink-0 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between bg-charcoal-900">
                <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Container */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="relative h-40 rounded-lg overflow-hidden border border-platinum-700/30">
                      <img src={formData.image} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 to-transparent" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                      URL de Imagen Principal
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg"
                      placeholder="https://... (Drive, Pexels, Google, etc.)"
                      required
                    />
                  </div>

                  {/* Additional Images */}
                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                      Fotos Adicionales
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                        className="luxury-input flex-1 py-2.5 px-3 rounded-lg"
                        placeholder="Pega otra URL de foto..."
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="px-4 py-2.5 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-gold-500/10 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {formData.additionalImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                        {formData.additionalImages.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`foto ${idx + 1}`} className="h-20 w-full object-cover rounded-lg border border-platinum-700/30" />
                            <button
                              type="button"
                              onClick={() => removeImageUrl(url)}
                              className="absolute top-1 right-1 p-1 bg-black/70 text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Precio ($)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Stock</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Categoría</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        placeholder="Anillos, Collares..."
                        list="category-suggestions"
                        required
                      />
                      <datalist id="category-suggestions">
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Material</label>
                      <input
                        type="text"
                        value={formData.material}
                        onChange={e => setFormData({ ...formData, material: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        placeholder="Oro 18k, Plata 925..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Peso (gramos)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Tamaño</label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        placeholder="Talla 7, 45cm..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Gemas (opcional)</label>
                      <input
                        type="text"
                        value={formData.gemstone}
                        onChange={e => setFormData({ ...formData, gemstone: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        placeholder="Diamante 1ct..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-platinum-300 mb-1.5">Certificación (opcional)</label>
                      <input
                        type="text"
                        value={formData.certification}
                        onChange={e => setFormData({ ...formData, certification: e.target.value })}
                        className="luxury-input w-full py-2.5 px-3 rounded-lg"
                        placeholder="GIA Certificado..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">Sucursal</label>
                    <select
                      value={formData.branchId}
                      onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg"
                      required
                    >
                      <option value="">Seleccionar sucursal</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">Estado del Producto</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'available', label: 'Disponible' },
                        { value: 'sold', label: 'Vendido' },
                        { value: 'reserved', label: 'Reservado' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: opt.value })}
                          className={`px-3 py-2.5 text-sm rounded-lg border transition-all ${
                            formData.status === opt.value
                              ? statusBadge(opt.value) + ' ring-1 ring-gold-500/50'
                              : 'border-platinum-700/30 text-platinum-400 hover:bg-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="luxury-card p-4 rounded-lg space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isCustomizable}
                        onChange={e => setFormData({ ...formData, isCustomizable: e.target.checked })}
                        className="mr-3 h-4 w-4 accent-gold-500"
                      />
                      <span className="text-sm text-platinum-200 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-gold-400" />
                        Producto personalizable
                      </span>
                    </label>

                    {formData.isCustomizable && (
                      <div>
                        <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                          Tiempo de elaboración (días)
                        </label>
                        <input
                          type="number"
                          value={formData.craftingTime}
                          onChange={e => setFormData({ ...formData, craftingTime: e.target.value })}
                          className="luxury-input w-full py-2.5 px-3 rounded-lg"
                          min="1"
                          placeholder="7"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed Footer Buttons */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 px-4 sm:px-6 py-4 bg-charcoal-900 border-t border-platinum-700/30">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:flex-1 px-4 py-2.5 border border-platinum-600/50 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:flex-1 luxury-button px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingProduct ? 'Actualizar' : 'Crear Producto'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gold }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; gold?: boolean }) {
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