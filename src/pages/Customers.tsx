import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, CreditCard as Edit2, Trash2, X, Phone, Mail, MapPin, ShoppingBag, DollarSign, Search, Save, Loader2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types/Customer';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../components/ScrollReveal';

const emptyForm = {
  fullName: '', phone: '', email: '', address: '', city: '', notes: '',
};

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingCustomer) {
      await updateCustomer({ ...formData, id: editingCustomer.id, totalPurchases: editingCustomer.totalPurchases, totalSpent: editingCustomer.totalSpent, createdAt: editingCustomer.createdAt });
    } else {
      await addCustomer(formData);
    }
    setSaving(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      notes: customer.notes,
    });
    setShowForm(true);
  };

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalPurchases = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
  const avgTicket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
              Cartera de Clientes
            </h1>
            <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
              Administra y registra tus clientes
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="luxury-button w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <StatCard icon={Users} label="Clientes" value={totalCustomers} />
            <StatCard icon={ShoppingBag} label="Compras" value={totalPurchases} />
            <StatCard icon={DollarSign} label="Ingresos" value={`$${totalRevenue.toLocaleString()}`} gold />
            <StatCard icon={DollarSign} label="Ticket Prom." value={`$${Math.round(avgTicket).toLocaleString()}`} />
          </div>
        </ScrollReveal>

        {/* Search */}
        <ScrollReveal>
          <div className="luxury-card p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-platinum-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, email o ciudad..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="luxury-input w-full pl-10 pr-3 py-2.5 rounded-lg"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Customer Cards */}
        {filteredCustomers.length === 0 ? (
          <div className="luxury-card rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
            <p className="text-platinum-400">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados todavía'}
            </p>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredCustomers.map(customer => (
              <StaggerItem key={customer.id}>
                <div className="luxury-card rounded-xl overflow-hidden hover:border-gold-500/40 transition-all duration-300">
                  <div className="h-1.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
                          <User className="h-5 w-5 text-gold-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-luxury text-lg font-semibold text-white truncate">{customer.fullName}</h3>
                          <p className="text-xs text-platinum-400">
                            Cliente desde {new Date(customer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(customer)} className="p-2 text-silver-400 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteCustomer(customer.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {customer.phone && (
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <Phone className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <Mail className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {(customer.address || customer.city) && (
                        <div className="flex items-center gap-2.5 text-sm text-platinum-300">
                          <MapPin className="h-4 w-4 text-gold-400 flex-shrink-0" />
                          <span className="truncate">
                            {[customer.address, customer.city].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {customer.notes && (
                      <div className="mb-4 p-3 bg-black/20 rounded-lg border border-platinum-700/20">
                        <p className="text-xs text-platinum-400">{customer.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-platinum-700/20">
                      <div className="text-center">
                        <ShoppingBag className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                        <p className="text-lg font-luxury font-semibold text-white">{customer.totalPurchases}</p>
                        <p className="text-xs text-platinum-500">Compras</p>
                      </div>
                      <div className="text-center">
                        <DollarSign className="h-4 w-4 text-platinum-500 mx-auto mb-1" />
                        <p className="text-lg font-luxury font-semibold text-gold-400">
                          ${customer.totalSpent.toLocaleString()}
                        </p>
                        <p className="text-xs text-platinum-500">Gastado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>

      {/* Customer Form Modal */}
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
              className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                  {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <button onClick={resetForm} className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg"
                      placeholder="+56 9 ..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-platinum-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="luxury-input w-full py-2.5 px-3 rounded-lg"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-1.5">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="luxury-input w-full py-2.5 px-3 rounded-lg resize-none"
                    rows={3}
                    placeholder="Preferencias, historial, observaciones..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 sticky bottom-0 bg-charcoal-900 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 border-t border-platinum-700/30">
                  <button type="button" onClick={resetForm} className="w-full sm:flex-1 px-4 py-2.5 border border-platinum-600/50 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="w-full sm:flex-1 luxury-button px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Guardando...</span></> : <><Save className="h-4 w-4" /><span>{editingCustomer ? 'Actualizar' : 'Crear Cliente'}</span></>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, gold }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; gold?: boolean }) {
  return (
    <div className="luxury-card p-4 sm:p-5 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">{label}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-luxury font-semibold mt-1 truncate ${gold ? 'text-gold-400' : 'text-white'}`}>{value}</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gold-400" />
        </div>
      </div>
    </div>
  );
}
