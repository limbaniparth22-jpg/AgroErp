import type { SaleInvoice, PurchaseInvoice } from './store';

export interface GSTBreakdown {
  taxableAmount: number; cgst: number; sgst: number; igst: number;
  totalGST: number; supplyType: 'intrastate'|'interstate';
}

export function calcGST(taxable: number, rate: number, shopCode: string, custCode = ''): GSTBreakdown {
  const inter = !!custCode && custCode !== shopCode;
  const gstAmt = +(taxable * rate / 100).toFixed(2);
  const half   = +(gstAmt / 2).toFixed(2);
  return inter
    ? { taxableAmount:taxable, cgst:0, sgst:0, igst:gstAmt, totalGST:gstAmt, supplyType:'interstate' }
    : { taxableAmount:taxable, cgst:half, sgst:half, igst:0, totalGST:+(half*2).toFixed(2), supplyType:'intrastate' };
}

export const INDIAN_STATES = [
  {name:'Andhra Pradesh',code:'37'},{name:'Arunachal Pradesh',code:'12'},
  {name:'Assam',code:'18'},{name:'Bihar',code:'10'},{name:'Chhattisgarh',code:'22'},
  {name:'Goa',code:'30'},{name:'Gujarat',code:'24'},{name:'Haryana',code:'06'},
  {name:'Himachal Pradesh',code:'02'},{name:'Jharkhand',code:'20'},
  {name:'Karnataka',code:'29'},{name:'Kerala',code:'32'},
  {name:'Madhya Pradesh',code:'23'},{name:'Maharashtra',code:'27'},
  {name:'Manipur',code:'14'},{name:'Meghalaya',code:'17'},{name:'Mizoram',code:'15'},
  {name:'Nagaland',code:'13'},{name:'Odisha',code:'21'},{name:'Punjab',code:'03'},
  {name:'Rajasthan',code:'08'},{name:'Sikkim',code:'11'},{name:'Tamil Nadu',code:'33'},
  {name:'Telangana',code:'36'},{name:'Tripura',code:'16'},{name:'Uttar Pradesh',code:'09'},
  {name:'Uttarakhand',code:'05'},{name:'West Bengal',code:'19'},
  {name:'Delhi',code:'07'},{name:'Jammu & Kashmir',code:'01'},{name:'Ladakh',code:'38'},
  {name:'Chandigarh',code:'04'},{name:'Puducherry',code:'34'},
];

// ─── GSTR-1 Data Generation ───────────────────────────────────────────────────
export function buildGSTR1(sales: SaleInvoice[], period: string) {
  const filtered = sales.filter(s => s.date.startsWith(period));

  // B2B — registered buyers
  const b2b = filtered
    .filter(s => s.customerGstin)
    .map(s => ({
      'GSTIN of Recipient': s.customerGstin,
      'Receiver Name':      s.customerName,
      'Invoice Number':     s.invoiceNo,
      'Invoice Date':       s.date,
      'Invoice Value':      s.total,
      'Place of Supply':    s.customerStateCode,
      'Taxable Value':      s.taxableAmount,
      'CGST Amount':        s.cgst,
      'SGST Amount':        s.sgst,
      'IGST Amount':        s.igst,
      'Invoice Type':       'Regular',
    }));

  // B2C — unregistered buyers grouped by rate
  const b2cMap: Record<number,{taxable:number;cgst:number;sgst:number;igst:number}> = {};
  filtered.filter(s => !s.customerGstin).forEach(s => {
    s.items.forEach(item => {
      const r = item.gstRate;
      if (!b2cMap[r]) b2cMap[r] = {taxable:0,cgst:0,sgst:0,igst:0};
      b2cMap[r].taxable += item.taxableAmount;
      b2cMap[r].cgst    += item.cgst;
      b2cMap[r].sgst    += item.sgst;
      b2cMap[r].igst    += item.igst;
    });
  });
  const b2cSummary = Object.entries(b2cMap).map(([rate,v]) => ({
    'Type':'OE', 'GST Rate %':+rate,
    'Taxable Value':+v.taxable.toFixed(2),
    'CGST':+v.cgst.toFixed(2),'SGST':+v.sgst.toFixed(2),'IGST':+v.igst.toFixed(2),
  }));

  return { b2b, b2cSummary };
}

// ─── GSTR-3B Summary ──────────────────────────────────────────────────────────
export function buildGSTR3B(sales: SaleInvoice[], purchases: PurchaseInvoice[], period: string) {
  const ps = sales.filter(s => s.date.startsWith(period));
  const pp = purchases.filter(p => p.date.startsWith(period));

  const outward = {
    taxable: +ps.reduce((a,s)=>a+s.taxableAmount,0).toFixed(2),
    cgst:    +ps.reduce((a,s)=>a+s.cgst,0).toFixed(2),
    sgst:    +ps.reduce((a,s)=>a+s.sgst,0).toFixed(2),
    igst:    +ps.reduce((a,s)=>a+s.igst,0).toFixed(2),
    total:   +ps.reduce((a,s)=>a+s.totalGST,0).toFixed(2),
  };
  const inward = {
    taxable: +pp.reduce((a,p)=>a+p.taxableAmount,0).toFixed(2),
    cgst:    +pp.reduce((a,p)=>a+p.cgst,0).toFixed(2),
    sgst:    +pp.reduce((a,p)=>a+p.sgst,0).toFixed(2),
    igst:    +pp.reduce((a,p)=>a+p.igst,0).toFixed(2),
    total:   +pp.reduce((a,p)=>a+p.totalGST,0).toFixed(2),
  };
  const net = {
    cgst: +(outward.cgst - inward.cgst).toFixed(2),
    sgst: +(outward.sgst - inward.sgst).toFixed(2),
    igst: +(outward.igst - inward.igst).toFixed(2),
    total:+(outward.total - inward.total).toFixed(2),
  };
  return { outward, inward, net, period, invoiceCount: ps.length };
}
