import { Branch, BranchInventory, BranchSales } from '../types/Branch';
import { Product } from '../types/Product';
import { Sale } from '../types/Sale';
import { performance, memoize } from '../utils/decorators';

export interface BranchAnalytics {
  branchId: string;
  branchName: string;
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  salesCount: number;
  revenue: number;
  topProducts: Array<{
    name: string;
    stock: number;
    value: number;
  }>;
  lowStockAlerts: number;
  specialties: string[];
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

export class BranchService {
  private static instance: BranchService;
  private branches: Map<string, Branch> = new Map();
  private branchInventory: Map<string, BranchInventory[]> = new Map();
  private branchSales: Map<string, BranchSales[]> = new Map();

  private constructor() {}

  public static getInstance(): BranchService {
    if (!BranchService.instance) {
      BranchService.instance = new BranchService();
    }
    return BranchService.instance;
  }

  public addBranch(branch: Branch) {
    this.branches.set(branch.id, branch);
    this.branchInventory.set(branch.id, []);
    this.branchSales.set(branch.id, []);
  }

  public updateBranch(branch: Branch) {
    this.branches.set(branch.id, branch);
  }

  public deleteBranch(branchId: string) {
    this.branches.delete(branchId);
    this.branchInventory.delete(branchId);
    this.branchSales.delete(branchId);
  }

  public getBranch(branchId: string): Branch | undefined {
    return this.branches.get(branchId);
  }

  public getAllBranches(): Branch[] {
    return Array.from(this.branches.values());
  }

  public updateBranchInventory(branchId: string, productId: string, stock: number) {
    const inventory = this.branchInventory.get(branchId) || [];
    const existingItem = inventory.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.stock = stock;
      existingItem.lastUpdated = new Date();
    } else {
      inventory.push({
        branchId,
        productId,
        stock,
        reservedStock: 0,
        lastUpdated: new Date()
      });
    }

    this.branchInventory.set(branchId, inventory);
  }

  public removeFromBranchInventory(branchId: string, productId: string) {
    const inventory = this.branchInventory.get(branchId) || [];
    const updatedInventory = inventory.filter(item => item.productId !== productId);
    this.branchInventory.set(branchId, updatedInventory);
  }

  public transferStock(productId: string, fromBranch: string, toBranch: string, quantity: number) {
    // Actualizar inventario de sucursal origen
    const fromInventory = this.branchInventory.get(fromBranch) || [];
    const fromItem = fromInventory.find(item => item.productId === productId);
    if (fromItem) {
      fromItem.stock -= quantity;
      fromItem.lastUpdated = new Date();
    }

    // Actualizar inventario de sucursal destino
    const toInventory = this.branchInventory.get(toBranch) || [];
    const toItem = toInventory.find(item => item.productId === productId);
    if (toItem) {
      toItem.stock += quantity;
      toItem.lastUpdated = new Date();
    } else {
      toInventory.push({
        branchId: toBranch,
        productId,
        stock: quantity,
        reservedStock: 0,
        lastUpdated: new Date()
      });
    }

    this.branchInventory.set(fromBranch, fromInventory);
    this.branchInventory.set(toBranch, toInventory);
  }

  @performance
  @memoize
  public getBranchAnalytics(branchId?: string, products: Product[] = [], sales: Sale[] = []): BranchAnalytics[] {
    const branchIds = branchId ? [branchId] : Array.from(this.branches.keys());
    
    return branchIds.map(id => {
      const branch = this.branches.get(id);
      if (!branch) return null;

      const branchProducts = products.filter(p => p.branchId === id);
      const branchSalesData = sales.filter(sale => 
        sale.items.some(item => item.product.branchId === id)
      );

      const totalProducts = branchProducts.length;
      const totalStock = branchProducts.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = branchProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
      const salesCount = branchSalesData.length;
      const revenue = branchSalesData.reduce((sum, sale) => sum + sale.total, 0);
      const lowStockAlerts = branchProducts.filter(p => p.stock <= 5).length;

      const topProducts = branchProducts
        .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          stock: p.stock,
          value: p.price * p.stock
        }));

      // Calcular performance basado en métricas
      let performance: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
      const performanceScore = (revenue / 10000) + (totalProducts / 10) + (totalStock / 50);
      
      if (performanceScore >= 3) performance = 'excellent';
      else if (performanceScore >= 2) performance = 'good';
      else if (performanceScore >= 1) performance = 'average';

      return {
        branchId: id,
        branchName: branch.name,
        totalProducts,
        totalStock,
        totalValue,
        salesCount,
        revenue,
        topProducts,
        lowStockAlerts,
        specialties: branch.specialties,
        performance
      };
    }).filter(Boolean) as BranchAnalytics[];
  }

  public getBranchInventory(branchId: string): BranchInventory[] {
    return this.branchInventory.get(branchId) || [];
  }

  public recordBranchSale(branchId: string, sale: Sale) {
    const branchSales = this.branchSales.get(branchId) || [];
    const today = new Date().toISOString().split('T')[0];
    
    const existingRecord = branchSales.find(record => record.date === today);
    if (existingRecord) {
      existingRecord.totalSales += 1;
      existingRecord.totalRevenue += sale.total;
    } else {
      branchSales.push({
        branchId,
        date: today,
        totalSales: 1,
        totalRevenue: sale.total,
        topProducts: sale.items.map(item => item.product.id)
      });
    }

    this.branchSales.set(branchId, branchSales);
  }

  public getBranchSales(branchId: string): BranchSales[] {
    return this.branchSales.get(branchId) || [];
  }

  @performance
  public generateBranchReport(branchId: string, products: Product[], sales: Sale[]) {
    const branch = this.branches.get(branchId);
    if (!branch) return null;

    const analytics = this.getBranchAnalytics(branchId, products, sales)[0];
    const inventory = this.getBranchInventory(branchId);
    const salesHistory = this.getBranchSales(branchId);

    return {
      branch,
      analytics,
      inventory,
      salesHistory,
      recommendations: this.generateRecommendations(analytics)
    };
  }

  private generateRecommendations(analytics: BranchAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.lowStockAlerts > 5) {
      recommendations.push('Reabastecer productos con stock bajo');
    }

    if (analytics.performance === 'poor') {
      recommendations.push('Revisar estrategias de ventas y marketing local');
    }

    if (analytics.totalProducts < 10) {
      recommendations.push('Considerar ampliar el catálogo de productos');
    }

    if (analytics.revenue < 5000) {
      recommendations.push('Implementar promociones especiales para aumentar ventas');
    }

    return recommendations;
  }
}