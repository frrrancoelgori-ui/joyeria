import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Search, X, ShoppingBag, DollarSign, User, Calendar,
  CreditCard, FileText, TrendingUp, Package, CheckCircle, Clock,
  XCircle, RefreshCw, Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Sale, SaleStatus } from '../types/Sale';
import { ScrollReveal, StaggerGroup, StaggerItem } from '../components/ScrollReveal';

const statusConfig: Record<SaleStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  completed: { label: 'Completada', icon: CheckCircle, color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-gold-500/15 text-gold-300 border-gold-500/30' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  refunded: { label: 'Reembolsada', icon: RefreshCw, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
};

export function Sales() {
  const { sales, customers, updateSale } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [updating, setUpdating] = useState(false);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sales.filter(s => {
      const matchesSearch =
        (s.saleNumber?.toString() || '').includes(term) ||
        (s.customerEmail || '').toLowerCase().includes(term) ||
        (s.customer?.fullName || '').toLowerCase().includes(term) ||
        s.items.some(it => it.product.name.toLowerCase().includes(term));
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sales, searchTerm, statusFilter]);

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.length;
  const completedSales = sales.filter(s => s.status === 'completed').length;
  const pendingSales = sales.filter(s => s.status === 'pending').length;
  const avgTicket = completedSales > 0 ? totalRevenue / completedSales : 0;

  const handleStatusChange = async (saleId: string, status: SaleStatus) => {
    setUpdating(true);
    await updateSale(saleId, { status });
    setUpdating(false);
    setSelectedSale(null);
  };

  const handleAssignCustomer = async (saleId: string, customerId: string) => {
    if (!customerId) return;
    setUpdating(true);
    await updateSale(saleId, { customerId });
    setUpdating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
            Gestión de Ventas
          </h1>
          <p className="text-platinum-400 text-sm mt-1 font-light tracking-wide">
            Registra y administra las ventas de la joyería
          </p>
        </div>

        {/* Stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <StatCard icon={Receipt} label="Ventas Totales" value={totalSales} />
            <StatCard icon={DollarSign} label="Ingresos" value={`$${totalRevenue.toLocaleString()}`} gold />
            <StatCard icon={CheckCircle} label="Completadas" value={completedSales} />
            <StatCard icon={Clock} label="Pendientes" value={pendingSales} />
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal>
          <div className="luxury-card p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-platinum-400" />
                <input
                  type="text"
                  placeholder="Buscar por N° venta, cliente o producto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="luxury-input w-full pl-10 pr-3 py-2.5 rounded-lg"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="luxury-input py-2.5 px-3 rounded-lg"
              >
                <option value="">Todos los estados</option>
                <option value="completed">Completadas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
                <option value="refunded">Reembolsadas</option>
              </select>
            </div>
          </div>
        </ScrollReveal>

        {/* Sales Table — Desktop */}
        <div className="luxury-card rounded-xl overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30 border-b border-platinum-700/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">N° Venta</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider hidden lg:table-cell">Productos</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gold-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gold-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-700/20">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Receipt className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
                      <p className="text-platinum-400">No se encontraron ventas</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => {
                    const StatusIcon = statusConfig[sale.status]?.icon || CheckCircle;
                    return (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedSale(sale)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-luxury font-semibold text-gold-400">
                            #{sale.saleNumber || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-platinum-300">
                          {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2 text-sm text-platinum-300">
                            <User className="h-3.5 w-3.5 text-gold-400 flex-shrink-0" />
                            <span className="truncate">{sale.customer?.fullName || sale.customerEmail || 'Cliente ocasional'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-platinum-300">
                            <Package className="h-3.5 w-3.5 text-platinum-500 flex-shrink-0" />
                            <span>{sale.items.length} {sale.items.length === 1 ? 'artículo' : 'artículos'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gold-400">${sale.total.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border inline-flex items-center gap-1 ${statusConfig[sale.status]?.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[sale.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }} className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales — Mobile Cards */}
        <StaggerGroup className="md:hidden space-y-3">
          {filteredSales.length === 0 ? (
            <div className="luxury-card rounded-xl p-8 text-center">
              <Receipt className="h-12 w-12 text-platinum-600 mx-auto mb-3" />
              <p className="text-platinum-400">No se encontraron ventas</p>
            </div>
          ) : (
            filteredSales.map(sale => {
              const StatusIcon = statusConfig[sale.status]?.icon || CheckCircle;
              return (
                <StaggerItem key={sale.id}>
                  <button onClick={() => setSelectedSale(sale)} className="luxury-card rounded-xl p-4 w-full text-left hover:border-gold-500/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-luxury font-semibold text-gold-400">#{sale.saleNumber || '—'}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border inline-flex items-center gap-1 ${statusConfig[sale.status]?.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[sale.status]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-platinum-400 mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sale.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-platinum-300">
                        <User className="h-3.5 w-3.5 text-gold-400" />
                        <span className="truncate">{sale.customer?.fullName || sale.customerEmail || 'Ocasional'}</span>
                      </div>
                      <span className="text-sm font-semibold text-gold-400">${sale.total.toLocaleString()}</span>
                    </div>
                  </button>
                </StaggerItem>
              );
            })
          )}
        </StaggerGroup>
      </div>

      {/* Sale Detail Modal */}
      <AnimatePresence>
        {selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setSelectedSale(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                    Venta #{selectedSale.saleNumber || '—'}
                  </h2>
                  <p className="text-xs text-platinum-400 mt-0.5">
                    {new Date(selectedSale.date).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* Customer Info */}
                <div className="luxury-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-gold-400" />
                    <h3 className="text-sm font-medium text-platinum-200">Cliente</h3>
                  </div>
                  {selectedSale.customer ? (
                    <div className="space-y-1">
                      <p className="text-sm text-white">{selectedSale.customer.fullName}</p>
                      {selectedSale.customer.phone && <p className="text-xs text-platinum-400">{selectedSale.customer.phone}</p>}
                      {selectedSale.customer.email && <p className="text-xs text-platinum-400">{selectedSale.customer.email}</p>}
                    </div>
                  ) : selectedSale.customerEmail ? (
                    <p className="text-sm text-platinum-300">{selectedSale.customerEmail}</p>
                  ) : (
                    <p className="text-sm text-platinum-500">Cliente ocasional</p>
                  )}

                  {/* Assign customer dropdown */}
                  {customers.length > 0 && !selectedSale.customer && (
                    <div className="mt-3">
                      <label className="block text-xs text-platinum-400 mb-1">Asignar a cliente registrado:</label>
                      <select
                        value=""
                        onChange={e => handleAssignCustomer(selectedSale.id, e.target.value)}
                        className="luxury-input w-full py-2 px-3 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.fullName} — {c.phone || c.email}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="h-4 w-4 text-gold-400" />
                    <h3 className="text-sm font-medium text-platinum-200">Productos</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-platinum-700/20">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{item.product.name}</p>
                          <p className="text-xs text-platinum-400">
                            {item.quantity} x ${item.product.price.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gold-400 whitespace-nowrap">
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-platinum-700/20">
                    <span className="text-sm font-medium text-platinum-200">Total</span>
                    <span className="text-xl font-luxury font-semibold text-gold-400">
                      ${selectedSale.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                {(selectedSale.paymentMethod || selectedSale.notes) && (
                  <div className="luxury-card p-4 rounded-lg space-y-2">
                    {selectedSale.paymentMethod && (
                      <div className="flex items-center gap-2 text-sm text-platinum-300">
                        <CreditCard className="h-4 w-4 text-gold-400" />
                        <span>Método de pago: {selectedSale.paymentMethod}</span>
                      </div>
                    )}
                    {selectedSale.notes && (
                      <div className="flex items-start gap-2 text-sm text-platinum-300">
                        <FileText className="h-4 w-4 text-gold-400 flex-shrink-0 mt-0.5" />
                        <span>{selectedSale.notes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Changer */}
                <div>
                  <label className="block text-sm font-medium text-platinum-300 mb-2">Cambiar estado de la venta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(statusConfig) as SaleStatus[]).map(status => {
                      const cfg = statusConfig[status];
                      const StatusIcon = cfg.icon;
                      const isActive = selectedSale.status === status;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedSale.id, status)}
                          disabled={updating}
                          className={`px-3 py-2.5 text-sm rounded-lg border transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                            isActive ? cfg.color + ' ring-1 ring-gold-500/50' : 'border-platinum-700/30 text-platinum-400 hover:bg-white/5'
                          }`}
                        >
                          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StatusIcon className="h-3.5 w-3.5" />}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
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
