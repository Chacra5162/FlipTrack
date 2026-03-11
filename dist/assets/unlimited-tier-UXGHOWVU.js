import{t as R,i as G,g as Y,f as r,r as j,s as F,a as A,e as L}from"./pro-tier-Vr5-Zgn3.js";let s=new Date().getFullYear(),g=null,M=!1,u=!1;const O=.153,_=[{min:0,max:11925,rate:.1},{min:11925,max:48475,rate:.12},{min:48475,max:103350,rate:.22},{min:103350,max:197300,rate:.24},{min:197300,max:250525,rate:.32},{min:250525,max:626350,rate:.35},{min:626350,max:1/0,rate:.37}];function Q(e){if(e<=0)return 0;const i=e*.9235;return Math.round(i*O*100)/100}function B(e){if(e<=0)return 0;const i=Q(e),n=Math.max(0,e-i/2-15e3);let t=0;for(const a of _){if(n<=a.min)break;const l=Math.min(n,a.max)-a.min;t+=l*a.rate}return Math.round(t*100)/100}function I(e){const i=Q(e),n=B(e),t=i+n;return{seTax:i,incomeTax:n,totalAnnual:t,quarterly:Math.round(t/4*100)/100}}const q={Q1:{label:"Q1 (Jan–Mar)",due:"April 15"},Q2:{label:"Q2 (Apr–Jun)",due:"June 15"},Q3:{label:"Q3 (Jul–Sep)",due:"September 15"},Q4:{label:"Q4 (Oct–Dec)",due:"January 15 (next year)"}};function H(e){s=Number(e),k()}function V(e){g=g===e?null:e,k()}function X(){M=!M,k()}function K(){u=!u,k()}function T(e,i){const n=new Date(e,(i-1)*3,1),t=new Date(e,i*3,0,23,59,59);return{start:n,end:t}}function v(e,i){let n=0,t=0,a=0,l=0;const m=new Set,S=F.filter(d=>{const o=new Date(d.date);return o>=e&&o<=i});for(const d of S){const o=A(d.itemId),c=d.qty||1,b=d.price||0;n+=b*c,t+=((o==null?void 0:o.cost)||0)*c,a+=d.fees||0,l+=d.ship||0,m.add(d.itemId)}const P=n-t-a-l,C=L.filter(d=>{const o=new Date(d.date);return o>=e&&o<=i}),f={};let y=0;for(const d of C){const o=d.category||"Other";f[o]=(f[o]||0)+(d.amount||0),y+=d.amount||0}const p=P-y,x=I(p);return{revenue:n,cogs:t,platformFees:a,shipping:l,grossProfit:P,totalExpenses:y,expensesByCategory:f,netProfit:p,estimatedTax:x.totalAnnual,estimatedTaxQuarterly:x.quarterly,seTax:x.seTax,incomeTax:x.incomeTax,saleCount:S.length,itemCount:m.size}}function N(){return`
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table" style="width:100%;font-size:12px">
        <thead>
          <tr style="background:var(--surface);border-bottom:2px solid var(--border)">
            <th style="padding:10px;text-align:left;font-weight:700">Period</th>
            <th style="padding:10px;text-align:right;font-weight:700">Revenue</th>
            <th style="padding:10px;text-align:right;font-weight:700">COGS</th>
            <th style="padding:10px;text-align:right;font-weight:700">Gross Profit</th>
            <th style="padding:10px;text-align:right;font-weight:700">Expenses</th>
            <th style="padding:10px;text-align:right;font-weight:700">Net Profit</th>
            <th style="padding:10px;text-align:right;font-weight:700">Qtr Tax Due</th>
          </tr>
        </thead>
        <tbody>${[1,2,3,4].map(n=>{const{start:t,end:a}=T(s,n),l=v(t,a);return`
      <tr style="cursor:pointer;background:${g===n?"var(--surface)":""};border-bottom:1px solid var(--border)" onclick="taxSetQuarter(${n})">
        <td style="padding:10px;font-weight:600;color:var(--text)">Q${n}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--accent)">${r(l.revenue)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--muted)">${r(l.cogs)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--good)">${r(l.grossProfit)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--danger)">${r(l.totalExpenses)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;font-weight:600;color:${l.netProfit>=0?"var(--good)":"var(--danger)"}">${r(l.netProfit)}</td>
        <td style="padding:10px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:600">${r(l.estimatedTaxQuarterly)}</td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `}function U(e){return`
    <div style="margin-bottom:16px;padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-title" style="margin:0">Schedule C Summary</div>
        <button onclick="taxToggleScheduleC()" style="padding:4px 10px;background:var(--accent2);color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px;font-weight:600;font-family:Syne,sans-serif">Hide</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;font-size:11px">
          <tbody>${[{line:1,label:"Gross receipts or sales",value:r(e.revenue)},{line:2,label:"Returns and allowances",value:r(0)},{line:4,label:"Cost of goods sold (COGS)",value:r(e.cogs)},{line:5,label:"Gross profit",value:r(e.grossProfit)},{line:10,label:"Commissions & fees (platforms)",value:r(e.platformFees)},{line:22,label:"Supplies",value:r(e.expensesByCategory.Supplies||0)},{line:27,label:"Other expenses",value:r((e.expensesByCategory["Shipping Supplies"]||0)+(e.expensesByCategory.Software||0))}].map(t=>`
    <tr style="border-bottom:1px solid var(--border)">
      <td style="padding:8px;font-weight:600;color:var(--muted);font-family:'DM Mono',monospace;width:50px">Line ${t.line}</td>
      <td style="padding:8px;color:var(--text)">${t.label}</td>
      <td style="padding:8px;font-family:'DM Mono',monospace;color:var(--accent);text-align:right;font-weight:600">${t.value}</td>
    </tr>
  `).join("")}</tbody>
        </table>
      </div>
    </div>
  `}async function W(){if(g){const{start:e,end:i}=T(s,g),n=v(e,i),t=["FlipTrack Tax Report - Q"+g+" "+s,"","Summary","Metric,Amount","Revenue,"+n.revenue,"COGS,"+n.cogs,"Platform Fees,"+n.platformFees,"Shipping Costs,"+n.shipping,"Gross Profit,"+n.grossProfit,"Total Expenses,"+n.totalExpenses,"Net Profit,"+n.netProfit,"Estimated Tax (25%),"+n.estimatedTax,"","Expenses by Category","Category,Amount",...Object.entries(n.expensesByCategory).map(([a,l])=>`"${a}",${l}`)].join(`
`);z("fliptrack-tax-q"+g+"-"+s+".csv",t)}else{let e=["FlipTrack Tax Report - "+s,"","Quarterly Summary","Quarter,Revenue,COGS,Gross Profit,Expenses,Net Profit,Estimated Tax"];for(let i=1;i<=4;i++){const{start:n,end:t}=T(s,i),a=v(n,t);e.push(`Q${i},${a.revenue},${a.cogs},${a.grossProfit},${a.totalExpenses},${a.netProfit},${a.estimatedTax}`)}z("fliptrack-tax-"+s+".csv",e.join(`
`))}R("Tax report exported ✓")}function z(e,i){const n=new Blob([i],{type:"text/csv"}),t=URL.createObjectURL(n),a=document.createElement("a");a.href=t,a.download=e,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(t)}async function k(){const e=document.getElementById("taxContent");if(!e)return;await G();const i=new Date(s,0,1),n=new Date(s,11,31,23,59,59),t=v(i,n);Y(s);let a=null;if(g){const{start:p,end:x}=T(s,g);a=v(p,x)}const l=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total Revenue</div>
        <div style="font-size:20px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${r(t.revenue)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${t.saleCount} sales</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total COGS</div>
        <div style="font-size:20px;font-weight:700;color:var(--muted);font-family:'DM Mono',monospace">${r(t.cogs)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">${t.itemCount} items</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Net Profit</div>
        <div style="font-size:20px;font-weight:700;color:${t.netProfit>=0?"var(--good)":"var(--danger)"};font-family:'DM Mono',monospace">${r(t.netProfit)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">margin: ${t.revenue?(t.netProfit/t.revenue*100).toFixed(1):0}%</div>
      </div>
      <div class="stat-card" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;border-color:var(--warn)">
        <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Est. Tax Liability</div>
        <div style="font-size:20px;font-weight:700;color:var(--warn);font-family:'DM Mono',monospace">${r(t.estimatedTax)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">
          <div>SE: ${r(t.seTax)}</div>
          <div>Income: ${r(t.incomeTax)}</div>
        </div>
      </div>
    </div>
  `,m=`
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;align-items:center;padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
      <select onchange="taxSetYear(this.value)" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:3px;font-family:'DM Mono',monospace;font-size:12px">
        <option value="2024" ${s===2024?"selected":""}>Tax Year 2024</option>
        <option value="2025" ${s===2025?"selected":""}>Tax Year 2025</option>
        <option value="2026" ${s===2026?"selected":""}>Tax Year 2026</option>
      </select>
      <button onclick="taxToggleScheduleC()" class="btn-secondary" style="padding:6px 12px;background:${M?"var(--accent2)":"var(--surface2)"};border:1px solid var(--border);color:white;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">${M?"Hide":"Show"} Schedule C</button>
      <button onclick="taxToggleYearComparison()" class="btn-secondary" style="padding:6px 12px;background:${u?"var(--accent2)":"var(--surface2)"};border:1px solid var(--border);color:white;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">${u?"Hide":"Show"} Year Comparison</button>
      <button onclick="taxExportCSV()" class="btn-primary" style="padding:6px 12px;background:var(--accent);color:white;border:none;border-radius:3px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:12px">Export CSV</button>
    </div>
  `,S=`
    <div class="panel" style="margin-bottom:20px;padding:12px;background:rgba(244,174,0,0.05);border-color:var(--warn)">
      <div class="panel-title" style="margin-bottom:12px">Estimated Quarterly Tax Payments (${s})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
        ${[1,2,3,4].map(p=>{const{start:x,end:d}=T(s,p),o=v(x,d),c=q["Q"+p];return`
            <div style="padding:12px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
              <div style="font-weight:700;color:var(--text);margin-bottom:8px">${c.label}</div>
              <div style="display:grid;gap:6px;font-size:11px;font-family:'DM Mono',monospace">
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">Payment Due:</span>
                  <span style="color:var(--warn);font-weight:600">${c.due}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">SE Tax:</span>
                  <span style="color:var(--accent)">${r(o.seTax)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:6px;background:rgba(var(--surface-rgb),0.5);border-radius:2px">
                  <span style="color:var(--muted)">Income Tax:</span>
                  <span style="color:var(--accent)">${r(o.incomeTax)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px;background:var(--warn);border-radius:2px;color:white;font-weight:700">
                  <span>Total Due:</span>
                  <span>${r(o.estimatedTaxQuarterly)}</span>
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `,P=`
    <div class="panel" style="margin-bottom:20px;padding:12px">
      <div class="panel-title" style="margin-bottom:12px">Quarterly Breakdown (${s})</div>
      ${N()}
      <div style="font-size:10px;color:var(--muted);text-align:center">Click a quarter to expand details</div>
    </div>
  `;let C="";a&&(C=`
      <div class="panel" style="margin-bottom:20px;padding:12px">
        <div class="panel-title" style="margin-bottom:12px">Q${g} Details</div>
        ${M?U(a):""}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Revenue</div>
            <div style="font-size:16px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${r(a.revenue)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Gross Profit</div>
            <div style="font-size:16px;font-weight:700;color:var(--good);font-family:'DM Mono',monospace">${r(a.grossProfit)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Expenses</div>
            <div style="font-size:16px;font-weight:700;color:var(--danger);font-family:'DM Mono',monospace">${r(a.totalExpenses)}</div>
          </div>
          <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Net Profit</div>
            <div style="font-size:16px;font-weight:700;color:${a.netProfit>=0?"var(--good)":"var(--danger)"};font-family:'DM Mono',monospace">${r(a.netProfit)}</div>
          </div>
        </div>
      </div>
    `);let f="";if(u&&s>2023){const p=s-1,x=new Date(p,0,1),d=new Date(p,11,31,23,59,59),o=v(x,d),c=o.revenue>0?(t.revenue-o.revenue)/o.revenue*100:0,b=o.netProfit>0?(t.netProfit-o.netProfit)/o.netProfit*100:t.netProfit>0?100:0,E=o.totalExpenses>0?(t.totalExpenses-o.totalExpenses)/o.totalExpenses*100:0,D=o.estimatedTax>0?(t.estimatedTax-o.estimatedTax)/o.estimatedTax*100:0,h=$=>$>0?"▲":$<0?"▼":"→",w=$=>$>0?"var(--good)":$<0?"var(--danger)":"var(--muted)";f=`
      <div class="panel" style="margin-bottom:20px;padding:12px">
        <div class="panel-title" style="margin-bottom:12px">${s} vs ${p} Comparison</div>
        <div style="overflow-x:auto">
          <table style="width:100%;font-size:11px;font-family:'DM Mono',monospace">
            <thead>
              <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
                <th style="padding:10px;text-align:left;color:var(--muted)">Metric</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">${p}</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">${s}</th>
                <th style="padding:10px;text-align:right;color:var(--muted)">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Revenue</td>
                <td style="padding:10px;text-align:right;color:var(--accent)">${r(o.revenue)}</td>
                <td style="padding:10px;text-align:right;color:var(--accent)">${r(t.revenue)}</td>
                <td style="padding:10px;text-align:right;color:${w(c)};font-weight:600">${h(c)} ${Math.abs(c).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Gross Profit</td>
                <td style="padding:10px;text-align:right;color:var(--good)">${r(o.grossProfit)}</td>
                <td style="padding:10px;text-align:right;color:var(--good)">${r(t.grossProfit)}</td>
                <td style="padding:10px;text-align:right;color:${w(c)};font-weight:600">${h(c)} ${Math.abs(o.grossProfit>0?(t.grossProfit-o.grossProfit)/o.grossProfit*100:0).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Expenses</td>
                <td style="padding:10px;text-align:right;color:var(--danger)">${r(o.totalExpenses)}</td>
                <td style="padding:10px;text-align:right;color:var(--danger)">${r(t.totalExpenses)}</td>
                <td style="padding:10px;text-align:right;color:${w(-E)};font-weight:600">${h(-E)} ${Math.abs(E).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:10px;font-weight:600">Net Profit</td>
                <td style="padding:10px;text-align:right;color:${o.netProfit>=0?"var(--good)":"var(--danger)"}">${r(o.netProfit)}</td>
                <td style="padding:10px;text-align:right;color:${t.netProfit>=0?"var(--good)":"var(--danger)"}">${r(t.netProfit)}</td>
                <td style="padding:10px;text-align:right;color:${w(b)};font-weight:600">${h(b)} ${Math.abs(b).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:600">Tax Liability</td>
                <td style="padding:10px;text-align:right;color:var(--warn)">${r(o.estimatedTax)}</td>
                <td style="padding:10px;text-align:right;color:var(--warn)">${r(t.estimatedTax)}</td>
                <td style="padding:10px;text-align:right;color:${w(D)};font-weight:600">${h(D)} ${Math.abs(D).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `}const y=j();e.innerHTML=`
    <div style="padding:16px 12px">
      ${l}
      ${m}
      ${S}
      ${P}
      ${C}
      ${u?f:""}
      ${y}
    </div>
  `}export{W as a,X as b,V as c,H as d,k as r,K as t};
