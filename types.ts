
export type UserRole = 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: 'un' | 'kg';
  barcodes: string[];
}

export interface Order {
  id: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentMethod: string;
  receiptData?: string;
  cashAmount?: number;
  changeAmount?: number;
  status: 'pending' | 'processing' | 'finished';
  createdAt: string;
}

export interface DebtEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'PAYMENT';
  saleId?: string;
  items?: SaleItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  history: DebtEntry[];
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'Dinheiro' | 'Cartão' | 'Fiado' | 'Pix';
  customerId?: string;
}

export type View = 'DASHBOARD' | 'INVENTORY' | 'POS' | 'FIADO' | 'SALES' | 'CUSTOMER_PORTAL';
