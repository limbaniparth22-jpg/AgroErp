"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES, EXPENSE_CATS } from '@/lib/store';
import type { Expense } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from '@/components/ui';
import { Plus, Trash2, DollarSign, TrendingDown, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS=['#16a34a','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2','#be185d','#92400e'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch]     = useState('');
  const [catF, setCatF]         = useState('All');
  const [modal, setModal]       = useState(false);
  const [delId, setDelId]       = useState<string|null>(null);
  const [toast, setToast]       = useState<any>(null);
  const [form, setForm]         = useState({ date:todayStr(), category:EXPENSE_CATS[0], description:'', amount:'', payMode:'Cash' });

  useEffect(()=>{ setExpenses(Store.getExpenses()); },[]);

  const persist=(d:Expense[])=>{setExpenses(d);Store.setExpenses(d);};
  const f=(k:string,v:any)=>setForm(p=>({...p,[k]:v}));

  const save=()=>{
    if(!form.description||!form.amount||+form.amount<=0){setToast({msg:'Fill all fields',type:'error'});return;}
    const exp: Expense={id:genId(),date:form.date,category:form.category,description:form.description,amount:parseFloat(form.amount),payMode:form.payMode as any};
    persist([...expenses,exp]);
    const l=Store.getLedger();
    Store.setLedger([...l,{id:genId(),date:form.date,type:'expense',partyType:'general',partyId:'',partyName:form.category,description:form.description,debit:0,credit:parseFloat(form.amount),balance:0,refId:exp.id}]);
    setToast({msg:'Expense recorded!',type:'success'}); setModal(false);
    setForm({date:todayStr(),category:EXPENSE_CATS[0],description:'',amount:'',payMode:'Cash'});
  };

  const filtered=expenses.filter(e=>(catF==='All'||e.category===catF)&&(e.description.toLowerCase().includes(search.toLowerCase())||e.category.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date));
  const total=expenses.reduce((a,e)=>a+e.amount,0);
  const thisMonth=expenses.filter(e=>e.date.startsWith(new Date().toISOString().slice(0,7))).reduce((a,e)=>a+e.amount,0);
  const catMap: Record<string,number>={};
  expenses.forEach(e=>{catMap[e.category]=(catMap[e.category]||0)+e.amount;});
  const chartData=Object.entries(catMap).map(([name,value])=>({name,value}));

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Expense Tracker" subtitle="Track all shop expenses"
          action={<button className="btn btn-primary" style={{background:'#dc2626'}} onClick={()=>setModal(true)}><Plus size={16}/> Add Expense</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Expenses" value={fmtMoney(total)}     color="#dc2626" icon={TrendingDown}/>
          <StatCard label="This Month"     value={fmtMoney(thisMonth)} color="#d97706" icon={Receipt}/>
          <StatCard label="Total Entries"  value={expenses.length}     color="#2563eb" icon={DollarSign}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
          <div>
            <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:160}}><SearchBar value={search} onChange={setSearch} placeholder="Search expenses…"/></div>
              <select value={catF} onChange={e=>setCatF(e.target.value)} className="field-input" style={{width:'auto'}}>
                <option>All</option>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="card" style={{overflow:'hidden'}}>
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Mode</th><th style={{textAlign:'right'}}>Amount</th><th></th></tr></thead>
                  <tbody>
                    {filtered.length===0&&<tr><td colSpan={6}><EmptyState icon={Receipt} title="No expenses"/></td></tr>}
                    {filtered.map(e=>(
                      <tr key={e.id}>
                        <td style={{fontFamily:'monospace',fontSize:12,color:'#64748b'}}>{fmtDate(e.date)}</td>
                        <td><span className="badge badge-red" style={{fontSize:11}}>{e.category}</span></td>
                        <td style={{fontSize:13}}>{e.description}</td>
                        <td><span className="badge badge-gray" style={{fontSize:11}}>{e.payMode}</span></td>
                        <td style={{textAlign:'right',fontWeight:700,color:'#dc2626'}}>{fmtMoney(e.amount)}</td>
                        <td><button className="btn btn-danger btn-icon" onClick={()=>setDelId(e.id)}><Trash2 size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                  {filtered.length>0&&(
                    <tfoot><tr style={{background:'#fff5f5',fontWeight:700}}>
                      <td colSpan={4} style={{padding:'10px 13px',color:'#dc2626'}}>TOTAL ({filtered.length})</td>
                      <td style={{padding:'10px 13px',textAlign:'right',color:'#dc2626'}}>{fmtMoney(filtered.reduce((a,e)=>a+e.amount,0))}</td>
                      <td></td>
                    </tr></tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:18,height:'fit-content'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>By Category</div>
            {chartData.length===0?<div style={{textAlign:'center',color:'#94a3b8',padding:30,fontSize:13}}>No data</div>:(
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {chartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie><Tooltip formatter={(v:any)=>fmtMoney(v)}/><Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/></PieChart>
                </ResponsiveContainer>
                {Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([cat,amt],i)=>(
                  <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f1f5f9',fontSize:13}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:9,height:9,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>{cat}</div>
                    <strong style={{color:'#dc2626'}}>{fmtMoney(amt)}</strong>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {modal&&(
          <Modal title="Record Expense" onClose={()=>setModal(false)} maxWidth={460} accent="#dc2626">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Field label="Date"><input type="date" className="field-input" value={form.date} onChange={e=>f('date',e.target.value)}/></Field>
              <Field label="Category"><select className="field-input" value={form.category} onChange={e=>f('category',e.target.value)}>{EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Description" required><input className="field-input" value={form.description} onChange={e=>f('description',e.target.value)} placeholder="e.g. Shop rent June 2025" autoFocus/></Field></div>
              <Field label="Amount ₹" required><input type="number" className="field-input" value={form.amount} onChange={e=>f('amount',e.target.value)} min={0}/></Field>
              <Field label="Payment Mode"><select className="field-input" value={form.payMode} onChange={e=>f('payMode',e.target.value)}>{PAY_MODES.map(m=><option key={m}>{m}</option>)}</select></Field>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center',background:'#dc2626'}} onClick={save}>Save Expense</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </Modal>
        )}

        {delId&&<Confirm msg="Delete expense?" onYes={()=>{persist(expenses.filter(e=>e.id!==delId));setDelId(null);setToast({msg:'Deleted',type:'error'});}} onNo={()=>setDelId(null)}/>}
        {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
