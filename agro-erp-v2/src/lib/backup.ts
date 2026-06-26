const KEYS = [
  'agro_products','agro_customers','agro_suppliers','agro_sales',
  'agro_purchases','agro_ledger','agro_expenses','agro_settings',
];

export function exportBackup(): void {
  const data: Record<string,any> = { _meta:{ version:'2.0', exportedAt: new Date().toISOString() } };
  KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) try { data[k] = JSON.parse(v); } catch {}
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `agro-erp-backup-${new Date().toISOString().slice(0,10)}.json`
  });
  a.click(); URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        let count = 0;
        Object.entries(data).forEach(([k,v]) => {
          if (k.startsWith('agro_')) { localStorage.setItem(k, JSON.stringify(v)); count++; }
        });
        resolve(`Restored ${count} data stores successfully`);
      } catch { reject(new Error('Invalid or corrupted backup file')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function clearAllData(): void {
  KEYS.forEach(k => localStorage.removeItem(k));
  // Don't clear users
}

export async function exportToExcel(sheets: { name:string; data:any[] }[], filename: string): Promise<void> {
  // Dynamic import to avoid SSR issues
  const XLSX = await import('xlsx');
  const wb   = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    if (!data.length) return;
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto column width
    const cols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 12) }));
    ws['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
  });
  XLSX.writeFile(wb, filename);
}

export function exportCSV(data: any[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows    = data.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`).join(','));
  const csv     = [headers.join(','), ...rows].join('\n');
  const blob    = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const a       = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: filename
  });
  a.click();
}
