import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Package, DollarSign, ShoppingBag,
  Download, BarChart3, PieChart, Activity, Key, X, AlertTriangle,
  Users, Crown, RefreshCw, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryAlert } from '../services/InventoryService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Swal from 'sweetalert2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const chartTextColor = '#E5E4E2';
const chartGridColor = 'rgba(212, 175, 55, 0.1)';

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartTextColor, font: { family: 'Jost', size: 12 } },
    },
    tooltip: {
      backgroundColor: 'rgba(12, 12, 12, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      borderWidth: 1,
      titleColor: '#D4AF37',
      bodyColor: '#E5E4E2',
      titleFont: { family: 'Cormorant Garamond', size: 16, weight: 600 as const },
      bodyFont: { family: 'Jost', size: 13 },
      padding: 12,
    },
  },
};

export function Dashboard() {
  const {
    products,
    sales,
    cart,
    getAnalytics,
    getInventoryAlerts,
    getCustomerInsights,
    getExecutiveSummary,
    exportProducts,
    exportSales,
    changeCredentials,
  } = useApp();

  const [analytics, setAnalytics] = useState<any>({});
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [customerInsights, setCustomerInsights] = useState<any>({});
  const [executiveSummary, setExecutiveSummary] = useState<any>({});
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [credentialsFormData, setCredentialsFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const refresh = () => {
      setAnalytics(getAnalytics());
      setInventoryAlerts(getInventoryAlerts());
      setCustomerInsights(getCustomerInsights());
      setExecutiveSummary(getExecutiveSummary());
      setLastUpdate(new Date());
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [getAnalytics, getInventoryAlerts, getCustomerInsights, getExecutiveSummary]);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const criticalAlerts = inventoryAlerts.filter(a => a.severity === 'critical').length;
  const highAlerts = inventoryAlerts.filter(a => a.severity === 'high').length;

  const realTimeData = analytics.realTimeMetrics || {};
  const kpis = executiveSummary.kpis || {};
  const trends = executiveSummary.trends || {};

  const salesTrendData = useMemo(() => {
    const last7Days: { label: string; revenue: number; orders: number }[] = [];
    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date.split('T')[0] === dateStr);
      last7Days.push({
        label: dayLabels[date.getDay()],
        revenue: daySales.reduce((sum, s) => sum + s.total, 0),
        orders: daySales.length,
      });
    }
    return last7Days;
  }, [sales]);

  const categoryChartData = {
    labels: analytics.categoryAnalytics?.map((cat: any) => cat.category) || [],
    datasets: [
      {
        label: 'Ingresos por Categoría',
        data: analytics.categoryAnalytics?.map((cat: any) => cat.revenue) || [],
        backgroundColor: [
          '#D4AF37', '#E8C874', '#C0C0C0', '#A8842F', '#E5E4E2', '#8B6F28',
        ],
        borderColor: 'rgba(12, 12, 12, 0.6)',
        borderWidth: 2,
      },
    ],
  };

  const trendChartData = {
    labels: salesTrendData.map(d => d.label),
    datasets: [
      {
        label: 'Ingresos',
        data: salesTrendData.map(d => d.revenue),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#E8C874',
        pointBorderColor: '#D4AF37',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Órdenes',
        data: salesTrendData.map(d => d.orders),
        borderColor: '#C0C0C0',
        backgroundColor: 'rgba(192, 192, 192, 0.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#E2E8F0',
        pointBorderColor: '#C0C0C0',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const topProductsData = {
    labels: analytics.topProducts?.map((p: any) =>
      p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name
    ) || [],
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: analytics.topProducts?.map((p: any) => p.totalSold || 0) || [],
        backgroundColor: 'rgba(212, 175, 55, 0.7)',
        borderColor: '#D4AF37',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialsFormData.newPassword !== credentialsFormData.confirmPassword) {
      Swal.fire({ title: 'Error', text: 'Las contraseñas no coinciden', icon: 'error' });
      return;
    }
    const success = changeCredentials(
      credentialsFormData.currentPassword,
      credentialsFormData.newUsername,
      credentialsFormData.newPassword
    );
    if (!success) {
      Swal.fire({ title: 'Error', text: 'Contraseña actual incorrecta', icon: 'error' });
    } else {
      setCredentialsFormData({
        currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '',
      });
      setShowCredentialsForm(false);
    }
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return 'bg-red-500/15 text-red-300 border-red-500/30';
    if (stock <= 5) return 'bg-gold-500/15 text-gold-300 border-gold-500/30';
    return 'bg-green-500/15 text-green-300 border-green-500/30';
  };

  const stats = [
    { title: 'Productos', value: totalProducts, icon: Package, change: `${realTimeData.productsAdded || 0} nuevos` },
    { title: 'Stock Total', value: totalStock, icon: ShoppingBag, change: `${outOfStock} agotados` },
    { title: 'Valor Inventario', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, change: 'Valor actual' },
    { title: 'Stock Bajo', value: lowStockProducts, icon: AlertTriangle, change: `${criticalAlerts} críticas` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-charcoal-950 via-charcoal-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="font-luxury text-2xl sm:text-3xl md:text-4xl font-semibold text-gradient-gold tracking-wide">
              Dashboard Analítico
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <RefreshCw className="h-3.5 w-3.5 text-gold-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-platinum-400 text-xs font-light">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowReportsModal(true)}
              className="luxury-button px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reportes</span>
            </button>
            <button
              onClick={() => setShowCredentialsForm(true)}
              className="px-4 py-2.5 rounded-lg border border-platinum-600/40 text-platinum-200 hover:bg-white/5 transition-colors flex items-center gap-2 text-xs"
            >
              <Key className="h-4 w-4" />
              <span>Credenciales</span>
            </button>
            <button
              onClick={() => exportProducts('excel')}
              className="px-4 py-2.5 rounded-lg border border-green-500/30 text-green-300 hover:bg-green-500/10 transition-colors flex items-center gap-2 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportProducts('pdf')}
              className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-xs"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Real-time Metrics Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="luxury-card p-4 sm:p-5 rounded-xl mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-gold-400 animate-pulse" />
            <h2 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
              Métricas en Tiempo Real
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <RTMetric label="Ventas Totales" value={realTimeData.totalSales || 0} />
            <RTMetric label="Ingresos Hoy" value={`$${(realTimeData.todayRevenue || 0).toLocaleString()}`} />
            <RTMetric label="Ticket Promedio" value={`$${(realTimeData.averageOrderValue || 0).toLocaleString()}`} />
            <RTMetric label="Items en Carritos" value={realTimeData.activeCartItems || 0} />
            <RTMetric label="Valor en Carritos" value={`$${(realTimeData.totalCartValue || 0).toLocaleString()}`} />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + index * 0.08 }}
              className="luxury-card p-4 sm:p-5 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-platinum-400 uppercase tracking-wider truncate">{stat.title}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-luxury font-semibold text-white mt-1 truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-platinum-500 mt-1 font-light truncate">{stat.change}</p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-gold-500/10 border border-gold-500/30 flex-shrink-0">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gold-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Executive Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="luxury-card p-4 sm:p-6 rounded-xl mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Crown className="h-5 w-5 text-gold-400" />
            <h2 className="font-luxury text-lg sm:text-xl font-semibold text-gradient-gold tracking-wide">
              Resumen Ejecutivo
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <ExecMetric label="Ingresos Totales" value={`$${(kpis.totalRevenue || 0).toLocaleString()}`} />
            <ExecMetric label="Órdenes" value={kpis.totalOrders || 0} />
            <ExecMetric label="Clientes" value={kpis.totalCustomers || 0} />
            <ExecMetric
              label="Crecimiento"
              value={`${(trends.growthRate || 0).toFixed(1)}%`}
              trend={trends.growthRate >= 0 ? 'up' : 'down'}
            />
          </div>
        </motion.div>

        {/* Inventory Alerts */}
        {inventoryAlerts.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="luxury-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-gold-400" />
              <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
                Alertas de Inventario
              </h3>
              <span className="ml-auto text-xs text-platinum-400">
                {criticalAlerts} críticas · {highAlerts} altas
              </span>
            </div>
            <div className="space-y-2.5">
              {inventoryAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-2 ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500'
                      : alert.severity === 'high'
                      ? 'bg-gold-500/10 border-gold-500'
                      : 'bg-silver-500/10 border-silver-500'
                  }`}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{alert.productName}</p>
                      <p className="text-xs text-platinum-400 font-light">{alert.message}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border shrink-0 ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : alert.severity === 'high'
                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                        : 'bg-silver-500/20 text-silver-300 border-silver-500/40'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Customer Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="luxury-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-gold-400" />
            <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
              Insights de Clientes
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <ExecMetric label="Total Clientes" value={customerInsights.totalCustomers || 0} />
            <ExecMetric label="Nuevos Este Mes" value={customerInsights.newCustomersThisMonth || 0} />
            <ExecMetric label="Clientes VIP" value={customerInsights.vipCustomers || 0} />
            <ExecMetric
              label="Retención"
              value={`${(customerInsights.retentionRate || 0).toFixed(1)}%`}
            />
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="luxury-card p-4 sm:p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
                Ingresos por Categoría
              </h3>
              <PieChart className="h-5 w-5 text-platinum-400" />
            </div>
            <div className="h-64">
              {analytics.categoryAnalytics?.length > 0 ? (
                <Pie data={categoryChartData} options={baseChartOptions} />
              ) : (
                <EmptyChart />
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="luxury-card p-4 sm:p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
                Tendencia de Ventas (7 días)
              </h3>
              <BarChart3 className="h-5 w-5 text-platinum-400" />
            </div>
            <div className="h-64">
              <Line
                data={trendChartData}
                options={{
                  ...baseChartOptions,
                  scales: {
                    x: {
                      grid: { color: chartGridColor },
                      ticks: { color: chartTextColor, font: { family: 'Jost' } },
                    },
                    y: {
                      grid: { color: chartGridColor },
                      ticks: { color: chartTextColor, font: { family: 'Jost' } },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Top Products */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="luxury-card p-4 sm:p-6 rounded-xl mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
              Productos Más Vendidos
            </h3>
            <TrendingUp className="h-5 w-5 text-platinum-400" />
          </div>
          <div className="h-64">
            {analytics.topProducts?.some((p: any) => p.totalSold > 0) ? (
              <Bar
                data={topProductsData}
                options={{
                  ...baseChartOptions,
                  indexAxis: 'y' as const,
                  scales: {
                    x: {
                      grid: { color: chartGridColor },
                      ticks: { color: chartTextColor, font: { family: 'Jost' } },
                      beginAtZero: true,
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: chartTextColor, font: { family: 'Jost' } },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart />
            )}
          </div>
        </motion.div>

        {/* Recent Sales */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="luxury-card rounded-xl overflow-hidden mb-6 sm:mb-8"
        >
          <div className="p-4 sm:p-6 border-b border-platinum-700/20">
            <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
              Ventas Recientes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider hidden sm:table-cell">Items</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider hidden md:table-cell">Cliente</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-700/15">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <ShoppingBag className="h-10 w-10 text-platinum-600 mx-auto mb-2" />
                      <p className="text-platinum-400 text-sm">No hay ventas registradas</p>
                    </td>
                  </tr>
                ) : (
                  sales.slice(-10).reverse().map(sale => (
                    <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-sm text-platinum-300 whitespace-nowrap">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-platinum-300 hidden sm:table-cell">
                        {sale.items.reduce((sum, i) => sum + i.quantity, 0)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm text-platinum-300 hidden md:table-cell">
                        {sale.customerEmail || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-gold-400 whitespace-nowrap">
                        ${sale.total.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg border bg-green-500/15 text-green-300 border-green-500/30">
                          {sale.status === 'completed' ? 'Completada' : sale.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Low Stock Products */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="luxury-card rounded-xl overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-platinum-700/20">
            <h3 className="font-luxury text-lg font-semibold text-gradient-gold tracking-wide">
              Productos con Stock Bajo
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Producto</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider hidden lg:table-cell">Categoría</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Precio</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gold-400 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-platinum-700/15">
                {products.filter(p => p.stock <= 5).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Package className="h-10 w-10 text-platinum-600 mx-auto mb-2" />
                      <p className="text-platinum-400 text-sm">Todos los productos tienen stock suficiente</p>
                    </td>
                  </tr>
                ) : (
                  products.filter(p => p.stock <= 5).slice(0, 10).map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-10 w-10 object-cover rounded-lg border border-platinum-700/30 flex-shrink-0" />
                          <span className="text-sm text-white truncate">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 hidden lg:table-cell">
                        <span className="px-2.5 py-1 text-xs font-medium bg-gold-500/10 text-gold-300 rounded-lg border border-gold-500/20">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-gold-400 whitespace-nowrap">
                        ${product.price.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${stockBadge(product.stock)}`}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Credentials Form Modal */}
      {showCredentialsForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="font-luxury text-xl font-semibold text-gradient-gold tracking-wide">
                Cambiar Credenciales
              </h2>
              <button
                onClick={() => setShowCredentialsForm(false)}
                className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCredentialsSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Contraseña Actual</label>
                <input
                  type="password"
                  value={credentialsFormData.currentPassword}
                  onChange={e => setCredentialsFormData({ ...credentialsFormData, currentPassword: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Nuevo Usuario</label>
                <input
                  type="text"
                  value={credentialsFormData.newUsername}
                  onChange={e => setCredentialsFormData({ ...credentialsFormData, newUsername: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Nueva Contraseña</label>
                <input
                  type="password"
                  value={credentialsFormData.newPassword}
                  onChange={e => setCredentialsFormData({ ...credentialsFormData, newPassword: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-platinum-300 mb-1.5">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={credentialsFormData.confirmPassword}
                  onChange={e => setCredentialsFormData({ ...credentialsFormData, confirmPassword: e.target.value })}
                  className="luxury-input w-full py-2.5 px-3 rounded-lg"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredentialsForm(false)}
                  className="w-full sm:flex-1 px-4 py-2.5 border border-platinum-600/50 text-platinum-200 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:flex-1 luxury-button px-4 py-2.5 rounded-lg">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-charcoal-900 border border-platinum-700/30 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-charcoal-900 border-b border-platinum-700/30 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="font-luxury text-xl sm:text-2xl font-semibold text-gradient-gold tracking-wide">
                Reportes Avanzados
              </h2>
              <button
                onClick={() => setShowReportsModal(false)}
                className="p-2 text-platinum-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <ReportCard
                  icon={Download}
                  iconColor="text-green-400"
                  title="Reporte de Productos"
                  subtitle="Excel completo"
                  onClick={() => exportProducts('excel')}
                />
                <ReportCard
                  icon={Download}
                  iconColor="text-gold-400"
                  title="Reporte de Ventas"
                  subtitle="Análisis completo"
                  onClick={() => exportSales('excel')}
                />
                <ReportCard
                  icon={Download}
                  iconColor="text-red-400"
                  title="Resumen Ejecutivo"
                  subtitle="PDF ejecutivo"
                  onClick={() => exportProducts('pdf')}
                />
              </div>

              <div className="luxury-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-gold-400" />
                  <h3 className="font-luxury text-lg font-semibold text-gradient-gold">KPIs Principales</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <ExecMetric label="Ingresos Totales" value={`$${(kpis.totalRevenue || 0).toLocaleString()}`} />
                  <ExecMetric label="Ticket Promedio" value={`$${(kpis.averageOrderValue || 0).toLocaleString()}`} />
                  <ExecMetric label="Valor Inventario" value={`$${(kpis.inventoryValue || 0).toLocaleString()}`} />
                  <ExecMetric
                    label="Crecimiento"
                    value={`${(trends.growthRate || 0).toFixed(1)}%`}
                    trend={trends.growthRate >= 0 ? 'up' : 'down'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RTMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg sm:text-xl md:text-2xl font-luxury font-semibold text-gold-400 truncate">
        {value}
      </p>
      <p className="text-xs text-platinum-400 mt-1 font-light">{label}</p>
    </div>
  );
}

function ExecMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
        <p className="text-xl sm:text-2xl font-luxury font-semibold text-white truncate">{value}</p>
      </div>
      <p className="text-xs text-platinum-400 mt-1 font-light">{label}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-platinum-500">
      <BarChart3 className="h-10 w-10 mb-2 opacity-40" />
      <p className="text-sm font-light">Sin datos suficientes</p>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="luxury-card p-4 rounded-xl hover:border-gold-500/40 transition-all duration-300 text-left"
    >
      <div className="text-center">
        <Icon className={`h-8 w-8 ${iconColor} mx-auto mb-2`} />
        <h3 className="font-medium text-white text-sm">{title}</h3>
        <p className="text-xs text-platinum-400 font-light mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
