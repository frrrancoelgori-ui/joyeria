import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Download,
  Upload,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  Edit,
  Trash2,
  Settings,
  Key
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types/Product';
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
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export function Dashboard() {
  const { 
    products, 
    sales, 
    getAnalytics, 
    getInventoryAlerts,
    getCustomerInsights,
    generateReports,
    getExecutiveSummary,
    exportProducts, 
    exportSales, 
    importProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    changeCredentials
  } = useApp();
  const [analytics, setAnalytics] = useState<any>({});
  const [realTimeData, setRealTimeData] = useState<any>({});
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [customerInsights, setCustomerInsights] = useState<any>({});
  const [executiveSummary, setExecutiveSummary] = useState<any>({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
    stock: ''
  });
  const [credentialsFormData, setCredentialsFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const updateAnalytics = () => {
      const data = getAnalytics();
      setAnalytics(data);
      setRealTimeData(data.realTimeMetrics);
      setInventoryAlerts(getInventoryAlerts());
      setCustomerInsights(getCustomerInsights());
      setExecutiveSummary(getExecutiveSummary());
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 3000);
    return () => clearInterval(interval);
  }, [getAnalytics, getInventoryAlerts, getCustomerInsights, getExecutiveSummary]);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importProducts(file);
      event.target.value = '';
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      ...productFormData,
      price: parseFloat(productFormData.price),
      stock: parseInt(productFormData.stock)
    };

    if (editingProduct) {
      updateProduct({ ...productData, id: editingProduct.id });
    } else {
      addProduct(productData);
    }

    resetProductForm();
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      category: '',
      stock: ''
    });
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category,
      stock: product.stock.toString()
    });
    setShowProductForm(true);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credentialsFormData.newPassword !== credentialsFormData.confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas no coinciden',
        icon: 'error'
      });
      return;
    }

    const success = changeCredentials(
      credentialsFormData.currentPassword,
      credentialsFormData.newUsername,
      credentialsFormData.newPassword
    );

    if (!success) {
      Swal.fire({
        title: 'Error',
        text: 'Contraseña actual incorrecta',
        icon: 'error'
      });
    } else {
      setCredentialsFormData({
        currentPassword: '',
        newUsername: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowCredentialsForm(false);
    }
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= 5).length;

  const criticalAlerts = inventoryAlerts.filter(alert => alert.severity === 'critical').length;
  const highAlerts = inventoryAlerts.filter(alert => alert.severity === 'high').length;

  const categoryChartData = {
    labels: analytics.categoryAnalytics?.map((cat: any) => cat.category) || [],
    datasets: [
      {
        label: 'Ingresos por Categoría',
        data: analytics.categoryAnalytics?.map((cat: any) => cat.revenue) || [],
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#F97316'
        ],
        borderWidth: 0,
      },
    ],
  };

  const salesTrendData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Ventas',
        data: [12, 19, 8, 15, 22, 18, 25],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Items en Carrito',
        data: [5, 8, 12, 7, 15, 20, realTimeData.activeCartItems || 0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const topProductsData = {
    labels: analytics.topProducts?.map((p: any) => p.name.substring(0, 15)) || [],
    datasets: [
      {
        label: 'Productos Más Vendidos',
        data: analytics.topProducts?.map((p: any) => p.totalSold || 0) || [],
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            Dashboard Analítico
          </motion.h1>
          
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReportsModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reportes Avanzados</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProductForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCredentialsForm(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>Cambiar Credenciales</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportProducts('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Excel</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportProducts('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar PDF</span>
            </motion.button>
            
            <motion.label
              whileHover={{ scale: 1.05 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Importar</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
            </motion.label>
          </div>
        </div>

        {/* Real-time Metrics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Métricas en Tiempo Real</h2>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Actualizado: {new Date(realTimeData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{realTimeData.totalSales || 0}</p>
                <p className="text-sm opacity-80">Ventas Totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${(realTimeData.todayRevenue || 0).toLocaleString()}</p>
                <p className="text-sm opacity-80">Ingresos Hoy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${(realTimeData.averageOrderValue || 0).toLocaleString()}</p>
                <p className="text-sm opacity-80">Ticket Promedio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{realTimeData.activeCartItems || 0}</p>
                <p className="text-sm opacity-80">Items en Carritos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">${(realTimeData.totalCartValue || 0).toLocaleString()}</p>
                <p className="text-sm opacity-80">Valor en Carritos</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {[
            {
              title: 'Total Productos',
              value: totalProducts,
              icon: Package,
              color: 'blue',
              change: '+12%'
            },
            {
              title: 'Stock Total',
              value: totalStock,
              icon: ShoppingBag,
              color: 'green',
              change: '+8%'
            },
            {
              title: 'Valor Inventario',
              value: `$${totalValue.toLocaleString()}`,
              icon: DollarSign,
              color: 'orange',
              change: '+15%'
            },
            {
              title: 'Stock Bajo',
              value: lowStockProducts,
              icon: TrendingUp,
              color: 'red',
              change: '-5%'
            },
            {
              title: 'Actividad Productos',
              value: `+${realTimeData.productsAdded || 0} -${realTimeData.productsDeleted || 0}`,
              icon: Activity,
              color: 'purple',
              change: `${realTimeData.productsUpdated || 0} editados`
            },
            {
              title: 'Alertas Críticas',
              value: criticalAlerts + highAlerts,
              icon: TrendingUp,
              color: criticalAlerts > 0 ? 'red' : 'green',
              change: `${criticalAlerts} críticas`
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} vs mes anterior
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
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
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Resumen Ejecutivo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${(executiveSummary.kpis?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm opacity-80">Ingresos Totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{executiveSummary.kpis?.totalOrders || 0}</p>
              <p className="text-sm opacity-80">Órdenes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{executiveSummary.kpis?.totalCustomers || 0}</p>
              <p className="text-sm opacity-80">Clientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{executiveSummary.trends?.growthRate?.toFixed(1) || 0}%</p>
              <p className="text-sm opacity-80">Crecimiento</p>
            </div>
          </div>
        </motion.div>

        {/* Inventory Alerts */}
        {inventoryAlerts.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Inventario</h3>
            <div className="space-y-3">
              {inventoryAlerts.slice(0, 5).map((alert, index) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{alert.productName}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-600'
                        : alert.severity === 'high'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-yellow-100 text-yellow-600'
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
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de Clientes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{customerInsights.totalCustomers || 0}</p>
              <p className="text-sm text-gray-600">Total Clientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{customerInsights.newCustomersThisMonth || 0}</p>
              <p className="text-sm text-gray-600">Nuevos Este Mes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{customerInsights.vipCustomers || 0}</p>
              <p className="text-sm text-gray-600">Clientes VIP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{customerInsights.retentionRate?.toFixed(1) || 0}%</p>
              <p className="text-sm text-gray-600">Retención</p>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ingresos por Categoría</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Pie data={categoryChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ventas vs Carritos</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Line data={salesTrendData} options={{ maintainAspectRatio: false }} />
            </div>
          </motion.div>
        </div>

        {/* Top Products */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Bar data={topProductsData} options={{ maintainAspectRatio: false }} />
          </div>
        </motion.div>

        {/* Products CRUD Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Productos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-lg">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-600' 
                          : product.stock > 0 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Product Form Modal */}
        {showProductForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={productFormData.stock}
                      onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={productFormData.image}
                    onChange={(e) => setProductFormData({...productFormData, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Credentials Form Modal */}
        {showCredentialsForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Cambiar Credenciales
              </h2>
              
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={credentialsFormData.currentPassword}
                    onChange={(e) => setCredentialsFormData({...credentialsFormData, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nuevo Usuario
                  </label>
                  <input
                    type="text"
                    value={credentialsFormData.newUsername}
                    onChange={(e) => setCredentialsFormData({...credentialsFormData, newUsername: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={credentialsFormData.newPassword}
                    onChange={(e) => setCredentialsFormData({...credentialsFormData, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={credentialsFormData.confirmPassword}
                    onChange={(e) => setCredentialsFormData({...credentialsFormData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCredentialsForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Advanced Reports Modal */}
        {showReportsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reportes Avanzados</h2>
                <button
                  onClick={() => setShowReportsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <button
                  onClick={() => exportProducts('excel')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-medium">Reporte de Productos</h3>
                    <p className="text-sm text-gray-600">Excel completo</p>
                  </div>
                </button>
                
                <button
                  onClick={() => exportSales('excel')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-medium">Reporte de Ventas</h3>
                    <p className="text-sm text-gray-600">Análisis completo</p>
                  </div>
                </button>
                
                <button
                  onClick={() => exportProducts('pdf')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <Download className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <h3 className="font-medium">Resumen Ejecutivo</h3>
                    <p className="text-sm text-gray-600">PDF ejecutivo</p>
                  </div>
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">KPIs Principales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ingresos Totales</p>
                    <p className="font-bold">${(executiveSummary.kpis?.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ticket Promedio</p>
                    <p className="font-bold">${(executiveSummary.kpis?.averageOrderValue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor Inventario</p>
                    <p className="font-bold">${(executiveSummary.kpis?.inventoryValue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Crecimiento</p>
                    <p className="font-bold text-green-600">{(executiveSummary.trends?.growthRate || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}