"use client";
import { useEffect, useState } from 'react';
import { Store, fmtMoney } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { PageHeader, StatCard } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, Package, Users, BarChart2 } from 'lucide-react';

const COLORS=['#16a34a','#2563eb','#7c3aed','#d97706','#dc2626','#0891b2'];
const kf=(n:number)=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(1)}K`:`₹${n}`;

export default function ReportsPage() {
  const [data,   setData]   = useState<any>(null);
  const [period, setPeriod] = useState<'week'|'month'|'year'>('month');

  useEffect(()=>{
    const sales     = Store.getSales();
    const purchases = Store.getPurchases();
    const products  = Store.getProducts();
    const customers = Store.getCustomers();
    const expenses  = Store.getExpenses();

    const rev=sales.reduce((a,s)=>a+s.total,0);
    const pur=purchases.reduce((a,p)=>a+p.total,0);
    const exp=expenses.reduce((a,e)=>a+e.amount,0);
    const gross=rev-pur;
    const net=gross-exp;
    const gst=sales.reduce((a,s)=>a+s.totalGST,0);
    const cgst=sales.reduce((a,s)=>a+s.cgst,0);
    const sgst=sales.reduce((a,s)=>a+s.sgst,0);
    const igst=sales.reduce((a,s)=>a+s.igst,0);
    const outstanding=sales.reduce((a,s)=>a+s.balanceDue,0);

    const today=new Date();
    let chart: any[]=[];
    if(period==='week'){
      chart=Array.from({length:7},(_,i)=>{
        const d=new Date(today);d.setDate(d.getDate()-(6-i));
        const key=d.toISOString().slice(0,10);
        const label=d.toLocaleDateString('en-IN',{weekday:'short'});
        return{label,rev:sales.filter(s=>s.date===key).reduce((a,s)=>a+s.total,0),pur:purchases.filter(p=>p.date===key).reduce((a,p)=>a+p.total,0),exp:expenses.filter(e=>e.date===key).reduce((a,e)=>a+e.amount,0)};
      });
    } else if(period==='month'){
      chart=Array.from({length:12},(_,i)=>{
        const d=new Date(today.getFullYear(),today.getMonth()-11+i,1);
        const key=d.toISOString().slice(0,7);
        const label=d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'});
        return{label,rev:sales.filter(s=>s.date.startsWith(key)).reduce((a,s)=>a+s.total,0),pur:purchases.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+p.total,0),exp:expenses.filter(e=>e.date.startsWith(key)).reduce((a,e)=>a+e.amount,0)};
      });
    } else {
      chart=Array.from({length:5},(_,i)=>{const yr=today.getFullYear()-4+i;return{label:String(yr),rev:sales.filter(s=>s.date.startsWith(String(yr))).reduce((a,s)=>a+s.total,0),pur:purchases.filter(p=>p.date.startsWith(String(yr))).reduce((a,p)=>a+p.total,0),exp:expenses.filter(e=>e.date.startsWith(String(yr))).reduce((a,e)=>a+e.amount,0)};});
    }

    const prodRev: Record<string,number>={};
    sales.forEach(inv=>inv.items.forEach(it=>{prodRev[it.productName]=(prodRev[it.productName]||0)+it.amount;}));
    const topProds=Object.entries(prodRev).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,revenue])=>({name,revenue}));

    const custRev: Record<string,number>={};
    sales.forEach(inv=>{custRev[inv.customerName]=(custRev[inv.customerName]||0)+inv.total;});
    const topCust=Object.entries(custRev).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,total])=>({name,total}));

    const catVal: Record<string,number>={};
    products.forEach(p=>{catVal[p.category]=(catVal[p.category]||0)+p.salePrice*p.stock;});
    const catData=Object.entries(catVal).map(([name,value])=>({name,value}));

    const modeData: Record<string,number>={};
    sales.forEach(s=>{modeData[s.payMode]=(modeData[s.payMode]||0)+s.total;});
    const payModes=Object.entries(modeData).map(([name,value])=>({name,value}));

    // GST breakdown
    const gstByRate: Record<number,{taxable:number;gst:number}> = {};
    sales.forEach(s=>s.items.forEach(it=>{
      if(!gstByRate[it.gstRate])gstByRate[it.gstRate]={taxable:0,gst:0};
      gstByRate[it.gstRate].taxable+=it.taxableAmount;
      gstByRate[it.gstRate].gst+=it.cgst+it.sgst+it.igst;
    }));

    setData({rev,pur,exp,gross,net,gst,cgst,sgst,igst,outstanding,chart,topProds,topCust,catData,payModes,gstByRate,totalProducts:products.length,totalCustomers:customers.length,lowStock:products.filter(p=>p.stock<=p.minStock).length});
  },[period]);

  if(!data) return null;

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Reports & Analytics" subtitle="Business performance overview"
          action={<div style={{display:'flex',gap:6}}>
            {(['week','month','year'] as const).map(p=>(
              <button key={p} className={`btn ${period===p?'btn-primary':'btn-secondary'}`} onClick={()=>setPeriod(p)} style={{textTransform:'capitalize',padding:'8px 14px',fontSize:12.5}}>
                {p==='week'?'7 Days':p==='month'?'12 Months':'5 Years'}
              </button>
            ))}
          </div>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(172px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Revenue"         value={fmtMoney(data.rev)}         color="#16a34a" icon={IndianRupee}/>
          <StatCard label="Purchases"       value={fmtMoney(data.pur)}         color="#7c3aed" icon={TrendingDown}/>
          <StatCard label="Expenses"        value={fmtMoney(data.exp)}         color="#dc2626" icon={TrendingDown}/>
          <StatCard label="Gross Profit"    value={fmtMoney(data.gross)}       color={data.gross>=0?'#16a34a':'#dc2626'} icon={TrendingUp} sub={data.rev>0?`Margin: ${((data.gross/data.rev)*100).toFixed(1)}%`:undefined}/>
          <StatCard label="Net Profit"      value={fmtMoney(data.net)}         color={data.net>=0?'#16a34a':'#dc2626'} icon={TrendingUp}/>
          <StatCard label="GST Collected"   value={fmtMoney(data.gst)}         color="#d97706" icon={IndianRupee}/>
          <StatCard label="Outstanding"     value={fmtMoney(data.outstanding)} color="#dc2626" icon={IndianRupee} sub="to collect"/>
          <StatCard label="Low Stock"       value={data.lowStock}              color="#f59e0b" icon={Package}/>
        </div>

        {/* Revenue vs Purchases vs Expenses */}
        <div className="card" style={{padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Revenue vs Purchases vs Expenses</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.chart} barGap={3} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="label" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}} tickFormatter={kf}/>
              <Tooltip formatter={(v:any,n:string)=>[fmtMoney(v),n==='rev'?'Revenue':n==='pur'?'Purchases':'Expenses']}/>
              <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}} formatter={(v:any)=>v==='rev'?'Revenue':v==='pur'?'Purchases':'Expenses'}/>
              <Bar dataKey="rev" fill="#16a34a" radius={[4,4,0,0]}/>
              <Bar dataKey="pur" fill="#7c3aed" radius={[4,4,0,0]}/>
              <Bar dataKey="exp" fill="#dc2626" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit trend */}
        <div className="card" style={{padding:20,marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Net Profit Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.chart.map((d:any)=>({...d,profit:d.rev-d.pur-d.exp}))}>
              <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={.3}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="label" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}} tickFormatter={kf}/>
              <Tooltip formatter={(v:any)=>[fmtMoney(v),'Net Profit']}/>
              <Area type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2.5} fill="url(#pg)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          {/* Top Products */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Top Products by Revenue</div>
            {data.topProds.length===0?<div style={{color:'#94a3b8',textAlign:'center',padding:24,fontSize:13}}>No sales data</div>:data.topProds.map((p:any,i:number)=>(
              <div key={p.name} style={{marginBottom:11}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>{i+1}. {p.name}</span><span style={{fontWeight:700,color:'#16a34a'}}>{fmtMoney(p.revenue)}</span></div>
                <div style={{background:'#e2e8f0',borderRadius:4,height:6}}><div style={{background:`hsl(${140-i*18},70%,40%)`,height:'100%',borderRadius:4,width:`${(p.revenue/(data.topProds[0]?.revenue||1))*100}%`,transition:'width 1s ease'}}/></div>
              </div>
            ))}
          </div>

          {/* Top Customers */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Top Customers</div>
            {data.topCust.length===0?<div style={{color:'#94a3b8',textAlign:'center',padding:24,fontSize:13}}>No data</div>:(
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#f8fafc'}}><th style={{padding:'7px 10px',textAlign:'left',fontWeight:600,color:'#64748b',fontSize:12}}>#</th><th style={{padding:'7px 10px',textAlign:'left',fontWeight:600,color:'#64748b',fontSize:12}}>Customer</th><th style={{padding:'7px 10px',textAlign:'right',fontWeight:600,color:'#64748b',fontSize:12}}>Revenue</th></tr></thead>
                <tbody>{data.topCust.map((c:any,i:number)=>(
                  <tr key={c.name} style={{borderBottom:'1px solid #f1f5f9'}}><td style={{padding:'8px 10px',color:'#94a3b8'}}>{i+1}</td><td style={{padding:'8px 10px',fontWeight:600}}>{c.name}</td><td style={{padding:'8px 10px',textAlign:'right',fontWeight:700,color:'#16a34a'}}>{fmtMoney(c.total)}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          {/* GST Summary */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>GST Collected</div>
            {[['CGST',data.cgst,'#16a34a'],['SGST',data.sgst,'#2563eb'],['IGST',data.igst,'#7c3aed'],['Total GST',data.gst,'#d97706']].map(([k,v,c])=>(
              <div key={k as string} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f1f5f9',fontSize:13}}>
                <span style={{color:'#64748b'}}>{k}</span><strong style={{color:c as string}}>{fmtMoney(v as number)}</strong>
              </div>
            ))}
          </div>

          {/* Stock by category */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Stock Value by Category</div>
            {data.catData.length===0?<div style={{color:'#94a3b8',padding:20,textAlign:'center',fontSize:13}}>No data</div>:(
              <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={data.catData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">{data.catData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v:any)=>fmtMoney(v)}/><Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer>
            )}
          </div>

          {/* Payment modes */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Sales by Payment Mode</div>
            {data.payModes.length===0?<div style={{color:'#94a3b8',padding:20,textAlign:'center',fontSize:13}}>No data</div>:data.payModes.map((m:any,i:number)=>(
              <div key={m.name} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f1f5f9',fontSize:13}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:9,height:9,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>{m.name}</div>
                <strong style={{color:COLORS[i%COLORS.length]}}>{fmtMoney(m.value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
