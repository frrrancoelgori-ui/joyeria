import { Sale } from '../types/Sale';
import { performance, memoize } from '../utils/decorators';

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: Date;
  registrationDate: Date;
  status: 'active' | 'inactive' | 'vip';
  segment: 'new' | 'regular' | 'loyal' | 'at_risk';
}

export interface CustomerInsight {
  totalCustomers: number;
  newCustomersThisMonth: number;
  vipCustomers: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  retentionRate: number;
  segments: {
    new: number;
    regular: number;
    loyal: number;
    at_risk: number;
  };
}

export class CustomerService {
  private static instance: CustomerService;
  private customers: Map<string, Customer> = new Map();

  private constructor() {}

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  @performance
  public processSale(sale: Sale) {
    const customerEmail = sale.customerEmail || 'guest@example.com';
    let customer = this.customers.get(customerEmail);

    if (!customer) {
      customer = {
        id: `customer_${Date.now()}`,
        email: customerEmail,
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchase: new Date(sale.date),
        registrationDate: new Date(sale.date),
        status: 'active',
        segment: 'new'
      };
    }

    customer.totalPurchases += 1;
    customer.totalSpent += sale.total;
    customer.lastPurchase = new Date(sale.date);
    customer.status = 'active';
    customer.segment = this.calculateCustomerSegment(customer);

    this.customers.set(customerEmail, customer);
  }

  private calculateCustomerSegment(customer: Customer): Customer['segment'] {
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - customer.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (customer.totalPurchases === 1) return 'new';
    if (customer.totalPurchases >= 10 && customer.totalSpent >= 1000) return 'loyal';
    if (daysSinceLastPurchase > 90) return 'at_risk';
    return 'regular';
  }

  @memoize
  public getCustomerInsights(): CustomerInsight {
    const customers = Array.from(this.customers.values());
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newCustomersThisMonth = customers.filter(
      c => c.registrationDate >= thirtyDaysAgo
    ).length;

    const vipCustomers = customers.filter(
      c => c.totalSpent >= 1000 || c.totalPurchases >= 10
    ).length;

    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalPurchases, 0);

    const segments = customers.reduce(
      (acc, customer) => {
        acc[customer.segment]++;
        return acc;
      },
      { new: 0, regular: 0, loyal: 0, at_risk: 0 }
    );

    return {
      totalCustomers: customers.length,
      newCustomersThisMonth,
      vipCustomers,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      customerLifetimeValue: customers.length > 0 ? totalRevenue / customers.length : 0,
      retentionRate: this.calculateRetentionRate(customers),
      segments
    };
  }

  private calculateRetentionRate(customers: Customer[]): number {
    const activeCustomers = customers.filter(c => {
      const daysSinceLastPurchase = Math.floor(
        (Date.now() - c.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLastPurchase <= 90;
    }).length;

    return customers.length > 0 ? (activeCustomers / customers.length) * 100 : 0;
  }

  public getTopCustomers(limit: number = 10): Customer[] {
    return Array.from(this.customers.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  public getCustomerById(id: string): Customer | undefined {
    return Array.from(this.customers.values()).find(c => c.id === id);
  }

  public getAllCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }
}