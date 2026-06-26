"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, fmtMoney } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { StatCard, PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { IndianRupee, Package, TrendingUp, TrendingDown, Users, AlertTriangle, ArrowRight, Receipt, Bell } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    const sales     = Store.getSales();
    const purchases = Store.getPurchases();
    const products  = Store.getProducts();
    const customers = Store.getCustomers();
    const expenses  = Store.getExpenses();

    const rev       = sales.reduce((a,s)=>a+s.total,0);
    const received  = sales.reduce((a,s)=>a+s.paidAmount,0);
    const outstanding = sales.reduce((a,s)=>a+s.balanceDue,0);
    const purchased = purchases.reduce((a,p)=>a+p.total,0);
    const expense   = expenses.reduce((a,e)=>a+e.amount,0);
    const gross     = rev - purchased;
    const net       = gross - expense;
    const stockVal  = products.reduce((a,p)=>a+p.salePrice*p.stock,0);
    const lowStock  = products.filter(p=>p.stock<=p.minStock);

    // Expiry within 30 days
    const soon = new Date(); soon.setDate(soon.getDate()+30);
    const expiring = products.flatMap(p => 
  p.batches?.filter(b => b.expiryDate && new Date(b.expiryDate) <= soon && b.qty > 0)
    .map(b => ({ product: p.name, ...b })) ?? []
);


    // Last 7 days revenue
    const last7 = Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const key=d.toISOString().slice(0,10);
      return { day:d.toLocaleDateString('en-IN',{weekday:'short'}), rev:sales.filter(s=>s.date===key).reduce((a,s)=>a+s.total,0) };
    });

    // Last 6 months
    const last6m = Array.from({length:6},(_,i)=>{
      const d=new Date(); d.setMonth(d.getMonth()-(5-i));
      const key=d.toISOString().slice(0,7);
      const label=d.toLocaleDateString('en-IN',{month:'short'});
      return { label, rev:sales.filter(s=>s.date.startsWith(key)).reduce((a,s)=>a+s.total,0), pur:purchases.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+p.total,0) };
    });

    const overdue = sales.filter(s=>s.status!=='paid' && s.dueDate && s.dueDate<new Date().toISOString().slice(0,10));

    setD({ rev, received, outstanding, purchased, expense, gross, net, stockVal, lowStock, expiring, last7, last6m, customers:customers.length, sales:sales.length, products:products.length, overdue:overdue.length });
  }, []);

  if (!d) return null;

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'User'} 👋`} subtitle="Here's your business overview for today" />

        {/* KPI grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Revenue"    value={fmtMoney(d.rev)}         color="#16a34a" icon={IndianRupee} />
          <StatCard label="Amount Received"  value={fmtMoney(d.received)}    color="#2563eb" icon={TrendingUp} />
          <StatCard label="Outstanding"      value={fmtMoney(d.outstanding)} color="#dc2626" icon={Receipt} sub="to collect" />
          <StatCard label="Gross Profit"     value={fmtMoney(d.gross)}       color={d.gross>=0?"#16a34a":"#dc2626"} icon={TrendingUp} />
          <StatCard label="Net Profit"       value={fmtMoney(d.net)}         color={d.net>=0?"#16a34a":"#dc2626"} icon={TrendingDown} />
          <StatCard label="Stock Value"      value={fmtMoney(d.stockVal)}    color="#7c3aed" icon={Package} sub={`${d.products} products`} />
          <StatCard label="Total Customers"  value={d.customers}             color="#0891b2" icon={Users} />
          <StatCard label="Overdue Invoices" value={d.overdue}               color="#f59e0b" icon={Bell} sub="need reminders" />
        </div>

        {/* Alerts */}
        {(d.lowStock.length>0 || d.expiring.length>0) && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
            {d.lowStock.length>0 && (
              <div style={{background:'#fff7ed',border:'2px solid #fb923c',borderRadius:14,padding:'14px 18px'}}>
                <div style={{fontWeight:700,color:'#c2410c',marginBottom:10,display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={17}/> Low Stock ({d.lowStock.length})</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {d.lowStock.slice(0,6).map((p:any)=><span key={p.id} style={{background:'#fed7aa',borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:600,color:'#9a3412'}}>{p.name}: {p.stock}</span>)}
                </div>
              </div>
            )}
            {d.expiring.length>0 && (
              <div style={{background:'#fff1f2',border:'2px solid #fca5a5',borderRadius:14,padding:'14px 18px'}}>
                <div style={{fontWeight:700,color:'#be123c',marginBottom:10,display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={17}/> Expiring Soon ({d.expiring.length})</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {d.expiring.slice(0,4).map((b:any,i:number)=><span key={i} style={{background:'#fecdd3',borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:600,color:'#9f1239'}}>{b.product} · Batch {b.batchNo}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:20}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:16,color:'#1e293b'}}>Revenue — Last 7 Days</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.last7}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={.3}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+'k':v}`}/>
                <Tooltip formatter={(v:any)=>[fmtMoney(v),'Revenue']}/>
                <Area type="monotone" dataKey="rev" stroke="#16a34a" strokeWidth={2.5} fill="url(#rg)" name="Revenue"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:16,color:'#1e293b'}}>Revenue vs Purchases (6 Months)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.last6m} barGap={3} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="label" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+'k':v}`}/>
                <Tooltip formatter={(v:any,n:string)=>[fmtMoney(v),n==='rev'?'Revenue':'Purchases']}/>
                <Bar dataKey="rev" name="rev" fill="#16a34a" radius={[4,4,0,0]}/>
                <Bar dataKey="pur" name="pur" fill="#7c3aed" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick links */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
          {[
            {href:'/sales',     label:'New Invoice',   emoji:'🧾', color:'#16a34a'},
            {href:'/stock',     label:'Add Stock',     emoji:'📦', color:'#7c3aed'},
            {href:'/purchases', label:'New Purchase',  emoji:'🚚', color:'#2563eb'},
            {href:'/reminders', label:'Reminders',     emoji:'🔔', color:'#f59e0b'},
            {href:'/gstr',      label:'GSTR Filing',   emoji:'📋', color:'#0891b2'},
            {href:'/reports',   label:'View Reports',  emoji:'📊', color:'#dc2626'},
          ].map(q=>(
            <Link key={q.href} href={q.href} style={{textDecoration:'none'}}>
              <div className="card" style={{padding:'16px 14px',textAlign:'center',cursor:'pointer',transition:'transform .18s',border:`2px solid ${q.color}20`}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLDivElement).style.borderColor=q.color;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='';(e.currentTarget as HTMLDivElement).style.borderColor=`${q.color}20`;}}>
                <div style={{fontSize:26}}>{q.emoji}</div>
                <div style={{fontSize:12.5,fontWeight:600,color:'#1e293b',marginTop:8}}>{q.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
