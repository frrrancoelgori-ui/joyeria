import React, { useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Package, DollarSign, ShoppingBag, X, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types/Product';

type ProductFormData = Omit<Product, 'id'> & {
  price: string;
  stock: string;
  weight: string;
  craftingTime: string;
};

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  image: '',
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
};

export function Admin() {
  const { products, branches, addProduct, updateProduct, deleteProduct } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesBranch = !branchFilter || p.branchId === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const branch = branches.find(b => b.id === formData.branchId);
    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      image: formData.image,
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
    };

    if (editingProduct) {
      await updateProduct({ ...productData, id: editingProduct.id });
    } else {
      await addProduct(productData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
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
    });
    setShowForm(true);
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
            onClick={() => setShowForm(true)}
            className="luxury-button w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="luxury-card p-4 sm:p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">Productos</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">{totalProducts}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gold-500" />
              </div>
            </div>
          </div>

          <div className="luxury-card p-4 sm:p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">Stock Total</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">{totalStock}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-silver-500/10 border border-silver-500/30 flex-shrink-0">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-silver-400" />
              </div>
            </div>
          </div>

          <div className="luxury-card p-4 sm:p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">Valor</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gold-400 mt-1 truncate">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-platinum-500/10 border border-platinum-500/30 flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-platinum-300" />
              </div>
            </div>
          </div>

          <div className="luxury-card p-4 sm:p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">Stock Bajo</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gold-400 mt-1">{lowStock}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
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

        {/* Products Table — Desktop */}
        <div className="luxury-card rounded-xl overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30 border-b border-platinum-700/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden xl:table-cell">
                    Sucursal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-700/20">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
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
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${stockBadge(product.stock)}`}>
                          {product.stock}
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
        <div className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="luxury-card rounded-xl p-8 text-center">
              <Package className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
              <p className="text-platinum-400">No se encontraron productos</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="luxury-card rounded-xl p-4">
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
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gold-400">
                          ${product.price.toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${stockBadge(product.stock)}`}>
                          Stock: {product.stock}
                        </span>
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
            ))
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Stock
                  </label>
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
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    placeholder="Anillos, Collares..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Material
                  </label>
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
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Peso (gramos)
                  </label>
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
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Tamaño
                  </label>
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
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Gemas (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.gemstone}
                    onChange={e => setFormData({ ...formData, gemstone: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    placeholder="Diamante 1ct..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                    Certificación (opcional)
                  </label>
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
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                  Sucursal
                </label>
                <select
                  value={formData.branchId}
                  onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">
                  URL de Imagen
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  placeholder="https://..."
                  required
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="preview"
                    className="mt-3 h-24 w-24 object-cover rounded-lg border border-platinum-700/30"
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-2 sticky bottom-0 bg-charcoal-900 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 border-t border-platinum-700/30">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:flex-1 px-4 py-2.5 border border-platinum-600/50 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 luxury-button px-4 py-2.5 rounded-lg"
                >
                  {editingProduct ? 'Actualizar' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
