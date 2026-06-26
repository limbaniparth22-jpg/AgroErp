"use client";
import { useState, useEffect } from 'react';
import { Store, fmtMoney } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import { buildGSTR1, buildGSTR3B } from '@/lib/gst';
import { exportToExcel } from '@/lib/backup';
import { FileText, Download, IndianRupee } from 'lucide-react';

export default function GSTRPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0,7));
  const [tab,    setTab]    = useState<'gstr1'|'gstr3b'>('gstr1');
  const [data,   setData]   = useState<any>(null);
  const [exporting, setExp] = useState(false);

  useEffect(()=>{
    const sales     = Store.getSales();
    const purchases = Store.getPurchases();
    const g1  = buildGSTR1(sales, period);
    const g3b = buildGSTR3B(sales, purchases, period);
    const periodSales = sales.filter(s=>s.date.startsWith(period));
    setData({ g1, g3b, periodSales, totalInvoices:periodSales.length });
  },[period]);

  const exportGSTR1 = async () => {
    if(!data) return; setExp(true);
    try {
      await exportToExcel([
        {name:'B2B Invoices',   data:data.g1.b2b},
        {name:'B2C Summary',    data:data.g1.b2cSummary},
      ], `GSTR1_${period}.xlsx`);
    } finally { setExp(false); }
  };

  const exportGSTR3B = async () => {
    if(!data) return; setExp(true);
    try {
      const g=data.g3b;
      await exportToExcel([{name:'GSTR-3B', data:[
        {Section:'3.1 Outward Supplies',Type:'Total Taxable',Value:g.outward.taxable},
        {Section:'3.1 Outward Supplies',Type:'CGST',Value:g.outward.cgst},
        {Section:'3.1 Outward Supplies',Type:'SGST',Value:g.outward.sgst},
        {Section:'3.1 Outward Supplies',Type:'IGST',Value:g.outward.igst},
        {Section:'4 ITC Available',Type:'Total Taxable',Value:g.inward.taxable},
        {Section:'4 ITC Available',Type:'CGST',Value:g.inward.cgst},
        {Section:'4 ITC Available',Type:'SGST',Value:g.inward.sgst},
        {Section:'4 ITC Available',Type:'IGST',Value:g.inward.igst},
        {Section:'Net Tax Payable',Type:'CGST',Value:g.net.cgst},
        {Section:'Net Tax Payable',Type:'SGST',Value:g.net.sgst},
        {Section:'Net Tax Payable',Type:'IGST',Value:g.net.igst},
        {Section:'Net Tax Payable',Type:'TOTAL',Value:g.net.total},
      ]}], `GSTR3B_${period}.xlsx`);
    } finally { setExp(false); }
  };

  if(!data) return null;
  const { g1, g3b } = data;

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="GSTR Filing" subtitle="Generate GSTR-1 and GSTR-3B reports from billing data"
          action={
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <label className="field-label" style={{margin:0}}>Period:</label>
              <input type="month" className="field-input" value={period} onChange={e=>setPeriod(e.target.value)} style={{width:'auto'}}/>
            </div>
          }/>

        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Invoices This Period" value={data.totalInvoices}               color="#2563eb" icon={FileText}/>
          <StatCard label="Total Outward GST"    value={fmtMoney(g3b.outward.total)}      color="#d97706" icon={IndianRupee}/>
          <StatCard label="ITC Available"        value={fmtMoney(g3b.inward.total)}       color="#16a34a" icon={IndianRupee}/>
          <StatCard label="Net Tax Payable"      value={fmtMoney(Math.max(0,g3b.net.total))} color="#dc2626" icon={IndianRupee}/>
        </div>

        {/* Tab switch */}
        <div style={{display:'flex',gap:6,marginBottom:18}}>
          {(['gstr1','gstr3b'] as const).map(t=>(
            <button key={t} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(t)} style={{textTransform:'uppercase',fontSize:13,fontWeight:700}}>
              {t==='gstr1'?'GSTR-1 (Outward Supplies)':'GSTR-3B (Summary Return)'}
            </button>
          ))}
        </div>

        {tab==='gstr1' && (
          <div>
            {/* B2B */}
            <div className="card" style={{overflow:'hidden',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}>
                <div><div style={{fontWeight:700,fontSize:14}}>B2B Invoices (Registered Buyers)</div><div style={{fontSize:12,color:'#64748b',marginTop:2}}>Buyers with GSTIN — {g1.b2b.length} invoices</div></div>
                <button className="btn btn-primary" onClick={exportGSTR1} disabled={exporting}><Download size={14}/> Export GSTR-1 Excel</button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>GSTIN of Buyer</th><th>Name</th><th>Invoice #</th><th>Date</th><th style={{textAlign:'right'}}>Invoice Value</th><th style={{textAlign:'right'}}>Taxable Value</th><th style={{textAlign:'right'}}>CGST</th><th style={{textAlign:'right'}}>SGST</th><th style={{textAlign:'right'}}>IGST</th></tr></thead>
                  <tbody>
                    {g1.b2b.length===0&&<tr><td colSpan={9}><EmptyState icon={FileText} title="No B2B invoices this period"/></td></tr>}
                    {g1.b2b.map((r:any,i:number)=>(
                      <tr key={i}>
                        <td style={{fontFamily:'monospace',fontSize:11.5}}>{r['GSTIN of Recipient']}</td>
                        <td style={{fontWeight:500}}>{r['Receiver Name']}</td>
                        <td style={{color:'#7c3aed',fontWeight:600}}>{r['Invoice Number']}</td>
                        <td style={{color:'#64748b',fontSize:12}}>{r['Invoice Date']}</td>
                        <td style={{textAlign:'right',fontWeight:700}}>{fmtMoney(r['Invoice Value'])}</td>
                        <td style={{textAlign:'right'}}>{fmtMoney(r['Taxable Value'])}</td>
                        <td style={{textAlign:'right',color:'#16a34a'}}>{fmtMoney(r['CGST Amount'])}</td>
                        <td style={{textAlign:'right',color:'#2563eb'}}>{fmtMoney(r['SGST Amount'])}</td>
                        <td style={{textAlign:'right',color:'#7c3aed'}}>{fmtMoney(r['IGST Amount'])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B2C Summary */}
            <div className="card" style={{overflow:'hidden'}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',fontWeight:700,fontSize:14}}>B2C Summary (Unregistered Buyers)</div>
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead><tr><th>Type</th><th style={{textAlign:'right'}}>GST Rate %</th><th style={{textAlign:'right'}}>Taxable Value</th><th style={{textAlign:'right'}}>CGST</th><th style={{textAlign:'right'}}>SGST</th><th style={{textAlign:'right'}}>IGST</th></tr></thead>
                  <tbody>
                    {g1.b2cSummary.length===0&&<tr><td colSpan={6}><EmptyState icon={FileText} title="No B2C invoices this period"/></td></tr>}
                    {g1.b2cSummary.map((r:any,i:number)=>(
                      <tr key={i}>
                        <td>{r.Type}</td>
                        <td style={{textAlign:'right',fontWeight:700}}>{r['GST Rate %']}%</td>
                        <td style={{textAlign:'right'}}>{fmtMoney(r['Taxable Value'])}</td>
                        <td style={{textAlign:'right',color:'#16a34a'}}>{fmtMoney(r['CGST'])}</td>
                        <td style={{textAlign:'right',color:'#2563eb'}}>{fmtMoney(r['SGST'])}</td>
                        <td style={{textAlign:'right',color:'#7c3aed'}}>{fmtMoney(r['IGST'])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab==='gstr3b' && (
          <div>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
              <button className="btn btn-primary" onClick={exportGSTR3B} disabled={exporting}><Download size={14}/> Export GSTR-3B Excel</button>
            </div>

            {[
              {title:'3.1 — Outward Taxable Supplies (Sales)', data:g3b.outward, color:'#16a34a'},
              {title:'4 — Eligible ITC (Input Tax Credit on Purchases)', data:g3b.inward, color:'#7c3aed'},
              {title:'6 — Net Tax Payable (= Outward GST − ITC)', data:g3b.net, color:g3b.net.total>0?'#dc2626':'#16a34a'},
            ].map(section=>(
              <div key={section.title} className="card" style={{padding:20,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,color:section.color,marginBottom:14}}>{section.title}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                  {[['Taxable Value','taxable'],['CGST','cgst'],['SGST','sgst'],['IGST','igst']].map(([label,key])=>(
                    <div key={key} style={{background:`${section.color}08`,border:`1.5px solid ${section.color}22`,borderRadius:10,padding:'14px 16px'}}>
                      <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:6}}>{label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:section.color}}>{fmtMoney((section.data as any)[key])}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{background:'#f0fdf4',border:'2px solid #86efac',borderRadius:12,padding:'16px 20px'}}>
              <div style={{fontWeight:700,color:'#166534',marginBottom:8}}>📋 How to file GSTR-3B</div>
              <div style={{fontSize:13,color:'#374151',lineHeight:1.7}}>
                1. Download Excel using the button above<br/>
                2. Login to <strong>gst.gov.in</strong> → Returns → GSTR-3B<br/>
                3. Fill Section 3.1 with <strong>Outward GST values</strong><br/>
                4. Fill Section 4 with <strong>ITC Available values</strong><br/>
                5. System auto-calculates net tax. Pay via challan and submit.<br/>
                <span style={{color:'#dc2626',fontWeight:600}}>⚠️ File by 20th of next month to avoid late fee.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
