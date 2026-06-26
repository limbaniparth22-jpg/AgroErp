"use client";
import { useState, useEffect } from 'react';
import { Store, genId, todayStr, fmtMoney, fmtDate } from '@/lib/store';
import type { LedgerEntry } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, PageHeader, SearchBar, EmptyState, StatCard, Field } from '@/components/ui';
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';

const TYPE_CLR: Record<string,{bg:string;color:string}> = {
  sale:    {bg:'#dcfce7',color:'#166534'},
  purchase:{bg:'#ede9fe',color:'#7c3aed'},
  expense: {bg:'#fee2e2',color:'#dc2626'},
  receipt: {bg:'#dbeafe',color:'#1d4ed8'},
  payment: {bg:'#fef9c3',color:'#92400e'},
};

export default function LedgerPage() {
  const [ledger, setLedger]  = useState<LedgerEntry[]>([]);
  const [search, setSearch]  = useState('');
  const [type,   setType]    = useState('All');
  const [from,   setFrom]    = useState('');
  const [to,     setTo]      = useState('');
  const [modal,  setModal]   = useState(false);
  const [toast,  setToast]   = useState<any>(null);
  const [form,   setForm]    = useState({ date:todayStr(), partyName:'', description:'', type:'receipt', debit:'', credit:'' });

  useEffect(()=>{ setLedger(Store.getLedger()); },[]);

  const persist=(d:LedgerEntry[])=>{setLedger(d);Store.setLedger(d);};
  const f=(k:string,v:any)=>setForm(p=>({...p,[k]:v}));

  const addEntry=()=>{
    if(!form.partyName||!form.description){setToast({msg:'Fill required fields',type:'error'});return;}
    if(!form.debit&&!form.credit){setToast({msg:'Enter debit or credit',type:'error'});return;}
    const entry: LedgerEntry={id:genId(),date:form.date,type:form.type as any,partyType:'general',partyId:'',partyName:form.partyName,description:form.description,debit:parseFloat(form.debit||'0'),credit:parseFloat(form.credit||'0'),balance:0,refId:''};
    persist([...ledger,entry]); setToast({msg:'Entry added!',type:'success'}); setModal(false);
    setForm({date:todayStr(),partyName:'',description:'',type:'receipt',debit:'',credit:''});
  };

  const filtered=ledger.filter(e=>(type==='All'||e.type===type)&&(!from||e.date>=from)&&(!to||e.date<=to)&&(e.partyName.toLowerCase().includes(search.toLowerCase())||e.description.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>a.date.localeCompare(b.date));

  // Running balance
  let running=0;
  const withBal=filtered.map(e=>{running+=e.debit-e.credit;return{...e,runBal:running};}).reverse();

  const totDebit =filtered.reduce((a,e)=>a+e.debit,0);
  const totCredit=filtered.reduce((a,e)=>a+e.credit,0);

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Account Ledger" subtitle="Complete transaction book with running balance"
          action={<button className="btn btn-primary" onClick={()=>setModal(true)}><Plus size={16}/> Manual Entry</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Entries" value={ledger.length}          color="#2563eb" icon={BookOpen}/>
          <StatCard label="Total Debit"   value={fmtMoney(totDebit)}    color="#16a34a" icon={TrendingUp}/>
          <StatCard label="Total Credit"  value={fmtMoney(totCredit)}   color="#dc2626" icon={TrendingDown}/>
          <StatCard label="Net Balance"   value={fmtMoney(Math.abs(totDebit-totCredit))} sub={(totDebit-totCredit)>=0?'Receivable':'Payable'} color={(totDebit-totCredit)>=0?'#16a34a':'#dc2626'} icon={DollarSign}/>
        </div>

        <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <div style={{flex:2,minWidth:180}}><SearchBar value={search} onChange={setSearch} placeholder="Party or description…"/></div>
          <select value={type} onChange={e=>setType(e.target.value)} className="field-input" style={{width:'auto'}}>
            {['All','sale','purchase','expense','receipt','payment'].map(t=><option key={t}>{t}</option>)}
          </select>
          <input type="date" className="field-input" value={from} onChange={e=>setFrom(e.target.value)} style={{width:'auto'}} title="From"/>
          <input type="date" className="field-input" value={to}   onChange={e=>setTo(e.target.value)}   style={{width:'auto'}} title="To"/>
          {(from||to||type!=='All')&&<button className="btn btn-secondary" onClick={()=>{setFrom('');setTo('');setType('All');}}>Clear</button>}
        </div>

        <div className="card" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Description</th><th style={{textAlign:'right'}}>Debit (Dr)</th><th style={{textAlign:'right'}}>Credit (Cr)</th><th style={{textAlign:'right'}}>Running Balance</th></tr></thead>
              <tbody>
                {withBal.length===0&&<tr><td colSpan={7}><EmptyState icon={BookOpen} title="No entries" subtitle="Entries are auto-created from sales, purchases & expenses"/></td></tr>}
                {withBal.map(e=>{
                  const clr=TYPE_CLR[e.type]||{bg:'#f1f5f9',color:'#475569'};
                  return (
                    <tr key={e.id}>
                      <td style={{fontFamily:'monospace',fontSize:12,color:'#64748b'}}>{fmtDate(e.date)}</td>
                      <td><span style={{background:clr.bg,color:clr.color,borderRadius:20,padding:'2px 9px',fontSize:11,fontWeight:700,textTransform:'capitalize'}}>{e.type}</span></td>
                      <td style={{fontWeight:600}}>{e.partyName||'—'}</td>
                      <td style={{color:'#64748b',fontSize:13}}>{e.description}</td>
                      <td style={{textAlign:'right',color:'#16a34a',fontWeight:600}}>{e.debit>0?fmtMoney(e.debit):'—'}</td>
                      <td style={{textAlign:'right',color:'#dc2626',fontWeight:600}}>{e.credit>0?fmtMoney(e.credit):'—'}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:e.runBal>=0?'#1e293b':'#dc2626'}}>
                        {fmtMoney(Math.abs(e.runBal))}<span style={{fontSize:10.5,color:'#94a3b8',marginLeft:4}}>{e.runBal>=0?'Dr':'Cr'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {withBal.length>0&&(
                <tfoot>
                  <tr style={{background:'#f0fdf4',fontWeight:700}}>
                    <td colSpan={4} style={{padding:'10px 13px',color:'#166534'}}>TOTALS ({filtered.length} entries)</td>
                    <td style={{padding:'10px 13px',textAlign:'right',color:'#16a34a'}}>{fmtMoney(totDebit)}</td>
                    <td style={{padding:'10px 13px',textAlign:'right',color:'#dc2626'}}>{fmtMoney(totCredit)}</td>
                    <td style={{padding:'10px 13px',textAlign:'right',color:(totDebit-totCredit)>=0?'#166534':'#dc2626'}}>{fmtMoney(Math.abs(totDebit-totCredit))} {(totDebit-totCredit)>=0?'Dr':'Cr'}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {modal&&(
          <Modal title="Add Manual Ledger Entry" onClose={()=>setModal(false)} maxWidth={480}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Field label="Date" required><input type="date" className="field-input" value={form.date} onChange={e=>f('date',e.target.value)}/></Field>
              <Field label="Entry Type"><select className="field-input" value={form.type} onChange={e=>f('type',e.target.value)}>{['receipt','payment','expense','sale','purchase'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></Field>
              <div style={{gridColumn:'1/-1'}}><Field label="Party Name" required><input className="field-input" value={form.partyName} onChange={e=>f('partyName',e.target.value)} autoFocus/></Field></div>
              <div style={{gridColumn:'1/-1'}}><Field label="Description" required><input className="field-input" value={form.description} onChange={e=>f('description',e.target.value)}/></Field></div>
              <Field label="Debit ₹ (money in)"><input type="number" className="field-input" value={form.debit} onChange={e=>f('debit',e.target.value)} min={0}/></Field>
              <Field label="Credit ₹ (money out)"><input type="number" className="field-input" value={form.credit} onChange={e=>f('credit',e.target.value)} min={0}/></Field>
            </div>
            <div style={{background:'#f0fdf4',borderRadius:8,padding:'9px 13px',marginTop:12,fontSize:12,color:'#166534'}}>💡 Debit = income/receipts. Credit = expenses/payments made.</div>
            <div style={{display:'flex',gap:10,marginTop:18}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={addEntry}>Add Entry</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(false)}>Cancel</button>
            </div>
          </Modal>
        )}

        {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
