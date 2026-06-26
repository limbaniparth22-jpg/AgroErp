"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from './AuthGuard';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users, UserCheck,
  BookOpen, BarChart2, DollarSign, FileText, Bell, Settings, UserCog,
  Leaf, Menu, X, LogOut, Wifi, WifiOff, ChevronRight
} from 'lucide-react';
import { ROUTE_ROLES, ROLE_COLORS, ROLE_LABELS } from '@/lib/auth';
import type { Role } from '@/lib/auth';

const NAV = [
  { group:'Main',  items:[
    { href:'/',          label:'Dashboard',  icon:LayoutDashboard },
    { href:'/stock',     label:'Inventory',  icon:Package },
    { href:'/sales',     label:'Sales',      icon:ShoppingCart },
    { href:'/purchases', label:'Purchases',  icon:Truck },
  ]},
  { group:'Parties', items:[
    { href:'/customers', label:'Customers',  icon:Users },
    { href:'/suppliers', label:'Suppliers',  icon:UserCheck },
  ]},
  { group:'Accounts', items:[
    { href:'/ledger',    label:'Ledger',     icon:BookOpen },
    { href:'/expenses',  label:'Expenses',   icon:DollarSign },
    { href:'/reminders', label:'Reminders',  icon:Bell },
  ]},
  { group:'Reports', items:[
    { href:'/reports',   label:'Analytics',  icon:BarChart2 },
    { href:'/gstr',      label:'GSTR Filing',icon:FileText },
  ]},
  { group:'Admin', items:[
    { href:'/settings',  label:'Settings',   icon:Settings },
    { href:'/users',     label:'Users',      icon:UserCog },
  ]},
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const path   = usePathname();
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [online,  setOnline]  = useState(true);

  useEffect(()=>{
    setOnline(navigator.onLine);
    const on=()=>setOnline(true), off=()=>setOnline(false);
    window.addEventListener('online',on); window.addEventListener('offline',off);
    return()=>{ window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  },[]);

  useEffect(()=>{ setOpen(false); },[path]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const canSee = (href: string) => {
    if (!user) return false;
    const roles = ROUTE_ROLES[href] || ['ADMIN'];
    return roles.includes(user.role as Role);
  };

  if (path === '/login') return <>{children}</>;

  return (
    <AuthGuard>
      {!online && <div className="offline-bar">📵 Offline Mode — Data saved locally</div>}

      {/* Sidebar */}
      <aside className={`sidebar ${open?'open':''}`} style={{top: online?0:28}}>
        {/* Logo */}
        <div style={{padding:'20px 18px 14px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,borderRadius:11,background:'linear-gradient(135deg,#4ade80,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Leaf size={20} color="#fff" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{fontFamily:'var(--font-display)',color:'#fff',fontSize:17,fontWeight:900,lineHeight:1.1}}>AgroERP</div>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:10.5}}>Retail Manager v2</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          {NAV.map(grp => {
            const visible = grp.items.filter(i => canSee(i.href));
            if (!visible.length) return null;
            return (
              <div key={grp.group}>
                <div className="nav-sep">{grp.group}</div>
                {visible.map(n => {
                  const active = n.href==='/' ? path==='/' : path.startsWith(n.href);
                  return (
                    <Link key={n.href} href={n.href} className={`nav-link${active?' active':''}`}>
                      <n.icon size={16} strokeWidth={active?2.5:2}/>
                      {n.label}
                      {active && <ChevronRight size={13} style={{marginLeft:'auto'}}/>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:`${ROLE_COLORS[user.role]}33`,border:`2px solid ${ROLE_COLORS[user.role]}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff'}}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{color:'#fff',fontSize:13,fontWeight:600}}>{user.name}</div>
                <div style={{fontSize:10.5,color:ROLE_COLORS[user.role],fontWeight:700}}>{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary" style={{width:'100%',justifyContent:'center',fontSize:12.5,padding:'7px 12px',background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.65)'}}>
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:40}}/>}

      {/* Main content */}
      <div className="main-wrap" style={{paddingTop: online?0:28}}>
        {/* Header */}
        <header style={{position:'sticky',top:online?0:28,zIndex:30,background:'rgba(255,255,255,.96)',backdropFilter:'blur(10px)',borderBottom:'1px solid #e2e8f0',padding:'0 24px',height:58,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>setOpen(!open)} className="btn btn-secondary btn-icon" style={{display:'none'}} id="menu-btn">
              {open?<X size={18}/>:<Menu size={18}/>}
            </button>
            <style>{`@media(max-width:768px){#menu-btn{display:flex!important}}`}</style>
            <span style={{fontSize:15,fontWeight:700,color:'#1e293b'}}>
              {NAV.flatMap(g=>g.items).find(n=>n.href==='/'?path==='/':path.startsWith(n.href))?.label ?? 'AgroERP'}
            </span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {online ? <Wifi size={16} color="#16a34a"/> : <WifiOff size={16} color="#f59e0b"/>}
            <span style={{fontSize:12,color:'#94a3b8'}}>{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
            {user && (
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4ade80,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}} title={`${user.name} (${user.role})`}>
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </header>
        <main style={{padding:'22px 22px 48px',maxWidth:1280,margin:'0 auto'}}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
