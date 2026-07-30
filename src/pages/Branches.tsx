import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star, Plus, CreditCard as Edit2, Trash2, Package, DollarSign, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Branch } from '../types/Branch';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../components/ScrollReveal';

const defaultHours = {
  monday: '9:00 AM - 7:00 PM',
  tuesday: '9:00 AM - 7:00 PM',
  wednesday: '9:00 AM - 7:00 PM',
  thursday: '9:00 AM - 7:00 PM',
  friday: '9:00 AM - 8:00 PM',
  saturday: '10:00 AM - 8:00 PM',
  sunday: '12:00 PM - 6:00 PM',
};

const emptyForm = {
  name: '', address: '', phone: '', email: '', manager: '',
  city: '', state: '', zipCode: '',
  openingHours: { ...defaultHours },
  specialties: [] as string[],
  isActive: true,
};

const dayLabels: { key: keyof typeof defaultHours; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export function Branches() {
  const { branches, addBranch, updateBranch, deleteBranch, getBranchAnalytics, products } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [specialtyInput, setSpecialtyInput] = useState('');

  const branchAnalytics = getBranchAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      await updateBranch({ ...formData, id: editingBranch.id });
    } else {
      await addBranch(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ ...emptyForm, openingHours: { ...defaultHours } });
    setShowForm(false);
    setEditingBranch(null);
    setSpecialtyInput('');
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      city: branch.city,
      state: branch.state,
      zipCode: branch.zipCode,
      openingHours: { ...defaultHours, ...branch.openingHours },
      specialties: branch.specialties || [],
      isActive: branch.isActive,
    });
    setShowForm(true);
  };

  const addSpecialty = () => {
    const trimmed = specialtyInput.trim();
    if (trimmed && !formData.specialties.includes(trimmed)) {
      setFormData({ ...formData, specialties: [...formData.specialties, trimmed] });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (s: string) => {
    setFormData({ ...formData, specialties: formData.specialties.filter(x => x !== s) });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
              Gestión de Sucursales
            </h1>
            <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
              Administra las sucursales de la joyería
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="luxury-button w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Sucursal</span>
          </button>
        </div>

        {/* Branches Grid */}
        {branches.length === 0 ? (
          <div className="luxury-card rounded-xl p-12 text-center">
            <MapPin className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
            <p className="text-platinum-400">No hay sucursales registradas</p>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {branches.map((branch) => {
              const analytics = branchAnalytics.find((a: any) => a.branchId === branch.id);
              return (
                <StaggerItem key={branch.id}>
                  <div className="luxury-card rounded-xl overflow-hidden hover:border-gold-500/40 transition-all duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-900 border-b border-gold-500/20 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0">
                          <h3 className="font-luxury text-lg sm:text-xl font-semibold text-gradient-gold truncate">
                            {branch.name}
                          </h3>
                          <p className="text-platinum-400 text-sm mt-0.5">Gerente: {branch.manager}</p>
                        </div>
                        {analytics && (
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 flex-shrink-0 ${
                            analytics.performance === 'excellent'
                              ? 'bg-green-500/15 text-green-300 border-green-500/30'
                              : analytics.performance === 'good'
                              ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                              : 'bg-platinum-500/15 text-platinum-300 border-platinum-500/30'
                          }`}>
                            {analytics.performance === 'excellent' && <Star className="h-3 w-3" />}
                            {analytics.performance === 'good' && <TrendingUp className="h-3 w-3" />}
                            <span className="capitalize">{analytics.performance || 'N/A'}</span>
                          </span>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <Package className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                          <p className="text-lg font-luxury font-semibold text-white">{analytics?.totalProducts || 0}</p>
                          <p className="text-xs text-platinum-500">Productos</p>
                        </div>
                        <div className="text-center">
                          <DollarSign className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                          <p className="text-lg font-luxury font-semibold text-gold-400">
                            ${(analytics?.revenue || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-platinum-500">Ventas</p>
                        </div>
                        <div className="text-center">
                          <AlertTriangle className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                          <p className="text-lg font-luxury font-semibold text-white">{analytics?.lowStockAlerts || 0}</p>
                          <p className="text-xs text-platinum-500">Alertas</p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-start gap-2.5 text-sm text-platinum-300">
                          <MapPin className="h-4 w-4 text-gold-400 flex-shrink-0 mt-0.5" />
                          <span>{branch.address}, {branch.city}, {branch.state}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <Phone className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <Mail className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span className="truncate">{branch.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <Clock className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span>{branch.openingHours?.monday || '—'}</span>
                        </div>
                      </div>

                      {/* Specialties */}
                      {branch.specialties && branch.specialties.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-platinum-400 uppercase tracking-wider mb-2">Especialidades</p>
                          <div className="flex flex-wrap gap-2">
                            {branch.specialties.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-1 text-xs font-medium bg-gold-500/10 text-gold-300 rounded-lg border border-gold-500/20">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-platinum-700/20">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="flex-1 px-3 py-2 text-sm text-platinum-200 border border-platinum-600/40 rounded-lg hover:bg-white/5 hover:border-gold-500/40 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => deleteBranch(branch.id)}
                          className="flex-1 px-3 py-2 text-sm text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </div>

      {/* Branch Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Gerente</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Código Postal</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Opening Hours */}
              <div className="luxury-card p-4 rounded-lg">
                <p className="text-sm font-medium text-platinum-200 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gold-400" />
                  Horarios de Atención
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dayLabels.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-platinum-400 mb-1">{label}</label>
                      <input
                        type="text"
                        value={formData.openingHours[key]}
                        onChange={e => setFormData({
                          ...formData,
                          openingHours: { ...formData.openingHours, [key]: e.target.value },
                        })}
                        className="luxury-input w-full py-2 px-3 rounded-lg text-sm"
                        placeholder="Cerrado"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Especialidades</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty(); } }}
                    className="luxury-input flex-1 py-2.5 px-3 rounded-lg"
                    placeholder="Anillos, Reparaciones..."
                  />
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="px-4 py-2.5 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-gold-500/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.specialties.map((s, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gold-500/10 text-gold-300 rounded-lg border border-gold-500/20">
                        {s}
                        <button type="button" onClick={() => removeSpecialty(s)} className="hover:text-red-300">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 sticky bottom-0 bg-charcoal-900 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 border-t border-platinum-700/30">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:flex-1 px-4 py-2.5 border border-platinum-600/50 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:flex-1 luxury-button px-4 py-2.5 rounded-lg">
                  {editingBranch ? 'Actualizar' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
