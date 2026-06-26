"use client";
import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/auth';
import { ShieldX, Loader2 } from 'lucide-react';

interface Props { children: ReactNode; roles?: Role[]; }

export function AuthGuard({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const router  = useRouter();
  const path    = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [user, loading, router, path]);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',gap:12,color:'#64748b'}}>
      <Loader2 size={26} style={{animation:'spin 1s linear infinite'}}/> Loading…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return null;

  if (roles && !roles.includes(user.role)) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:14,color:'#94a3b8'}}>
      <ShieldX size={52} style={{opacity:.4}}/>
      <div style={{fontSize:18,fontWeight:700,color:'#475569'}}>Access Denied</div>
      <div style={{fontSize:14}}>Your role ({user.role}) cannot access this page.</div>
    </div>
  );

  return <>{children}</>;
}
