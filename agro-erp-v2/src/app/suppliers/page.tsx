"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney } from '@/lib/store';
import type { Supplier } from '@/lib/store';
import { INDIAN_STATES } from '@/lib/gst';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from '@/components/ui';
import { Plus, Edit2, Trash2, UserCheck, Phone, MapPin, Truck } from 'lucide-react';

const EMPTY: Omit<Supplier,'id'|'createdAt'> = { name:'',phone:'',email:'',address:'',city:'',state:'Gujarat',stateCode:'24',gstNo:'',openingBalance:0 };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<'add'|'edit'|null>(null);
  const [form, setForm]           = useState<any>({...EMPTY});
  const [delId, setDelId]         = useState<string|null>(null);
  const [toast, setToast]         = useState<any>(null);

  useEffect(()=>{ setSuppliers(Store.getSuppliers()); setPurchases(Store.getPurchases()); },[]);

  const persist=(d:Supplier[])=>{setSuppliers(d);Store.setSuppliers(d);};
  const notify=(msg:string,type:any='success')=>setToast({msg,type});
  const f=(k:string,v:any)=>setForm((p:any)=>({...p,[k]:v}));

  const save=()=>{
    if(!form.name||!form.phone){notify('Name and phone required','error');return;}
    if(modal==='add') persist([...suppliers,{...form,id:genId(),createdAt:todayStr(),openingBalance:+form.openingBalance}]);
    else persist(suppliers.map(s=>s.id===form.id?{...form,openingBalance:+form.openingBalance}:s));
    notify(modal==='add'?'Supplier added!':'Updated!'); setModal(null);
  };

  const getPayable=(id:string)=>{
    const s=suppliers.find(x=>x.id===id);
    const total=purchases.filter(p=>p.supplierId===id).reduce((a,p)=>a+p.total,0);
    const paid =purchases.filter(p=>p.supplierId===id).reduce((a,p)=>a+p.paidAmount,0);
    return (s?.openingBalance||0)+total-paid;
  };

  const filtered=suppliers.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.phone.includes(search));

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Supplier Management" subtitle={`${suppliers.length} suppliers`}
          action={<button className="btn btn-primary" style={{background:'#7c3aed'}} onClick={()=>{setForm({...EMPTY});setModal('add');}}><Plus size={16}/> Add Supplier</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Suppliers" value={suppliers.length} color="#7c3aed" icon={UserCheck}/>
          <StatCard label="Total Payable"   value={fmtMoney(suppliers.reduce((a,s)=>{const b=getPayable(s.id);return a+(b>0?b:0);},0))} color="#dc2626" icon={Truck}/>
          <StatCard label="Purchase Orders" value={purchases.length} color="#16a34a" icon={Truck}/>
        </div>

        <div style={{marginBottom:16}}><SearchBar value={search} onChange={setSearch} placeholder="Supplier name or phone…"/></div>

        {filtered.length===0 ? <div className="card"><EmptyState icon={UserCheck} title="No suppliers found"/></div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {filtered.map(s=>{
              const payable=getPayable(s.id);
              const biz=purchases.filter(p=>p.supplierId===s.id).reduce((a,p)=>a+p.total,0);
              const cnt=purchases.filter(p=>p.supplierId===s.id).length;
              return (
                <div key={s.id} className="card" style={{padding:'18px 20px',transition:'transform .18s,box-shadow .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 24px rgba(0,0,0,.1)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow=''}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div style={{display:'flex',gap:11,alignItems:'center'}}>
                      <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#7c3aed'}}>{s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15}}>{s.name}</div>
                        <div style={{fontSize:12,color:'#64748b',display:'flex',alignItems:'center',gap:4,marginTop:2}}><Phone size={11}/>{s.phone}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      <button className="btn btn-secondary btn-icon" onClick={()=>{setForm({...s});setModal('edit');}}><Edit2 size={13} color="#7c3aed"/></button>
                      <button className="btn btn-danger btn-icon" onClick={()=>setDelId(s.id)}><Trash2 size={13}/></button>
                    </div>
                  </div>
                  {(s.city||s.state)&&<div style={{fontSize:12,color:'#64748b',display:'flex',gap:5,marginBottom:6}}><MapPin size={12} style={{marginTop:1}}/>{[s.city,s.state].filter(Boolean).join(', ')}{s.stateCode&&<span style={{color:'#94a3b8'}}>({s.stateCode})</span>}</div>}
                  {s.gstNo&&<div style={{fontSize:11,background:'#faf5ff',color:'#7c3aed',borderRadius:6,padding:'2px 8px',display:'inline-block',marginBottom:8,fontFamily:'monospace'}}>GSTIN: {s.gstNo}</div>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,paddingTop:10,borderTop:'1px solid #f1f5f9'}}>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Orders</div><div style={{fontWeight:700,fontSize:16}}>{cnt}</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Purchased</div><div style={{fontWeight:700,fontSize:12,color:'#7c3aed'}}>{fmtMoney(biz)}</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Payable</div><div style={{fontWeight:700,fontSize:12,color:payable>0?'#dc2626':'#16a34a'}}>{payable>0?fmtMoney(payable):'Clear'}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {modal&&(
          <Modal title={modal==='add'?'Add Supplier':'Edit Supplier'} onClose={()=>setModal(null)} maxWidth={560} accent="#7c3aed">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}><Field label="Supplier Name" required><input className="field-input" value={form.name} onChange={e=>f('name',e.target.value)} autoFocus/></Field></div>
              <Field label="Phone" required><input className="field-input" value={form.phone} onChange={e=>f('phone',e.target.value)}/></Field>
              <Field label="Email"><input className="field-input" type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Address"><input className="field-input" value={form.address} onChange={e=>f('address',e.target.value)}/></Field></div>
              <Field label="City"><input className="field-input" value={form.city} onChange={e=>f('city',e.target.value)}/></Field>
              <Field label="State"><select className="field-input" value={form.state} onChange={e=>{const st=INDIAN_STATES.find(x=>x.name===e.target.value);f('state',e.target.value);if(st)f('stateCode',st.code);}}>
                {INDIAN_STATES.map(s=><option key={s.code}>{s.name}</option>)}
              </select></Field>
              <Field label="State Code"><input className="field-input" value={form.stateCode} onChange={e=>f('stateCode',e.target.value)}/></Field>
              <Field label="GSTIN"><input className="field-input" value={form.gstNo} onChange={e=>f('gstNo',e.target.value)} style={{fontFamily:'monospace'}}/></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Opening Balance ₹"><input type="number" className="field-input" value={form.openingBalance} onChange={e=>f('openingBalance',e.target.value)}/></Field></div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center',background:'#7c3aed'}} onClick={save}>Save</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </Modal>
        )}

        {delId&&<Confirm msg="Delete supplier?" onYes={()=>{persist(suppliers.filter(s=>s.id!==delId));setDelId(null);notify('Deleted','error');}} onNo={()=>setDelId(null)}/>}
        {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
