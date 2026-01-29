import { Product, CartItem } from '../types/Product';
import { Sale } from '../types/Sale';
import { memoize, performance } from '../utils/decorators';

interface RealTimeMetrics {
  totalSales: number;
  todayRevenue: number;
  averageOrderValue: number;
  activeCartItems: number;
  totalCartValue: number;
  productsAdded: number;
  productsUpdated: number;
  productsDeleted: number;
  timestamp: Date;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private salesData: Sale[] = [];
  private realTimeMetrics: RealTimeMetrics;
  private cartData: CartItem[] = [];
  private productActivity = {
    added: 0,
    updated: 0,
    deleted: 0
  };

  private constructor() {
    this.realTimeMetrics = {
      totalSales: 0,
      todayRevenue: 0,
      averageOrderValue: 0,
      activeCartItems: 0,
      totalCartValue: 0,
      productsAdded: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      timestamp: new Date()
    };
    this.initializeRealTimeAnalytics();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initializeRealTimeAnalytics() {
    // Actualizar métricas en tiempo real cada 3 segundos
    setInterval(() => {
      this.updateRealTimeMetrics();
    }, 3000);
  }

  public trackCartUpdate(cartItems: CartItem[]) {
    this.cartData = cartItems;
    this.updateRealTimeMetrics();
  }

  public trackProductAdded(product: Product) {
    this.productActivity.added++;
    this.updateRealTimeMetrics();
  }

  public trackProductUpdated(product: Product) {
    this.productActivity.updated++;
    this.updateRealTimeMetrics();
  }

  public trackProductDeleted(product: Product) {
    this.productActivity.deleted++;
    this.updateRealTimeMetrics();
  }

  @performance
  @memoize
  public calculateRevenue(products: Product[], timeframe: 'day' | 'week' | 'month' = 'month'): number {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return this.salesData
      .filter(sale => new Date(sale.date) >= startDate)
      .reduce((total, sale) => total + sale.total, 0);
  }

  @performance
  public getTopSellingProducts(products: Product[], limit: number = 5): Product[] {
    const productSales = new Map<string, number>();
    
    this.salesData.forEach(sale => {
      sale.items.forEach(item => {
        const current = productSales.get(item.product.id) || 0;
        productSales.set(item.product.id, current + item.quantity);
      });
    });

    return products
      .map(product => ({
        ...product,
        totalSold: productSales.get(product.id) || 0
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  @performance
  public getCategoryAnalytics(products: Product[]): any[] {
    const categoryData = new Map<string, { revenue: number; quantity: number }>();

    this.salesData.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.product.category;
        const current = categoryData.get(category) || { revenue: 0, quantity: 0 };
        categoryData.set(category, {
          revenue: current.revenue + (item.product.price * item.quantity),
          quantity: current.quantity + item.quantity
        });
      });
    });

    return Array.from(categoryData.entries()).map(([category, data]) => ({
      category,
      ...data
    }));
  }

  @performance
  public getCartAnalytics() {
    return {
      totalItems: this.cartData.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: this.cartData.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
      uniqueProducts: this.cartData.length,
      averageItemPrice: this.cartData.length > 0 
        ? this.cartData.reduce((sum, item) => sum + item.product.price, 0) / this.cartData.length 
        : 0
    };
  }

  @performance
  public getProductActivityMetrics() {
    return {
      ...this.productActivity,
      totalActivity: this.productActivity.added + this.productActivity.updated + this.productActivity.deleted
    };
  }
  public addSale(sale: Sale) {
    this.salesData.push(sale);
    this.updateRealTimeMetrics();
  }

  private updateRealTimeMetrics() {
    const cartAnalytics = this.getCartAnalytics();
    const productActivity = this.getProductActivityMetrics();
    
    this.realTimeMetrics = {
      totalSales: this.salesData.length,
      todayRevenue: this.calculateRevenue([], 'day'),
      averageOrderValue: this.salesData.length > 0 
        ? this.salesData.reduce((sum, sale) => sum + sale.total, 0) / this.salesData.length 
        : 0,
      activeCartItems: cartAnalytics.totalItems,
      totalCartValue: cartAnalytics.totalValue,
      productsAdded: productActivity.added,
      productsUpdated: productActivity.updated,
      productsDeleted: productActivity.deleted,
      timestamp: new Date()
    };
  }

  public getRealTimeMetrics() {
    return this.realTimeMetrics;
  }

  public getSalesData() {
    return this.salesData;
  }

  public getCartData() {
    return this.cartData;
  }

  @performance
  public generateAdvancedReport() {
    return {
      sales: {
        total: this.salesData.length,
        revenue: this.salesData.reduce((sum, sale) => sum + sale.total, 0),
        averageOrderValue: this.realTimeMetrics.averageOrderValue
      },
      cart: this.getCartAnalytics(),
      products: this.getProductActivityMetrics(),
      realTime: this.realTimeMetrics
    };
  }
}