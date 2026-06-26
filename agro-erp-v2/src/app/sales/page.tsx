"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES, round2 } from '@/lib/store';
import type { SaleInvoice, InvoiceItem, Product, Customer } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, GSTBadge } from '@/components/ui';
import { printInvoice } from '@/lib/pdf';
import { calcGST } from '@/lib/gst';
import { Plus, Eye, Trash2, Printer, ShoppingCart, CheckCircle } from 'lucide-react';

const nextNo = (sales: SaleInvoice[]) => `INV-${new Date().getFullYear()}-${String(sales.length+1).padStart(4,'0')}`;

export default function SalesPage() {
  const [sales, setSales]         = useState<SaleInvoice[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings]                = useState(Store.getSettings);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [showCreate, setCreate]   = useState(false);
  const [viewInv, setView]        = useState<SaleInvoice|null>(null);
  const [delId, setDel]           = useState<string|null>(null);
  const [toast, setToast]         = useState<any>(null);

  useEffect(()=>{ setSales(Store.getSales()); setProducts(Store.getProducts()); setCustomers(Store.getCustomers()); },[]);

  const notify  = (msg:string,type:any='success') => setToast({msg,type});
  const persist = (d:SaleInvoice[]) => { setSales(d); Store.setSales(d); };

  const doDelete = () => {
    const inv = sales.find(s=>s.id===delId);
    if (inv) {
      const prods = Store.getProducts();
      Store.setProducts(prods.map(p=>{ const it=inv.items.find(i=>i.productId===p.id); return it?{...p,stock:p.stock+it.qty}:p; }));
      setProducts(Store.getProducts());
    }
    persist(sales.filter(s=>s.id!==delId)); setDel(null); notify('Invoice deleted & stock restored','error');
  };

  const filtered = sales.filter(s=>(filter==='all'||s.status===filter)&&(s.invoiceNo.toLowerCase().includes(search.toLowerCase())||s.customerName.toLowerCase().includes(search.toLowerCase()))).slice().reverse();

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Sales & Billing" subtitle={`${sales.length} invoices · Revenue: ${fmtMoney(sales.reduce((a,s)=>a+s.total,0))}`}
          action={<button className="btn btn-primary" onClick={()=>setCreate(true)}><Plus size={16}/> New Invoice</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18}}>
          {[{l:'Total Billed',v:sales.reduce((a,s)=>a+s.total,0),c:'#16a34a'},{l:'Received',v:sales.reduce((a,s)=>a+s.paidAmount,0),c:'#2563eb'},{l:'Outstanding',v:sales.reduce((a,s)=>a+s.balanceDue,0),c:'#dc2626'}].map(x=>(
            <div key={x.l} style={{background:'#fff',borderRadius:12,padding:'13px 17px',borderLeft:`4px solid ${x.c}`,boxShadow:'0 1px 5px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.4px'}}>{x.l}</div>
              <div style={{fontSize:20,fontWeight:800,color:x.c,marginTop:3}}>{fmtMoney(x.v)}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} placeholder="Invoice # or customer…"/></div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="field-input" style={{width:'auto'}}>
            <option value="all">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>GST Type</th><th>Taxable</th><th>GST</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={11}><EmptyState icon={ShoppingCart} title="No invoices yet"/></td></tr>}
                {filtered.map(inv=>(
                  <tr key={inv.id}>
                    <td style={{fontWeight:700,color:'#166534'}}>{inv.invoiceNo}</td>
                    <td><div style={{fontWeight:500}}>{inv.customerName}</div><div style={{fontSize:11,color:'#94a3b8'}}>{inv.customerPhone}</div></td>
                    <td style={{color:'#64748b',fontSize:12}}>{fmtDate(inv.date)}</td>
                    <td><GSTBadge type={inv.supplyType}/></td>
                    <td>{fmtMoney(inv.taxableAmount)}</td>
                    <td style={{color:'#7c3aed'}}>{fmtMoney(inv.totalGST)}</td>
                    <td style={{fontWeight:700}}>{fmtMoney(inv.total)}</td>
                    <td style={{color:'#16a34a',fontWeight:600}}>{fmtMoney(inv.paidAmount)}</td>
                    <td style={{color:inv.balanceDue>0?'#dc2626':'#16a34a',fontWeight:600}}>{fmtMoney(inv.balanceDue)}</td>
                    <td><span className={`badge ${inv.status==='paid'?'badge-green':inv.status==='partial'?'badge-yellow':'badge-red'}`}>{inv.status}</span></td>
                    <td>
                      <div style={{display:'flex',gap:5}}>
                        <button className="btn btn-secondary btn-icon" onClick={()=>setView(inv)}><Eye size={14} color="#2563eb"/></button>
                        <button className="btn btn-secondary btn-icon" onClick={()=>printInvoice(inv,settings)}><Printer size={14} color="#7c3aed"/></button>
                        <button className="btn btn-danger btn-icon" onClick={()=>setDel(inv.id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && <CreateModal products={products} setProducts={setProducts} customers={customers} sales={sales} settings={settings}
          onSave={inv=>{ persist([...sales,inv]); notify('Invoice created! 🎉'); setCreate(false); }} onClose={()=>setCreate(false)}/>}

        {viewInv && <ViewModal inv={viewInv} settings={settings} onClose={()=>setView(null)}/>}
        {delId && <Confirm msg="Delete invoice? Stock will be restored." onYes={doDelete} onNo={()=>setDel(null)}/>}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateModal({products,setProducts,customers,sales,settings,onSave,onClose}:any) {
  const [custQ, setCQ]       = useState('');
  const [selC, setSelC]      = useState<Customer|null>(null);
  const [wName, setWN]       = useState('');
  const [wPhone,setWP]       = useState('');
  const [wGST, setWG]        = useState('');
  const [wState,setWS]       = useState('');
  const [items, setItems]    = useState<InvoiceItem[]>([]);
  const [selP, setSelP]      = useState('');
  const [qty, setQty]        = useState(1);
  const [disc, setDisc]      = useState(0);
  const [payMode,setPay]     = useState<any>('Cash');
  const [paidAmt,setPaid]    = useState('');
  const [date, setDate]      = useState(todayStr());
  const [due,  setDue]       = useState(todayStr());
  const [notes,setNotes]     = useState('');
  const [toast,setToast]     = useState<any>(null);

  const shopCode  = settings.stateCode || '24';
  const custCode  = selC ? selC.stateCode : wState;
  const isInter   = !!custCode && custCode !== shopCode;
  const supplyType: 'intrastate'|'interstate' = isInter ? 'interstate' : 'intrastate';

  const fCust = customers.filter((c:Customer)=>c.name.toLowerCase().includes(custQ.toLowerCase())||c.phone.includes(custQ));

  const addItem = () => {
    const prod = products.find((p:Product)=>p.id===selP);
    if (!prod) { setToast({msg:'Select a product',type:'error'}); return; }
    if (qty<=0||qty>prod.stock) { setToast({msg:`Only ${prod.stock} ${prod.unit} available`,type:'error'}); return; }
    const base      = round2(prod.salePrice * qty);
    const dAmt      = round2(base * disc / 100);
    const taxable   = round2(base - dAmt);
    const gst       = calcGST(taxable, prod.gstRate, shopCode, custCode);
    const item: InvoiceItem = {
      productId:prod.id, productName:prod.name, unit:prod.unit,
      hsnCode:prod.hsnCode, batchNo:'',
      qty, rate:prod.salePrice, discount:disc, gstRate:prod.gstRate,
      taxableAmount:taxable, cgst:gst.cgst, sgst:gst.sgst, igst:gst.igst,
      amount:round2(taxable+gst.totalGST),
    };
    const exist = items.findIndex(i=>i.productId===prod.id);
    if (exist>=0) {
      const ni=[...items]; const old=ni[exist];
      const newQty=old.qty+qty;
      if (newQty>prod.stock){setToast({msg:'Exceeds stock',type:'error'});return;}
      const nb=round2(prod.salePrice*newQty); const nd=round2(nb*old.discount/100); const nt=round2(nb-nd);
      const ng=calcGST(nt,prod.gstRate,shopCode,custCode);
      ni[exist]={...old,qty:newQty,taxableAmount:nt,cgst:ng.cgst,sgst:ng.sgst,igst:ng.igst,amount:round2(nt+ng.totalGST)};
      setItems(ni);
    } else setItems(p=>[...p,item]);
    setSelP(''); setQty(1); setDisc(0);
  };

  const subtotal    = round2(items.reduce((a,i)=>a+i.rate*i.qty,0));
  const totalDisc   = round2(items.reduce((a,i)=>a+(i.rate*i.qty*i.discount/100),0));
  const taxable     = round2(subtotal-totalDisc);
  const cgst        = round2(items.reduce((a,i)=>a+i.cgst,0));
  const sgst        = round2(items.reduce((a,i)=>a+i.sgst,0));
  const igst        = round2(items.reduce((a,i)=>a+i.igst,0));
  const totalGST    = round2(cgst+sgst+igst);
  const total       = round2(taxable+totalGST);
  const paid        = parseFloat(paidAmt||'0');
  const balance     = round2(Math.max(0,total-paid));
  const status: 'paid'|'partial'|'unpaid' = balance===0?'paid':paid>0?'partial':'unpaid';

  const generate = () => {
    if (!items.length){setToast({msg:'Add at least one item',type:'error'});return;}
    const custName  = selC?selC.name:wName||'Walk-in Customer';
    const custPhone = selC?selC.phone:wPhone;
    const custGST   = selC?selC.gstNo:wGST;
    const custSt    = selC?selC.stateCode:wState;
    const inv: SaleInvoice = {
      id:genId(), invoiceNo:nextNo(sales),
      customerId:selC?.id||'', customerName:custName, customerPhone:custPhone,
      customerGstin:custGST, customerStateCode:custSt,
      date, dueDate:due, items, subtotal, totalDiscount:totalDisc,
      taxableAmount:taxable, cgst, sgst, igst, totalGST, total,
      paidAmount:round2(paid), balanceDue:balance,
      payMode, supplyType, notes, status,
    };
    // Deduct stock
    const prods=Store.getProducts();
    Store.setProducts(prods.map(p=>{const it=items.find(i=>i.productId===p.id);return it?{...p,stock:p.stock-it.qty}:p;}));
    setProducts(Store.getProducts());
    // Ledger
    const ledger=Store.getLedger();
    Store.setLedger([...ledger,{id:genId(),date,type:'sale',partyType:'customer',partyId:selC?.id||'',partyName:custName,description:`Sale ${inv.invoiceNo}`,debit:total,credit:0,balance,refId:inv.id}]);
    onSave(inv);
  };

  const upiUrl = settings.upiId && balance>0
    ? `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.name)}&am=${balance}&tn=${nextNo(sales)}`
    : '';

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box" style={{maxWidth:880}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 22px',borderBottom:'1px solid #f1f5f9',position:'sticky',top:0,background:'#fff',zIndex:1,borderRadius:'18px 18px 0 0'}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#166534'}}>New Sale Invoice <GSTBadge type={supplyType}/></h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:22,display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {/* Left */}
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#166534',marginBottom:12,paddingBottom:6,borderBottom:'1px solid #f1f5f9'}}>Customer</div>
            <div style={{marginBottom:8}}><Field label="Search Customer"><input className="field-input" value={custQ} onChange={e=>{setCQ(e.target.value);setSelC(null);}} placeholder="Name or phone…"/></Field></div>
            {custQ&&fCust.length>0&&!selC&&(
              <div style={{border:'1px solid #e2e8f0',borderRadius:9,maxHeight:120,overflowY:'auto',background:'#fff',marginBottom:8,zIndex:10,position:'relative'}}>
                {fCust.map((c:Customer)=>(
                  <div key={c.id} onClick={()=>{setSelC(c);setCQ(c.name);}} style={{padding:'8px 13px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #f8f9fa'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='#f0fdf4'}
                    onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
                    <strong>{c.name}</strong> · {c.phone} <span style={{fontSize:11,color:'#94a3b8'}}>{c.state}</span>
                  </div>
                ))}
              </div>
            )}
            {!selC ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <Field label="Name"><input className="field-input" value={wName} onChange={e=>setWN(e.target.value)} placeholder="Walk-in name"/></Field>
                <Field label="Phone"><input className="field-input" value={wPhone} onChange={e=>setWP(e.target.value)} placeholder="Mobile"/></Field>
                <Field label="GSTIN"><input className="field-input" value={wGST} onChange={e=>setWG(e.target.value)} placeholder="Optional"/></Field>
                <Field label="State Code"><input className="field-input" value={wState} onChange={e=>setWS(e.target.value)} placeholder="e.g. 24"/></Field>
              </div>
            ) : (
              <div style={{background:'#dcfce7',borderRadius:9,padding:'8px 13px',fontSize:13,fontWeight:600,color:'#166534',marginBottom:8}}>
                ✓ {selC.name} · {selC.phone} · {selC.state} (Code: {selC.stateCode})
              </div>
            )}

            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Field label="Date"><input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)}/></Field>
              <Field label="Due Date"><input type="date" className="field-input" value={due} onChange={e=>setDue(e.target.value)}/></Field>
              <Field label="Payment Mode"><select className="field-input" value={payMode} onChange={e=>setPay(e.target.value)}>{PAY_MODES.map(m=><option key={m}>{m}</option>)}</select></Field>
              <Field label="Amount Paid ₹"><input type="number" className="field-input" value={paidAmt} onChange={e=>setPaid(e.target.value)} placeholder={`Max ${fmtMoney(total)}`}/></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Notes"><textarea className="field-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:'vertical'}}/></Field></div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#166534',marginBottom:12,paddingBottom:6,borderBottom:'1px solid #f1f5f9'}}>Add Items</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:6,marginBottom:8,alignItems:'end'}}>
              <Field label="Product">
                <select className="field-input" value={selP} onChange={e=>setSelP(e.target.value)}>
                  <option value="">Select…</option>
                  {products.map((p:Product)=><option key={p.id} value={p.id}>{p.name} ({p.stock}) GST:{p.gstRate}%</option>)}
                </select>
              </Field>
              <Field label="Qty"><input type="number" className="field-input" value={qty} min={1} onChange={e=>setQty(+e.target.value)}/></Field>
              <Field label="Disc%"><input type="number" className="field-input" value={disc} min={0} max={100} onChange={e=>setDisc(+e.target.value)}/></Field>
              <div><button className="btn btn-primary" onClick={addItem} style={{height:40,marginTop:19}}>+</button></div>
            </div>

            <div style={{background:'#f8fafc',borderRadius:10,minHeight:130,padding:8,maxHeight:200,overflowY:'auto',marginBottom:12}}>
              {items.length===0&&<div style={{color:'#94a3b8',textAlign:'center',padding:20,fontSize:13}}>No items added</div>}
              {items.map(i=>(
                <div key={i.productId} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#fff',borderRadius:8,marginBottom:5,border:'1px solid #e2e8f0'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{i.productName}</div>
                    <div style={{fontSize:11.5,color:'#64748b'}}>
                      {i.qty} × {fmtMoney(i.rate)} {i.discount>0?`(${i.discount}% off)`:''} · GST {i.gstRate}%
                      {i.cgst>0?` · CGST ${fmtMoney(i.cgst)} SGST ${fmtMoney(i.sgst)}`:` · IGST ${fmtMoney(i.igst)}`}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <strong style={{fontSize:14}}>{fmtMoney(i.amount)}</strong>
                    <button className="btn btn-danger btn-icon" onClick={()=>setItems(p=>p.filter(x=>x.productId!==i.productId))}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{background:'#14532d',color:'#fff',borderRadius:12,padding:'14px 17px'}}>
              {[[`Subtotal`,fmtMoney(subtotal)],[`Discount`,`-${fmtMoney(totalDisc)}`],[`Taxable`,fmtMoney(taxable)],
                supplyType==='intrastate'?[`CGST + SGST`,`${fmtMoney(cgst)} + ${fmtMoney(sgst)}`]:[`IGST`,fmtMoney(igst)],
              ].map(([k,v]:any)=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12.5,opacity:.8}}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:18,borderTop:'1px solid rgba(255,255,255,.25)',paddingTop:8,marginTop:6}}><span>TOTAL</span><span>{fmtMoney(total)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,marginTop:5,opacity:.75}}>
                <span>Paid · Balance</span><span>{fmtMoney(paid)} · <span style={{color:'#fca5a5'}}>{fmtMoney(balance)}</span></span>
              </div>
              <div style={{textAlign:'center',marginTop:6}}>
                <span style={{fontSize:11,fontWeight:700,background:status==='paid'?'#4ade80':status==='partial'?'#fbbf24':'#f87171',color:'#14532d',borderRadius:20,padding:'2px 12px'}}>{status.toUpperCase()}</span>
              </div>
            </div>

            {/* UPI QR */}
            {settings.upiId && balance>0 && payMode==='UPI' && (
              <div style={{marginTop:12,textAlign:'center',background:'#f0fdf4',borderRadius:10,padding:'10px 0'}}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`} width={120} height={120} alt="UPI QR" style={{borderRadius:8}}/>
                <div style={{fontSize:12,fontWeight:600,color:'#166534',marginTop:4}}>Scan & Pay {fmtMoney(balance)}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{settings.upiId}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{padding:'0 22px 22px'}}>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',fontSize:15,padding:'13px'}} onClick={generate}>🧾 Generate Invoice</button>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

function ViewModal({inv,settings,onClose}:{inv:SaleInvoice;settings:any;onClose:()=>void}) {
  return (
    <Modal title={`Invoice ${inv.invoiceNo}`} onClose={onClose} maxWidth={680}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
        <div><strong>{inv.customerName}</strong><div style={{fontSize:12,color:'#64748b'}}>{inv.customerPhone}</div>{inv.customerGstin&&<div style={{fontSize:11,fontFamily:'monospace',color:'#7c3aed'}}>GSTIN: {inv.customerGstin}</div>}</div>
        <div style={{textAlign:'right'}}><div style={{fontSize:13}}>{fmtDate(inv.date)}</div><GSTBadge type={inv.supplyType}/><span className={`badge ${inv.status==='paid'?'badge-green':inv.status==='partial'?'badge-yellow':'badge-red'}`} style={{marginLeft:6}}>{inv.status}</span></div>
      </div>
      <table className="data-table" style={{marginBottom:14}}>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Taxable</th><th>Amount</th></tr></thead>
        <tbody>{inv.items.map((it,i)=>(
          <tr key={i}><td>{i+1}</td><td style={{fontWeight:500}}>{it.productName}</td><td>{it.qty} {it.unit}</td><td>{fmtMoney(it.rate)}</td><td>{it.discount}%</td><td>{it.gstRate}%</td><td>{fmtMoney(it.taxableAmount)}</td><td style={{fontWeight:700}}>{fmtMoney(it.amount)}</td></tr>
        ))}</tbody>
      </table>
      <div style={{maxWidth:280,marginLeft:'auto'}}>
        {[[`Taxable`,fmtMoney(inv.taxableAmount)],inv.cgst>0?[`CGST`,fmtMoney(inv.cgst)]:null,inv.sgst>0?[`SGST`,fmtMoney(inv.sgst)]:null,inv.igst>0?[`IGST`,fmtMoney(inv.igst)]:null].filter(Boolean).map(([k,v]:any)=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid #f1f5f9'}}><span style={{color:'#64748b'}}>{k}</span><span>{v}</span></div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:16,color:'#166634',padding:'8px 0'}}><span>TOTAL</span><span>{fmtMoney(inv.total)}</span></div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
          <span style={{color:'#16a34a',fontWeight:600}}>Paid: {fmtMoney(inv.paidAmount)}</span>
          <span style={{color:'#dc2626',fontWeight:600}}>Due: {fmtMoney(inv.balanceDue)}</span>
        </div>
      </div>
      <button className="btn btn-primary" style={{width:'100%',marginTop:16,justifyContent:'center'}} onClick={()=>printInvoice(inv,settings)}>
        <Printer size={15}/> Print / Download Invoice
      </button>
    </Modal>
  );
}
