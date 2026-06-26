// ─── Types ────────────────────────────────────────────────────────────────────
export type Category = 'Fertilizer'|'Pesticide'|'Seeds'|'Irrigation'|'Tools'|'Other';
export type PayMode  = 'Cash'|'UPI'|'Card'|'Cheque'|'Bank Transfer'|'Credit';
export type TxType   = 'sale'|'purchase'|'expense'|'receipt'|'payment';

export interface Batch {
  id: string; batchNo: string; expiryDate: string;
  manufactureDate: string; qty: number; purchasePrice: number;
}

export interface Product {
  id: string; name: string; category: Category;
  unit: string; purchasePrice: number; salePrice: number;
  stock: number; hsnCode: string; gstRate: number;
  minStock: number; batches: Batch[]; createdAt: string;
}

export interface Customer {
  id: string; name: string; phone: string; email: string;
  address: string; city: string; state: string; stateCode: string;
  pincode: string; gstNo: string; openingBalance: number; createdAt: string;
}

export interface Supplier {
  id: string; name: string; phone: string; email: string;
  address: string; city: string; state: string; stateCode: string;
  gstNo: string; openingBalance: number; createdAt: string;
}

export interface InvoiceItem {
  productId: string; productName: string; unit: string;
  hsnCode: string; batchNo: string;
  qty: number; rate: number; discount: number; gstRate: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; amount: number;
}

export interface SaleInvoice {
  id: string; invoiceNo: string;
  customerId: string; customerName: string; customerPhone: string;
  customerGstin: string; customerStateCode: string;
  date: string; dueDate: string; items: InvoiceItem[];
  subtotal: number; totalDiscount: number; taxableAmount: number;
  cgst: number; sgst: number; igst: number; totalGST: number;
  total: number; paidAmount: number; balanceDue: number;
  payMode: PayMode; supplyType: 'intrastate'|'interstate';
  notes: string; status: 'paid'|'partial'|'unpaid';
}

export interface PurchaseInvoice {
  id: string; invoiceNo: string;
  supplierId: string; supplierName: string; billNo: string;
  date: string; dueDate: string; items: InvoiceItem[];
  subtotal: number; totalDiscount: number; taxableAmount: number;
  cgst: number; sgst: number; igst: number; totalGST: number;
  total: number; paidAmount: number; balanceDue: number;
  payMode: PayMode; notes: string; status: 'paid'|'partial'|'unpaid';
}

export interface LedgerEntry {
  id: string; date: string; type: TxType;
  partyType: 'customer'|'supplier'|'general';
  partyId: string; partyName: string;
  description: string; debit: number; credit: number;
  balance: number; refId: string;
}

export interface Expense {
  id: string; date: string; category: string;
  description: string; amount: number; payMode: PayMode;
}

export interface ShopSettings {
  name: string; tagline: string; address: string;
  city: string; state: string; stateCode: string;
  pincode: string; phone: string; email: string; website: string;
  gstin: string; panNo: string; logo: string; theme: string;
  invoicePrefix: string; invoiceTerms: string; invoiceFooter: string;
  bankName: string; bankBranch: string; accountNo: string;
  ifsc: string; accountType: string; upiId: string;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_PRODUCTS: Product[] = [
  { id:'p1', name:'Urea (46% N)', category:'Fertilizer', unit:'Bag (50kg)', purchasePrice:260, salePrice:285, stock:120, hsnCode:'3102', gstRate:5, minStock:20, batches:[], createdAt:'2025-01-01' },
  { id:'p2', name:'DAP Fertilizer', category:'Fertilizer', unit:'Bag (50kg)', purchasePrice:1280, salePrice:1380, stock:80, hsnCode:'3105', gstRate:5, minStock:10, batches:[], createdAt:'2025-01-01' },
  { id:'p3', name:'NPK 19:19:19', category:'Fertilizer', unit:'Bag (50kg)', purchasePrice:990, salePrice:1100, stock:60, hsnCode:'3105', gstRate:5, minStock:10, batches:[], createdAt:'2025-01-01' },
  { id:'p4', name:'Chlorpyrifos 20EC', category:'Pesticide', unit:'Litre', purchasePrice:380, salePrice:440, stock:40, hsnCode:'3808', gstRate:18, minStock:8, batches:[], createdAt:'2025-01-01' },
  { id:'p5', name:'Imidacloprid 17.8SL', category:'Pesticide', unit:'250ml', purchasePrice:190, salePrice:230, stock:30, hsnCode:'3808', gstRate:18, minStock:5, batches:[], createdAt:'2025-01-01' },
  { id:'p6', name:'BT Hybrid Cotton Seeds', category:'Seeds', unit:'Packet (450g)', purchasePrice:780, salePrice:880, stock:200, hsnCode:'1207', gstRate:0, minStock:20, batches:[], createdAt:'2025-01-01' },
  { id:'p7', name:'Groundnut Seeds (Bold)', category:'Seeds', unit:'Kg', purchasePrice:80, salePrice:98, stock:300, hsnCode:'1202', gstRate:0, minStock:30, batches:[], createdAt:'2025-01-01' },
  { id:'p8', name:'Drip Lateral Pipe 16mm', category:'Irrigation', unit:'Roll (100m)', purchasePrice:560, salePrice:650, stock:35, hsnCode:'3917', gstRate:12, minStock:5, batches:[], createdAt:'2025-01-01' },
  { id:'p9', name:'Knapsack Sprayer 16L', category:'Tools', unit:'Piece', purchasePrice:520, salePrice:650, stock:15, hsnCode:'8424', gstRate:12, minStock:3, batches:[], createdAt:'2025-01-01' },
  { id:'p10', name:'Mancozeb 75WP', category:'Pesticide', unit:'100g', purchasePrice:55, salePrice:70, stock:25, hsnCode:'3808', gstRate:18, minStock:5, batches:[], createdAt:'2025-01-01' },
];

const SEED_CUSTOMERS: Customer[] = [
  { id:'c1', name:'Ramesh Patel', phone:'9876543210', email:'ramesh@gmail.com', address:'Near Hanuman Temple', city:'Anjar', state:'Gujarat', stateCode:'24', pincode:'370110', gstNo:'', openingBalance:0, createdAt:'2025-01-01' },
  { id:'c2', name:'Bhavesh Jadeja', phone:'9988776655', email:'', address:'Main Bazaar', city:'Bhuj', state:'Gujarat', stateCode:'24', pincode:'370001', gstNo:'', openingBalance:2500, createdAt:'2025-01-01' },
  { id:'c3', name:'Naresh Bhatt', phone:'9001122334', email:'naresh@gmail.com', address:'Port Area', city:'Mundra', state:'Gujarat', stateCode:'24', pincode:'370421', gstNo:'24AAAAA0000A1Z5', openingBalance:0, createdAt:'2025-01-01' },
  { id:'c4', name:'Suresh Rajput', phone:'9712345678', email:'', address:'Village Road', city:'Rapar', state:'Gujarat', stateCode:'24', pincode:'370165', gstNo:'', openingBalance:1800, createdAt:'2025-01-02' },
];

const SEED_SUPPLIERS: Supplier[] = [
  { id:'s1', name:'Agromax Distributors', phone:'9000111222', email:'agromax@mail.com', address:'GIDC Phase 2', city:'Ahmedabad', state:'Gujarat', stateCode:'24', gstNo:'24BBBBB0000B1Z5', openingBalance:0, createdAt:'2025-01-01' },
  { id:'s2', name:'Krushi Seva Kendra', phone:'9000333444', email:'', address:'Market Yard', city:'Rajkot', state:'Gujarat', stateCode:'24', gstNo:'24CCCCC0000C1Z5', openingBalance:5000, createdAt:'2025-01-01' },
  { id:'s3', name:'Seed India Pvt Ltd', phone:'9000555666', email:'seeds@india.com', address:'Ring Road', city:'Surat', state:'Gujarat', stateCode:'24', gstNo:'24DDDDD0000D1Z5', openingBalance:0, createdAt:'2025-01-02' },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  name:'KisanKart Agro Store', tagline:'Your Trusted Agri Partner',
  address:'Shop No 5, Main Market', city:'Bhuj', state:'Gujarat',
  stateCode:'24', pincode:'370001', phone:'+91 97148 66592',
  email:'shop@agroshop.in', website:'', gstin:'24AAAAA0000A1Z5',
  panNo:'AAAAA0000A', logo:'', theme:'#16a34a',
  invoicePrefix:'INV', invoiceTerms:'Payment due within 30 days. Goods once sold will not be taken back.',
  invoiceFooter:'Thank you for your business! Visit again.',
  bankName:'State Bank of India', bankBranch:'Bhuj Branch',
  accountNo:'12345678901', ifsc:'SBIN0001234', accountType:'Current',
  upiId:'shop@upi',
};

// ─── LocalStorage Store ────────────────────────────────────────────────────────
const isBrowser = () => typeof window !== 'undefined';
function load<T>(key: string, seed: T): T {
  if (!isBrowser()) return seed;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : (() => { localStorage.setItem(key, JSON.stringify(seed)); return seed; })(); }
  catch { return seed; }
}
function save<T>(key: string, d: T) { if (isBrowser()) localStorage.setItem(key, JSON.stringify(d)); }

export const Store = {
  getProducts:  (): Product[]       => load('agro_products',  SEED_PRODUCTS),
  setProducts:  (d: Product[])      => save('agro_products',  d),
  getCustomers: (): Customer[]      => load('agro_customers', SEED_CUSTOMERS),
  setCustomers: (d: Customer[])     => save('agro_customers', d),
  getSuppliers: (): Supplier[]      => load('agro_suppliers', SEED_SUPPLIERS),
  setSuppliers: (d: Supplier[])     => save('agro_suppliers', d),
  getSales:     (): SaleInvoice[]   => load('agro_sales',     []),
  setSales:     (d: SaleInvoice[])  => save('agro_sales',     d),
  getPurchases: (): PurchaseInvoice[]=> load('agro_purchases',[]),
  setPurchases: (d: PurchaseInvoice[])=> save('agro_purchases',d),
  getLedger:    (): LedgerEntry[]   => load('agro_ledger',    []),
  setLedger:    (d: LedgerEntry[])  => save('agro_ledger',    d),
  getExpenses:  (): Expense[]       => load('agro_expenses',  []),
  setExpenses:  (d: Expense[])      => save('agro_expenses',  d),
  getSettings:  (): ShopSettings    => load('agro_settings',  DEFAULT_SETTINGS),
  setSettings:  (d: ShopSettings)   => save('agro_settings',  d),
};

// ─── Utilities ─────────────────────────────────────────────────────────────────
export const genId     = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
export const todayStr  = () => new Date().toISOString().slice(0,10);
export const fmtDate   = (d: string) => { if (!d) return ''; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}`; };
export const fmtMoney  = (n: number) => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const round2    = (n: number) => Math.round(n * 100) / 100;

export const CATEGORIES: Category[] = ['Fertilizer','Pesticide','Seeds','Irrigation','Tools','Other'];
export const PAY_MODES: PayMode[]   = ['Cash','UPI','Card','Cheque','Bank Transfer','Credit'];
export const EXPENSE_CATS = ['Rent','Salary','Electricity','Transport','Fuel','Marketing','Repairs','Miscellaneous'];
export const GST_RATES    = [0,5,12,18,28];
