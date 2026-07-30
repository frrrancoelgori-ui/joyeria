export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  totalPurchases: number;
  totalSpent: number;
  createdAt: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'totalPurchases' | 'totalSpent' | 'createdAt'>;
