import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Product } from '../types/Product';
import { Sale } from '../types/Sale';
import { performance, asyncQueue } from '../utils/decorators';

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  @performance
  @asyncQueue
  public async exportProductsToExcel(products: Product[]): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(products.map(product => ({
      ID: product.id,
      Nombre: product.name,
      Descripción: product.description,
      Precio: product.price,
      Categoría: product.category,
      Stock: product.stock
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    XLSX.writeFile(workbook, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @performance
  @asyncQueue
  public async exportSalesToExcel(sales: Sale[]): Promise<void> {
    const salesData = sales.map(sale => ({
      ID: sale.id,
      Fecha: new Date(sale.date).toLocaleDateString(),
      Total: sale.total,
      'Cantidad Items': sale.items.length,
      Cliente: sale.customerEmail || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(salesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
    
    XLSX.writeFile(workbook, `ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  @performance
  @asyncQueue
  public async exportProductsToPDF(products: Product[]): Promise<void> {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Reporte de Productos', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);

    const tableData = products.map(product => [
      product.id,
      product.name,
      product.category,
      `$${product.price.toLocaleString()}`,
      product.stock.toString()
    ]);

    (doc as any).autoTable({
      head: [['ID', 'Nombre', 'Categoría', 'Precio', 'Stock']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  @performance
  public async importProductsFromExcel(file: File): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const products: Product[] = jsonData.map((row: any, index) => ({
            id: row.ID || `imported_${Date.now()}_${index}`,
            name: row.Nombre || row.Name || '',
            description: row.Descripción || row.Description || '',
            price: parseFloat(row.Precio || row.Price || 0),
            category: row.Categoría || row.Category || 'General',
            stock: parseInt(row.Stock || 0),
            image: row.Imagen || row.Image || 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=500'
          }));

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }
}