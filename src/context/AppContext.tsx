import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem } from '../types/Product';
import { Sale } from '../types/Sale';
import { Branch, BranchInventory } from '../types/Branch';
import { AnalyticsService } from '../services/AnalyticsService';
import { ExportService } from '../services/ExportService';
import { InventoryService } from '../services/InventoryService';
import { CustomerService } from '../services/CustomerService';
import { ReportService } from '../services/ReportService';
import { BranchService } from '../services/BranchService';
import Swal from 'sweetalert2';

interface AppContextType {
  products: Product[];
  branches: Branch[];
  selectedBranch: Branch | null;
  cart: CartItem[];
  sales: Sale[];
  isAuthenticated: boolean;
  adminCredentials: { username: string; password: string };
  login: (password: string) => boolean;
  loginWithCredentials: (username: string, password: string) => boolean;
  changeCredentials: (currentPassword: string, newUsername: string, newPassword: string) => boolean;
  logout: () => void;
  selectBranch: (branch: Branch) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
  updateBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addProducts: (products: Product[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  transferStock: (productId: string, fromBranch: string, toBranch: string, quantity: number) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  completePurchase: (customerEmail?: string) => void;
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

const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const initialBranches: Branch[] = [
  {
    id: '1',
    name: 'Diamante Real Centro',
    address: 'Av. Principal 123',
    phone: '+1 (555) 123-4567',
    email: 'centro@diamantereal.com',
    manager: 'María González',
    city: 'Ciudad Principal',
    state: 'Estado Central',
    zipCode: '12345',
    openingHours: {
      monday: '9:00 AM - 7:00 PM',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 7:00 PM',
      friday: '9:00 AM - 8:00 PM',
      saturday: '10:00 AM - 8:00 PM',
      sunday: '12:00 PM - 6:00 PM'
    },
    specialties: ['Anillos de Compromiso', 'Joyas Personalizadas', 'Reparaciones'],
    isActive: true,
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '2',
    name: 'Diamante Real Plaza Norte',
    address: 'Centro Comercial Plaza Norte, Local 205',
    phone: '+1 (555) 234-5678',
    email: 'plazanorte@diamantereal.com',
    manager: 'Carlos Rodríguez',
    city: 'Ciudad Norte',
    state: 'Estado Central',
    zipCode: '12346',
    openingHours: {
      monday: '10:00 AM - 9:00 PM',
      tuesday: '10:00 AM - 9:00 PM',
      wednesday: '10:00 AM - 9:00 PM',
      thursday: '10:00 AM - 9:00 PM',
      friday: '10:00 AM - 10:00 PM',
      saturday: '10:00 AM - 10:00 PM',
      sunday: '12:00 PM - 8:00 PM'
    },
    specialties: ['Relojes de Lujo', 'Cadenas de Oro', 'Aretes Diamante'],
    isActive: true,
    coordinates: { lat: 40.7589, lng: -73.9851 }
  },
  {
    id: '3',
    name: 'Diamante Real Boutique',
    address: 'Zona Rosa, Calle Exclusiva 456',
    phone: '+1 (555) 345-6789',
    email: 'boutique@diamantereal.com',
    manager: 'Ana Martínez',
    city: 'Ciudad Exclusiva',
    state: 'Estado Premium',
    zipCode: '12347',
    openingHours: {
      monday: '11:00 AM - 8:00 PM',
      tuesday: '11:00 AM - 8:00 PM',
      wednesday: '11:00 AM - 8:00 PM',
      thursday: '11:00 AM - 8:00 PM',
      friday: '11:00 AM - 9:00 PM',
      saturday: '10:00 AM - 9:00 PM',
      sunday: 'Cerrado'
    },
    specialties: ['Joyas de Diseñador', 'Piedras Preciosas', 'Colecciones Exclusivas'],
    isActive: true,
    coordinates: { lat: 40.7505, lng: -73.9934 }
  }
];

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Anillo de Compromiso Solitario',
    description: 'Elegante anillo de compromiso con diamante solitario de 1 quilate, montado en oro blanco de 18k',
    price: 2500,
    image: 'https://images.pexels.com/photos/1232931/pexels-photo-1232931.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Anillos',
    stock: 8,
    material: 'Oro Blanco 18k',
    weight: 3.5,
    size: 'Ajustable',
    gemstone: 'Diamante 1ct',
    certification: 'GIA Certificado',
    branchId: '1',
    branchName: 'Diamante Real Centro',
    isCustomizable: true,
    craftingTime: 7
  },
  {
    id: '2',
    name: 'Collar de Perlas Cultivadas',
    description: 'Hermoso collar de perlas cultivadas de agua dulce con broche de oro amarillo',
    price: 450,
    image: 'https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Collares',
    stock: 12,
    material: 'Oro Amarillo 14k',
    weight: 25.0,
    size: '45cm',
    gemstone: 'Perlas Cultivadas',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: false
  },
  {
    id: '3',
    name: 'Aretes de Esmeralda',
    description: 'Exquisitos aretes con esmeraldas colombianas y diamantes en oro blanco',
    price: 1800,
    image: 'https://images.pexels.com/photos/1454172/pexels-photo-1454172.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Aretes',
    stock: 6,
    material: 'Oro Blanco 18k',
    weight: 4.2,
    size: 'Mediano',
    gemstone: 'Esmeralda + Diamantes',
    certification: 'Certificado de Origen',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: true,
    craftingTime: 10
  },
  {
    id: '4',
    name: 'Reloj de Oro Rosa',
    description: 'Elegante reloj suizo con caja de oro rosa y correa de cuero genuino',
    price: 3200,
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Relojes',
    stock: 4,
    material: 'Oro Rosa 18k',
    weight: 85.0,
    size: '42mm',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: false
  },
  {
    id: '5',
    name: 'Pulsera de Diamantes',
    description: 'Deslumbrante pulsera con diamantes engarzados en oro blanco',
    price: 2800,
    image: 'https://images.pexels.com/photos/1454173/pexels-photo-1454173.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Pulseras',
    stock: 5,
    material: 'Oro Blanco 18k',
    weight: 12.5,
    size: '18cm',
    gemstone: 'Diamantes 2.5ct total',
    certification: 'GIA Certificado',
    branchId: '1',
    branchName: 'Diamante Real Centro',
    isCustomizable: true,
    craftingTime: 14
  },
  {
    id: '6',
    name: 'Cadena de Oro Amarillo',
    description: 'Cadena clásica de oro amarillo de 24k, perfecta para cualquier ocasión',
    price: 680,
    image: 'https://images.pexels.com/photos/1454174/pexels-photo-1454174.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Cadenas',
    stock: 15,
    material: 'Oro Amarillo 24k',
    weight: 18.0,
    size: '50cm',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: false
  }, // ← ¡Aquí estaba faltando la coma!
  {
    id: '7',
    name: 'Anillo de Compromiso Halo',
    description: 'Espectacular anillo con diamante central rodeado de diamantes más pequeños en oro blanco',
    price: 3500,
    image: 'https://images.pexels.com/photos/1454175/pexels-photo-1454175.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Anillos',
    stock: 3,
    material: 'Oro Blanco 18k',
    weight: 4.8,
    size: 'Ajustable',
    gemstone: 'Diamante 1.5ct + Halo',
    certification: 'GIA Certificado',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: true,
    craftingTime: 10
  },
  {
    id: '8',
    name: 'Collar de Diamantes Rivière',
    description: 'Elegante collar rivière con diamantes graduados en oro blanco',
    price: 5200,
    image: 'https://images.pexels.com/photos/1454176/pexels-photo-1454176.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Collares',
    stock: 2,
    material: 'Oro Blanco 18k',
    weight: 15.2,
    size: '40cm',
    gemstone: 'Diamantes 3ct total',
    certification: 'GIA Certificado',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: false
  },
  {
    id: '9',
    name: 'Aretes de Perlas Tahití',
    description: 'Sofisticados aretes con perlas negras de Tahití y diamantes',
    price: 1200,
    image: 'https://images.pexels.com/photos/1454177/pexels-photo-1454177.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Aretes',
    stock: 8,
    material: 'Oro Blanco 14k',
    weight: 6.3,
    size: 'Grande',
    gemstone: 'Perlas Tahití + Diamantes',
    certification: 'Certificado de Origen',
    branchId: '1',
    branchName: 'Diamante Real Centro',
    isCustomizable: false
  },
  {
    id: '10',
    name: 'Reloj de Diamantes para Dama',
    description: 'Reloj de lujo con caja y brazalete engastados con diamantes',
    price: 4800,
    image: 'https://images.pexels.com/photos/1454178/pexels-photo-1454178.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Relojes',
    stock: 2,
    material: 'Oro Blanco 18k',
    weight: 65.0,
    size: '28mm',
    gemstone: 'Diamantes 1.2ct total',
    certification: 'Certificado Suizo',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: false
  },
  {
    id: '11',
    name: 'Pulsera Tennis de Zafiros',
    description: 'Elegante pulsera tennis con zafiros azules y diamantes alternados',
    price: 3800,
    image: 'https://images.pexels.com/photos/1454179/pexels-photo-1454179.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Pulseras',
    stock: 4,
    material: 'Oro Blanco 18k',
    weight: 14.7,
    size: '19cm',
    gemstone: 'Zafiros + Diamantes',
    certification: 'GIA Certificado',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: true,
    craftingTime: 12
  },
  {
    id: '12',
    name: 'Cadena Cubana de Oro',
    description: 'Imponente cadena cubana de oro amarillo macizo, perfecta para hombres',
    price: 2200,
    image: 'https://images.pexels.com/photos/1454180/pexels-photo-1454180.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Cadenas',
    stock: 6,
    material: 'Oro Amarillo 18k',
    weight: 45.0,
    size: '60cm',
    branchId: '1',
    branchName: 'Diamante Real Centro',
    isCustomizable: false
  },
  {
    id: '13',
    name: 'Anillo de Rubí Birmano',
    description: 'Exclusivo anillo con rubí birmano natural y diamantes laterales',
    price: 4200,
    image: 'https://images.pexels.com/photos/1454181/pexels-photo-1454181.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Anillos',
    stock: 1,
    material: 'Platino',
    weight: 5.2,
    size: 'Ajustable',
    gemstone: 'Rubí Birmano 2ct + Diamantes',
    certification: 'Certificado Gübelin',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: true,
    craftingTime: 15
  },
  {
    id: '14',
    name: 'Collar de Perlas Australianas',
    description: 'Lujoso collar de perlas australianas doradas con broche de diamantes',
    price: 3600,
    image: 'https://images.pexels.com/photos/1454182/pexels-photo-1454182.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Collares',
    stock: 3,
    material: 'Oro Amarillo 18k',
    weight: 32.0,
    size: '50cm',
    gemstone: 'Perlas Australianas + Diamantes',
    certification: 'Certificado de Origen',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: false
  },
  {
    id: '15',
    name: 'Aretes Chandelier de Diamantes',
    description: 'Espectaculares aretes chandelier con múltiples niveles de diamantes',
    price: 6800,
    image: 'https://images.pexels.com/photos/1454183/pexels-photo-1454183.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Aretes',
    stock: 2,
    material: 'Oro Blanco 18k',
    weight: 8.9,
    size: 'Extra Grande',
    gemstone: 'Diamantes 4ct total',
    certification: 'GIA Certificado',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: true,
    craftingTime: 20
  },
  {
    id: '16',
    name: 'Reloj Cronógrafo de Oro',
    description: 'Reloj cronógrafo suizo de oro amarillo con funciones múltiples',
    price: 5500,
    image: 'https://images.pexels.com/photos/1454184/pexels-photo-1454184.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Relojes',
    stock: 3,
    material: 'Oro Amarillo 18k',
    weight: 120.0,
    size: '44mm',
    certification: 'Certificado Suizo',
    branchId: '1',
    branchName: 'Diamante Real Centro',
    isCustomizable: false
  },
  {
    id: '17',
    name: 'Pulsera de Esmeraldas Colombianas',
    description: 'Exclusiva pulsera con esmeraldas colombianas y diamantes',
    price: 7200,
    image: 'https://images.pexels.com/photos/1454185/pexels-photo-1454185.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Pulseras',
    stock: 1,
    material: 'Platino',
    weight: 18.5,
    size: '17cm',
    gemstone: 'Esmeraldas Colombianas + Diamantes',
    certification: 'Certificado de Origen',
    branchId: '3',
    branchName: 'Diamante Real Boutique',
    isCustomizable: true,
    craftingTime: 25
  },
  {
    id: '18',
    name: 'Cadena Rope de Oro Blanco',
    description: 'Elegante cadena rope de oro blanco con acabado brillante',
    price: 1800,
    image: 'https://images.pexels.com/photos/1454186/pexels-photo-1454186.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Cadenas',
    stock: 8,
    material: 'Oro Blanco 18k',
    weight: 28.0,
    size: '55cm',
    branchId: '2',
    branchName: 'Diamante Real Plaza Norte',
    isCustomizable: false
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(DEFAULT_ADMIN_CREDENTIALS);
  
  const analyticsService = AnalyticsService.getInstance();
  const exportService = ExportService.getInstance();
  const inventoryService = InventoryService.getInstance();
  const customerService = CustomerService.getInstance();
  const reportService = ReportService.getInstance();
  const branchService = BranchService.getInstance();

  const login = (password: string): boolean => {
    if (password === adminCredentials.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const loginWithCredentials = (username: string, password: string): boolean => {
    if (username === adminCredentials.username && password === adminCredentials.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const changeCredentials = (currentPassword: string, newUsername: string, newPassword: string): boolean => {
    if (currentPassword === adminCredentials.password) {
      setAdminCredentials({ username: newUsername, password: newPassword });
      Swal.fire({
        title: '¡Credenciales actualizadas!',
        text: 'Las nuevas credenciales han sido guardadas',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const selectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const addBranch = (branchData: Omit<Branch, 'id'>) => {
    const newBranch = { ...branchData, id: Date.now().toString() };
    setBranches(prev => [...prev, newBranch]);
    branchService.addBranch(newBranch);
    Swal.fire({
      title: '¡Sucursal agregada!',
      text: `${branchData.name} ha sido agregada al sistema`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const updateBranch = (updatedBranch: Branch) => {
    setBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));
    branchService.updateBranch(updatedBranch);
    Swal.fire({
      title: '¡Sucursal actualizada!',
      text: 'Los cambios han sido guardados',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const deleteBranch = (id: string) => {
    const branchProducts = products.filter(p => p.branchId === id);
    if (branchProducts.length > 0) {
      Swal.fire({
        title: 'No se puede eliminar',
        text: `Esta sucursal tiene ${branchProducts.length} productos en inventario`,
        icon: 'warning'
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar sucursal?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setBranches(prev => prev.filter(b => b.id !== id));
        branchService.deleteBranch(id);
        Swal.fire({
          title: '¡Eliminada!',
          text: 'La sucursal ha sido eliminada',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  
  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
    analyticsService.trackProductAdded(newProduct);
    branchService.updateBranchInventory(newProduct.branchId, newProduct.id, newProduct.stock);
    Swal.fire({
      title: '¡Producto agregado!',
      text: `${product.name} ha sido agregado al catálogo`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const addProducts = (newProducts: Product[]) => {
    setProducts(prev => [...prev, ...newProducts]);
    newProducts.forEach(product => analyticsService.trackProductAdded(product));
    newProducts.forEach(product => 
      branchService.updateBranchInventory(product.branchId, product.id, product.stock)
    );
    Swal.fire({
      title: '¡Productos importados!',
      text: `${newProducts.length} productos han sido agregados`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    analyticsService.trackProductUpdated(updatedProduct);
    branchService.updateBranchInventory(updatedProduct.branchId, updatedProduct.id, updatedProduct.stock);
    Swal.fire({
      title: '¡Producto actualizado!',
      text: 'Los cambios han sido guardados',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const deleteProduct = (id: string) => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const productToDelete = products.find(p => p.id === id);
        setProducts(prev => prev.filter(p => p.id !== id));
        setCart(prev => prev.filter(item => item.product.id !== id));
        if (productToDelete) {
          analyticsService.trackProductDeleted(productToDelete);
        }
        branchService.removeFromBranchInventory(productToDelete?.branchId || '', id);
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El producto ha sido eliminado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const transferStock = (productId: string, fromBranch: string, toBranch: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.branchId !== fromBranch) {
      Swal.fire({
        title: 'Error',
        text: 'Producto no encontrado en la sucursal origen',
        icon: 'error'
      });
      return;
    }

    if (product.stock < quantity) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: `Solo hay ${product.stock} unidades disponibles`,
        icon: 'warning'
      });
      return;
    }

    const existingInDestination = products.find(p => p.name === product.name && p.branchId === toBranch);
    const destinationBranch = branches.find(b => b.id === toBranch);

    if (existingInDestination) {
      setProducts(prev => prev.map(p => 
        p.id === existingInDestination.id 
          ? { ...p, stock: p.stock + quantity }
          : p.id === productId
          ? { ...p, stock: p.stock - quantity }
          : p
      ));
    } else {
      const newProduct = {
        ...product,
        id: `${productId}_${toBranch}_${Date.now()}`,
        stock: quantity,
        branchId: toBranch,
        branchName: destinationBranch?.name || 'Sucursal'
      };
      
      setProducts(prev => [
        ...prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p),
        newProduct
      ]);
    }

    branchService.transferStock(productId, fromBranch, toBranch, quantity);
    
    Swal.fire({
      title: '¡Transferencia exitosa!',
      text: `${quantity} unidades transferidas exitosamente`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      Swal.fire({
        title: 'Producto agotado',
        text: 'Este producto no está disponible',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        const updatedCart = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        analyticsService.trackCartUpdate(updatedCart);
        return updatedCart;
      }
      const newCart = [...prev, { product, quantity: 1 }];
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
    
    Swal.fire({
      title: '¡Agregado al carrito!',
      text: `${product.name} ha sido agregado`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.product.id !== productId);
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const newCart = prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      analyticsService.trackCartUpdate(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    Swal.fire({
      title: '¿Vaciar carrito?',
      text: 'Se eliminarán todos los productos',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        analyticsService.trackCartUpdate([]);
        Swal.fire({
          title: '¡Carrito vaciado!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const completePurchase = (customerEmail?: string) => {
    if (cart.length === 0) return;

    const sale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      customerEmail,
      status: 'completed'
    };

    setSales(prev => [...prev, sale]);
    analyticsService.addSale(sale);
    
    customerService.processSale(sale);
    
    setProducts(prev => prev.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        const newStock = product.stock - cartItem.quantity;
        inventoryService.recordStockMovement(
          product.id,
          'out',
          cartItem.quantity,
          'Venta completada',
          product.stock,
          newStock
        );
        return { ...product, stock: newStock };
      }
      return product;
    }));

    setCart([]);
    analyticsService.trackCartUpdate([]);
    
    Swal.fire({
      title: '¡Compra exitosa!',
      text: `Total: $${cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()}`,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const exportProducts = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await exportService.exportProductsToExcel(products);
      } else {
        await exportService.exportProductsToPDF(products);
      }
      Swal.fire({
        title: '¡Exportado!',
        text: `Archivo ${format.toUpperCase()} descargado`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo exportar el archivo',
        icon: 'error'
      });
    }
  };

  const exportSales = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await exportService.exportSalesToExcel(sales);
      } else {
        await exportService.exportSalesToPDF(sales);
      }
      Swal.fire({
        title: '¡Exportado!',
        text: `Archivo ${format.toUpperCase()} descargado`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo exportar el archivo',
        icon: 'error'
      });
    }
  };

  const importProducts = async (file: File) => {
    try {
      const importedProducts = await exportService.importProductsFromExcel(file);
      addProducts(importedProducts);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo importar el archivo',
        icon: 'error'
      });
    }
  };

  const getAnalytics = () => {
    return {
      revenue: analyticsService.calculateRevenue(products),
      topProducts: analyticsService.getTopSellingProducts(products),
      categoryAnalytics: analyticsService.getCategoryAnalytics(products),
      realTimeMetrics: analyticsService.getRealTimeMetrics(),
      inventory: inventoryService.getInventoryReport(products),
      customers: customerService.getCustomerInsights()
    };
  };

  const getInventoryAlerts = () => {
    return inventoryService.checkInventoryAlerts(products);
  };

  const getCustomerInsights = () => {
    return customerService.getCustomerInsights();
  };

  const generateReports = () => {
    const salesReport = reportService.generateSalesReport(sales, products);
    const inventoryReport = reportService.generateInventoryReport(products, sales);
    const customerInsights = customerService.getCustomerInsights();
    
    return {
      sales: salesReport,
      inventory: inventoryReport,
      customers: customerInsights
    };
  };

  const getExecutiveSummary = () => {
    const reports = generateReports();
    return reportService.generateExecutiveSummary(
      reports.sales,
      reports.inventory,
      reports.customers
    );
  };

  const getBranchAnalytics = (branchId?: string) => {
    return branchService.getBranchAnalytics(branchId, products, sales);
  };

  return (
    <AppContext.Provider value={{
      products,
      branches,
      selectedBranch,
      cart,
      sales,
      isAuthenticated,
      adminCredentials,
      login,
      loginWithCredentials,
      changeCredentials,
      logout,
      selectBranch,
      addBranch,
      updateBranch,
      deleteBranch,
      addProduct,
      addProducts,
      updateProduct,
      deleteProduct,
      transferStock,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      completePurchase,
      exportProducts,
      exportSales,
      importProducts,
      getAnalytics,
      getInventoryAlerts,
      getCustomerInsights,
      generateReports,
      getExecutiveSummary,
      getBranchAnalytics
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