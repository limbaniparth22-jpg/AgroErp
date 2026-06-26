"use client";
import { useState, useEffect, useRef } from 'react';
import { Store, DEFAULT_SETTINGS } from '@/lib/store';
import type { ShopSettings } from '@/lib/store';
import { INDIAN_STATES } from '@/lib/gst';
import { exportBackup, importBackup, clearAllData } from '@/lib/backup';
import { AppShell } from '@/components/AppShell';
import { Toast, PageHeader, Field, Confirm } from '@/components/ui';
import { Settings, Download, Upload, Trash2, Building2, CreditCard, Receipt, Palette, Save } from 'lucide-react';

const THEMES = [
  {name:'Forest Green', color:'#16a34a'},{name:'Royal Blue', color:'#2563eb'},
  {name:'Deep Purple',  color:'#7c3aed'},{name:'Crimson Red', color:'#dc2626'},
  {name:'Earth Brown',  color:'#92400e'},{name:'Teal',        color:'#0891b2'},
];

export default function SettingsPage() {
  const [form,    setForm]    = useState<ShopSettings>({...DEFAULT_SETTINGS});
  const [tab,     setTab]     = useState<'shop'|'invoice'|'bank'|'backup'|'appearance'>('shop');
  const [toast,   setToast]   = useState<any>(null);
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(Store.getSettings()); }, []);

  const save = () => { Store.setSettings(form); setToast({msg:'Settings saved!',type:'success'}); };
  const f    = (k: keyof ShopSettings, v: any) => setForm(p => ({...p,[k]:v}));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => f('logo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const msg = await importBackup(file);
      setToast({msg,type:'success'});
      setTimeout(()=>window.location.reload(),1500);
    } catch(err:any) { setToast({msg:err.message,type:'error'}); }
  };

  const doReset = () => { clearAllData(); setToast({msg:'All data cleared. Reload to start fresh.',type:'info'}); setConfirm(false); setTimeout(()=>window.location.reload(),2000); };

  const TABS = [
    {key:'shop',       label:'Shop Info',   icon:Building2},
    {key:'invoice',    label:'Invoice',     icon:Receipt},
    {key:'bank',       label:'Bank & UPI',  icon:CreditCard},
    {key:'appearance', label:'Appearance',  icon:Palette},
    {key:'backup',     label:'Backup',      icon:Download},
  ];

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="Settings" subtitle="Configure your shop, invoice and system preferences"
          action={<button className="btn btn-primary" onClick={save}><Save size={15}/> Save All Settings</button>}/>

        {/* Tab nav */}
        <div style={{display:'flex',gap:6,marginBottom:22,borderBottom:'2px solid #f1f5f9',paddingBottom:0}}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key as any)}
              className="btn" style={{borderRadius:'9px 9px 0 0',background:tab===t.key?'#fff':'transparent',color:tab===t.key?'#166534':'#64748b',fontWeight:tab===t.key?700:500,boxShadow:tab===t.key?'0 -2px 0 #16a34a inset':'none',borderBottom:tab===t.key?'2px solid #16a34a':'2px solid transparent',fontSize:13}}>
              <t.icon size={14}/>{t.label}
            </button>
          ))}
        </div>

        <div className="card" style={{padding:26,maxWidth:700}}>

          {/* Shop Info */}
          {tab==='shop' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Shop / Business Name" required>
                  <input className="field-input" value={form.name} onChange={e=>f('name',e.target.value)} placeholder="KisanKart Agro Store"/>
                </Field>
              </div>
              <Field label="Tagline / Slogan"><input className="field-input" value={form.tagline} onChange={e=>f('tagline',e.target.value)} placeholder="Your Trusted Agri Partner"/></Field>
              <Field label="Phone"><input className="field-input" value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="+91 97148 66592"/></Field>
              <Field label="Email"><input className="field-input" type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></Field>
              <Field label="Website"><input className="field-input" value={form.website} onChange={e=>f('website',e.target.value)} placeholder="www.agroshop.in"/></Field>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Address"><input className="field-input" value={form.address} onChange={e=>f('address',e.target.value)} placeholder="Shop No, Street, Area"/></Field>
              </div>
              <Field label="City"><input className="field-input" value={form.city} onChange={e=>f('city',e.target.value)}/></Field>
              <Field label="State"><select className="field-input" value={form.state} onChange={e=>{const s=INDIAN_STATES.find(x=>x.name===e.target.value);f('state',e.target.value);if(s)f('stateCode',s.code);}}>
                {INDIAN_STATES.map(s=><option key={s.code}>{s.name}</option>)}
              </select></Field>
              <Field label="State Code (for GST)"><input className="field-input" value={form.stateCode} onChange={e=>f('stateCode',e.target.value)} placeholder="24"/></Field>
              <Field label="Pincode"><input className="field-input" value={form.pincode} onChange={e=>f('pincode',e.target.value)} maxLength={6}/></Field>
              <Field label="GSTIN"><input className="field-input" value={form.gstin} onChange={e=>f('gstin',e.target.value)} style={{fontFamily:'monospace'}} placeholder="24AAAAA0000A1Z5"/></Field>
              <Field label="PAN Number"><input className="field-input" value={form.panNo} onChange={e=>f('panNo',e.target.value)} style={{fontFamily:'monospace'}} placeholder="AAAAA0000A"/></Field>

              {/* Logo upload */}
              <div style={{gridColumn:'1/-1',marginTop:8}}>
                <Field label="Shop Logo">
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    {form.logo && <img src={form.logo} alt="Logo" style={{width:60,height:60,objectFit:'contain',borderRadius:10,border:'1px solid #e2e8f0'}}/>}
                    <div>
                      <button className="btn btn-secondary" onClick={()=>document.getElementById('logo-upload')?.click()}>📷 Upload Logo</button>
                      {form.logo && <button className="btn btn-danger" style={{marginLeft:8}} onClick={()=>f('logo','')}>Remove</button>}
                      <input id="logo-upload" type="file" accept="image/*" style={{display:'none'}} onChange={handleLogo}/>
                      <div style={{fontSize:11.5,color:'#94a3b8',marginTop:4}}>PNG/JPG, appears on invoices. Max 2MB.</div>
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Invoice Settings */}
          {tab==='invoice' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Field label="Invoice Prefix"><input className="field-input" value={form.invoicePrefix} onChange={e=>f('invoicePrefix',e.target.value)} placeholder="INV"/></Field>
              <div style={{gridColumn:'1/-1',padding:'12px 16px',background:'#f0fdf4',borderRadius:10,fontSize:13,color:'#166534'}}>
                Invoice numbers will appear as: <strong>{form.invoicePrefix}-{new Date().getFullYear()}-0001</strong>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Terms & Conditions (shown on invoice)">
                  <textarea className="field-input" rows={3} value={form.invoiceTerms} onChange={e=>f('invoiceTerms',e.target.value)} style={{resize:'vertical'}}/>
                </Field>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Invoice Footer Text">
                  <input className="field-input" value={form.invoiceFooter} onChange={e=>f('invoiceFooter',e.target.value)} placeholder="Thank you for your business!"/>
                </Field>
              </div>
            </div>
          )}

          {/* Bank & UPI */}
          {tab==='bank' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <Field label="Bank Name"><input className="field-input" value={form.bankName} onChange={e=>f('bankName',e.target.value)} placeholder="State Bank of India"/></Field>
              <Field label="Branch Name"><input className="field-input" value={form.bankBranch} onChange={e=>f('bankBranch',e.target.value)} placeholder="Bhuj Main Branch"/></Field>
              <Field label="Account Number"><input className="field-input" value={form.accountNo} onChange={e=>f('accountNo',e.target.value)} style={{fontFamily:'monospace'}} placeholder="12345678901"/></Field>
              <Field label="IFSC Code"><input className="field-input" value={form.ifsc} onChange={e=>f('ifsc',e.target.value)} style={{fontFamily:'monospace'}} placeholder="SBIN0001234"/></Field>
              <Field label="Account Type"><select className="field-input" value={form.accountType} onChange={e=>f('accountType',e.target.value)}>
                {['Current','Savings'].map(t=><option key={t}>{t}</option>)}
              </select></Field>
              <Field label="UPI ID (for QR code on invoice)"><input className="field-input" value={form.upiId} onChange={e=>f('upiId',e.target.value)} placeholder="shop@upi or 9876543210@ybl"/></Field>

              {form.upiId && (
                <div style={{gridColumn:'1/-1',textAlign:'center',padding:'16px',background:'#f0fdf4',borderRadius:12,border:'1px solid #86efac'}}>
                  <div style={{fontWeight:600,color:'#166534',marginBottom:10,fontSize:14}}>Your UPI QR Code (shown on invoices)</div>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${form.upiId}&pn=${encodeURIComponent(form.name)}`)}`} width={150} height={150} alt="UPI QR" style={{borderRadius:10,border:'1px solid #dcfce7'}}/>
                  <div style={{fontSize:13,color:'#64748b',marginTop:8}}>UPI: {form.upiId}</div>
                </div>
              )}
            </div>
          )}

          {/* Appearance */}
          {tab==='appearance' && (
            <div>
              <Field label="Theme Color">
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:8}}>
                  {THEMES.map(t=>(
                    <div key={t.color} onClick={()=>f('theme',t.color)}
                      style={{padding:'12px 14px',borderRadius:10,cursor:'pointer',border:`2px solid ${form.theme===t.color?t.color:'#e2e8f0'}`,display:'flex',alignItems:'center',gap:10,background:form.theme===t.color?`${t.color}10`:'#fafafa',transition:'all .15s'}}>
                      <div style={{width:24,height:24,borderRadius:'50%',background:t.color,boxShadow:`0 0 0 3px ${form.theme===t.color?t.color+'40':'transparent'}`}}/>
                      <span style={{fontSize:13,fontWeight:600,color:form.theme===t.color?t.color:'#374151'}}>{t.name}</span>
                    </div>
                  ))}
                </div>
              </Field>
              <div style={{marginTop:16}}>
                <Field label="Custom Color">
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <input type="color" value={form.theme} onChange={e=>f('theme',e.target.value)} style={{width:48,height:40,border:'none',borderRadius:8,cursor:'pointer',padding:2}}/>
                    <input className="field-input" value={form.theme} onChange={e=>f('theme',e.target.value)} style={{fontFamily:'monospace',width:140}} placeholder="#16a34a"/>
                    <div style={{width:40,height:40,borderRadius:8,background:form.theme}}/>
                  </div>
                </Field>
              </div>
              <div style={{marginTop:16,padding:'14px 18px',borderRadius:12,border:`2px solid ${form.theme}`,background:`${form.theme}08`}}>
                <div style={{fontWeight:700,color:form.theme}}>Theme Preview</div>
                <div style={{fontSize:13,color:'#475569',marginTop:4}}>This color appears in your sidebar, buttons, and invoice header.</div>
              </div>
            </div>
          )}

          {/* Backup */}
          {tab==='backup' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{padding:'18px 20px',borderRadius:12,border:'1.5px solid #86efac',background:'#f0fdf4'}}>
                <div style={{fontWeight:700,fontSize:15,color:'#166534',marginBottom:6,display:'flex',alignItems:'center',gap:8}}><Download size={18}/>Export / Download Backup</div>
                <div style={{fontSize:13,color:'#374151',marginBottom:14}}>Downloads all your data (products, customers, invoices, ledger) as a JSON file. Keep it safe!</div>
                <button className="btn btn-primary" onClick={exportBackup}><Download size={15}/> Download Backup File (.json)</button>
              </div>

              <div style={{padding:'18px 20px',borderRadius:12,border:'1.5px solid #bfdbfe',background:'#eff6ff'}}>
                <div style={{fontWeight:700,fontSize:15,color:'#1d4ed8',marginBottom:6,display:'flex',alignItems:'center',gap:8}}><Upload size={18}/>Import / Restore Backup</div>
                <div style={{fontSize:13,color:'#374151',marginBottom:14}}>Restore your data from a previously exported backup file. This will overwrite current data.</div>
                <button className="btn btn-secondary" style={{background:'#dbeafe',color:'#1d4ed8'}} onClick={()=>fileRef.current?.click()}><Upload size={15}/> Choose Backup File</button>
                <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={doImport}/>
              </div>

              <div style={{padding:'18px 20px',borderRadius:12,border:'1.5px solid #fca5a5',background:'#fff5f5'}}>
                <div style={{fontWeight:700,fontSize:15,color:'#dc2626',marginBottom:6,display:'flex',alignItems:'center',gap:8}}><Trash2 size={18}/>Clear All Data</div>
                <div style={{fontSize:13,color:'#374151',marginBottom:14}}>Permanently deletes all products, customers, invoices and ledger entries. This CANNOT be undone. Export a backup first!</div>
                <button className="btn btn-danger" onClick={()=>setConfirm(true)}><Trash2 size={15}/> Clear All Data</button>
              </div>

              <div style={{padding:'14px 18px',borderRadius:10,background:'#fef9c3',border:'1px solid #fde047',fontSize:13,color:'#92400e'}}>
                💡 <strong>Tip:</strong> Take a backup every week. Data is stored in your browser — clearing browser history or cache may delete it.
              </div>
            </div>
          )}

        </div>

        <div style={{marginTop:16}}>
          <button className="btn btn-primary" onClick={save} style={{fontSize:14,padding:'11px 24px'}}><Save size={16}/> Save All Settings</button>
        </div>

        {confirm && <Confirm msg="This will permanently delete ALL your data. Are you absolutely sure? Export a backup first!" onYes={doReset} onNo={()=>setConfirm(false)}/>}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
