// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN'|'MANAGER'|'CASHIER'|'VIEWER';

export interface AppUser {
  id: string; name: string; username: string;
  passwordHash: string; role: Role;
  active: boolean; createdAt: string; lastLogin: string;
}

export interface TokenPayload {
  userId: string; username: string; role: Role; name: string;
  exp: number; iat: number;
}

export interface LoginResult { token: string; payload: TokenPayload; }

// ─── Constants ────────────────────────────────────────────────────────────────
const USERS_KEY = 'agro_users';
const SALT      = 'AGRO_ERP_SECURE_2025_KUTCHH';
const TOKEN_TTL = 8 * 60 * 60 * 1000; // 8 hours

// ─── Crypto ──────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function hashPassword(pwd: string): Promise<string> {
  return sha256(pwd + SALT);
}

// ─── JWT-like Token ───────────────────────────────────────────────────────────
function b64(obj: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/=/g,'');
}

function genToken(payload: TokenPayload): string {
  const h = b64({ alg:'HS256', typ:'JWT' });
  const p = b64(payload);
  const s = btoa(`${h}.${p}.${SALT}`).replace(/=/g,'');
  return `${h}.${p}.${s}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1])))) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// ─── User Store ───────────────────────────────────────────────────────────────
const isBrowser = () => typeof window !== 'undefined';

export function getUsers(): AppUser[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

export function saveUsers(users: AppUser[]): void {
  if (isBrowser()) localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function initAuth(): Promise<void> {
  if (!isBrowser()) return;
  const users = getUsers();
  if (users.length === 0) {
    const defaultUsers: Omit<AppUser,'passwordHash'>[] = [
      { id:'u1', name:'Administrator', username:'admin',   role:'ADMIN',   active:true, createdAt:'2025-01-01', lastLogin:'' },
      { id:'u2', name:'Shop Manager',  username:'manager', role:'MANAGER', active:true, createdAt:'2025-01-01', lastLogin:'' },
      { id:'u3', name:'Cashier',       username:'cashier', role:'CASHIER', active:true, createdAt:'2025-01-01', lastLogin:'' },
      { id:'u4', name:'Viewer',        username:'viewer',  role:'VIEWER',  active:true, createdAt:'2025-01-01', lastLogin:'' },
    ];
    const defaultPasswords: Record<string,string> = {
      admin:'Admin@123', manager:'Manager@123', cashier:'Cashier@123', viewer:'Viewer@123',
    };
    const withHash = await Promise.all(
      defaultUsers.map(async u => ({
        ...u, passwordHash: await hashPassword(defaultPasswords[u.username] || 'Pass@123'),
      }))
    );
    saveUsers(withHash);
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export async function login(username: string, password: string): Promise<LoginResult | null> {
  const users = getUsers();
  const user  = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.active);
  if (!user) return null;
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return null;
  const updated = users.map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u);
  saveUsers(updated);
  const payload: TokenPayload = {
    userId: user.id, username: user.username, role: user.role,
    name: user.name, iat: Date.now(), exp: Date.now() + TOKEN_TTL,
  };
  return { token: genToken(payload), payload };
}

export async function changePassword(userId: string, newPassword: string): Promise<void> {
  const users = getUsers();
  const hash  = await hashPassword(newPassword);
  saveUsers(users.map(u => u.id === userId ? { ...u, passwordHash: hash } : u));
}

// ─── RBAC ────────────────────────────────────────────────────────────────────
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/':          ['ADMIN','MANAGER','CASHIER','VIEWER'],
  '/stock':     ['ADMIN','MANAGER','CASHIER'],
  '/sales':     ['ADMIN','MANAGER','CASHIER'],
  '/purchases': ['ADMIN','MANAGER'],
  '/customers': ['ADMIN','MANAGER','CASHIER'],
  '/suppliers': ['ADMIN','MANAGER'],
  '/ledger':    ['ADMIN','MANAGER'],
  '/expenses':  ['ADMIN','MANAGER'],
  '/reports':   ['ADMIN','MANAGER','VIEWER'],
  '/gstr':      ['ADMIN','MANAGER'],
  '/reminders': ['ADMIN','MANAGER'],
  '/settings':  ['ADMIN'],
  '/users':     ['ADMIN'],
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:'Administrator', MANAGER:'Manager', CASHIER:'Cashier', VIEWER:'Viewer (Read-only)',
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN:'#dc2626', MANAGER:'#7c3aed', CASHIER:'#16a34a', VIEWER:'#2563eb',
};

export function canAccess(role: Role, route: string): boolean {
  const allowed = ROUTE_ROLES[route] || ['ADMIN'];
  return allowed.includes(role);
}
// Add this at the very bottom of src/lib/auth.ts
export function genId(): string {
  return 'u_' + Math.random().toString(36).substring(2, 9);
}
