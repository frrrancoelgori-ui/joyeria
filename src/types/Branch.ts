export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  specialties: string[];
  isActive: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BranchInventory {
  branchId: string;
  productId: string;
  stock: number;
  reservedStock: number;
  lastUpdated: Date;
}

export interface BranchSales {
  branchId: string;
  date: string;
  totalSales: number;
  totalRevenue: number;
  topProducts: string[];
}