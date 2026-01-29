import { Product } from '../types/Product';
import { Sale } from '../types/Sale';
import { Customer } from './CustomerService';
import { InventoryAlert } from './InventoryService';
import { performance } from '../utils/decorators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  topSellingProducts: Product[];
  slowMovingProducts: Product[];
  categoryBreakdown: Array<{
    category: string;
    products: number;
    value: number;
  }>;
}

export class ReportService {
  private static instance: ReportService;

  private constructor() {}

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  @performance
  public generateSalesReport(
    sales: Sale[],
    products: Product[],
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): SalesReport {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredSales = sales.filter(sale => new Date(sale.date) >= startDate);
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    // Productos más vendidos
    const productSales = new Map<string, { quantity: number; revenue: number }>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productSales.get(item.product.name) || { quantity: 0, revenue: 0 };
        productSales.set(item.product.name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.product.price * item.quantity)
        });
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Ventas por categoría
    const categorySales = new Map<string, { sales: number; revenue: number }>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const current = categorySales.get(item.product.category) || { sales: 0, revenue: 0 };
        categorySales.set(item.product.category, {
          sales: current.sales + item.quantity,
          revenue: current.revenue + (item.product.price * item.quantity)
        });
      });
    });

    const salesByCategory = Array.from(categorySales.entries())
      .map(([category, data]) => ({ category, ...data }));

    // Ventas diarias
    const dailySalesMap = new Map<string, { sales: number; revenue: number }>();
    filteredSales.forEach(sale => {
      const date = new Date(sale.date).toISOString().split('T')[0];
      const current = dailySalesMap.get(date) || { sales: 0, revenue: 0 };
      dailySalesMap.set(date, {
        sales: current.sales + 1,
        revenue: current.revenue + sale.total
      });
    });

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      totalSales: filteredSales.length,
      totalRevenue,
      averageOrderValue: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0,
      topProducts,
      salesByCategory,
      dailySales
    };
  }

  @performance
  public generateInventoryReport(products: Product[], sales: Sale[]): InventoryReport {
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockItems = products.filter(p => p.stock <= 5 && p.stock > 0).length;
    const outOfStockItems = products.filter(p => p.stock === 0).length;

    // Productos más vendidos
    const productSales = new Map<string, number>();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productSales.get(item.product.id) || 0;
        productSales.set(item.product.id, current + item.quantity);
      });
    });

    const topSellingProducts = products
      .map(product => ({
        ...product,
        totalSold: productSales.get(product.id) || 0
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    const slowMovingProducts = products
      .map(product => ({
        ...product,
        totalSold: productSales.get(product.id) || 0
      }))
      .filter(p => p.totalSold <= 2 && p.stock > 10)
      .slice(0, 10);

    // Desglose por categoría
    const categoryMap = new Map<string, { products: number; value: number }>();
    products.forEach(product => {
      const current = categoryMap.get(product.category) || { products: 0, value: 0 };
      categoryMap.set(product.category, {
        products: current.products + 1,
        value: current.value + (product.price * product.stock)
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }));

    return {
      totalProducts: products.length,
      totalValue,
      lowStockItems,
      outOfStockItems,
      topSellingProducts,
      slowMovingProducts,
      categoryBreakdown
    };
  }

  @performance
  public async exportAdvancedReport(
    type: 'sales' | 'inventory' | 'customers',
    data: any,
    format: 'excel' | 'pdf'
  ): Promise<void> {
    if (format === 'excel') {
      await this.exportToExcel(type, data);
    } else {
      await this.exportToPDF(type, data);
    }
  }

  private async exportToExcel(type: string, data: any): Promise<void> {
    const workbook = XLSX.utils.book_new();

    switch (type) {
      case 'sales':
        const salesSheet = XLSX.utils.json_to_sheet([
          { Métrica: 'Total Ventas', Valor: data.totalSales },
          { Métrica: 'Ingresos Totales', Valor: `$${data.totalRevenue.toLocaleString()}` },
          { Métrica: 'Ticket Promedio', Valor: `$${data.averageOrderValue.toLocaleString()}` }
        ]);
        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Resumen');

        if (data.topProducts?.length > 0) {
          const productsSheet = XLSX.utils.json_to_sheet(data.topProducts);
          XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Productos');
        }
        break;

      case 'inventory':
        const inventorySheet = XLSX.utils.json_to_sheet([
          { Métrica: 'Total Productos', Valor: data.totalProducts },
          { Métrica: 'Valor Total', Valor: `$${data.totalValue.toLocaleString()}` },
          { Métrica: 'Stock Bajo', Valor: data.lowStockItems },
          { Métrica: 'Sin Stock', Valor: data.outOfStockItems }
        ]);
        XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Resumen');
        break;
    }

    XLSX.writeFile(workbook, `reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private async exportToPDF(type: string, data: any): Promise<void> {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Reporte de ${type.charAt(0).toUpperCase() + type.slice(1)}`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);

    let yPosition = 50;

    switch (type) {
      case 'sales':
        doc.text(`Total de Ventas: ${data.totalSales}`, 20, yPosition);
        doc.text(`Ingresos Totales: $${data.totalRevenue.toLocaleString()}`, 20, yPosition + 10);
        doc.text(`Ticket Promedio: $${data.averageOrderValue.toLocaleString()}`, 20, yPosition + 20);
        break;

      case 'inventory':
        doc.text(`Total Productos: ${data.totalProducts}`, 20, yPosition);
        doc.text(`Valor Total: $${data.totalValue.toLocaleString()}`, 20, yPosition + 10);
        doc.text(`Stock Bajo: ${data.lowStockItems}`, 20, yPosition + 20);
        doc.text(`Sin Stock: ${data.outOfStockItems}`, 20, yPosition + 30);
        break;
    }

    doc.save(`reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  public generateExecutiveSummary(
    salesReport: SalesReport,
    inventoryReport: InventoryReport,
    customerInsights: any
  ) {
    return {
      kpis: {
        totalRevenue: salesReport.totalRevenue,
        totalOrders: salesReport.totalSales,
        averageOrderValue: salesReport.averageOrderValue,
        inventoryValue: inventoryReport.totalValue,
        totalCustomers: customerInsights.totalCustomers,
        newCustomers: customerInsights.newCustomersThisMonth
      },
      alerts: {
        lowStock: inventoryReport.lowStockItems,
        outOfStock: inventoryReport.outOfStockItems,
        atRiskCustomers: customerInsights.segments.at_risk
      },
      trends: {
        topCategory: salesReport.salesByCategory[0]?.category || 'N/A',
        topProduct: salesReport.topProducts[0]?.name || 'N/A',
        growthRate: this.calculateGrowthRate(salesReport.dailySales)
      }
    };
  }

  private calculateGrowthRate(dailySales: Array<{ date: string; revenue: number }>): number {
    if (dailySales.length < 2) return 0;
    
    const recent = dailySales.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    const previous = dailySales.slice(-14, -7).reduce((sum, day) => sum + day.revenue, 0);
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  }
}