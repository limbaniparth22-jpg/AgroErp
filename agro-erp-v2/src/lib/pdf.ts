import type { SaleInvoice } from './store';
import type { ShopSettings } from './store';

const m = (n: number) => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export function printInvoice(inv: SaleInvoice, s: ShopSettings): void {
  const win = window.open('','_blank','width=900,height=700');
  if (!win) { alert('Allow popups to print invoice'); return; }

  const gstRows = inv.supplyType === 'interstate'
    ? `<tr class="sub"><td>IGST</td><td>${m(inv.igst)}</td></tr>`
    : `<tr class="sub"><td>CGST</td><td>${m(inv.cgst)}</td></tr>
       <tr class="sub"><td>SGST</td><td>${m(inv.sgst)}</td></tr>`;

  const upiData = s.upiId
    ? `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.name)}&am=${inv.balanceDue}&tn=${inv.invoiceNo}`
    : '';

  const qrImg = upiData && inv.balanceDue > 0
    ? `<div class="qr-box">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(upiData)}" width="130" height="130" alt="UPI QR"/>
        <div class="qr-label">Scan &amp; Pay ₹${inv.balanceDue.toFixed(2)}</div>
        <div class="qr-upi">${s.upiId}</div>
       </div>`
    : '';

  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Invoice ${inv.invoiceNo}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:24px}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #14532d;padding-bottom:14px;margin-bottom:16px}
    .logo-name{display:flex;align-items:center;gap:12px}
    .logo-name img{width:56px;height:56px;object-fit:contain;border-radius:8px}
    .shop-name{font-size:20px;font-weight:900;color:#14532d}
    .shop-sub{font-size:11px;color:#555;margin-top:2px}
    .inv-title{font-size:22px;font-weight:900;color:#dc2626;text-align:right}
    .inv-meta{font-size:12px;text-align:right;margin-top:4px;color:#333}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;margin-top:4px}
    .paid{background:#dcfce7;color:#166534}.partial{background:#fef9c3;color:#92400e}.unpaid{background:#fee2e2;color:#dc2626}
    .party-row{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}
    .party-box{background:#f0fdf4;border-radius:6px;padding:10px 14px;flex:1}
    .party-box h4{font-size:10px;text-transform:uppercase;color:#16a34a;margin-bottom:5px;letter-spacing:.5px}
    table{width:100%;border-collapse:collapse;font-size:11.5px}
    thead tr{background:#14532d;color:#fff}
    th,td{padding:7px 9px;text-align:left}
    th{font-size:11px;font-weight:600}
    tbody tr:nth-child(even){background:#f8fffe}
    tbody tr{border-bottom:1px solid #e5e7eb}
    .right{text-align:right}
    .bottom{display:flex;justify-content:space-between;align-items:flex-start;margin-top:16px;gap:20px}
    .bank{background:#f8f9fa;border-radius:6px;padding:10px 14px;font-size:11px;flex:1}
    .bank strong{display:block;margin-bottom:4px;color:#14532d}
    .totals{min-width:250px}
    .totals table{font-size:12px}
    .totals td{padding:5px 9px;border:none;border-bottom:1px solid #f1f5f9}
    .totals .sub td{color:#64748b}
    .grand td{font-size:15px;font-weight:900;color:#14532d;border-top:2px solid #14532d;border-bottom:none}
    .qr-box{text-align:center;padding:8px;border:1px solid #e2e8f0;border-radius:8px;background:#fff}
    .qr-label{font-size:10px;font-weight:700;color:#16a34a;margin-top:4px}
    .qr-upi{font-size:9px;color:#94a3b8}
    .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#94a3b8}
    .terms{margin-top:10px;font-size:10.5px;color:#475569;background:#fef9c3;padding:8px 12px;border-radius:5px}
    .no-print{text-align:center;margin-top:20px}
    .no-print button{background:#14532d;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-size:13px;cursor:pointer;margin:0 5px}
    .no-print button.sec{background:#f1f5f9;color:#374151}
    @media print{.no-print{display:none}body{padding:12px}}
  </style></head><body>

  <div class="top">
    <div class="logo-name">
      ${s.logo ? `<img src="${s.logo}" alt="Logo"/>` : '<span style="font-size:36px">🌾</span>'}
      <div>
        <div class="shop-name">${s.name}</div>
        ${s.tagline?`<div class="shop-sub">${s.tagline}</div>`:''}
        <div class="shop-sub">${s.address}, ${s.city} - ${s.pincode}</div>
        <div class="shop-sub">Ph: ${s.phone} | GSTIN: ${s.gstin}</div>
      </div>
    </div>
    <div>
      <div class="inv-title">TAX INVOICE</div>
      <div class="inv-meta"><b>${inv.invoiceNo}</b></div>
      <div class="inv-meta">Date: ${inv.date} &nbsp;|&nbsp; Due: ${inv.dueDate}</div>
      <div class="inv-meta">
        <span class="badge ${inv.status}">${inv.status.toUpperCase()}</span>
        &nbsp;<span style="font-size:10px;color:#64748b">${inv.supplyType==='interstate'?'Interstate (IGST)':'Intrastate (CGST+SGST)'}</span>
      </div>
    </div>
  </div>

  <div class="party-row">
    <div class="party-box">
      <h4>Bill To</h4>
      <strong>${inv.customerName}</strong><br/>
      ${inv.customerPhone?`Ph: ${inv.customerPhone}<br/>`:''}
      ${inv.customerGstin?`<span style="font-family:monospace;font-size:10px">GSTIN: ${inv.customerGstin}</span>`:'Unregistered Buyer'}
    </div>
    <div class="party-box">
      <h4>Payment Details</h4>
      Mode: <strong>${inv.payMode}</strong><br/>
      Paid: <strong style="color:#16a34a">${m(inv.paidAmount)}</strong><br/>
      ${inv.balanceDue>0?`Balance: <strong style="color:#dc2626">${m(inv.balanceDue)}</strong>`:'<strong style="color:#16a34a">Fully Paid ✓</strong>'}
    </div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>Product / Description</th><th>HSN</th>
      <th class="right">Qty</th><th>Unit</th><th class="right">Rate</th>
      <th class="right">Disc%</th><th class="right">GST%</th><th class="right">Taxable</th><th class="right">Amount</th>
    </tr></thead>
    <tbody>
      ${inv.items.map((it,i)=>`<tr>
        <td>${i+1}</td>
        <td><strong>${it.productName}</strong>${it.batchNo?`<br/><span style="font-size:10px;color:#64748b">Batch: ${it.batchNo}</span>`:''}</td>
        <td style="font-family:monospace;font-size:10px">${it.hsnCode||'—'}</td>
        <td class="right">${it.qty}</td><td>${it.unit}</td>
        <td class="right">${m(it.rate)}</td>
        <td class="right">${it.discount}%</td>
        <td class="right">${it.gstRate}%</td>
        <td class="right">${m(it.taxableAmount)}</td>
        <td class="right"><strong>${m(it.amount)}</strong></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="bottom">
    <div>
      ${s.bankName?`<div class="bank">
        <strong>Bank / Payment Details</strong>
        ${s.bankName} &nbsp;|&nbsp; ${s.bankBranch}<br/>
        A/c: ${s.accountNo} &nbsp;|&nbsp; IFSC: ${s.ifsc}<br/>
        ${s.upiId?`UPI: <strong>${s.upiId}</strong>`:''}
      </div>`:''}
      ${s.invoiceTerms?`<div class="terms"><strong>Terms:</strong> ${s.invoiceTerms}</div>`:''}
      ${inv.notes?`<div class="terms" style="background:#dbeafe;margin-top:8px"><strong>Notes:</strong> ${inv.notes}</div>`:''}
    </div>
    <div style="display:flex;gap:16px;align-items:flex-start">
      ${qrImg}
      <table class="totals">
        <tr class="sub"><td>Subtotal</td><td class="right">${m(inv.subtotal)}</td></tr>
        ${inv.totalDiscount>0?`<tr class="sub"><td>Discount</td><td class="right" style="color:#dc2626">-${m(inv.totalDiscount)}</td></tr>`:''}
        <tr class="sub"><td>Taxable Amount</td><td class="right"><strong>${m(inv.taxableAmount)}</strong></td></tr>
        ${gstRows}
        <tr class="grand"><td>TOTAL</td><td class="right">${m(inv.total)}</td></tr>
        <tr class="sub"><td style="color:#16a34a">Amount Paid</td><td class="right" style="color:#16a34a">${m(inv.paidAmount)}</td></tr>
        ${inv.balanceDue>0?`<tr class="sub"><td style="color:#dc2626">Balance Due</td><td class="right" style="color:#dc2626;font-weight:700">${m(inv.balanceDue)}</td></tr>`:''}
      </table>
    </div>
  </div>

  <div class="footer">
    <div>Computer generated invoice — No signature required</div>
    <div>${s.invoiceFooter||'Thank you for your business!'}</div>
    ${s.website?`<div>${s.website}</div>`:''}
  </div>

  <div class="no-print">
    <button onclick="window.print()">🖨️ Print Invoice</button>
    <button class="sec" onclick="window.close()">✕ Close</button>
  </div>
  </body></html>`);
  win.document.close();
}
