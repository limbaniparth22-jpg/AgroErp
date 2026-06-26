"use client";
import { useState, useEffect } from 'react';
import { Store, fmtMoney, fmtDate } from '@/lib/store';
import type { SaleInvoice } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import { Bell, MessageCircle, Mail, Phone, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function RemindersPage() {
  const [sales,    setSales]    = useState<SaleInvoice[]>([]);
  const [settings, setSettings] = useState(Store.getSettings());
  const [filter,   setFilter]   = useState<'all'|'overdue'|'due_soon'>('all');
  const [sent,     setSent]     = useState<Record<string,string>>({});

  useEffect(() => {
    setSales(Store.getSales());
    const saved = localStorage.getItem('agro_reminders_sent');
    if (saved) setSent(JSON.parse(saved));
  }, []);

  const today     = new Date().toISOString().slice(0, 10);
  const soonDate  = new Date(); soonDate.setDate(soonDate.getDate() + 7);
  const soonStr   = soonDate.toISOString().slice(0, 10);

  const pending = sales.filter(s => s.status !== 'paid' && s.balanceDue > 0);
  const overdue  = pending.filter(s => s.dueDate && s.dueDate < today);
  const dueSoon  = pending.filter(s => s.dueDate && s.dueDate >= today && s.dueDate <= soonStr);

  const displayed = filter === 'overdue' ? overdue : filter === 'due_soon' ? dueSoon : pending;
  const sorted    = [...displayed].sort((a, b) => (a.dueDate||'').localeCompare(b.dueDate||''));

  const daysOverdue = (dueDate: string) => {
    if (!dueDate) return 0;
    return Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);
  };

  const markSent = (id: string, via: string) => {
    const updated = { ...sent, [id]: `${via} on ${fmtDate(today)}` };
    setSent(updated);
    localStorage.setItem('agro_reminders_sent', JSON.stringify(updated));
  };

  const buildMessage = (inv: SaleInvoice) =>
    `Dear ${inv.customerName},\n\nThis is a gentle reminder that your payment of *${fmtMoney(inv.balanceDue)}* is due against invoice *${inv.invoiceNo}* dated ${fmtDate(inv.date)}.\n\nDue Date: ${fmtDate(inv.dueDate)}\nAmount Due: ${fmtMoney(inv.balanceDue)}\n\nKindly make the payment at your earliest convenience.\n\nRegards,\n${settings.name}\n${settings.phone}`;

  const whatsappLink = (inv: SaleInvoice) =>
    `https://wa.me/91${inv.customerPhone.replace(/\D/g,'')}?text=${encodeURIComponent(buildMessage(inv))}`;

  const emailLink = (inv: SaleInvoice) =>
    `mailto:?subject=${encodeURIComponent(`Payment Reminder - ${inv.invoiceNo}`)}&body=${encodeURIComponent(buildMessage(inv))}`;

  const smsLink = (inv: SaleInvoice) =>
    `sms:${inv.customerPhone}?body=${encodeURIComponent(`Payment reminder: ${fmtMoney(inv.balanceDue)} due for invoice ${inv.invoiceNo}. -${settings.name}`)}`;

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Payment Reminders" subtitle="Track and send due payment alerts to customers"/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Pending"  value={pending.length}             color="#d97706" icon={Bell}/>
          <StatCard label="Overdue"        value={overdue.length}             color="#dc2626" icon={AlertTriangle}/>
          <StatCard label="Due Within 7d"  value={dueSoon.length}            color="#f59e0b" icon={Clock}/>
          <StatCard label="Total Due Amt"  value={fmtMoney(pending.reduce((a,s)=>a+s.balanceDue,0))} color="#dc2626" icon={Bell}/>
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          {[{key:'all',label:`All Pending (${pending.length})`,color:'#d97706'},{key:'overdue',label:`Overdue (${overdue.length})`,color:'#dc2626'},{key:'due_soon',label:`Due Soon (${dueSoon.length})`,color:'#f59e0b'}].map(t=>(
            <button key={t.key} onClick={()=>setFilter(t.key as any)}
              className="btn" style={{background:filter===t.key?t.color:'#f1f5f9',color:filter===t.key?'#fff':'#475569',fontSize:13,fontWeight:600}}>
              {t.label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="card"><EmptyState icon={CheckCircle} title="All payments collected!" subtitle="No pending dues at this time"/></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {sorted.map(inv => {
              const days = daysOverdue(inv.dueDate);
              const isOver = days > 0;
              const lastSent = sent[inv.id];
              return (
                <div key={inv.id} className="card" style={{padding:'16px 20px',borderLeft:`4px solid ${isOver?'#dc2626':'#f59e0b'}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    {/* Info */}
                    <div style={{flex:1,minWidth:200}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                        <div style={{width:38,height:38,borderRadius:10,background:isOver?'#fee2e2':'#fef9c3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:isOver?'#dc2626':'#92400e'}}>
                          {inv.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{fontWeight:700,fontSize:15}}>{inv.customerName}</div>
                          <div style={{fontSize:12,color:'#64748b',display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{inv.customerPhone}</div>
                        </div>
                        {isOver
                          ? <span style={{background:'#fee2e2',color:'#dc2626',borderRadius:20,padding:'2px 10px',fontSize:11.5,fontWeight:700}}>{days}d Overdue</span>
                          : <span style={{background:'#fef9c3',color:'#92400e',borderRadius:20,padding:'2px 10px',fontSize:11.5,fontWeight:700}}>Due {fmtDate(inv.dueDate)}</span>
                        }
                      </div>
                      <div style={{display:'flex',gap:16,fontSize:13,color:'#64748b',flexWrap:'wrap'}}>
                        <span>Invoice: <strong style={{color:'#166534'}}>{inv.invoiceNo}</strong></span>
                        <span>Date: {fmtDate(inv.date)}</span>
                        <span>Total: {fmtMoney(inv.total)}</span>
                        <span>Paid: <span style={{color:'#16a34a',fontWeight:600}}>{fmtMoney(inv.paidAmount)}</span></span>
                        <span>Due: <strong style={{color:'#dc2626',fontSize:14}}>{fmtMoney(inv.balanceDue)}</strong></span>
                      </div>
                      {lastSent && <div style={{marginTop:6,fontSize:11.5,color:'#16a34a',display:'flex',alignItems:'center',gap:5}}><CheckCircle size={12}/> Reminder sent via {lastSent}</div>}
                    </div>

                    {/* Action buttons */}
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      {inv.customerPhone && (
                        <>
                          <a href={whatsappLink(inv)} target="_blank" rel="noopener noreferrer"
                            onClick={()=>markSent(inv.id,'WhatsApp')}
                            style={{display:'flex',alignItems:'center',gap:6,background:'#dcfce7',color:'#166534',border:'none',borderRadius:9,padding:'8px 14px',textDecoration:'none',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                            <MessageCircle size={15}/> WhatsApp
                          </a>
                          <a href={smsLink(inv)}
                            onClick={()=>markSent(inv.id,'SMS')}
                            style={{display:'flex',alignItems:'center',gap:6,background:'#dbeafe',color:'#1d4ed8',border:'none',borderRadius:9,padding:'8px 14px',textDecoration:'none',fontSize:13,fontWeight:600}}>
                            <Phone size={15}/> SMS
                          </a>
                        </>
                      )}
                      <a href={emailLink(inv)}
                        onClick={()=>markSent(inv.id,'Email')}
                        style={{display:'flex',alignItems:'center',gap:6,background:'#ede9fe',color:'#7c3aed',border:'none',borderRadius:9,padding:'8px 14px',textDecoration:'none',fontSize:13,fontWeight:600}}>
                        <Mail size={15}/> Email
                      </a>
                    </div>
                  </div>

                  {/* Message preview */}
                  <details style={{marginTop:10}}>
                    <summary style={{fontSize:12,color:'#94a3b8',cursor:'pointer',userSelect:'none'}}>Preview reminder message</summary>
                    <pre style={{marginTop:8,background:'#f8fafc',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#374151',whiteSpace:'pre-wrap',fontFamily:'inherit',border:'1px solid #e2e8f0'}}>
                      {buildMessage(inv)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        )}

        {pending.length > 0 && (
          <div style={{marginTop:16,background:'#fef9c3',border:'1px solid #fde047',borderRadius:12,padding:'12px 18px',fontSize:13,color:'#92400e'}}>
            💡 <strong>Tip:</strong> Click WhatsApp to open a pre-filled message in WhatsApp. The customer's number and payment details are auto-filled. After sending, a ✓ confirmation is shown.
          </div>
        )}
      </div>
    </AppShell>
  );
}
