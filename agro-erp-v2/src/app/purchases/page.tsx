"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES, round2, GST_RATES } from '@/lib/store';
import type { PurchaseInvoice, InvoiceItem, Product, Supplier } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard, GSTBadge } from '@/components/ui';
import { calcGST } from '@/lib/gst';
import { Plus, Eye, Trash2, Truck } from 'lucide-react';

const nextNo = (p: PurchaseInvoice[]) => `PUR-${new Date().getFullYear()}-${String(p.length+1).padStart(4,'0')}`;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings]                = useState(Store.getSettings);
  const [search, setSearch]       = useState('');
  const [showCreate, setCreate]   = useState(false);
  const [view, setView]           = useState<PurchaseInvoice|null>(null);
  const [delId, setDel]           = useState<string|null>(null);
  const [toast, setToast]         = useState<any>(null);

  useEffect(()=>{ setPurchases(Store.getPurchases()); setProducts(Store.getProducts()); setSuppliers(Store.getSuppliers()); },[]);

  const notify  = (msg:string,type:any='success') => setToast({msg,type});
  const persist = (d:PurchaseInvoice[]) => { setPurchases(d); Store.setPurchases(d); };

  const doDelete = () => {
    const inv = purchases.find(p=>p.id===delId);
    if (inv) {
      const prods = Store.getProducts();
      Store.setProducts(prods.map(p=>{ const it=inv.items.find(i=>i.productId===p.id); return it?{...p,stock:Math.max(0,p.stock-it.qty)}:p; }));
      setProducts(Store.getProducts());
    }
    persist(purchases.filter(p=>p.id!==delId)); setDel(null); notify('Purchase deleted & stock reversed','error');
  };

  const filtered = purchases.filter(p=>p.invoiceNo.toLowerCase().includes(search.toLowerCase())||p.supplierName.toLowerCase().includes(search.toLowerCase())||p.billNo.toLowerCase().includes(search.toLowerCase())).slice().reverse();

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Purchase Management" subtitle={`${purchases.length} orders · Total: ${fmtMoney(purchases.reduce((a,p)=>a+p.total,0))}`}
          action={<button className="btn btn-primary" style={{background:'#7c3aed'}} onClick={()=>setCreate(true)}><Plus size={16}/> New Purchase</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:18}}>
          {[{l:'Total Purchased',v:purchases.reduce((a,p)=>a+p.total,0),c:'#7c3aed'},{l:'Amount Paid',v:purchases.reduce((a,p)=>a+p.paidAmount,0),c:'#16a34a'},{l:'Payable Due',v:purchases.reduce((a,p)=>a+p.balanceDue,0),c:'#dc2626'}].map(x=>(
            <div key={x.l} style={{background:'#fff',borderRadius:12,padding:'13px 17px',borderLeft:`4px solid ${x.c}`,boxShadow:'0 1px 5px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.4px'}}>{x.l}</div>
              <div style={{fontSize:20,fontWeight:800,color:x.c,marginTop:3}}>{fmtMoney(x.v)}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:14}}><SearchBar value={search} onChange={setSearch} placeholder="Supplier, PO# or bill no…"/></div>

        <div className="card" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>PO #</th><th>Supplier</th><th>Bill No</th><th>Date</th><th>GST Type</th><th>Taxable</th><th>GST</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={12}><EmptyState icon={Truck} title="No purchases yet"/></td></tr>}
                {filtered.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontWeight:700,color:'#7c3aed'}}>{p.invoiceNo}</td>
                    <td style={{fontWeight:500}}>{p.supplierName}</td>
                    <td style={{fontFamily:'monospace',fontSize:11.5}}>{p.billNo||'—'}</td>
                    <td style={{color:'#64748b',fontSize:12}}>{fmtDate(p.date)}</td>
                    <td><GSTBadge type={p.cgst>0?'intrastate':'interstate'}/></td>
                    <td>{fmtMoney(p.taxableAmount)}</td>
                    <td style={{color:'#7c3aed'}}>{fmtMoney(p.totalGST)}</td>
                    <td style={{fontWeight:700}}>{fmtMoney(p.total)}</td>
                    <td style={{color:'#16a34a',fontWeight:600}}>{fmtMoney(p.paidAmount)}</td>
                    <td style={{color:p.balanceDue>0?'#dc2626':'#16a34a',fontWeight:600}}>{fmtMoney(p.balanceDue)}</td>
                    <td><span className={`badge ${p.status==='paid'?'badge-green':p.status==='partial'?'badge-yellow':'badge-red'}`}>{p.status}</span></td>
                    <td><div style={{display:'flex',gap:5}}>
                      <button className="btn btn-secondary btn-icon" onClick={()=>setView(p)}><Eye size={14} color="#2563eb"/></button>
                      <button className="btn btn-danger btn-icon" onClick={()=>setDel(p.id)}><Trash2 size={14}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && <CreatePurchaseModal products={products} setProducts={setProducts} suppliers={suppliers} purchases={purchases} settings={settings}
          onSave={inv=>{ persist([...purchases,inv]); notify('Purchase recorded! Stock updated ✓'); setCreate(false); }} onClose={()=>setCreate(false)}/>}

        {view && (
          <Modal title={`Purchase ${view.invoiceNo}`} onClose={()=>setView(null)} maxWidth={660} accent="#7c3aed">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <div><strong>{view.supplierName}</strong><div style={{fontSize:12,color:'#64748b'}}>Bill: {view.billNo||'—'}</div></div>
              <div><div style={{fontSize:13}}>{fmtDate(view.date)}</div><span className={`badge ${view.status==='paid'?'badge-green':view.status==='partial'?'badge-yellow':'badge-red'}`}>{view.status}</span></div>
            </div>
            <table className="data-table" style={{marginBottom:14}}>
              <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Taxable</th><th>Amount</th></tr></thead>
              <tbody>{view.items.map((it,i)=><tr key={i}><td>{i+1}</td><td style={{fontWeight:500}}>{it.productName}</td><td>{it.qty} {it.unit}</td><td>{fmtMoney(it.rate)}</td><td>{it.gstRate}%</td><td>{fmtMoney(it.taxableAmount)}</td><td style={{fontWeight:700}}>{fmtMoney(it.amount)}</td></tr>)}</tbody>
            </table>
            <div style={{display:'flex',justifyContent:'flex-end',gap:20,fontSize:13}}>
              <span>Taxable: <strong>{fmtMoney(view.taxableAmount)}</strong></span>
              <span style={{color:'#7c3aed'}}>GST: <strong>{fmtMoney(view.totalGST)}</strong></span>
              <span style={{fontWeight:700,fontSize:15,color:'#14532d'}}>Total: {fmtMoney(view.total)}</span>
              <span style={{color:'#16a34a'}}>Paid: {fmtMoney(view.paidAmount)}</span>
              <span style={{color:'#dc2626'}}>Due: {fmtMoney(view.balanceDue)}</span>
            </div>
          </Modal>
        )}

        {delId && <Confirm msg="Delete purchase? Stock will be reversed." onYes={doDelete} onNo={()=>setDel(null)}/>}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}

function CreatePurchaseModal({products,setProducts,suppliers,purchases,settings,onSave,onClose}:any) {
  const [suppQ, setSQ]    = useState('');
  const [selS, setSel]    = useState<Supplier|null>(null);
  const [sName, setSN]    = useState('');
  const [billNo, setBN]   = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selP, setSelP]   = useState('');
  const [qty, setQty]     = useState(1);
  const [rate, setRate]   = useState(0);
  const [gstR, setGstR]   = useState(5);
  const [batchNo,setBatch]= useState('');
  const [payMode,setPay]  = useState<any>('Cash');
  const [paidAmt,setPaid] = useState('');
  const [date, setDate]   = useState(todayStr());
  const [due,  setDue]    = useState(todayStr());
  const [notes,setNotes]  = useState('');
  const [toast,setToast]  = useState<any>(null);

  const shopCode = settings.stateCode||'24';
  const suppCode = selS?.stateCode||shopCode;
  const supplyType: 'intrastate'|'interstate' = suppCode!==shopCode?'interstate':'intrastate';
  const fSupp = suppliers.filter((s:Supplier)=>s.name.toLowerCase().includes(suppQ.toLowerCase()));

  const addItem = () => {
    const prod=products.find((p:Product)=>p.id===selP);
    if(!prod){setToast({msg:'Select a product',type:'error'});return;}
    if(qty<=0){setToast({msg:'Enter valid qty',type:'error'});return;}
    const taxable = round2(rate*qty);
    const gst     = calcGST(taxable,gstR,shopCode,suppCode);
    const item: InvoiceItem = { productId:prod.id,productName:prod.name,unit:prod.unit,hsnCode:prod.hsnCode,batchNo,qty,rate,discount:0,gstRate:gstR,taxableAmount:taxable,cgst:gst.cgst,sgst:gst.sgst,igst:gst.igst,amount:round2(taxable+gst.totalGST) };
    const exist=items.findIndex(i=>i.productId===prod.id);
    if(exist>=0){const ni=[...items];const old=ni[exist];const nq=old.qty+qty;const nt=round2(old.rate*nq);const ng=calcGST(nt,old.gstRate,shopCode,suppCode);ni[exist]={...old,qty:nq,taxableAmount:nt,...ng,amount:round2(nt+ng.totalGST)};setItems(ni);}
    else setItems(p=>[...p,item]);
    setSelP('');setQty(1);setRate(0);setBatch('');
  };

  const subtotal=round2(items.reduce((a,i)=>a+i.taxableAmount,0));
  const totalGST=round2(items.reduce((a,i)=>a+i.cgst+i.sgst+i.igst,0));
  const total=round2(subtotal+totalGST);
  const paid=parseFloat(paidAmt||'0');
  const balance=round2(Math.max(0,total-paid));
  const status: 'paid'|'partial'|'unpaid'=balance===0?'paid':paid>0?'partial':'unpaid';

  const generate=()=>{
    if(!items.length){setToast({msg:'Add items',type:'error'});return;}
    const sName2=selS?selS.name:sName||'Unknown Supplier';
    const inv: PurchaseInvoice={
      id:genId(),invoiceNo:nextNo(purchases),
      supplierId:selS?.id||'',supplierName:sName2,billNo,
      date,dueDate:due,items,subtotal,totalDiscount:0,taxableAmount:subtotal,
      cgst:round2(items.reduce((a,i)=>a+i.cgst,0)),sgst:round2(items.reduce((a,i)=>a+i.sgst,0)),igst:round2(items.reduce((a,i)=>a+i.igst,0)),
      totalGST,total,paidAmount:round2(paid),balanceDue:balance,payMode,notes,status,
    };
    const prods=Store.getProducts();
    Store.setProducts(prods.map(p=>{const it=items.find(i=>i.productId===p.id);return it?{...p,stock:p.stock+it.qty}:p;}));
    setProducts(Store.getProducts());
    const ledger=Store.getLedger();
    Store.setLedger([...ledger,{id:genId(),date,type:'purchase',partyType:'supplier',partyId:selS?.id||'',partyName:sName2,description:`Purchase ${inv.invoiceNo}`,debit:0,credit:total,balance,refId:inv.id}]);
    onSave(inv);
  };

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box" style={{maxWidth:820}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 22px',borderBottom:'1px solid #f1f5f9',position:'sticky',top:0,background:'#fff',zIndex:1,borderRadius:'18px 18px 0 0'}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:'#7c3aed'}}>Record Purchase <GSTBadge type={supplyType}/></h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:22,display:'grid',gridTemplateColumns:'1fr 1fr',gap:22}}>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#7c3aed',marginBottom:10}}>Supplier</div>
            <Field label="Search Supplier"><input className="field-input" value={suppQ} onChange={e=>{setSQ(e.target.value);setSel(null);}} placeholder="Supplier name…"/></Field>
            {suppQ&&fSupp.length>0&&!selS&&(
              <div style={{border:'1px solid #e2e8f0',borderRadius:9,maxHeight:110,overflowY:'auto',background:'#fff',marginTop:4,zIndex:10,position:'relative'}}>
                {fSupp.map((s:Supplier)=>(
                  <div key={s.id} onClick={()=>{setSel(s);setSQ(s.name);}} style={{padding:'8px 13px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #f8f9fa'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='#faf5ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
                    <strong>{s.name}</strong> · {s.phone} · {s.state}
                  </div>
                ))}
              </div>
            )}
            {!selS&&<div style={{marginTop:8}}><Field label="Or Enter Supplier Name"><input className="field-input" value={sName} onChange={e=>setSN(e.target.value)} placeholder="Supplier name"/></Field></div>}
            {selS&&<div style={{background:'#ede9fe',borderRadius:9,padding:'8px 13px',fontSize:13,fontWeight:600,color:'#7c3aed',marginTop:8}}>✓ {selS.name} · {selS.state} (Code: {selS.stateCode})</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
              <Field label="Supplier Bill No"><input className="field-input" value={billNo} onChange={e=>setBN(e.target.value)} placeholder="BILL-001"/></Field>
              <Field label="Payment Mode"><select className="field-input" value={payMode} onChange={e=>setPay(e.target.value)}>{PAY_MODES.map(m=><option key={m}>{m}</option>)}</select></Field>
              <Field label="Purchase Date"><input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)}/></Field>
              <Field label="Due Date"><input type="date" className="field-input" value={due} onChange={e=>setDue(e.target.value)}/></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Amount Paid ₹"><input type="number" className="field-input" value={paidAmt} onChange={e=>setPaid(e.target.value)} placeholder={`Total: ${fmtMoney(total)}`}/></Field></div>
              <div style={{gridColumn:'1/-1'}}><Field label="Notes"><textarea className="field-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:'vertical'}}/></Field></div>
            </div>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#7c3aed',marginBottom:10}}>Items</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:8,alignItems:'end'}}>
              <Field label="Product"><select className="field-input" value={selP} onChange={e=>{setSelP(e.target.value);const p=products.find((x:Product)=>x.id===e.target.value);if(p){setRate(p.purchasePrice);setGstR(p.gstRate);}}}>
                <option value="">Select…</option>{products.map((p:Product)=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select></Field>
              <Field label="Qty"><input type="number" className="field-input" value={qty} min={1} onChange={e=>setQty(+e.target.value)}/></Field>
              <Field label="Rate ₹"><input type="number" className="field-input" value={rate} min={0} onChange={e=>setRate(+e.target.value)}/></Field>
              <Field label="GST%"><select className="field-input" value={gstR} onChange={e=>setGstR(+e.target.value)}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></Field>
              <div><button className="btn btn-primary" style={{height:40,marginTop:19,background:'#7c3aed'}} onClick={addItem}>+</button></div>
            </div>
            <Field label="Batch No (optional)"><input className="field-input" value={batchNo} onChange={e=>setBatch(e.target.value)} placeholder="e.g. B2025-001" style={{marginBottom:8}}/></Field>
            <div style={{background:'#f8fafc',borderRadius:10,minHeight:120,padding:8,maxHeight:180,overflowY:'auto',marginBottom:12}}>
              {items.length===0&&<div style={{color:'#94a3b8',textAlign:'center',padding:20,fontSize:13}}>No items</div>}
              {items.map(i=>(
                <div key={i.productId} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#fff',borderRadius:8,marginBottom:5,border:'1px solid #e2e8f0'}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{i.productName}{i.batchNo&&<span style={{fontSize:11,color:'#7c3aed',marginLeft:6}}>Batch: {i.batchNo}</span>}</div><div style={{fontSize:11.5,color:'#64748b'}}>{i.qty} × {fmtMoney(i.rate)} · GST {i.gstRate}%</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}><strong>{fmtMoney(i.amount)}</strong><button className="btn btn-danger btn-icon" onClick={()=>setItems(p=>p.filter(x=>x.productId!==i.productId))}><Trash2 size={12}/></button></div>
                </div>
              ))}
            </div>
            <div style={{background:'#4c1d95',color:'#fff',borderRadius:12,padding:'13px 16px'}}>
              {[['Taxable',fmtMoney(subtotal)],['GST',fmtMoney(totalGST)]].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12.5,opacity:.8}}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:17,borderTop:'1px solid rgba(255,255,255,.25)',paddingTop:7,marginTop:5}}><span>TOTAL</span><span>{fmtMoney(total)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,marginTop:4,opacity:.75}}><span>Paid · Due</span><span>{fmtMoney(paid)} · <span style={{color:'#fca5a5'}}>{fmtMoney(balance)}</span></span></div>
            </div>
          </div>
        </div>
        <div style={{padding:'0 22px 22px'}}>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',fontSize:15,padding:'13px',background:'#7c3aed'}} onClick={generate}>📦 Record Purchase &amp; Update Stock</button>
        </div>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
