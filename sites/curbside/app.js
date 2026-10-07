/* Curbside — Food Truck OS. Vanilla JS, localStorage. No third-party requests. */
(function(){
"use strict";

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2,10);
const todayKey = () => fmtKey(new Date());
const fmtKey = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parseKey = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); };
const fmtDate = k => parseKey(k).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const money = n => '$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0});
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function daysUntil(k){ if(!k) return null; return Math.round((parseKey(k)-new Date(new Date().toDateString()))/86400000); }
function addDaysKey(k,n){ const d=parseKey(k); d.setDate(d.getDate()+n); return fmtKey(d); }
const CYCLE_DAYS = {annual:365, biennial:730, '3yr':1095, '5yr':1825, onetime:0};
const CYCLE_LABEL = {annual:'Renews yearly', biennial:'Renews every 2 yrs', '3yr':'Renews every 3 yrs', '5yr':'Renews every 5 yrs', onetime:'One-time'};

/* ---------- icons (inline SVG) ---------- */
const I = {
  truck:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h13v9H1z"/><path d="M14 11h4l4 4v2h-8z"/><circle cx="6" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  warehouse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-6 9 6"/><path d="M5 9v10h14V9"/><path d="M9 19v-6h6v6"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  cash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5h.01"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.06-.4.1-.8.1-1.2z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  chevL:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l-6 6 6 6"/></svg>',
  chevR:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6l6 6-6 6"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
};
function brandMark(el){ el.innerHTML = I.truck; }
/* self-sizing icons: 1em of surrounding text; explicit CSS sizes still override */
Object.keys(I).forEach(k => { I[k] = I[k].replace('<svg ', '<svg width="1em" height="1em" '); });

/* ---------- permit data (researched 2026-10-07; fees typical, verify with agency) ---------- */
/* applies: full = onboard cooking, limited = reheat/assembly, prepack = sealed only */
const TRUCK_TYPES = {
  full:{name:'Full kitchen', desc:'Cooking on board — grill, fryer, full prep'},
  limited:{name:'Limited prep', desc:'Reheating, assembly, coffee, smoothies'},
  prepack:{name:'Prepackaged only', desc:'Sealed items, no cooking or handling'}
};
const CITIES = {
  la:{name:'Los Angeles, CA', sub:'LA County Public Health', permits:[
    {id:'la-mff', name:'Mobile Food Facility permit (MFF-C)', agency:'LA County Public Health', fee:620, cycle:'annual', applies:['full'], note:'Full cooking. MFF-B (~$440) if limited prep, MFF-A (~$280) if prepack only.'},
    {id:'la-btrc', name:'Business Tax Registration Certificate', agency:'City of LA Office of Finance', fee:60, cycle:'annual', applies:['full','limited','prepack'], note:'City business tax registration.'},
    {id:'la-seller', name:"Seller's Permit", agency:'CA Dept. of Tax & Fee Admin', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Required before your first sale.'},
    {id:'la-fire', name:'Fire inspection + Class K extinguisher', agency:'LA Fire Dept.', fee:150, cycle:'annual', applies:['full','limited'], note:'Required with open flame or fryers.'},
    {id:'la-comm', name:'Commissary agreement', agency:'LA County-approved commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required before health permit issues. Track cost in Commissary tab.'},
    {id:'la-ins', name:'General liability insurance', agency:'Your carrier', fee:2400, cycle:'annual', applies:['full','limited','prepack'], note:'Typically $1M/$2M. Venues and events ask for proof.'}
  ]},
  austin:{name:'Austin, TX', sub:'TX statewide license (2026)', permits:[
    {id:'at-dshs3', name:'TX DSHS Type III mobile food license', agency:'TX Dept. of State Health Services', fee:876, cycle:'annual', applies:['full'], note:'New 2026 statewide license replaces local permits. +$500 pre-licensing inspection. Type II ($618) if limited.'},
    {id:'at-dshs2', name:'TX DSHS Type II mobile food license', agency:'TX Dept. of State Health Services', fee:618, cycle:'annual', applies:['limited'], note:'Limited prep. +$400 pre-licensing inspection.'},
    {id:'at-dshs1', name:'TX DSHS Type I mobile food license', agency:'TX Dept. of State Health Services', fee:309, cycle:'annual', applies:['prepack'], note:'Prepackaged only. Lowest tier.'},
    {id:'at-fire', name:'Fire inspection', agency:'Austin Fire Dept.', fee:222, cycle:'annual', applies:['full','limited'], note:'If cooking equipment on board.'},
    {id:'at-cfm', name:'Certified Food Manager certificate', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'One CFM must be assigned to the unit.'},
    {id:'at-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Written agreement required with application.'}
  ]},
  portland:{name:'Portland, OR', sub:'Multnomah County Health', permits:[
    {id:'pd-mfu', name:'Mobile Food Unit license (Class III/IV)', agency:'Multnomah County Health Dept.', fee:500, cycle:'annual', applies:['full'], note:'Class I/II (~$300) for limited or prepack. Classed by menu complexity.'},
    {id:'pd-mfu12', name:'Mobile Food Unit license (Class I/II)', agency:'Multnomah County Health Dept.', fee:300, cycle:'annual', applies:['limited','prepack'], note:'Limited prep or prepackaged.'},
    {id:'pd-fhc', name:'Oregon Food Handler Card', agency:'Multnomah County / OR Health Authority', fee:10, cycle:'3yr', applies:['full','limited','prepack'], note:'$10, every handler on the truck needs one.'},
    {id:'pd-fire', name:'Propane / fire safety permit', agency:'Portland Fire & Rescue', fee:150, cycle:'annual', applies:['full','limited'], note:'Annual inspection for gas cooking equipment.'},
    {id:'pd-biz', name:'Portland business license', agency:'City of Portland', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Standard city business registration.'},
    {id:'pd-comm', name:'Commissary agreement', agency:'Approved commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Proof of approved prep/storage facility.'}
  ]},
  denver:{name:'Denver, CO', sub:'State + City of Denver', permits:[
    {id:'dv-state', name:'CO retail food license — full mobile unit', agency:'CDPHE / Denver County', fee:481, cycle:'annual', applies:['full'], note:'2026 statutory fee. Prepackaged-only units pay ~$338.'},
    {id:'dv-statep', name:'CO retail food license — prepackaged', agency:'CDPHE / Denver County', fee:338, cycle:'annual', applies:['limited','prepack'], note:'No cooking on board.'},
    {id:'dv-city', name:'Denver mobile food vending license', agency:'Denver Business Licensing', fee:300, cycle:'annual', applies:['full','limited','prepack'], note:'City vending license, renewed yearly.'},
    {id:'dv-tax', name:'CO sales tax license', agency:'CO Dept. of Revenue', fee:16, cycle:'onetime', applies:['full','limited','prepack'], note:'$16 one-time, online.'},
    {id:'dv-fire', name:'Denver Fire propane permit', agency:'Denver Fire Dept.', fee:150, cycle:'annual', applies:['full','limited'], note:'Required with propane on board.'},
    {id:'dv-comm', name:'Commissary affidavit', agency:'Licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Signed affidavit of commissary servicing.'}
  ]},
  chicago:{name:'Chicago, IL', sub:'City of Chicago BACP', permits:[
    {id:'ch-mfp', name:'Mobile Food Preparer license', agency:'Chicago BACP', fee:1000, cycle:'biennial', applies:['full'], note:'$1,000 for a 2-year term. Cooking on board.'},
    {id:'ch-mfd', name:'Mobile Food Dispenser license', agency:'Chicago BACP', fee:700, cycle:'biennial', applies:['limited','prepack'], note:'$700 for a 2-year term. No onboard cooking.'},
    {id:'ch-fire', name:'Fire safety permit', agency:'Chicago Fire Dept.', fee:100, cycle:'annual', applies:['full','limited'], note:'Propane / cooking equipment.'},
    {id:'ch-fsr', name:'Fire suppression system review', agency:'Chicago Fire Dept.', fee:150, cycle:'onetime', applies:['full'], note:'One-time plan review for hood suppression.'},
    {id:'ch-san', name:'Food sanitation manager certificate', agency:'City of Chicago', fee:150, cycle:'5yr', applies:['full','limited'], note:'Certified manager for the unit.'},
    {id:'ch-comm', name:'Commissary / shared kitchen agreement', agency:'Licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'All prep at licensed kitchen; +$330/2yr shared-kitchen user license.'}
  ]},
  miami:{name:'Miami, FL', sub:'FL DBPR statewide', permits:[
    {id:'mi-mfdv', name:'Mobile Food Dispensing Vehicle license', agency:'FL DBPR', fee:347, cycle:'annual', applies:['full','limited','prepack'], note:'Statewide license, valid in every FL city. +$150 plan review for new units.'},
    {id:'mi-plan', name:'Plan review', agency:'FL DBPR', fee:150, cycle:'onetime', applies:['full','limited','prepack'], note:'One-time for new vehicles.'},
    {id:'mi-cobtr', name:'County Business Tax Receipt', agency:'Miami-Dade Tax Collector', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Required for county operation.'},
    {id:'mi-citybtr', name:'City of Miami Business Tax Receipt', agency:'City of Miami Finance', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Only if vending inside City of Miami limits.'},
    {id:'mi-fire', name:'Fire suppression + Class K cert', agency:'Fire inspector / installer', fee:400, cycle:'onetime', applies:['full'], note:'One-time install + cert for open flame / fryers.'},
    {id:'mi-comm', name:'Commissary agreement', agency:'DBPR-licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'DBPR requires it before processing your application.'}
  ]},
  nyc:{name:'New York, NY', sub:'NYC DOHMH (capped permits)', permits:[
    {id:'nyc-license', name:'Mobile Food Vendor License (photo ID)', agency:'NYC DOHMH', fee:50, cycle:'biennial', applies:['full','limited','prepack'], note:'$50/2yr per operator. +$53 food protection course, must pass. No waitlist for the license itself.'},
    {id:'nyc-permit', name:'Mobile Food Vending Unit Permit', agency:'NYC DOHMH', fee:200, cycle:'biennial', applies:['full','limited','prepack'], note:'The truck decal. CAPPED: 5,100 unit permits with multi-year waitlists. Local Law 18 adds 445/yr through 2032. Private-property permits skip the waitlist.'},
    {id:'nyc-sales', name:'NYS Certificate of Authority', agency:'NYS Tax Dept.', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Collect sales tax.'},
    {id:'nyc-comm', name:'Commissary / servicing agreement', agency:'Approved servicing area', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required: daily servicing, waste disposal, restocking.'}
  ]},
  sf:{name:'San Francisco, CA', sub:'SFDPH + Treasurer', permits:[
    {id:'sf-mff', name:'Mobile Food Facility permit (cooking)', agency:'SFDPH', fee:1150, cycle:'annual', applies:['full'], note:'~$900-$1,400/yr for cooking classes. +$376-$879 one-time plan check. 6-10 weeks.'},
    {id:'sf-mfflow', name:'Mobile Food Facility permit (low-risk)', agency:'SFDPH', fee:500, cycle:'annual', applies:['limited','prepack'], note:'Lower-risk classes pay less. Commissary must hold its own SFDPH MFF permit.'},
    {id:'sf-biz', name:'Business Registration Certificate', agency:'SF Treasurer', fee:91, cycle:'annual', applies:['full','limited','prepack'], note:'Income-based, starts at $91/yr.'},
    {id:'sf-seller', name:"Seller's Permit", agency:'CA CDTFA', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free, online same day.'},
    {id:'sf-cfpm', name:'Food Protection Manager certification', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'Required in CA. $15-$150 by provider.'},
    {id:'sf-row', name:'Street vending permit (public ROW)', agency:'SF MTA / Public Works', fee:350, cycle:'annual', applies:['full','limited','prepack'], note:'Only to vend on public property. Competitive, waitlists common.'},
    {id:'sf-comm', name:'Commissary agreement', agency:'SFDPH-permitted commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required before SFDPH application. Commissary must hold its own SFDPH MFF permit.'}
  ]},
  seattle:{name:'Seattle, WA', sub:'King County Public Health', permits:[
    {id:'se-mfu', name:'Mobile Food Unit Permit', agency:'King County Public Health', fee:600, cycle:'annual', applies:['full','limited','prepack'], note:'~$450-$750/yr by complexity. Plan review first, ~2 weeks.'},
    {id:'se-li', name:'Conversion Vendor Insignia', agency:'WA Labor & Industries', fee:0, cycle:'onetime', applies:['full'], note:'Plan review required for trucks/trailers. 4-6 weeks. Verify fee with L&I.'},
    {id:'se-biz', name:'Seattle Business License Tax Certificate', agency:'City of Seattle', fee:110, cycle:'annual', applies:['full','limited','prepack'], note:'~$55-$300/yr by gross revenue.'},
    {id:'se-tax', name:'WA Sales Tax License (UBI)', agency:'WA Dept. of Revenue', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Register to collect sales tax.'},
    {id:'se-comm', name:'Commissary Use Agreement', agency:'King County-permitted commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required. Commissary must be King County-permitted.'}
  ]},
  houston:{name:'Houston, TX', sub:'TX statewide license (2026)', permits:[
    {id:'ho-dshs3', name:'TX DSHS Type III mobile food license', agency:'TX Dept. of State Health Services', fee:876, cycle:'annual', applies:['full'], note:'Statewide since July 2026 (HB 2844). +$500 pre-licensing inspection.'},
    {id:'ho-dshs2', name:'TX DSHS Type II mobile food license', agency:'TX Dept. of State Health Services', fee:618, cycle:'annual', applies:['limited'], note:'Limited prep. +$400 pre-licensing inspection.'},
    {id:'ho-dshs1', name:'TX DSHS Type I mobile food license', agency:'TX Dept. of State Health Services', fee:309, cycle:'annual', applies:['prepack'], note:'Prepackaged only. Lowest tier.'},
    {id:'ho-fire', name:'Propane / LP-Gas permit', agency:'Houston Fire Marshal', fee:0, cycle:'annual', applies:['full','limited'], note:'Required if cooking with propane. Verify fee: 832-394-8811.'},
    {id:'ho-cfm', name:'Certified Food Manager certificate', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'Required per unit.'},
    {id:'ho-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Written agreement required with application.'}
  ]},
  atlanta:{name:'Atlanta, GA', sub:'GA DPH + City Street Eats', permits:[
    {id:'at-ga', name:'Mobile Food Service Permit', agency:'Fulton County Board of Health', fee:250, cycle:'annual', applies:['full','limited','prepack'], note:'$100-$400/yr scaled to gross sales. Plan review + health and fire inspections first.'},
    {id:'at-street', name:'Street Eats public vending permit', agency:'City of Atlanta (ATLBIZ)', fee:495, cycle:'annual', applies:['full','limited','prepack'], note:'$75 permit + $50 background + $20 fingerprinting + $350/yr reservation. Only for public right-of-way.'},
    {id:'at-biz', name:'Business Occupation Tax Certificate', agency:'City of Atlanta', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Income-based. Apply via ATLBIZ.'},
    {id:'at-tax', name:'GA Sales & Use Tax Number', agency:'GA Dept. of Revenue', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free, online.'},
    {id:'at-fire', name:'Fire Marshal inspection + hood suppression', agency:'Atlanta Fire Rescue', fee:0, cycle:'annual', applies:['full','limited'], note:'Required. Verify inspection fee.'},
    {id:'at-comm', name:'Commissary / base of operations', agency:'GA DPH-approved facility', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required for wastewater dumping, cleaning, restocking.'}
  ]},
  nashville:{name:'Nashville, TN', sub:'Metro Public Health', permits:[
    {id:'na-health', name:'Metro Public Health mobile food permit', agency:'Nashville-Davidson Health Dept.', fee:225, cycle:'annual', applies:['full','limited','prepack'], note:'Reported $150-$300/yr. Health inspection required. Verify current fee.'},
    {id:'na-vend', name:'Mobile vending authorization', agency:'Metro Nashville', fee:500, cycle:'annual', applies:['full','limited','prepack'], note:'Reported $200-$800/yr by type. Verify with Metro before budgeting.'},
    {id:'na-handler', name:'TN Food Handler certification', agency:'TN Dept. of Agriculture', fee:50, cycle:'3yr', applies:['full','limited','prepack'], note:'$50 for 3 years.'},
    {id:'na-biz', name:'Davidson County business license', agency:'Metro Clerk', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'TN business tax applies. Verify minimum with county clerk.'},
    {id:'na-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Required by state law where applicable.'}
  ]}
};
const EV_STATUSES = [['lead','Lead'],['booked','Booked'],['done','Done']];

/* ---------- state ---------- */
const LS_KEY = 'curbside.v1';
let S = null;
function defaultState(){ return {v:1, truckName:'My Truck', city:null, truckType:null, permits:[], customDefs:[], locations:{}, commissary:{name:'',cost:'',renews:'',days:[],notes:''}, events:[], revenue:[], onboarded:false}; }
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} try{ if(window.__curbsideSync) window.__curbsideSync.onSave(); }catch(e){} }
function load(){ try{ const r=localStorage.getItem(LS_KEY); if(r){ S=JSON.parse(r); if(!S.customDefs) S.customDefs=[]; return; } }catch(e){} S=defaultState(); }
function cityPermits(){ const c=CITIES[S.city]; if(!c) return []; return c.permits.filter(p=>p.applies.includes(S.truckType)); }

/* ---------- sheets ---------- */
function openSheet(html){ const w=$('#sheetWrap'); $('#sheet').innerHTML=html; w.classList.remove('hidden'); const s=$('#sheet'); const f=s.querySelector('input,textarea,select,button'); if(f) f.focus({preventScroll:true}); }
function closeSheet(){ $('#sheetWrap').classList.add('hidden'); $('#sheet').innerHTML=''; }
$('#sheetWrap').addEventListener('click', e=>{ if(e.target.id==='sheetWrap') closeSheet(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#sheetWrap').classList.contains('hidden')) closeSheet(); });

/* ---------- onboarding ---------- */
let obCity=null, obType=null;
function renderOnboard(){
  $('#onboard').classList.remove('hidden'); $('#main').classList.add('hidden');
  brandMark($('#brandMark'));
  const g=$('#cityGrid'); g.innerHTML='';
  Object.keys(CITIES).forEach(k=>{
    const c=CITIES[k];
    const b=document.createElement('button');
    b.className='city-card'+(obCity===k?' sel':'');
    b.innerHTML='<strong>'+esc(c.name)+'</strong><span>'+esc(c.sub)+'</span>';
    b.onclick=()=>{ obCity=k; obType=null; renderObSteps(); };
    g.appendChild(b);
  });
  renderObSteps();
}
function renderObSteps(){
  $('#obStep1').classList.toggle('hidden', !(obCity===null));
  const show2 = obCity && !obType, show3 = obCity && obType;
  const stepN = !obCity ? 0 : !obType ? 1 : 2;
  document.querySelectorAll('#obDots span').forEach((d,i)=>d.classList.toggle('on', i<=stepN));
  $('#obStep2').classList.toggle('hidden', !show2);
  $('#obStep3').classList.toggle('hidden', !show3);
  if(show2){
    const t=$('#typeList'); t.innerHTML='';
    Object.keys(TRUCK_TYPES).forEach(k=>{
      const b=document.createElement('button');
      b.className='type-card'; b.innerHTML='<strong>'+TRUCK_TYPES[k].name+'</strong><span>'+TRUCK_TYPES[k].desc+'</span>';
      b.onclick=()=>{ obType=k; renderObSteps(); };
      t.appendChild(b);
    });
  }
  if(show3){
    $('#obCityName').textContent=CITIES[obCity].name;
    const list=CITIES[obCity].permits.filter(p=>p.applies.includes(obType));
    $('#obPermitPreview').innerHTML=list.map(p=>
      '<div class="pp-row"><strong>'+esc(p.name)+'</strong><span>'+(p.fee?money(p.fee)+'/'+(p.cycle==='onetime'?'one-time':p.cycle==='annual'?'yr':p.cycle):'Free')+'</span></div>'
    ).join('');
    $('#obTotal').textContent=money(list.reduce((a,p)=>a+p.fee,0));
  }
}
$('#obBack').onclick=()=>{ obCity=null; renderObSteps(); renderOnboard(); };
$('#obBack2').onclick=()=>{ obType=null; renderObSteps(); };
$('#obGo').onclick=()=>{
  S.city=obCity; S.truckType=obType;
  S.permits=cityPermits().map(p=>({id:p.id, status:'needed', expires:null, cost:p.fee}));
  S.onboarded=true; save(); enterMain();
};

/* ---------- main shell ---------- */
function enterMain(){
  $('#onboard').classList.add('hidden'); $('#main').classList.remove('hidden');
  brandMark($('#brandMark2'));
  $('#settingsBtn').innerHTML=I.gear;
  $('#truckName').textContent=S.truckName;
  $('#cityLabel').textContent=CITIES[S.city]?CITIES[S.city].name+' · '+TRUCK_TYPES[S.truckType].name:'';
  $('#permitCitySub').textContent=CITIES[S.city]?('Requirements for '+CITIES[S.city].name+' · '+TRUCK_TYPES[S.truckType].name+'. Fees are typical — verify with the agency.'):'';
  $('#weekPrev').innerHTML=I.chevL; $('#weekNext').innerHTML=I.chevR;
  $$('#tabbar .ti')[0].innerHTML=I.home; $$('#tabbar .ti')[1].innerHTML=I.shield;
  $$('#tabbar .ti')[2].innerHTML=I.pin; $$('#tabbar .ti')[3].innerHTML=I.warehouse;
  $$('#tabbar .ti')[4].innerHTML=I.cal; $$('#tabbar .ti')[5].innerHTML=I.cash;
  switchTab('home');
}
$$('#tabbar button').forEach(b=>{ b.onclick=()=>switchTab(b.dataset.tab); });
$$('[data-goto]').forEach(b=>{ b.onclick=()=>switchTab(b.dataset.goto); });
function switchTab(t){
  $$('#tabbar button').forEach(b=>b.classList.toggle('active', b.dataset.tab===t));
  $$('.tab-page').forEach(p=>p.classList.add('hidden'));
  $('#page-'+t).classList.remove('hidden');
  if(t==='home') renderHome(); if(t==='permits') renderPermits();
  if(t==='locations') renderLocations(); if(t==='commissary') renderCommissary();
  if(t==='events') renderEvents(); if(t==='revenue') renderRevenue();
  window.scrollTo(0,0);
}

/* ---------- alerts + score ---------- */
function permitState(sp){
  if(sp.status!=='active') return {level:'needed', days:null};
  const d=daysUntil(sp.expires);
  if(d===null) return {level:'ok', days:null};
  if(d<0) return {level:'expired', days:d};
  if(d<=30) return {level:'crit', days:d};
  if(d<=90) return {level:'warn', days:d};
  return {level:'ok', days:d};
}
function allPermits(){ return S.permits.map(sp=>({def:permitDef(sp.id), sp})).filter(x=>x.def); }
function permitDef(id){
  const custom=(S.customDefs||[]).find(p=>p.id===id); if(custom) return custom;
  for(const k of Object.keys(CITIES)) { const f=CITIES[k].permits.find(p=>p.id===id); if(f) return f; }
  return null;
}
function renderAlerts(){
  const box=$('#alerts'); const items=[];
  allPermits().forEach(({def,sp})=>{
    const st=permitState(sp);
    if(sp.status!=='active') items.push({level:'warn', text:'Missing: '+def.name, tab:'permits'});
    else if(st.level==='expired') items.push({level:'crit', text:def.name+' EXPIRED '+Math.abs(st.days)+' days ago — renew now', tab:'permits'});
    else if(st.level==='crit') items.push({level:'crit', text:def.name+' renews in '+st.days+' days', tab:'permits'});
    else if(st.level==='warn') items.push({level:'warn', text:def.name+' renews in '+st.days+' days', tab:'permits'});
  });
  if(S.commissary.renews){ const d=daysUntil(S.commissary.renews);
    if(d!==null&&d<=60) items.push({level:d<=14?'crit':'warn', text:'Commissary agreement renews in '+d+' days', tab:'commissary'});
  }
  box.innerHTML=items.slice(0,4).map((a,i)=>
    '<div class="alert '+a.level+'">'+I.warn+'<span>'+esc(a.text)+'</span><button data-a="'+i+'">Fix</button></div>'
  ).join('');
  box.querySelectorAll('button').forEach(b=>{ b.onclick=()=>switchTab(items[+b.dataset.a].tab); });
}
function complianceScore(){
  const ps=allPermits(); if(!ps.length) return 0;
  let good=0;
  ps.forEach(({sp})=>{ const st=permitState(sp); if(sp.status==='active'&&(st.level==='ok'||st.level==='warn')) good++; });
  return Math.round(good/ps.length*100);
}

/* ---------- home ---------- */
function weekKeys(offset){ const d=new Date(); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day+offset*7); const out=[]; for(let i=0;i<7;i++){ const x=new Date(d); x.setDate(d.getDate()+i); out.push(fmtKey(x)); } return out; }
function renderHome(){
  renderAlerts();
  const score=complianceScore();
  $('#scoreNum').textContent=score;
  $('#scoreRing').style.setProperty('--p',(score*3.6)+'deg');
  const need=S.permits.filter(p=>p.status!=='active').length;
  $('#scoreLabel').textContent = score===100?'Fully compliant':score>=70?'Almost there':need>0?need+' permit'+(need>1?'s':'')+' still needed':'Check renewals';
  const act=allPermits().filter(({sp})=>sp.status==='active'&&permitState(sp).days!==null).sort((a,b)=>permitState(a.sp).days-permitState(b.sp).days);
  $('#scoreDetail').textContent = act.length?('Next renewal: '+act[0].def.name):'Add your permits to track renewals';
  // today card
  const tK=todayKey(); const spots=S.locations[tK]||[];
  const logged=S.revenue.some(r=>r.date===tK);
  $('#todayCard').innerHTML='<div class="card today-card"><div class="t-row"><div><strong>'+new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+'</strong>'+
    '<div class="muted">'+(spots.length?spots.map(s=>esc(s.spot)+(s.hours?' · '+esc(s.hours):'')).join('<br>'):'No spot scheduled today')+'</div></div>'+
    '<button class="btn primary small" id="quickRev">'+(logged?'Update today':'Log today')+'</button></div></div>';
  $('#quickRev').onclick=()=>revenueSheet(tK);
  // week strip
  const wk=weekKeys(0);
  $('#weekStrip').innerHTML=wk.map(k=>{
    const d=parseKey(k); const spots=(S.locations[k]||[]);
    return '<div class="day-chip'+(k===tK?' today':'')+'"><b>'+d.toLocaleDateString('en-US',{weekday:'short'})+' '+d.getDate()+'</b>'+
      '<span class="spot">'+(spots.length?esc(spots[0].spot)+(spots.length>1?' +'+(spots.length-1):''):'—')+'</span></div>';
  }).join('');
  // revenue this week
  const wset=new Set(wk);
  const rw=S.revenue.filter(r=>wset.has(r.date)).reduce((a,r)=>a+ +r.amount,0);
  $('#revWeek').textContent=money(rw);
  $('#revWeekSub').textContent=S.revenue.filter(r=>wset.has(r.date)).length+' selling days logged';
  // next renewal card
  if(act.length){ const st=permitState(act[0].sp);
    $('#nextRenewal').textContent=st.days<0?'OVERDUE':st.days+' days';
    $('#nextRenewalSub').textContent=act[0].def.name;
  } else { $('#nextRenewal').textContent='—'; $('#nextRenewalSub').textContent='No dated permits'; }
  // upcoming events
  const up=S.events.filter(e=>e.status!=='done'&&e.date>=tK).sort((a,b)=>a.date<b.date?-1:1).slice(0,3);
  $('#homeEvents').innerHTML=up.length?up.map(e=>
    '<div class="spot-row"><div class="s-info"><strong>'+esc(e.name)+'</strong><span>'+fmtDate(e.date)+' · '+e.status+(e.fee?' · '+money(e.fee):'')+'</span></div></div>'
  ).join(''):'<div class="empty">No upcoming events. Add bookings in the Events tab.</div>';
}

/* ---------- permits ---------- */
function renderTimeline(){
  const ps=allPermits().filter(({sp})=>sp.status==='active'&&sp.expires);
  const head='<div class="tl-head"><h4>12-month renewal timeline</h4><button class="link-btn" id="snapBtn">Copy compliance snapshot</button></div>';
  if(!ps.length) return '<div class="card">'+head+'<div class="empty">Mark a permit as obtained to see your 12-month renewal timeline.</div></div>';
  const months=[]; const now=new Date();
  for(let i=0;i<12;i++){ const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    months.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'), label:d.toLocaleDateString('en-US',{month:'short'})+(i===0?'*':''), year:d.getFullYear()}); }
  const rows=months.map(mn=>{
    const hits=ps.filter(({sp})=>sp.expires.slice(0,7)===mn.key);
    if(!hits.length) return '';
    return '<div class="tl-row"><span class="tl-month">'+mn.label+'</span><div class="tl-chips">'+hits.map(({def,sp})=>{
      const st=permitState(sp);
      const cls=st.level==='crit'||st.level==='expired'?'crit':st.level==='warn'?'warn':'ok';
      return '<span class="pill '+cls+'">'+esc(def.name.length>26?def.name.slice(0,26)+'…':def.name)+'</span>';
    }).join('')+'</div></div>';
  }).join('');
  return '<div class="card">'+head+(rows||'<span class="muted">No renewals due in the next 12 months.</span>')+'</div>';
}
function copySnapshot(){
  const ps=allPermits();
  const lines=ps.map(({def,sp})=>{
    const st=permitState(sp);
    const s=sp.status!=='active'?'NOT OBTAINED':st.days===null?'active':st.days<0?'EXPIRED '+Math.abs(st.days)+'d ago':'expires '+sp.expires+' ('+st.days+'d)';
    return '- '+def.name+' ('+def.agency+'): '+s;
  });
  const txt=S.truckName+' — '+CITIES[S.city].name+'\nCompliance snapshot '+todayKey()+'\n'+lines.join('\n');
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(
    ()=>{ $('#snapBtn').textContent='Copied!'; setTimeout(()=>{ const b=$('#snapBtn'); if(b) b.textContent='Copy compliance snapshot'; },2000); },
    ()=>{ prompt('Copy your compliance snapshot:', txt); });
}
function renderPermits(){
  renderAlerts();
  $('#permitTimeline').innerHTML=renderTimeline();
  const sb=$('#snapBtn'); if(sb) sb.onclick=copySnapshot;
  const box=$('#permitList'); const ps=allPermits();
  const order={expired:0,crit:1,warn:2,needed:3,ok:4};
  ps.sort((a,b)=>{ const sa=a.sp.status==='active'?permitState(a.sp).level:'needed'; const sb=b.sp.status==='active'?permitState(b.sp).level:'needed'; return order[sa]-order[sb]; });
  box.innerHTML=ps.map(({def,sp})=>{
    const st=permitState(sp); const done=sp.status==='active';
    let pill;
    if(!done) pill='<span class="pill">Not obtained</span>';
    else if(st.level==='expired') pill='<span class="pill crit">Expired '+Math.abs(st.days)+'d ago</span>';
    else if(st.level==='crit') pill='<span class="pill crit">'+st.days+' days left</span>';
    else if(st.level==='warn') pill='<span class="pill warn">'+st.days+' days left</span>';
    else if(st.days===null) pill='<span class="pill ok">Done</span>';
    else pill='<span class="pill ok">'+st.days+' days left</span>';
    return '<div class="permit'+(done?' done':'')+'"><div class="p-top">'+
      '<button class="p-check" data-p="'+sp.id+'" aria-label="Toggle obtained">'+(done?I.check:'')+'</button>'+
      '<div class="p-body"><strong>'+esc(def.name)+'</strong><span class="muted">'+esc(def.agency)+'</span>'+
      '<div class="p-meta">'+pill+'<span class="pill cost">'+(def.fee?money(def.fee):'Free')+'</span><span class="pill">'+CYCLE_LABEL[def.cycle]+'</span></div>'+
      (done&&sp.expires?'<div class="muted" style="margin-top:6px">Expires '+fmtDate(sp.expires)+'</div>':'')+
      '<div class="muted" style="margin-top:6px">'+esc(def.note||'')+'</div>'+
      '<div class="p-actions"><button class="link-btn" data-e="'+sp.id+'">'+(done?'Update expiry':'Set expiry & mark obtained')+'</button>'+
      (sp.custom?'<button class="link-btn" data-d="'+sp.id+'" style="color:var(--mut)">Remove</button>':'')+'</div>'+
      '</div></div></div>';
  }).join('') || '<div class="empty">No permits yet.</div>';
  box.querySelectorAll('.p-check').forEach(b=>{ b.onclick=()=>togglePermit(b.dataset.p); });
  box.querySelectorAll('[data-e]').forEach(b=>{ b.onclick=()=>permitDateSheet(b.dataset.e); });
  box.querySelectorAll('[data-d]').forEach(b=>{ b.onclick=()=>{ const id=b.dataset.d; S.permits=S.permits.filter(p=>p.id!==id); S.customDefs=(S.customDefs||[]).filter(d=>d.id!==id); save(); renderPermits(); renderAlerts(); }; });
}
function togglePermit(id){
  const sp=S.permits.find(p=>p.id===id); const def=permitDef(id);
  if(sp.status==='active'){ sp.status='needed'; sp.expires=null; save(); renderPermits(); renderAlerts(); return; }
  const days=CYCLE_DAYS[def.cycle];
  sp.status='active'; sp.expires=days?addDaysKey(todayKey(),days):null; save(); renderPermits(); renderAlerts();
}
function permitDateSheet(id){
  const sp=S.permits.find(p=>p.id===id); const def=permitDef(id);
  const days=CYCLE_DAYS[def.cycle];
  openSheet('<h3>'+esc(def.name)+'</h3><p class="muted">'+esc(def.agency)+' · '+(def.fee?money(def.fee):'Free')+' · '+CYCLE_LABEL[def.cycle]+'</p>'+
    '<label>Expiry date<input type="date" id="pdDate" value="'+(sp.expires||(days?addDaysKey(todayKey(),days):''))+'"></label>'+
    '<p class="muted">Leave blank for one-time permits with no renewal.</p>'+
    '<button class="btn primary big" id="pdSave">Mark obtained</button><button class="btn ghost" id="pdCancel">Cancel</button>');
  $('#pdCancel').onclick=closeSheet;
  $('#pdSave').onclick=()=>{ sp.status='active'; sp.expires=$('#pdDate').value||null; save(); closeSheet(); renderPermits(); };
}
$('#addPermitBtn').onclick=()=>{
  openSheet('<h3>Add a permit</h3><p class="muted">For city-specific extras not in the list.</p>'+
    '<label>Name<input type="text" id="apName" placeholder="e.g. Special event permit" maxlength="80"></label>'+
    '<label>Agency<input type="text" id="apAgency" placeholder="e.g. ' + esc(CITIES[S.city].name) + ' health dept." maxlength="80"></label>'+
    '<div class="row2"><label>Fee ($)<input type="number" id="apFee" min="0" placeholder="0"></label>'+
    '<label>Renews<select id="apCycle"><option value="annual">Yearly</option><option value="biennial">Every 2 yrs</option><option value="3yr">Every 3 yrs</option><option value="5yr">Every 5 yrs</option><option value="onetime">One-time</option></select></label></div>'+
    '<label>Expiry date<input type="date" id="apExp"></label>'+
    '<button class="btn primary big" id="apSave">Add permit</button><button class="btn ghost" id="apCancel">Cancel</button>');
  $('#apCancel').onclick=closeSheet;
  $('#apSave').onclick=()=>{
    const name=$('#apName').value.trim(); if(!name) return;
    const id='custom-'+uid();
    // register custom def in persisted state (CITIES is static and would not survive reload)
    const def={id, name, agency:$('#apAgency').value.trim()||'—', fee:+$('#apFee').value||0, cycle:$('#apCycle').value, applies:[S.truckType], note:'Added by you.', custom:true};
    S.customDefs.push(def);
    S.permits.push({id, status:$('#apExp').value?'active':'needed', expires:$('#apExp').value||null, cost:+$('#apFee').value||0, custom:true});
    save(); closeSheet(); renderPermits();
  };
};

/* ---------- locations ---------- */
let weekOffset=0;
function renderLocations(){
  const wk=weekKeys(weekOffset);
  const first=parseKey(wk[0]), last=parseKey(wk[6]);
  $('#weekLabel').textContent=first.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+last.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const tK=todayKey();
  $('#weekGrid').innerHTML=wk.map(k=>{
    const d=parseKey(k); const spots=S.locations[k]||[];
    return '<div class="day-block"><div class="d-head"><strong>'+d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})+(k===tK?' · today':'')+'</strong>'+
      '<button class="btn small" data-add="'+k+'">+ Spot</button></div>'+
      (spots.length?spots.map((s,i)=>'<div class="spot-row"><div class="s-info"><strong>'+esc(s.spot)+'</strong><span>'+esc(s.addr||'')+(s.hours?' · '+esc(s.hours):'')+'</span></div><button class="del" data-del="'+k+'|'+i+'" aria-label="Remove">×</button></div>').join('')
      :'<div class="muted" style="font-size:13px">No spot scheduled.</div>')+'</div>';
  }).join('');
  $('#weekGrid').querySelectorAll('[data-add]').forEach(b=>{ b.onclick=()=>spotSheet(b.dataset.add); });
  $('#weekGrid').querySelectorAll('[data-del]').forEach(b=>{ b.onclick=()=>{ const [k,i]=b.dataset.del.split('|'); S.locations[k].splice(+i,1); if(!S.locations[k].length) delete S.locations[k]; save(); renderLocations(); }; });
}
$('#weekPrev').onclick=()=>{ weekOffset--; renderLocations(); };
$('#weekNext').onclick=()=>{ weekOffset++; renderLocations(); };
function spotSheet(k){
  openSheet('<h3>Schedule spot</h3><p class="muted">'+fmtDate(k)+'</p>'+
    '<label>Spot name<input type="text" id="spName" placeholder="e.g. Brewery X lot, 5th & Main" maxlength="80"></label>'+
    '<label>Address<input type="text" id="spAddr" placeholder="Optional" maxlength="120"></label>'+
    '<label>Hours<input type="text" id="spHours" placeholder="e.g. 11a–2p, 5–9p" maxlength="40"></label>'+
    '<button class="btn primary big" id="spSave">Add to schedule</button><button class="btn ghost" id="spCancel">Cancel</button>');
  $('#spCancel').onclick=closeSheet;
  $('#spSave').onclick=()=>{
    const name=$('#spName').value.trim(); if(!name) return;
    (S.locations[k]=S.locations[k]||[]).push({spot:name, addr:$('#spAddr').value.trim(), hours:$('#spHours').value.trim()});
    save(); closeSheet(); renderLocations();
  };
}

/* ---------- commissary ---------- */
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function renderCommissary(){
  const c=S.commissary;
  $('#comName').value=c.name||''; $('#comCost').value=c.cost||'';
  $('#comRenews').value=c.renews||''; $('#comNotes').value=c.notes||'';
  const dp=$('#comDays'); dp.innerHTML='';
  DAYS.forEach(d=>{
    const b=document.createElement('button');
    b.type='button'; b.className='day-pill'+((c.days||[]).includes(d)?' on':''); b.textContent=d;
    b.onclick=()=>{ const i=c.days.indexOf(d); if(i>=0) c.days.splice(i,1); else c.days.push(d); save(); renderCommissary(); };
    dp.appendChild(b);
  });
  const cost=+c.cost||0;
  const rd=c.renews?daysUntil(c.renews):null;
  $('#comSummary').innerHTML='<h4>Summary</h4>'+
    (c.name?'<strong style="font-size:17px">'+esc(c.name)+'</strong>':'<span class="muted">No commissary saved yet.</span>')+
    (cost?'<div class="muted" style="margin-top:6px">'+money(cost)+'/mo = '+money(cost*12)+'/yr</div>':'')+
    (c.days&&c.days.length?'<div class="muted" style="margin-top:4px">Usual days: '+c.days.join(', ')+'</div>':'')+
    (rd!==null?'<div style="margin-top:8px"><span class="pill '+(rd<=30?'crit':rd<=90?'warn':'ok')+'">Agreement '+(rd<0?'expired '+Math.abs(rd)+'d ago':'renews in '+rd+' days')+'</span></div>':'');
}
$('#comSave').onclick=()=>{
  S.commissary={name:$('#comName').value.trim(), cost:$('#comCost').value, renews:$('#comRenews').value, days:S.commissary.days||[], notes:$('#comNotes').value.trim()};
  save(); renderCommissary();
};

/* ---------- events ---------- */
function renderEvents(){
  const box=$('#pipeline'); box.innerHTML='';
  EV_STATUSES.forEach(([key,label])=>{
    const col=document.createElement('div'); col.className='pipe-col';
    const list=S.events.filter(e=>e.status===key).sort((a,b)=>a.date<b.date?-1:1);
    col.innerHTML='<h4>'+label+' <span class="count">'+list.length+'</span></h4>';
    list.forEach(e=>{
      const d=document.createElement('div'); d.className='ev-card';
      d.innerHTML='<strong>'+esc(e.name)+'</strong><span class="muted">'+fmtDate(e.date)+(e.fee?' · '+money(e.fee)+' fee':'')+(e.contact?' · '+esc(e.contact):'')+'</span>'+
        '<div class="ev-foot">'+
        (key!=='lead'?'<button class="btn small" data-mv="'+e.id+'|lead">← Lead</button>':'')+
        (key!=='booked'?'<button class="btn small" data-mv="'+e.id+'|booked">'+(key==='lead'?'Book →':'← Booked')+'</button>':'')+
        (key!=='done'?'<button class="btn small" data-mv="'+e.id+'|done">Done →</button>':'')+
        '<button class="link-btn" data-del="'+e.id+'" style="margin-left:auto">Remove</button></div>';
      col.appendChild(d);
    });
    if(!list.length){ const em=document.createElement('div'); em.className='empty'; em.textContent='Nothing here.'; col.appendChild(em); }
    box.appendChild(col);
  });
  box.querySelectorAll('[data-mv]').forEach(b=>{ b.onclick=()=>{ const [id,st]=b.dataset.mv.split('|'); S.events.find(e=>e.id===id).status=st; save(); renderEvents(); }; });
  box.querySelectorAll('[data-del]').forEach(b=>{ b.onclick=()=>{ S.events=S.events.filter(e=>e.id!==b.dataset.del); save(); renderEvents(); }; });
}
$('#addEventBtn').onclick=()=>{
  openSheet('<h3>Add booking</h3>'+
    '<label>Event name<input type="text" id="evName" placeholder="e.g. Wedding — Garcia" maxlength="80"></label>'+
    '<div class="row2"><label>Date<input type="date" id="evDate" value="'+todayKey()+'"></label><label>Fee ($) — optional<input type="number" id="evFee" min="0" placeholder="500"></label></div>'+
    '<label>Contact<input type="text" id="evContact" placeholder="Name / phone" maxlength="80"></label>'+
    '<label>Status<select id="evStatus"><option value="lead">Lead</option><option value="booked">Booked</option><option value="done">Done</option></select></label>'+
    '<button class="btn primary big" id="evSave">Add booking</button><button class="btn ghost" id="evCancel">Cancel</button>');
  $('#evCancel').onclick=closeSheet;
  $('#evSave').onclick=()=>{
    const name=$('#evName').value.trim(); if(!name||!$('#evDate').value) return;
    S.events.push({id:uid(), name, date:$('#evDate').value, fee:$('#evFee').value, contact:$('#evContact').value.trim(), status:$('#evStatus').value});
    save(); closeSheet(); renderEvents();
  };
};

/* ---------- revenue ---------- */
function renderRevenue(){
  const tK=todayKey();
  const wkStart=addDaysKey(tK,-6);
  const inW=S.revenue.filter(r=>r.date>=wkStart);
  const mStart=tK.slice(0,7);
  const inM=S.revenue.filter(r=>r.date.slice(0,7)===mStart);
  $('#revW').textContent=money(inW.reduce((a,r)=>a+ +r.amount,0));
  $('#revM').textContent=money(inM.reduce((a,r)=>a+ +r.amount,0));
  const best=S.revenue.slice().sort((a,b)=>b.amount-a.amount)[0];
  $('#revBest').textContent=best?money(best.amount):'—';
  // chart: last 7 days
  const days=[]; for(let i=6;i>=0;i--) days.push(addDaysKey(tK,-i));
  const max=Math.max(1,...days.map(k=>S.revenue.filter(r=>r.date===k).reduce((a,r)=>a+ +r.amount,0)));
  $('#revChart').innerHTML=days.map(k=>{
    const tot=S.revenue.filter(r=>r.date===k).reduce((a,r)=>a+ +r.amount,0);
    return '<div class="bar" style="height:'+Math.max(4,Math.round(tot/max*100))+'%"><span>'+(tot?Math.round(tot):'')+'</span></div>';
  }).join('');
  $('.chart-labels') && $('.chart-labels').remove();
  const lbl=document.createElement('div'); lbl.className='chart-labels';
  lbl.innerHTML=days.map(k=>'<span>'+parseKey(k).toLocaleDateString('en-US',{weekday:'narrow'})+'</span>').join('');
  $('#revChart').after(lbl);
  const list=S.revenue.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,30);
  $('#revList').innerHTML=list.length?list.map(r=>
    '<div class="rev-row"><div><strong>'+money(r.amount)+'</strong><div class="muted" style="font-size:12px">'+fmtDate(r.date)+(r.spot?' · '+esc(r.spot):'')+'</div></div><button class="del" data-r="'+r.id+'" aria-label="Remove">×</button></div>'
  ).join(''):'<div class="empty">No revenue logged yet. Log each selling day.</div>';
  $('#revList').querySelectorAll('[data-r]').forEach(b=>{ b.onclick=()=>{ S.revenue=S.revenue.filter(r=>r.id!==b.dataset.r); save(); renderRevenue(); }; });
}
function revenueSheet(presetDate){
  openSheet('<h3>Log a selling day</h3>'+
    '<div class="row2"><label>Date<input type="date" id="rvDate" value="'+(presetDate||todayKey())+'"></label><label>Revenue ($)<input type="number" id="rvAmt" inputmode="decimal" min="0" placeholder="850"></label></div>'+
    '<label>Spot<input type="text" id="rvSpot" placeholder="Where did you sell?" maxlength="80"></label>'+
    '<button class="btn primary big" id="rvSave">Log it</button><button class="btn ghost" id="rvCancel">Cancel</button>');
  $('#rvCancel').onclick=closeSheet;
  $('#rvSave').onclick=()=>{
    const amt=+$('#rvAmt').value; if(!amt||!$('#rvDate').value) return;
    const d=$('#rvDate').value;
    const ex=S.revenue.find(r=>r.date===d);
    if(ex){ ex.amount=amt; ex.spot=$('#rvSpot').value.trim()||ex.spot; }
    else S.revenue.push({id:uid(), date:d, amount:amt, spot:$('#rvSpot').value.trim()});
    save(); closeSheet(); renderRevenue(); renderHome();
  };
}
$('#addRevBtn').onclick=()=>revenueSheet();

/* ---------- settings ---------- */
$('#settingsBtn').onclick=()=>{
  openSheet('<h3>Settings</h3>'+
    '<label>Truck name<input type="text" id="stName" value="'+esc(S.truckName)+'" maxlength="60"></label>'+
    '<div class="set-row"><span>City</span><span class="muted">'+esc(CITIES[S.city]?CITIES[S.city].name:'—')+'</span></div>'+
    '<div class="set-row"><span>Operation</span><span class="muted">'+esc(TRUCK_TYPES[S.truckType]?TRUCK_TYPES[S.truckType].name:'—')+'</span></div>'+
    '<button class="btn primary big" id="stSave">Save</button>'+
    '<button class="danger" id="stReset">Erase all data and start over</button>'+
    '<button class="btn ghost" id="stCancel">Close</button>');
  $('#stCancel').onclick=closeSheet;
  $('#stSave').onclick=()=>{ S.truckName=$('#stName').value.trim()||'My Truck'; $('#truckName').textContent=S.truckName; save(); closeSheet(); };
  try{ if(window.__curbsideSyncUI) window.__curbsideSyncUI(); }catch(e){}
  $('#stReset').onclick=()=>{ if(confirm('Erase everything and restart setup?')){ ['curbside.v1','curbside.device_key','curbside.syncmeta.v1','curbside.lastsync.v1'].forEach(k=>{ try{localStorage.removeItem(k);}catch(e){} }); location.reload(); } };
};

/* ---------- init ---------- */
load();
if(S.onboarded && S.city){ enterMain(); } else { renderOnboard(); }

/* ---------- sync hooks (prototype backend; see sync.js) ---------- */
function refreshUI(){
  renderAlerts();
  var cur=null;
  $$('.tab-page').forEach(function(p){ if(!p.classList.contains('hidden')) cur=p; });
  if(cur) switchTab(cur.id.replace('page-',''));
}
window.__curbside = {
  getS: function(){ return S; },
  saveLocal: function(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} },
  refresh: refreshUI
};
})();

