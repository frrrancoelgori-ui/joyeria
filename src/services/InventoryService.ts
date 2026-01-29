import { Product } from '../types/Product';
import { performance, memoize } from '../utils/decorators';

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'price_change';
  productId: string;
  productName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  timestamp: Date;
  userId: string;
  previousStock: number;
  newStock: number;
}

export class InventoryService {
  private static instance: InventoryService;
  private alerts: InventoryAlert[] = [];
  private stockMovements: StockMovement[] = [];
  private lowStockThreshold = 10;
  private overstockThreshold = 100;

  private constructor() {}

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  @performance
  public checkInventoryAlerts(products: Product[]): InventoryAlert[] {
    const newAlerts: InventoryAlert[] = [];

    products.forEach(product => {
      // Stock bajo
      if (product.stock <= 5 && product.stock > 0) {
        newAlerts.push({
          id: `low_stock_${product.id}_${Date.now()}`,
          type: 'low_stock',
          productId: product.id,
          productName: product.name,
          message: `Stock bajo: Solo quedan ${product.stock} unidades`,
          severity: 'high',
          timestamp: new Date(),
          resolved: false
        });
      }

      // Sin stock
      if (product.stock === 0) {
        newAlerts.push({
          id: `out_of_stock_${product.id}_${Date.now()}`,
          type: 'out_of_stock',
          productId: product.id,
          productName: product.name,
          message: 'Producto agotado',
          severity: 'critical',
          timestamp: new Date(),
          resolved: false
        });
      }

      // Sobrestock
      if (product.stock > this.overstockThreshold) {
        newAlerts.push({
          id: `overstock_${product.id}_${Date.now()}`,
          type: 'overstock',
          productId: product.id,
          productName: product.name,
          message: `Posible sobrestock: ${product.stock} unidades`,
          severity: 'medium',
          timestamp: new Date(),
          resolved: false
        });
      }
    });

    this.alerts = [...this.alerts.filter(alert => !alert.resolved), ...newAlerts];
    return this.alerts;
  }

  public recordStockMovement(
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string,
    previousStock: number,
    newStock: number,
    userId: string = 'admin'
  ) {
    const movement: StockMovement = {
      id: `movement_${Date.now()}`,
      productId,
      type,
      quantity,
      reason,
      timestamp: new Date(),
      userId,
      previousStock,
      newStock
    };

    this.stockMovements.push(movement);
  }

  @memoize
  public getStockMovements(productId?: string): StockMovement[] {
    if (productId) {
      return this.stockMovements.filter(movement => movement.productId === productId);
    }
    return this.stockMovements;
  }

  public getAlerts(resolved: boolean = false): InventoryAlert[] {
    return this.alerts.filter(alert => alert.resolved === resolved);
  }

  public resolveAlert(alertId: string) {
    this.alerts = this.alerts.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    );
  }

  @performance
  public getInventoryReport(products: Product[]) {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const overstockCount = products.filter(p => p.stock > this.overstockThreshold).length;

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockCount,
      outOfStockCount,
      overstockCount,
      averageStock: totalProducts > 0 ? totalStock / totalProducts : 0,
      stockTurnover: this.calculateStockTurnover(),
      alerts: this.getAlerts(),
      recentMovements: this.stockMovements.slice(-10)
    };
  }

  private calculateStockTurnover(): number {
    // Simulación de rotación de inventario
    const totalSold = this.stockMovements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    return totalSold / 30; // Rotación diaria promedio
  }
}