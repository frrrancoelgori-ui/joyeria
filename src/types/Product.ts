export type ProductStatus = 'available' | 'sold' | 'reserved';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  additionalImages?: string[];
  category: string;
  stock: number;
  material: string;
  weight: number;
  size: string;
  gemstone?: string;
  certification?: string;
  branchId: string;
  branchName: string;
  isCustomizable: boolean;
  craftingTime?: number;
  status: ProductStatus;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
