"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney, fmtDate, CATEGORIES, GST_RATES } from '@/lib/store';
import type { Product, Batch, Category } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from '@/components/ui';
import { Plus, Edit2, Trash2, Package, PlusCircle, AlertTriangle } from 'lucide-react';

const EMPTY = { name:'', category:'Fertilizer' as Category, unit:'', purchasePrice:0, salePrice:0, stock:0, hsnCode:'', gstRate:5, minStock:5, batches:[] as Batch[] };

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [modal, setModal] = useState<'add'|'edit'|'batch'|null>(null);
  const [form, setForm] = useState<any>({...EMPTY});
  const [batchForm, setBatchForm] = useState({ batchNo:'', expiryDate:'', manufactureDate:'', qty:0, purchasePrice:0 });
  const [selProd, setSelProd] = useState<Product|null>(null);
  const [delId, setDelId] = useState<string|null>(null);
  const [toast, setToast] = useState<any>(null);

  useEffect(() => { setProducts(Store.getProducts()); }, []);

  const persist = (d: Product[]) => { setProducts(d); Store.setProducts(d); };
  const notify  = (msg:string, type:any='success') => setToast({msg,type});
  const f       = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}));

  const save = () => {
    if (!form.name||!form.unit||!form.salePrice) { notify('Fill required fields','error'); return; }
    if (modal==='add') persist([...products,{...form,id:genId(),createdAt:todayStr(),stock:+form.stock,purchasePrice:+form.purchasePrice,salePrice:+form.salePrice,minStock:+form.minStock,gstRate:+form.gstRate}]);
    else persist(products.map(p=>p.id===form.id?{...form,stock:+form.stock,purchasePrice:+form.purchasePrice,salePrice:+form.salePrice,minStock:+form.minStock,gstRate:+form.gstRate}:p));
    notify(modal==='add'?'Product added!':'Product updated!'); setModal(null);
  };

  const addBatch = () => {
    if (!batchForm.batchNo||!batchForm.qty||+batchForm.qty<=0) { notify('Enter batch no and qty','error'); return; }
    const batch: Batch = { id:genId(), ...batchForm, qty:+batchForm.qty, purchasePrice:+batchForm.purchasePrice };
    const newStock = selProd!.stock + +batchForm.qty;
    persist(products.map(p=>p.id===selProd!.id ? {...p,stock:newStock,batches:[...p.batches,batch]} : p));
    notify(`Batch ${batchForm.batchNo} added — Stock: ${newStock}`);
    setModal(null); setSelProd(null); setBatchForm({batchNo:'',expiryDate:'',manufactureDate:'',qty:0,purchasePrice:0});
  };

  const soon = new Date(); soon.setDate(soon.getDate()+30);
  const isExpiringSoon = (p: Product) => p.batches?.some(b => b.expiryDate && new Date(b.expiryDate) <= soon && b.qty > 0) ?? false;

  const filtered = products.filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = products.filter(p=>p.stock<=p.minStock);
  const expiring = products.filter(isExpiringSoon);

  const statusBadge = (p: Product) => {
    if (p.stock===0) return {label:'Out of Stock',cls:'badge-red'};
    if (p.stock<=p.minStock) return {label:'Low',cls:'badge-yellow'};
    return {label:'In Stock',cls:'badge-green'};
  };

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Stock & Inventory" subtitle={`${products.length} products · ${products.reduce((a,p)=>a+p.stock,0)} total units`}
          action={<button className="btn btn-primary" onClick={()=>{setForm({...EMPTY});setModal('add');}}><Plus size={16}/> Add Product</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:20}}>
          <StatCard label="Total Products" value={products.length}            color="#16a34a" icon={Package}/>
          <StatCard label="Low Stock"      value={lowStock.length}            color="#f59e0b" icon={AlertTriangle}/>
          <StatCard label="Expiring Soon"  value={expiring.length}            color="#dc2626" icon={AlertTriangle}/>
          <StatCard label="Stock Value"    value={fmtMoney(products.reduce((a,p)=>a+p.salePrice*p.stock,0))} color="#7c3aed" icon={Package}/>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:200}}><SearchBar value={search} onChange={setSearch} placeholder="Search product or HSN…"/></div>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="field-input" style={{width:'auto'}}>
            <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>Product</th><th>Cat.</th><th>HSN</th><th>Unit</th>
                <th>GST%</th><th>Purchase ₹</th><th>Sale ₹</th>
                <th>Stock</th><th>Batches</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length===0 && <tr><td colSpan={12}><EmptyState icon={Package} title="No products found"/></td></tr>}
                {filtered.map((p,i)=>{
                  const st=statusBadge(p);
                  const expiringBatch=isExpiringSoon(p);
                  return (
                    <tr key={p.id}>
                      <td style={{color:'#94a3b8',fontSize:12}}>{i+1}</td>
                      <td><span style={{fontWeight:600}}>{p.name}</span>{expiringBatch&&<span style={{marginLeft:6,fontSize:10,background:'#fee2e2',color:'#dc2626',borderRadius:4,padding:'1px 5px'}}>Expiring</span>}</td>
                      <td><span className="badge badge-green" style={{fontSize:10.5}}>{p.category}</span></td>
                      <td style={{fontFamily:'monospace',fontSize:11.5}}>{p.hsnCode||'—'}</td>
                      <td style={{color:'#64748b',fontSize:12}}>{p.unit}</td>
                      <td style={{fontWeight:600,color:'#7c3aed'}}>{p.gstRate}%</td>
                      <td>{fmtMoney(p.purchasePrice)}</td>
                      <td style={{fontWeight:700,color:'#166534'}}>{fmtMoney(p.salePrice)}</td>
                      <td style={{fontWeight:700,color:p.stock===0?'#dc2626':p.stock<=p.minStock?'#d97706':'#16a34a'}}>{p.stock}</td>
                      <td style={{fontSize:12,color:'#64748b'}}>{p.batches?.length ?? 0} batch{(p.batches?.length ?? 0) !== 1 ? 'es' : ''}</td>

                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div style={{display:'flex',gap:5}}>
                          <button title="Add Batch" className="btn btn-secondary btn-icon" onClick={()=>{setSelProd(p);setBatchForm({batchNo:'',expiryDate:'',manufactureDate:'',qty:0,purchasePrice:p.purchasePrice});setModal('batch');}}><PlusCircle size={14} color="#16a34a"/></button>
                          <button title="Edit" className="btn btn-secondary btn-icon" onClick={()=>{setForm({...p});setModal('edit');}}><Edit2 size={14} color="#2563eb"/></button>
                          <button title="Delete" className="btn btn-danger btn-icon" onClick={()=>setDelId(p.id)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(modal==='add'||modal==='edit') && (
          <Modal title={modal==='add'?'Add Product':'Edit Product'} onClose={()=>setModal(null)} maxWidth={660}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}><Field label="Product Name" required><input className="field-input" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Product name"/></Field></div>
              <Field label="Category"><select className="field-input" value={form.category} onChange={e=>f('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
              <Field label="Unit" required><input className="field-input" value={form.unit} onChange={e=>f('unit',e.target.value)} placeholder="Bag, Litre, Kg…"/></Field>
              <Field label="HSN Code"><input className="field-input" value={form.hsnCode} onChange={e=>f('hsnCode',e.target.value)} placeholder="e.g. 3102"/></Field>
              <Field label="GST Rate %"><select className="field-input" value={form.gstRate} onChange={e=>f('gstRate',e.target.value)}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</select></Field>
              <Field label="Purchase Price ₹" required><input type="number" className="field-input" value={form.purchasePrice} onChange={e=>f('purchasePrice',e.target.value)} min={0}/></Field>
              <Field label="Sale Price ₹" required><input type="number" className="field-input" value={form.salePrice} onChange={e=>f('salePrice',e.target.value)} min={0}/></Field>
              <Field label="Opening Stock"><input type="number" className="field-input" value={form.stock} onChange={e=>f('stock',e.target.value)} min={0}/></Field>
              <Field label="Min Stock Alert"><input type="number" className="field-input" value={form.minStock} onChange={e=>f('minStock',e.target.value)} min={0}/></Field>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={save}>Save</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </Modal>
        )}

        {/* Batch Modal */}
        {modal==='batch' && selProd && (
          <Modal title={`Add Batch — ${selProd.name}`} onClose={()=>{setModal(null);setSelProd(null);}} maxWidth={460}>
            <p style={{color:'#64748b',fontSize:13,marginTop:0}}>Current stock: <strong style={{color:'#16a34a'}}>{selProd.stock} {selProd.unit}</strong></p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Batch Number" required><input className="field-input" value={batchForm.batchNo} onChange={e=>setBatchForm(p=>({...p,batchNo:e.target.value}))} placeholder="e.g. B2025-001" autoFocus/></Field>
              </div>
              <Field label="Manufacture Date"><input type="date" className="field-input" value={batchForm.manufactureDate} onChange={e=>setBatchForm(p=>({...p,manufactureDate:e.target.value}))}/></Field>
              <Field label="Expiry Date"><input type="date" className="field-input" value={batchForm.expiryDate} onChange={e=>setBatchForm(p=>({...p,expiryDate:e.target.value}))}/></Field>
              <Field label="Quantity to Add" required><input type="number" className="field-input" value={batchForm.qty||''} onChange={e=>setBatchForm(p=>({...p,qty:+e.target.value}))} min={1}/></Field>
              <Field label="Purchase Price ₹"><input type="number" className="field-input" value={batchForm.purchasePrice||''} onChange={e=>setBatchForm(p=>({...p,purchasePrice:+e.target.value}))} min={0}/></Field>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={addBatch}>Add Batch + Stock</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>{setModal(null);setSelProd(null);}}>Cancel</button>
            </div>
          </Modal>
        )}

        {delId && <Confirm msg="Delete this product? This cannot be undone." onYes={()=>{persist(products.filter(p=>p.id!==delId));setDelId(null);notify('Deleted','error');}} onNo={()=>setDelId(null)}/>}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
