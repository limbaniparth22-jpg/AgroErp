"use client";
import { useState, useEffect } from 'react';
import { getUsers, saveUsers, hashPassword, genId as makeId, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth';
import type { AppUser, Role } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { Modal, Toast, Confirm, PageHeader, Field, EmptyState, StatCard } from '@/components/ui';
import { Plus, Edit2, UserCheck, UserX, KeyRound, UserCog, Shield } from 'lucide-react';

const genId = () => `user_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
const ROLES: Role[] = ['ADMIN','MANAGER','CASHIER','VIEWER'];

const PERM_MAP: Record<Role, string[]> = {
  ADMIN:   ['All modules + Settings + Users'],
  MANAGER: ['Dashboard, Stock, Sales, Purchases, Customers, Suppliers, Ledger, Expenses, Reminders, Reports, GSTR'],
  CASHIER: ['Dashboard, Stock (view), Sales, Customers'],
  VIEWER:  ['Dashboard, Reports (read-only)'],
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users,  setUsers]  = useState<AppUser[]>([]);
  const [modal,  setModal]  = useState<'add'|'edit'|'pwd'|null>(null);
  const [form,   setForm]   = useState({ name:'', username:'', password:'', role:'CASHIER' as Role, active:true });
  const [editId, setEditId] = useState('');
  const [pwd,    setPwd]    = useState({ userId:'', newPwd:'', confirm:'' });
  const [delId,  setDelId]  = useState<string|null>(null);
  const [toast,  setToast]  = useState<any>(null);

  useEffect(() => { setUsers(getUsers()); }, []);

  const notify  = (msg:string, type:any='success') => setToast({msg,type});
  const f       = (k:string,v:any) => setForm(p=>({...p,[k]:v}));
  const refresh = () => setUsers(getUsers());

  const openAdd  = () => { setForm({name:'',username:'',password:'',role:'CASHIER',active:true}); setModal('add'); };
  const openEdit = (u:AppUser) => { setForm({name:u.name,username:u.username,password:'',role:u.role,active:u.active}); setEditId(u.id); setModal('edit'); };
  const openPwd  = (u:AppUser) => { setPwd({userId:u.id,newPwd:'',confirm:''}); setModal('pwd'); };

  const saveUser = async () => {
    if (!form.name||!form.username) { notify('Name and username required','error'); return; }
    const all = getUsers();
    if (modal==='add') {
      if (!form.password) { notify('Password required','error'); return; }
      if (all.some(u=>u.username===form.username)) { notify('Username already exists','error'); return; }
      const hash = await hashPassword(form.password);
      const newUser: AppUser = { id:genId(), name:form.name, username:form.username, passwordHash:hash, role:form.role, active:form.active, createdAt:new Date().toISOString().slice(0,10), lastLogin:'' };
      saveUsers([...all, newUser]);
      notify('User created!');
    } else {
      if (editId===me?.userId && form.role!=='ADMIN') { notify('Cannot change your own role from Admin','error'); return; }
      saveUsers(all.map(u=>u.id===editId?{...u,name:form.name,username:form.username,role:form.role,active:form.active}:u));
      notify('User updated!');
    }
    refresh(); setModal(null);
  };

  const changePwd = async () => {
    if (!pwd.newPwd||pwd.newPwd.length<6) { notify('Minimum 6 characters','error'); return; }
    if (pwd.newPwd!==pwd.confirm) { notify('Passwords do not match','error'); return; }
    const hash = await hashPassword(pwd.newPwd);
    saveUsers(getUsers().map(u=>u.id===pwd.userId?{...u,passwordHash:hash}:u));
    notify('Password changed!'); refresh(); setModal(null);
  };

  const toggleActive = (id:string) => {
    if (id===me?.userId) { notify('Cannot deactivate your own account','error'); return; }
    saveUsers(getUsers().map(u=>u.id===id?{...u,active:!u.active}:u));
    refresh(); notify('User status updated');
  };

  const doDelete = () => {
    if (delId===me?.userId) { notify('Cannot delete your own account','error'); setDelId(null); return; }
    saveUsers(getUsers().filter(u=>u.id!==delId));
    refresh(); setDelId(null); notify('User deleted','error');
  };

  const activeCount = users.filter(u=>u.active).length;

  return (
    <AppShell>
      <div className="page-in">
        <PageHeader title="User Management" subtitle="Manage users and role-based access control"
          action={<button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add User</button>}/>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(165px,1fr))',gap:14,marginBottom:22}}>
          <StatCard label="Total Users"  value={users.length}   color="#2563eb" icon={UserCog}/>
          <StatCard label="Active Users" value={activeCount}    color="#16a34a" icon={UserCheck}/>
          <StatCard label="Inactive"     value={users.length-activeCount} color="#94a3b8" icon={UserX}/>
          <StatCard label="Your Role"    value={me?.role||'?'}  color={ROLE_COLORS[me?.role as Role]||'#94a3b8'} icon={Shield}/>
        </div>

        {/* Role permissions reference */}
        <div className="card" style={{padding:18,marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Role Permissions Reference</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:10}}>
            {ROLES.map(r=>(
              <div key={r} style={{borderRadius:10,padding:'12px 14px',border:`1.5px solid ${ROLE_COLORS[r]}30`,background:`${ROLE_COLORS[r]}06`}}>
                <div style={{fontWeight:700,color:ROLE_COLORS[r],fontSize:13,marginBottom:5}}>{ROLE_LABELS[r]}</div>
                <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>{PERM_MAP[r].join(', ')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User table */}
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Last Login</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.length===0&&<tr><td colSpan={8}><EmptyState icon={UserCog} title="No users found"/></td></tr>}
                {users.map((u,i)=>(
                  <tr key={u.id}>
                    <td style={{color:'#94a3b8',fontSize:12}}>{i+1}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:9}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:`${ROLE_COLORS[u.role]}22`,border:`2px solid ${ROLE_COLORS[u.role]}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:ROLE_COLORS[u.role]}}>{u.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:600}}>{u.name}</div>
                          {u.id===me?.userId&&<div style={{fontSize:10.5,color:'#16a34a',fontWeight:600}}>● You</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{fontFamily:'monospace',fontSize:12.5}}>{u.username}</td>
                    <td><span style={{background:`${ROLE_COLORS[u.role]}18`,color:ROLE_COLORS[u.role],borderRadius:20,padding:'3px 11px',fontSize:11.5,fontWeight:700}}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.active?'badge-green':'badge-gray'}`}>{u.active?'Active':'Inactive'}</span>
                    </td>
                    <td style={{fontSize:12,color:'#64748b'}}>{u.lastLogin?new Date(u.lastLogin).toLocaleDateString('en-IN'):'Never'}</td>
                    <td style={{fontSize:12,color:'#64748b'}}>{u.createdAt}</td>
                    <td>
                      <div style={{display:'flex',gap:5}}>
                        <button className="btn btn-secondary btn-icon" title="Edit" onClick={()=>openEdit(u)}><Edit2 size={13} color="#2563eb"/></button>
                        <button className="btn btn-secondary btn-icon" title="Change Password" onClick={()=>openPwd(u)}><KeyRound size={13} color="#d97706"/></button>
                        <button className="btn btn-secondary btn-icon" title={u.active?'Deactivate':'Activate'} onClick={()=>toggleActive(u.id)}>
                          {u.active?<UserX size={13} color="#dc2626"/>:<UserCheck size={13} color="#16a34a"/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Modal */}
        {(modal==='add'||modal==='edit') && (
          <Modal title={modal==='add'?'Add New User':'Edit User'} onClose={()=>setModal(null)} maxWidth={480}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div style={{gridColumn:'1/-1'}}>
                <Field label="Full Name" required><input className="field-input" value={form.name} onChange={e=>f('name',e.target.value)} autoFocus placeholder="e.g. Ramesh Patel"/></Field>
              </div>
              <Field label="Username" required><input className="field-input" value={form.username} onChange={e=>f('username',e.target.value)} placeholder="e.g. ramesh" style={{fontFamily:'monospace'}}/></Field>
              <Field label="Role" required>
                <select className="field-input" value={form.role} onChange={e=>f('role',e.target.value as Role)}>
                  {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </Field>
              {modal==='add' && (
                <div style={{gridColumn:'1/-1'}}>
                  <Field label="Password" required><input type="password" className="field-input" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Min 6 characters"/></Field>
                </div>
              )}
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" id="active-chk" checked={form.active} onChange={e=>f('active',e.target.checked)} style={{width:16,height:16}}/>
                <label htmlFor="active-chk" style={{fontSize:13,fontWeight:500,cursor:'pointer'}}>Account is Active</label>
              </div>
              <div style={{gridColumn:'1/-1',background:`${ROLE_COLORS[form.role]}0a`,borderRadius:9,padding:'10px 14px',fontSize:12.5,color:ROLE_COLORS[form.role]}}>
                <strong>{ROLE_LABELS[form.role]}:</strong> {PERM_MAP[form.role].join(', ')}
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={saveUser}>Save User</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </Modal>
        )}

        {/* Change Password Modal */}
        {modal==='pwd' && (
          <Modal title="Change Password" onClose={()=>setModal(null)} maxWidth={400} accent="#d97706">
            <Field label="New Password"><input type="password" className="field-input" value={pwd.newPwd} onChange={e=>setPwd(p=>({...p,newPwd:e.target.value}))} placeholder="Min 6 characters" autoFocus/></Field>
            <div style={{marginTop:14}}><Field label="Confirm Password"><input type="password" className="field-input" value={pwd.confirm} onChange={e=>setPwd(p=>({...p,confirm:e.target.value}))} placeholder="Repeat password"/></Field></div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center',background:'#d97706'}} onClick={changePwd}>Change Password</button>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:'center'}} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </Modal>
        )}

        {delId && <Confirm msg="Delete this user permanently?" onYes={doDelete} onNo={()=>setDelId(null)}/>}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      </div>
    </AppShell>
  );
}
