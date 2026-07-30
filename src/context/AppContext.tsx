import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, CartItem, ProductStatus } from '../types/Product';
import { Sale, SaleStatus } from '../types/Sale';
import { Branch } from '../types/Branch';
import { Customer, CustomerInput } from '../types/Customer';
import { AnalyticsService } from '../services/AnalyticsService';
import { ExportService } from '../services/ExportService';
import { InventoryService } from '../services/InventoryService';
import { CustomerService } from '../services/CustomerService';
import { ReportService } from '../services/ReportService';
import { BranchService } from '../services/BranchService';
import { supabase, callAdminFunction } from '../services/supabaseClient';
import Swal from 'sweetalert2';

interface StoreSettings {
  storeName: string;
  whatsappNumber: string;
  logoUrl: string | null;
}

interface AppContextType {
  products: Product[];
  branches: Branch[];
  selectedBranch: Branch | null;
  cart: CartItem[];
  sales: Sale[];
  customers: Customer[];
  isAuthenticated: boolean;
  loading: boolean;
  storeSettings: StoreSettings;
  loginWithCredentials: (username: string, password: string) => Promise<boolean>;
  changeCredentials: (currentPassword: string, newUsername: string, newPassword: string) => Promise<boolean>;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<boolean>;
  logout: () => void;
  selectBranch: (branch: Branch) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addProducts: (products: Product[]) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCustomer: (customer: CustomerInput) => Promise<boolean>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<void>;
  updateSale: (saleId: string, updates: { status?: SaleStatus; paymentStatus?: string; paymentMethod?: string; notes?: string; customerId?: string }) => Promise<boolean>;
  recordSale: (params: { items: CartItem[]; total: number; customerId?: string; customerEmail?: string; branchId?: string; paymentMethod?: string; notes?: string; saleStatus?: SaleStatus }) => Promise<boolean>;
  transferStock: (productId: string, fromBranch: string, toBranch: string, quantity: number) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  completePurchase: (customerEmail?: string) => Promise<void>;
  exportProducts: (format: 'excel' | 'pdf') => void;
  exportSales: (format: 'excel' | 'pdf') => void;
  importProducts: (file: File) => Promise<void>;
  getAnalytics: () => any;
  getInventoryAlerts: () => any[];
  getCustomerInsights: () => any;
  generateReports: () => any;
  getExecutiveSummary: () => any;
  getBranchAnalytics: (branchId?: string) => any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapDbProduct(p: any, branchName: string): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image: p.image_url,
    additionalImages: p.additional_images || [],
    category: p.category,
    stock: p.stock,
    material: p.material,
    weight: Number(p.weight),
    size: p.size,
    gemstone: p.gemstone || undefined,
    certification: p.certification || undefined,
    branchId: p.branch_id,
    branchName,
    isCustomizable: p.is_customizable,
    craftingTime: p.crafting_time || undefined,
    status: (p.status || 'available') as ProductStatus,
  };
}

function mapDbBranch(b: any): Branch {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    email: b.email,
    manager: b.manager,
    city: b.city,
    state: b.state,
    zipCode: b.zip_code,
    openingHours: b.opening_hours,
    specialties: b.specialties,
    isActive: b.is_active,
    coordinates: b.latitude && b.longitude ? { lat: Number(b.latitude), lng: Number(b.longitude) } : undefined,
  };
}

function mapDbSale(s: any, items: any[]): Sale {
  return {
    id: s.id,
    saleNumber: s.sale_number,
    date: s.created_at,
    items: items.map((it: any) => ({
      product: {
        id: it.product_id,
        name: it.product_name,
        description: '',
        price: Number(it.product_price),
        image: '',
        category: '',
        stock: 0,
        material: '',
        weight: 0,
        size: '',
        branchId: s.branch_id || '',
        branchName: '',
        isCustomizable: false,
        status: 'available' as ProductStatus,
      },
      quantity: it.quantity,
    })),
    total: Number(s.total_amount),
    customerEmail: s.customer_email || undefined,
    customerId: s.customer_id || undefined,
    status: (s.status || (s.payment_status === 'completed' ? 'completed' : s.payment_status) || 'completed') as SaleStatus,
    paymentStatus: s.payment_status,
    paymentMethod: s.payment_method,
    notes: s.notes,
    branchId: s.branch_id || undefined,
  };
}

function mapDbCustomer(c: any): Customer {
  return {
    id: c.id,
    fullName: c.full_name,
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    notes: c.notes || '',
    totalPurchases: c.total_purchases || 0,
    totalSpent: Number(c.total_spent) || 0,
    createdAt: c.created_at,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'Diamante Real',
    whatsappNumber: '56941228089',
    logoUrl: null,
  });

  const analyticsService = AnalyticsService.getInstance();
  const exportService = ExportService.getInstance();
  const inventoryService = InventoryService.getInstance();
  const customerService = CustomerService.getInstance();
  const reportService = ReportService.getInstance();
  const branchService = BranchService.getInstance();

  // ---- Load data from Supabase ----
  const loadBranches = useCallback(async (): Promise<Branch[]> => {
    const { data, error } = await supabase.from('branches').select('*').eq('is_active', true).order('name');
    if (error) {
      console.error('Error loading branches:', error);
      return [];
    }
    return (data || []).map(mapDbBranch);
  }, []);

  const loadProducts = useCallback(async (branchList: Branch[]): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
    if (error) {
      console.error('Error loading products:', error);
      return [];
    }
    const branchMap = new Map(branchList.map(b => [b.id, b.name]));
    return (data || []).map(p => mapDbProduct(p, branchMap.get(p.branch_id) || ''));
  }, []);

  const loadSales = useCallback(async (): Promise<Sale[]> => {
    const { data: saleRows, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      console.error('Error loading sales:', error);
      return [];
    }
    return (saleRows || []).map(s => mapDbSale(s, s.sale_items || []));
  }, []);

  const loadCustomers = useCallback(async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading customers:', error);
      return [];
    }
    return (data || []).map(mapDbCustomer);
  }, []);

  const loadSettings = useCallback(async (): Promise<StoreSettings> => {
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      return { storeName: 'Diamante Real', whatsappNumber: '56941228089', logoUrl: null };
    }
    return {
      storeName: data.store_name,
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
    };
  }, []);

  useEffect(() => {
    (async () => {
      const bl = await loadBranches();
      setBranches(bl);
      const pl = await loadProducts(bl);
      setProducts(pl);
      const sl = await loadSales();
      setSales(sl);
      analyticsService.setSalesData(sl);
      sl.forEach(s => customerService.processSale(s));
      const cl = await loadCustomers();
      setCustomers(cl);
      const st = await loadSettings();
      setStoreSettings(st);
      setLoading(false);
    })();
  }, [loadBranches, loadProducts, loadSales, loadCustomers, loadSettings, analyticsService, customerService]);

  // ---- Auth ----
  const loginWithCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire({
          title: 'Acceso denegado',
          text: data.error || 'Credenciales incorrectas',
          icon: 'error',
          confirmButtonColor: '#D4AF37',
        });
        return false;
      }
      setIsAuthenticated(true);
      Swal.fire({
        title: '¡Bienvenido!',
        text: 'Acceso concedido al panel de administración',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return true;
    } catch (err) {
      Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        icon: 'error',
        confirmButtonColor: '#D4AF37',
      });
      return false;
    }
  }, []);

  const changeCredentials = useCallback(async (
    currentPassword: string, newUsername: string, newPassword: string
  ): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/change-credentials', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire({ title: 'Error', text: data.error || 'No se actualizaron las credenciales', icon: 'error' });
        return false;
      }
      Swal.fire({
        title: '¡Credenciales actualizadas!',
        text: 'Las nuevas credenciales han sido guardadas de forma segura',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      return true;
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo conectar con el servidor', icon: 'error' });
      return false;
    }
  }, []);

  const updateStoreSettings = useCallback(async (settings: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStoreSettings(prev => ({ ...prev, ...data.settings }));
      Swal.fire({
        title: '¡Configuración guardada!',
        text: 'Los cambios se aplicaron en toda la tienda',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      return true;
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message || 'No se guardó la configuración', icon: 'error' });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    supabase.auth.signOut();
  }, []);

  const selectBranch = useCallback((branch: Branch) => setSelectedBranch(branch), []);

  // ---- Branch CRUD ----
  const addBranch = useCallback(async (branchData: Omit<Branch, 'id'>) => {
    try {
      const res = await callAdminFunction('/admin-api/branch', {
        method: 'POST',
        body: JSON.stringify(branchData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBranches(prev => [...prev, data.branch]);
      Swal.fire({ title: '¡Sucursal agregada!', text: `${branchData.name} ha sido agregada`, icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message || 'No se pudo agregar la sucursal', icon: 'error' });
    }
  }, []);

  const updateBranch = useCallback(async (updatedBranch: Branch) => {
    try {
      const res = await callAdminFunction('/admin-api/branch', {
        method: 'PUT',
        body: JSON.stringify(updatedBranch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBranches(prev => prev.map(b => b.id === updatedBranch.id ? data.branch : b));
      setProducts(prev => prev.map(p => p.branchId === updatedBranch.id ? { ...p, branchName: data.branch.name } : p));
      Swal.fire({ title: '¡Sucursal actualizada!', text: 'Los cambios han sido guardados', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, []);

  const deleteBranch = useCallback(async (id: string) => {
    const branchProducts = products.filter(p => p.branchId === id);
    if (branchProducts.length > 0) {
      Swal.fire({ title: 'No se puede eliminar', text: `Esta sucursal tiene ${branchProducts.length} productos en inventario`, icon: 'warning' });
      return;
    }
    const result = await Swal.fire({
      title: '¿Eliminar sucursal?', text: 'Esta acción no se puede deshacer', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await callAdminFunction(`/admin-api/branch?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBranches(prev => prev.filter(b => b.id !== id));
      Swal.fire({ title: '¡Eliminada!', text: 'La sucursal ha sido eliminada', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, [products]);

  // ---- Product CRUD ----
  const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await callAdminFunction('/admin-api/product', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => [...prev, data.product]);
      Swal.fire({ title: '¡Producto agregado!', text: `${productData.name} ha sido agregado al catálogo`, icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, []);

  const addProducts = useCallback(async (newProducts: Product[]) => {
    for (const p of newProducts) {
      try {
        const res = await callAdminFunction('/admin-api/product', {
          method: 'POST',
          body: JSON.stringify({
            name: p.name, description: p.description, price: p.price, image: p.image,
            category: p.category, stock: p.stock, material: p.material, weight: p.weight,
            size: p.size, gemstone: p.gemstone, certification: p.certification,
            branchId: p.branchId, isCustomizable: p.isCustomizable, craftingTime: p.craftingTime,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setProducts(prev => [...prev, data.product]);
          analyticsService.trackProductAdded(data.product);
        }
      } catch (err) {
        console.error('Error importing product:', err);
      }
    }
    Swal.fire({ title: '¡Productos importados!', text: `${newProducts.length} productos han sido procesados`, icon: 'success', timer: 2000, showConfirmButton: false });
  }, [analyticsService]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    try {
      const res = await callAdminFunction('/admin-api/product', {
        method: 'PUT',
        body: JSON.stringify(updatedProduct),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? data.product : p));
      analyticsService.trackProductUpdated(data.product);
      Swal.fire({ title: '¡Producto actualizado!', text: 'Los cambios han sido guardados', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, [analyticsService]);

  const deleteProduct = useCallback(async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?', text: 'Esta acción no se puede deshacer', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await callAdminFunction(`/admin-api/product?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(item => item.product.id !== id));
      Swal.fire({ title: '¡Eliminado!', text: 'El producto ha sido eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, []);

  const transferStock = useCallback(async (productId: string, fromBranch: string, toBranch: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.branchId !== fromBranch) {
      Swal.fire({ title: 'Error', text: 'Producto no encontrado en la sucursal origen', icon: 'error' });
      return;
    }
    if (product.stock < quantity) {
      Swal.fire({ title: 'Stock insuficiente', text: `Solo hay ${product.stock} unidades disponibles`, icon: 'warning' });
      return;
    }
    const existingInDestination = products.find(p => p.name === product.name && p.branchId === toBranch);
    const destinationBranch = branches.find(b => b.id === toBranch);
    if (existingInDestination) {
      const updated = { ...existingInDestination, stock: existingInDestination.stock + quantity };
      await updateProduct(updated);
      const updatedSource = { ...product, stock: product.stock - quantity };
      await updateProduct(updatedSource);
    } else {
      const newProduct: Product = {
        ...product,
        id: `${productId}_${toBranch}_${Date.now()}`,
        stock: quantity,
        branchId: toBranch,
        branchName: destinationBranch?.name || 'Sucursal',
      };
      const { id, ...productData } = newProduct;
      await addProduct(productData);
      const updatedSource = { ...product, stock: product.stock - quantity };
      await updateProduct(updatedSource);
    }
    Swal.fire({ title: '¡Transferencia exitosa!', text: `${quantity} unidades transferidas`, icon: 'success', timer: 2000, showConfirmButton: false });
  }, [products, branches, updateProduct, addProduct]);

  // ---- Customer CRUD ----
  const addCustomer = useCallback(async (customerData: CustomerInput): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/customer', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(prev => [data.customer, ...prev]);
      Swal.fire({ title: '¡Cliente agregado!', text: `${customerData.fullName} ha sido registrado`, icon: 'success', timer: 2000, showConfirmButton: false });
      return true;
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
      return false;
    }
  }, []);

  const updateCustomer = useCallback(async (updatedCustomer: Customer): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/customer', {
        method: 'PUT',
        body: JSON.stringify(updatedCustomer),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? data.customer : c));
      Swal.fire({ title: '¡Cliente actualizado!', text: 'Los cambios han sido guardados', icon: 'success', timer: 1500, showConfirmButton: false });
      return true;
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
      return false;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?', text: 'Esta acción no se puede deshacer', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await callAdminFunction(`/admin-api/customer?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(prev => prev.filter(c => c.id !== id));
      Swal.fire({ title: '¡Eliminado!', text: 'El cliente ha sido eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
    }
  }, []);

  // ---- Sale management ----
  const updateSale = useCallback(async (saleId: string, updates: { status?: SaleStatus; paymentStatus?: string; paymentMethod?: string; notes?: string; customerId?: string }): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/sales', {
        method: 'PUT',
        body: JSON.stringify({ id: saleId, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...updates } : s));
      Swal.fire({ title: '¡Venta actualizada!', text: 'Los cambios han sido guardados', icon: 'success', timer: 1500, showConfirmButton: false });
      return true;
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
      return false;
    }
  }, []);

  const recordSale = useCallback(async (params: { items: CartItem[]; total: number; customerId?: string; customerEmail?: string; branchId?: string; paymentMethod?: string; notes?: string; saleStatus?: SaleStatus }): Promise<boolean> => {
    try {
      const res = await callAdminFunction('/admin-api/sale', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const sale: Sale = {
        id: data.saleId,
        saleNumber: data.saleNumber,
        date: new Date().toISOString(),
        items: [...params.items],
        total: params.total,
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        status: params.saleStatus || 'completed',
        paymentMethod: params.paymentMethod,
        notes: params.notes,
        branchId: params.branchId,
      };
      setSales(prev => [sale, ...prev]);
      analyticsService.addSale(sale);
      customerService.processSale(sale);
      // Decrement stock locally
      setProducts(prev => prev.map(product => {
        const cartItem = params.items.find(item => item.product.id === product.id);
        if (cartItem) {
          const newStock = Math.max(0, product.stock - cartItem.quantity);
          return { ...product, stock: newStock, status: newStock === 0 ? 'sold' : product.status };
        }
        return product;
      }));
      // Reload customers to update stats
      const cl = await loadCustomers();
      setCustomers(cl);
      Swal.fire({ title: '¡Venta registrada!', text: `N° ${data.saleNumber || ''} — Total: ${params.total.toLocaleString()}`, icon: 'success', timer: 3000, showConfirmButton: false });
      return true;
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message || 'No se pudo registrar la venta', icon: 'error' });
      return false;
    }
  }, [loadCustomers]);

  // ---- Cart ----
  const addToCart = useCallback((product: Product) => {
    if (product.stock === 0) {
      Swal.fire({ title: 'Producto agotado', text: 'Este producto no está disponible', icon: 'error', timer: 2000, showConfirmButton: false });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const updated = prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        analyticsService.trackCartUpdate(updated);
        return updated;
      }
      const newCart = [...prev, { product, quantity: 1 }];
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
    Swal.fire({ title: '¡Agregado al carrito!', text: `${product.name} ha sido agregado`, icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  }, [analyticsService]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.product.id !== productId);
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
  }, [analyticsService]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => {
      const newCart = prev.map(item => item.product.id === productId ? { ...item, quantity } : item);
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
  }, [analyticsService, removeFromCart, analyticsService]);

  const clearCart = useCallback(() => {
    Swal.fire({
      title: '¿Vaciar carrito?', text: 'Se eliminarán todos los productos', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, vaciar', cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        analyticsService.trackCartUpdate([]);
        Swal.fire({ title: '¡Carrito vaciado!', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    });
  }, [analyticsService]);

  const completePurchase = useCallback(async (customerEmail?: string) => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const branchId = cart[0]?.product.branchId || undefined;
    const success = await recordSale({ items: [...cart], total, customerEmail, branchId, saleStatus: 'completed' });
    if (success) {
      setCart([]);
    }
  }, [cart, recordSale]);

  // ---- Exports / imports ----
  const exportProducts = useCallback(async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') await exportService.exportProductsToExcel(products);
      else await exportService.exportProductsToPDF(products);
      Swal.fire({ title: '¡Exportado!', text: `Archivo ${format.toUpperCase()} descargado`, icon: 'success', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo exportar el archivo', icon: 'error' });
    }
  }, [products, exportService]);

  const exportSales = useCallback(async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') await exportService.exportSalesToExcel(sales);
      else await exportService.exportSalesToPDF(sales);
      Swal.fire({ title: '¡Exportado!', text: `Archivo ${format.toUpperCase()} descargado`, icon: 'success', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo exportar el archivo', icon: 'error' });
    }
  }, [sales, exportService]);

  const importProducts = useCallback(async (file: File) => {
    try {
      const imported = await exportService.importProductsFromExcel(file);
      await addProducts(imported);
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo importar el archivo', icon: 'error' });
    }
  }, [exportService, addProducts]);

  // ---- Analytics (computed from in-memory state) ----
  const getAnalytics = useCallback(() => ({
    revenue: analyticsService.calculateRevenue(products),
    topProducts: analyticsService.getTopSellingProducts(products),
    categoryAnalytics: analyticsService.getCategoryAnalytics(products),
    realTimeMetrics: analyticsService.getRealTimeMetrics(),
    inventory: inventoryService.getInventoryReport(products),
    customers: customerService.getCustomerInsights(),
  }), [products, analyticsService, inventoryService, customerService]);

  const getInventoryAlerts = useCallback(() => inventoryService.checkInventoryAlerts(products), [products, inventoryService]);

  const getCustomerInsights = useCallback(() => customerService.getCustomerInsights(), [customerService]);

  const generateReports = useCallback(() => {
    const salesReport = reportService.generateSalesReport(sales, products);
    const inventoryReport = reportService.generateInventoryReport(products, sales);
    const customerInsights = customerService.getCustomerInsights();
    return { sales: salesReport, inventory: inventoryReport, customers: customerInsights };
  }, [sales, products, reportService, customerService]);

  const getExecutiveSummary = useCallback(() => {
    const reports = generateReports();
    return reportService.generateExecutiveSummary(reports.sales, reports.inventory, reports.customers);
  }, [generateReports, reportService]);

  const getBranchAnalytics = useCallback((branchId?: string) => branchService.getBranchAnalytics(branchId, products, sales), [products, sales, branchService]);

  return (
    <AppContext.Provider value={{
      products, branches, selectedBranch, cart, sales, customers,
      isAuthenticated, loading, storeSettings,
      loginWithCredentials, changeCredentials, updateStoreSettings, logout,
      selectBranch, addBranch, updateBranch, deleteBranch,
      addProduct, addProducts, updateProduct, deleteProduct, transferStock,
      addCustomer, updateCustomer, deleteCustomer, updateSale, recordSale,
      addToCart, removeFromCart, updateCartQuantity, clearCart, completePurchase,
      exportProducts, exportSales, importProducts,
      getAnalytics, getInventoryAlerts, getCustomerInsights,
      generateReports, getExecutiveSummary, getBranchAnalytics,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
