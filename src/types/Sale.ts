import { CartItem } from './Product';

export type SaleStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';

export interface SaleCustomer {
  fullName: string;
  phone?: string;
  email?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNumber?: number;
  date: string;
  items: CartItem[];
  total: number;
  customerEmail?: string;
  customerId?: string;
  customer?: SaleCustomer;
  status: SaleStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
  branchId?: string;
}
