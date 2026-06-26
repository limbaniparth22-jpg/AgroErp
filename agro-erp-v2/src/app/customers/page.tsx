"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney } from '@/lib/store';
import type { Customer } from '@/lib/store';
import { INDIAN_STATES } from '@/lib/gst';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from '@/components/ui';
import { Plus, Edit2, Trash2, Users, Phone, MapPin, CreditCard } from 'lucide-react';

const EMPTY: Omit<Customer,'id'|'createdAt'> = { name:'',phone:'',email:'',address:'',city:'',state:'Gujarat',stateCode:'24',pincode:'',gstNo:'',openingBalance:0 };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales,     setSales]     = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<'add'|'edit'|null>(null);
  const [form, setForm]           = useState<any>({...EMPTY});
  const [delId, setDelId]         = useState<string|null>(null);
  const [toast, setToast]         = useState<any>(null);

  useEffect(()=>{ setCustomers(Store.getCustomers()); setSales(Store.getSales()); },[]);

  const persist = (d:Customer[]) => { setCustomers(d); Store.setCustomers(d); };
  const notify  = (msg:string,type:any='success') => setToast({msg,type});
  const f       = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}));

  const save = () => {
    if(!form.name||!form.phone){notify('Name and phone required','error');return;}
    if(modal==='add') persist([...customers,{...form,id:genId(),createdAt:todayStr(),openingBalance:+form.openingBalance}]);
    else persist(customers.map(c=>c.id===form.id?{...form,openingBalance:+form.openingBalance}:c));
    notify(modal==='add'?'Customer added!':'Customer updated!'); setModal(null);
  };

  const getBalance = (id:string) => {
    const c=customers.find(x=>x.id===id);
    const total=sales.filter(s=>s.customerId===id).reduce((a,s)=>a+s.total,0);
    const paid =sales.filter(s=>s.customerId===id).reduce((a,s)=>a+s.paidAmount,0);
    return (c?.openingBalance||0)+total-paid;
  };

  const filtered = customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search)||c.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Customer Management" subtitle={`${customers.length} customers registered`}
          action={<button className="btn btn-primary" onClick={()=>{setForm({...EMPTY});setModal('add');}}><Plus size={16}/> Add Customer</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Customers"  value={customers.length}                                          color="#2563eb" icon={Users}/>
          <StatCard label="Total Receivable" value={fmtMoney(customers.reduce((a,c)=>{const b=getBalance(c.id);return a+(b>0?b:0);},0))} color="#dc2626" icon={CreditCard}/>
          <StatCard label="Total Business"   value={fmtMoney(sales.reduce((a,s)=>a+s.total,0))}              color="#16a34a" icon={CreditCard}/>
        </div>

        <div style={{marginBottom:16}}><SearchBar value={search} onChange={setSearch} placeholder="Name, phone or city…"/></div>

        {filtered.length===0 ? <div className="card"><EmptyState icon={Users} title="No customers found"/></div> : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {filtered.map(c=>{
              const bal=getBalance(c.id);
              const biz=sales.filter(s=>s.customerId===c.id).reduce((a,s)=>a+s.total,0);
              const cnt=sales.filter(s=>s.customerId===c.id).length;
              return (
                <div key={c.id} className="card" style={{padding:'18px 20px',transition:'transform .18s,box-shadow .18s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 24px rgba(0,0,0,.1)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.boxShadow=''}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div style={{display:'flex',gap:11,alignItems:'center'}}>
                      <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,#dbeafe,#bfdbfe)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#1d4ed8'}}>{c.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15}}>{c.name}</div>
                        <div style={{fontSize:12,color:'#64748b',display:'flex',alignItems:'center',gap:4,marginTop:2}}><Phone size={11}/>{c.phone}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      <button className="btn btn-secondary btn-icon" onClick={()=>{setForm({...c});setModal('edit');}}><Edit2 size={13} color="#2563eb"/></button>
                      <button className="btn btn-danger btn-icon" onClick={()=>setDelId(c.id)}><Trash2 size={13}/></button>
                    </div>
                  </div>
                  {(c.city||c.state)&&<div style={{fontSize:12,color:'#64748b',display:'flex',gap:5,marginBottom:6}}><MapPin size={12} style={{marginTop:1,flexShrink:0}}/>{[c.city,c.state].filter(Boolean).join(', ')}{c.stateCode&&<span style={{color:'#94a3b8'}}>({c.stateCode})</span>}</div>}
                  {c.gstNo&&<div style={{fontSize:11,background:'#f0fdf4',color:'#166534',borderRadius:6,padding:'2px 8px',display:'inline-block',marginBottom:8,fontFamily:'monospace'}}>GSTIN: {c.gstNo}</div>}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,paddingTop:10,borderTop:'1px solid #f1f5f9',marginTop:4}}>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Invoices</div><div style={{fontWeight:700,fontSize:16}}>{cnt}</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Business</div><div style={{fontWeight:700,fontSize:12,color:'#16a34a'}}>{fmtMoney(biz)}</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>Balance</div><div style={{fontWeight:700,fontSize:12,color:bal>0?'#dc2626':bal<0?'#16a34a':'#64748b'}}>{bal>0?`Due ${fmtMoney(bal)}`:bal<0?`Adv ${fmtMoney(-bal)}`:'Clear'}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {modal&&(
          <Modal title={modal==='add'?'Add Customer':'Edit Customer'} onClose={()=>setModal(null)} maxWidth={560}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}><Field label="Full Name" required><input className="field-input" value={form.name} onChange={e=>f('name',e.target.value)} autoFocus/></Field></div>
              <Field label="Phone" required><input className="field-input" value={form.phone} onChange={e=>f('phone',e.target.value)} maxLength={10}/></Field>
              <Field label="Email"><input className="field-input" type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Address"><input className="field-input" value={form.address} onChange={e=>f('address',e.target.value)} placeholder="Street address"/></Field></div>
              <Field label="City"><input className="field-input" value={form.city} onChange={e=>f('city',e.target.value)} placeholder="Bhuj, Anjar…"/></Field>
              <Field label="Pincode"><input className="field-input" value={form.pincode} onChange={e=>f('pincode',e.target.value)} maxLength={6}/></Field>
              <Field label="State"><select className="field-input" value={form.state} onChange={e=>{const s=INDIAN_STATES.find(x=>x.name===e.target.value);f('state',e.target.value);if(s)f('stateCode',s.code);}}>
                {INDIAN_STATES.map(s=><option key={s.code}>{s.name}</option>)}
              </select></Field>
              <Field label="State Code"><input className="field-input" value={form.stateCode} onChange={e=>f('stateCode',e.target.value)} placeholder="e.g. 24"/></Field>
              <Field label="GSTIN (if registered)"><input className="field-input" value={form.gstNo} onChange={e=>f('gstNo',e.target.value)} style={{fontFamily:'monospace'}} placeholder="24AAAAA0000A1Z5"/></Field>
              <Field label="Opening Balance ₹"><input type="number" className="field-input" value={form.openingBalance} onChange={e=>f('openingBalance',e.target.value)}/></Field>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={save}>Save Customer</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </Modal>
        )}

        {delId&&<Confirm msg="Delete this customer?" onYes={()=>{persist(customers.filter(c=>c.id!==delId));setDelId(null);notify('Deleted','error');}} onNo={()=>setDelId(null)}/>}
        {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
