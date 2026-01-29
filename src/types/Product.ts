export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
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
  craftingTime?: number; // días para productos personalizados
}

export interface CartItem {
  product: Product;
  quantity: number;
}