import { CartItem } from './Product';

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  customerEmail?: string;
  status: 'completed' | 'pending' | 'cancelled';
}