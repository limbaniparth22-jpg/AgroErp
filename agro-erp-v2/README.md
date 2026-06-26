# 🌾 AgroERP v2 — Agro Retail Management System

Full-featured mini-ERP for agro retail shops built with **Next.js 14 + TypeScript**.

---

## ✅ Features

| Module | What it does |
|---|---|
| **GST Billing** | Auto CGST/SGST (intrastate) or IGST (interstate), HSN codes, professional print invoices |
| **Inventory** | Batch numbers, expiry dates, low-stock alerts, category-wise tracking |
| **Purchases** | Supplier orders, stock auto-update, GST on purchases, ITC tracking |
| **Customers** | State-wise records, balance tracking, GSTIN support |
| **Suppliers** | Payable tracking, state code for GST |
| **Ledger** | Auto-entries from all transactions, running balance, manual entries |
| **Expenses** | Category-wise, pie chart, auto-ledger |
| **GSTR** | GSTR-1 (B2B + B2C), GSTR-3B summary, Excel export |
| **Reminders** | WhatsApp / SMS / Email overdue payment alerts with pre-filled messages |
| **Reports** | P&L, revenue trends, top products, top customers, payment modes |
| **Settings** | Shop branding, logo, UPI QR, invoice terms, backup/restore, theme |
| **Users** | JWT auth, 4 roles (Admin/Manager/Cashier/Viewer), RBAC |
| **PWA** | Offline mode with service worker |

---

## 🔐 Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `Admin@123` |
| Manager | `manager` | `Manager@123` |
| Cashier | `cashier` | `Cashier@123` |
| Viewer | `viewer` | `Viewer@123` |

---

## 🚀 Local Setup — Step by Step

### Step 1 — Install Node.js
Download from **https://nodejs.org** → choose **v18 LTS** or higher → install and restart computer.

Verify: open terminal and type:
```bash
node -v    # should show v18 or higher
npm -v     # should show 9 or higher
```

### Step 2 — Extract the ZIP
Extract `agro-erp-v2.zip` anywhere on your PC.

### Step 3 — Open terminal inside the folder
- Windows: Open the `agro-erp-v2` folder → right-click inside → "Open in Terminal" (or PowerShell)
- Mac/Linux: `cd /path/to/agro-erp-v2`

### Step 4 — Install packages
```bash
npm install
```
Wait 2–4 minutes. Downloads ~150MB of packages into `node_modules/`.

### Step 5 — Run locally
```bash
npm run dev
```
Open browser → **http://localhost:3000**
Login with `admin` / `Admin@123`

### Step 6 — Build for production (optional test)
```bash
npm run build
npm run start
```

---

## ☁️ Deploy on Vercel (Free Public URL)

### Method A — GitHub + Vercel (Recommended for updates)

**1. Create GitHub repo:**
- Go to **github.com** → New repository → name: `agro-erp` → Create
- Copy the repo URL

**2. Push code:**
```bash
git init
git add .
git commit -m "AgroERP v2 - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agro-erp.git
git push -u origin main
```

**3. Deploy on Vercel:**
- Go to **vercel.com** → Sign in with GitHub
- Click **Add New Project** → Select `agro-erp` repo
- Leave all settings as default (Vercel auto-detects Next.js)
- Click **Deploy**
- ✅ Live in ~2 minutes at `https://agro-erp-xxx.vercel.app`

**Future updates:** Just push to GitHub → Vercel auto-redeploys.

### Method B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel          # run from inside agro-erp-v2 folder
```

---

## 📁 Complete File Structure

```
agro-erp-v2/
├── .eslintrc.json
├── .gitignore
├── README.md
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   ├── manifest.json          ← PWA config
│   └── sw.js                  ← Service worker (offline)
└── src/
    ├── context/
    │   └── AuthContext.tsx    ← JWT auth React context
    ├── lib/
    │   ├── store.ts           ← Data layer + types + localStorage
    │   ├── auth.ts            ← JWT tokens + RBAC + user management
    │   ├── gst.ts             ← GST calculations + GSTR generation
    │   ├── pdf.ts             ← Invoice print HTML template
    │   └── backup.ts          ← Export/import/Excel utilities
    ├── components/
    │   ├── AppShell.tsx       ← Sidebar + header + offline indicator
    │   ├── AuthGuard.tsx      ← Route protection
    │   └── ui.tsx             ← Shared: Modal, Toast, StatCard, Field…
    └── app/
        ├── globals.css
        ├── layout.tsx
        ├── page.tsx           ← Dashboard
        ├── login/page.tsx     ← Login with JWT
        ├── stock/page.tsx     ← Inventory + batch + expiry
        ├── sales/page.tsx     ← GST billing + UPI QR
        ├── purchases/page.tsx ← Purchase orders + ITC
        ├── customers/page.tsx ← Customer ledger
        ├── suppliers/page.tsx ← Supplier management
        ├── ledger/page.tsx    ← Account book
        ├── expenses/page.tsx  ← Expense tracker
        ├── reports/page.tsx   ← P&L + analytics
        ├── gstr/page.tsx      ← GSTR-1 + GSTR-3B + Excel export
        ├── reminders/page.tsx ← WhatsApp/SMS/Email reminders
        ├── settings/page.tsx  ← Shop settings + backup
        └── users/page.tsx     ← User management + RBAC
```

---

## ⚠️ Important Notes

1. **Data stored in browser localStorage** — each browser/device has its own data.
2. Use **Export Backup** (Settings page) weekly to save your data as a JSON file.
3. To reset everything: Settings → Backup → Clear All Data.
4. For multiple devices/users sharing data, a future backend upgrade using Supabase/MongoDB is recommended.
5. Offline mode works for viewing; new entries sync when back online.

---

*Built by Galaxy Automation, Kutchh, Gujarat — AgroERP v2.0*
