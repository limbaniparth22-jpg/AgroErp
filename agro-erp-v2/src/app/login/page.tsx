"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Leaf, Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';

// 1. Your actual login logic and form moved into a separate component
function LoginFormContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const { login, user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => { 
    if (user) router.replace(params.get('next') || '/'); 
  }, [user, router, params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Enter username and password'); return; }
    setLoading(true); setError('');
    const ok = await login(username.trim(), password);
    if (ok) { router.push(params.get('next') || '/'); }
    else { setError('Invalid username or password'); setLoading(false); }
  };

  const DEMO = [
    {u:'admin',   p:'Admin@123',   r:'Admin',   c:'#dc2626'},
    {u:'manager', p:'Manager@123', r:'Manager', c:'#7c3aed'},
    {u:'cashier', p:'Cashier@123', r:'Cashier', c:'#16a34a'},
    {u:'viewer',  p:'Viewer@123',  r:'Viewer',  c:'#2563eb'},
  ];

  return (
    <div style={{background:'#fff',borderRadius:20,padding:32,boxShadow:'0 24px 80px rgba(0,0,0,.35)'}}>
      <h2 style={{margin:'0 0 22px',fontSize:18,fontWeight:700,color:'#14532d'}}>Sign In to Your Account</h2>

      {error && (
        <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:9,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#dc2626'}}>
          <AlertCircle size={16}/> {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{marginBottom:16}}>
          <label className="field-label">Username</label>
          <div style={{position:'relative'}}>
            <User size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
            <input className="field-input" style={{paddingLeft:38}} value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin / manager / cashier" autoFocus autoComplete="username"/>
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <label className="field-label">Password</label>
          <div style={{position:'relative'}}>
            <Lock size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
            <input className="field-input" style={{paddingLeft:38,paddingRight:42}} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password"/>
            <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:2}}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'12px',fontSize:15,fontWeight:700}} disabled={loading}>
          {loading ? '⏳ Signing in…' : '🔐 Sign In'}
        </button>
      </form>

      {/* Demo credentials */}
      <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid #f1f5f9'}}>
        <div style={{fontSize:11.5,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Demo Login Credentials</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
          {DEMO.map(d=>(
            <button key={d.u} onClick={()=>{setUsername(d.u);setPassword(d.p);setError('');}}
              style={{background:`${d.c}0f`,border:`1.5px solid ${d.c}30`,borderRadius:8,padding:'7px 10px',cursor:'pointer',textAlign:'left',fontSize:12}}>
              <span style={{fontWeight:700,color:d.c}}>{d.r}</span>
              <div style={{color:'#64748b',fontFamily:'monospace',fontSize:11}}>{d.u}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. Main exported component wrapping the content inside <Suspense>
export default function LoginPage() {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:64,height:64,borderRadius:18,background:'linear-gradient(135deg,#4ade80,#16a34a)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:14,boxShadow:'0 8px 24px rgba(0,0,0,.3)'}}>
            <Leaf size={32} color="#fff" strokeWidth={2.5}/>
          </div>
          <div style={{fontFamily:'var(--font-display)',color:'#fff',fontSize:28,fontWeight:900}}>AgroERP</div>
          <div style={{color:'rgba(255,255,255,.55)',fontSize:13,marginTop:4}}>Agro Retail Management System</div>
        </div>

        {/* Wrapped content element */}
        <Suspense fallback={
          <div style={{background:'#fff',borderRadius:20,padding:32,textAlign:'center',color:'#14532d',fontWeight:600}}>
            Loading Application...
          </div>
        }>
          <LoginFormContent />
        </Suspense>

        <div style={{textAlign:'center',marginTop:16,fontSize:12,color:'rgba(255,255,255,.35)'}}>
          Galaxy Automation · AgroERP v2.0
        </div>
      </div>
    </div>
  );
}
