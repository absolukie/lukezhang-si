/* Curbside: Food Truck OS. Vanilla JS, localStorage. No third-party requests. */
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
const moneySigned = n => (n<0?'-$':'+$')+Math.abs(Math.round(Number(n)||0)).toLocaleString('en-US');
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function daysUntil(k){ if(!k) return null; return Math.round((parseKey(k)-new Date(new Date().toDateString()))/86400000); }
function addDaysKey(k,n){ const d=parseKey(k); d.setDate(d.getDate()+n); return fmtKey(d); }
const CYCLE_DAYS = {annual:365, biennial:730, '3yr':1095, '5yr':1825, onetime:0};
const CYCLE_LABEL = {annual:'Renews yearly', biennial:'Renews every 2 yrs', '3yr':'Renews every 3 yrs', '5yr':'Renews every 5 yrs', onetime:'One-time'};
/* Fee honesty: est:true fees are unverified estimates and render with ~ plus a
 * provenance line naming the agency. fee:0 + est:true means the fee is unknown,
 * never free. feeNote overrides the fee pill for line items that carry no fee
 * of their own (e.g. commissary agreements: the agreement is free, the rent
 * is tracked in the Commissary tab). */
const feeLabel = d => d.feeNote ? d.feeNote : d.fee>0 ? ((d.est?'~':'')+money(d.fee)) : (d.est?'Fee TBD':'Free');
const estTag = d => d.est ? ' <span class="est">est.</span>' : '';
const estLine = d => d.est ? '<div class="est-line">Unverified estimate. Confirm with '+esc(d.agency)+'</div>' : '';
/* Estimated countdowns: expiry dates the app guessed (not user-entered) render with ~. */
const approxDays = sp => sp.expiresEst ? '~' : '';

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
/* self-sizing icons: 1em of surrounding text; explicit CSS sizes still override.
   All decorative: buttons already carry text labels, so hide from screen readers. */
Object.keys(I).forEach(k => { I[k] = I[k].replace('<svg ', '<svg aria-hidden="true" width="1em" height="1em" '); });

/* ---------- permit data (researched 2026-10-07; fees typical, verify with agency) ---------- */
/* applies: full = onboard cooking, limited = reheat/assembly, prepack = sealed only */
/* ID rule: every permit id is unique across ALL cities (checked at boot below).
 * Atlanta uses the ga- prefix; Austin keeps at-. */
const TRUCK_TYPES = {
  full:{name:'Full kitchen', desc:'Cooking on board: grill, fryer, full prep'},
  limited:{name:'Limited prep', desc:'Reheating, assembly, coffee, smoothies'},
  prepack:{name:'Prepackaged only', desc:'Sealed items, no cooking or handling'}
};
const CITIES = {
  la:{name:'Los Angeles, CA', sub:'LA County Public Health', permits:[
    {id:'la-mff', name:'Mobile Food Facility permit (MFF-C)', agency:'LA County Public Health', fee:620, cycle:'annual', applies:['full'], note:'Full cooking. MFF-B (~$440) if limited prep, MFF-A (~$280) if prepack only.'},
    {id:'la-mffb', est:true, name:'Mobile Food Facility permit (MFF-B)', agency:'LA County Public Health', fee:440, cycle:'annual', applies:['limited'], note:'Limited prep. MFF-C ($620) for full cooking, MFF-A (~$280) for prepack only.'},
    {id:'la-mffa', est:true, name:'Mobile Food Facility permit (MFF-A)', agency:'LA County Public Health', fee:280, cycle:'annual', applies:['prepack'], note:'Prepackaged only. MFF-C ($620) for full cooking, MFF-B (~$440) for limited prep.'},
    {id:'la-btrc', name:'Business Tax Registration Certificate', agency:'City of LA Office of Finance', fee:60, cycle:'annual', applies:['full','limited','prepack'], note:'City business tax registration.'},
    {id:'la-seller', name:"Seller's Permit", agency:'CA Dept. of Tax & Fee Admin', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Required before your first sale.'},
    {id:'la-fire', est:true, name:'Fire inspection + Class K extinguisher', agency:'LA Fire Dept.', fee:150, cycle:'annual', applies:['full','limited'], note:'Required with open flame or fryers.'},
    {id:'la-comm', name:'Commissary agreement', agency:'LA County-approved commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required before health permit issues. Track the monthly cost in the Commissary section.'},
    {id:'la-ins', name:'General liability insurance', agency:'Your carrier', fee:2400, cycle:'annual', applies:['full','limited','prepack'], note:'Typically $1M/$2M. Venues and events ask for proof.'}
  ]},
  austin:{name:'Austin, TX', sub:'TX statewide license (2026)', permits:[
    {id:'at-dshs3', name:'TX DSHS Type III mobile food license', agency:'TX Dept. of State Health Services', fee:876, cycle:'annual', applies:['full'], note:'New 2026 statewide license replaces local permits. +$500 pre-licensing inspection. Type II ($618) if limited.'},
    {id:'at-dshs2', name:'TX DSHS Type II mobile food license', agency:'TX Dept. of State Health Services', fee:618, cycle:'annual', applies:['limited'], note:'Limited prep. +$400 pre-licensing inspection.'},
    {id:'at-dshs1', name:'TX DSHS Type I mobile food license', agency:'TX Dept. of State Health Services', fee:309, cycle:'annual', applies:['prepack'], note:'Prepackaged only. Lowest tier.'},
    {id:'at-fire', name:'Fire inspection', agency:'Austin Fire Dept.', fee:222, cycle:'annual', applies:['full','limited'], note:'If cooking equipment on board.'},
    {id:'at-cfm', est:true, name:'Certified Food Manager certificate', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'One CFM must be assigned to the unit.'},
    {id:'at-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Written agreement required with application. Track the monthly cost in the Commissary section.'}
  ]},
  portland:{name:'Portland, OR', sub:'Multnomah County Health', permits:[
    {id:'pd-mfu', name:'Mobile Food Unit license (Class III/IV)', agency:'Multnomah County Health Dept.', fee:500, cycle:'annual', applies:['full'], note:'Class I/II (~$300) for limited or prepack. Classed by menu complexity.'},
    {id:'pd-mfu12', name:'Mobile Food Unit license (Class I/II)', agency:'Multnomah County Health Dept.', fee:300, cycle:'annual', applies:['limited','prepack'], note:'Limited prep or prepackaged.'},
    {id:'pd-fhc', name:'Oregon Food Handler Card', agency:'Multnomah County / OR Health Authority', fee:10, cycle:'3yr', applies:['full','limited','prepack'], note:'$10, every handler on the truck needs one.'},
    {id:'pd-fire', est:true, name:'Propane / fire safety permit', agency:'Portland Fire & Rescue', fee:150, cycle:'annual', applies:['full','limited'], note:'Annual inspection for gas cooking equipment.'},
    {id:'pd-biz', name:'Portland business license', agency:'City of Portland', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Standard city business registration.'},
    {id:'pd-comm', name:'Commissary agreement', agency:'Approved commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Proof of approved prep/storage facility. Track the monthly cost in the Commissary section.'}
  ]},
  denver:{name:'Denver, CO', sub:'State + City of Denver', permits:[
    {id:'dv-state', name:'CO retail food license (full mobile unit)', agency:'CDPHE / Denver County', fee:481, cycle:'annual', applies:['full'], note:'2026 statutory fee. Prepackaged-only units pay ~$338.'},
    {id:'dv-statep', name:'CO retail food license (prepackaged)', agency:'CDPHE / Denver County', fee:338, cycle:'annual', applies:['limited','prepack'], note:'No cooking on board.'},
    {id:'dv-city', name:'Denver mobile food vending license', agency:'Denver Business Licensing', fee:300, cycle:'annual', applies:['full','limited','prepack'], note:'City vending license, renewed yearly.'},
    {id:'dv-tax', name:'CO sales tax license', agency:'CO Dept. of Revenue', fee:16, cycle:'onetime', applies:['full','limited','prepack'], note:'$16 one-time, online.'},
    {id:'dv-fire', est:true, name:'Denver Fire propane permit', agency:'Denver Fire Dept.', fee:150, cycle:'annual', applies:['full','limited'], note:'Required with propane on board.'},
    {id:'dv-comm', name:'Commissary affidavit', agency:'Licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Signed affidavit of commissary servicing.'}
  ]},
  chicago:{name:'Chicago, IL', sub:'City of Chicago BACP', permits:[
    {id:'ch-mfp', name:'Mobile Food Preparer license', agency:'Chicago BACP', fee:1000, cycle:'biennial', applies:['full'], note:'$1,000 for a 2-year term. Cooking on board.'},
    {id:'ch-mfd', name:'Mobile Food Dispenser license', agency:'Chicago BACP', fee:700, cycle:'biennial', applies:['limited','prepack'], note:'$700 for a 2-year term. No onboard cooking.'},
    {id:'ch-fire', est:true, name:'Fire safety permit', agency:'Chicago Fire Dept.', fee:100, cycle:'annual', applies:['full','limited'], note:'Propane / cooking equipment.'},
    {id:'ch-fsr', name:'Fire suppression system review', agency:'Chicago Fire Dept.', fee:150, cycle:'onetime', applies:['full'], note:'One-time plan review for hood suppression.'},
    {id:'ch-san', est:true, name:'Food sanitation manager certificate', agency:'City of Chicago', fee:150, cycle:'5yr', applies:['full','limited'], note:'Certified manager for the unit.'},
    {id:'ch-comm', name:'Commissary / shared kitchen agreement', agency:'Licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'All prep at licensed kitchen; +$330/2yr shared-kitchen user license.'}
  ]},
  miami:{name:'Miami, FL', sub:'FL DBPR statewide', permits:[
    {id:'mi-mfdv', name:'Mobile Food Dispensing Vehicle license', agency:'FL DBPR', fee:347, cycle:'annual', applies:['full','limited','prepack'], note:'Statewide license, valid in every FL city. +$150 plan review for new units.'},
    {id:'mi-plan', name:'Plan review', agency:'FL DBPR', fee:150, cycle:'onetime', applies:['full','limited','prepack'], note:'One-time for new vehicles.'},
    {id:'mi-cobtr', name:'County Business Tax Receipt', agency:'Miami-Dade Tax Collector', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Required for county operation.'},
    {id:'mi-citybtr', name:'City of Miami Business Tax Receipt', agency:'City of Miami Finance', fee:100, cycle:'annual', applies:['full','limited','prepack'], note:'Only if vending inside City of Miami limits.'},
    {id:'mi-fire', est:true, name:'Fire suppression + Class K cert', agency:'Fire inspector / installer', fee:400, cycle:'onetime', applies:['full'], note:'One-time install + cert for open flame / fryers.'},
    {id:'mi-comm', name:'Commissary agreement', agency:'DBPR-licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'DBPR requires it before processing your application.'}
  ]},
  nyc:{name:'New York, NY', sub:'NYC DOHMH (capped permits)', permits:[
    {id:'nyc-license', name:'Mobile Food Vendor License (photo ID)', agency:'NYC DOHMH', fee:50, cycle:'biennial', applies:['full','limited','prepack'], note:'$50/2yr per operator. +$53 food protection course, must pass. No waitlist for the license itself.'},
    {id:'nyc-permit', est:true, name:'Mobile Food Vending Unit Permit', agency:'NYC DOHMH', fee:200, cycle:'biennial', applies:['full','limited','prepack'], note:'The truck decal. CAPPED: 5,100 unit permits with multi-year waitlists. Local Law 18 adds 445/yr through 2032. Private-property permits skip the waitlist.'},
    {id:'nyc-sales', name:'NYS Certificate of Authority', agency:'NYS Tax Dept.', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Collect sales tax.'},
    {id:'nyc-comm', name:'Commissary / servicing agreement', agency:'Approved servicing area', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required: daily servicing, waste disposal, restocking.'}
  ]},
  sf:{name:'San Francisco, CA', sub:'SFDPH + Treasurer', permits:[
    {id:'sf-mff', est:true, name:'Mobile Food Facility permit (cooking)', agency:'SFDPH', fee:1150, cycle:'annual', applies:['full'], note:'~$900-$1,400/yr for cooking classes. +$376-$879 one-time plan check. 6-10 weeks.'},
    {id:'sf-mfflow', name:'Mobile Food Facility permit (low-risk)', agency:'SFDPH', fee:500, cycle:'annual', applies:['limited','prepack'], note:'Lower-risk classes pay less. Commissary must hold its own SFDPH MFF permit.'},
    {id:'sf-biz', name:'Business Registration Certificate', agency:'SF Treasurer', fee:91, cycle:'annual', applies:['full','limited','prepack'], note:'Income-based, starts at $91/yr.'},
    {id:'sf-seller', name:"Seller's Permit", agency:'CA CDTFA', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free, online same day.'},
    {id:'sf-cfpm', est:true, name:'Food Protection Manager certification', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'Required in CA. $15-$150 by provider.'},
    {id:'sf-row', name:'Street vending permit (public ROW)', agency:'SF MTA / Public Works', fee:350, cycle:'annual', applies:['full','limited','prepack'], note:'Only to vend on public property. Competitive, waitlists common.'},
    {id:'sf-comm', name:'Commissary agreement', agency:'SFDPH-permitted commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required before SFDPH application. Commissary must hold its own SFDPH MFF permit.'}
  ]},
  seattle:{name:'Seattle, WA', sub:'King County Public Health', permits:[
    {id:'se-mfu', est:true, name:'Mobile Food Unit Permit', agency:'King County Public Health', fee:600, cycle:'annual', applies:['full','limited','prepack'], note:'~$450-$750/yr by complexity. Plan review first, ~2 weeks.'},
    {id:'se-li', est:true, name:'Conversion Vendor Insignia', agency:'WA Labor & Industries', fee:0, cycle:'onetime', applies:['full'], note:'Plan review required for trucks/trailers. 4-6 weeks. Verify fee with L&I.'},
    {id:'se-biz', est:true, name:'Seattle Business License Tax Certificate', agency:'City of Seattle', fee:110, cycle:'annual', applies:['full','limited','prepack'], note:'~$55-$300/yr by gross revenue.'},
    {id:'se-tax', name:'WA Sales Tax License (UBI)', agency:'WA Dept. of Revenue', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free. Register to collect sales tax.'},
    {id:'se-comm', name:'Commissary Use Agreement', agency:'King County-permitted commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required. Commissary must be King County-permitted.'}
  ]},
  houston:{name:'Houston, TX', sub:'TX statewide license (2026)', permits:[
    {id:'ho-dshs3', name:'TX DSHS Type III mobile food license', agency:'TX Dept. of State Health Services', fee:876, cycle:'annual', applies:['full'], note:'Statewide since July 2026 (HB 2844). +$500 pre-licensing inspection.'},
    {id:'ho-dshs2', name:'TX DSHS Type II mobile food license', agency:'TX Dept. of State Health Services', fee:618, cycle:'annual', applies:['limited'], note:'Limited prep. +$400 pre-licensing inspection.'},
    {id:'ho-dshs1', name:'TX DSHS Type I mobile food license', agency:'TX Dept. of State Health Services', fee:309, cycle:'annual', applies:['prepack'], note:'Prepackaged only. Lowest tier.'},
    {id:'ho-fire', est:true, name:'Propane / LP-Gas permit', agency:'Houston Fire Marshal', fee:0, cycle:'annual', applies:['full','limited'], note:'Required if cooking with propane. Verify fee: 832-394-8811.'},
    {id:'ho-cfm', est:true, name:'Certified Food Manager certificate', agency:'ANSI-accredited provider', fee:150, cycle:'5yr', applies:['full','limited'], note:'Required per unit.'},
    {id:'ho-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Written agreement required with application.'}
  ]},
  atlanta:{name:'Atlanta, GA', sub:'GA DPH + City Street Eats', permits:[
    {id:'ga-health', est:true, name:'Mobile Food Service Permit', agency:'Fulton County Board of Health', fee:250, cycle:'annual', applies:['full','limited','prepack'], note:'$100-$400/yr scaled to gross sales. Plan review + health and fire inspections first.'},
    {id:'ga-street', name:'Street Eats public vending permit', agency:'City of Atlanta (ATLBIZ)', fee:495, cycle:'annual', applies:['full','limited','prepack'], note:'$75 permit + $50 background + $20 fingerprinting + $350/yr reservation. Only for public right-of-way.'},
    {id:'ga-biz', est:true, name:'Business Occupation Tax Certificate', agency:'City of Atlanta', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'Income-based. Apply via ATLBIZ.'},
    {id:'ga-tax', name:'GA Sales & Use Tax Number', agency:'GA Dept. of Revenue', fee:0, cycle:'onetime', applies:['full','limited','prepack'], note:'Free, online.'},
    {id:'ga-fire', est:true, name:'Fire Marshal inspection + hood suppression', agency:'Atlanta Fire Rescue', fee:0, cycle:'annual', applies:['full','limited'], note:'Required. Verify inspection fee.'},
    {id:'ga-comm', name:'Commissary / base of operations', agency:'GA DPH-approved facility', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required for wastewater dumping, cleaning, restocking.'}
  ]},
  nashville:{name:'Nashville, TN', sub:'Metro Public Health', permits:[
    {id:'na-health', est:true, name:'Metro Public Health mobile food permit', agency:'Nashville-Davidson Health Dept.', fee:225, cycle:'annual', applies:['full','limited','prepack'], note:'Reported $150-$300/yr. Health inspection required. Verify current fee.'},
    {id:'na-vend', est:true, name:'Mobile vending authorization', agency:'Metro Nashville', fee:500, cycle:'annual', applies:['full','limited','prepack'], note:'Reported $200-$800/yr by type. Verify with Metro before budgeting.'},
    {id:'na-handler', name:'TN Food Handler certification', agency:'TN Dept. of Agriculture', fee:50, cycle:'3yr', applies:['full','limited','prepack'], note:'$50 for 3 years.'},
    {id:'na-biz', est:true, name:'Davidson County business license', agency:'Metro Clerk', fee:0, cycle:'annual', applies:['full','limited','prepack'], note:'TN business tax applies. Verify minimum with county clerk.'},
    {id:'na-comm', name:'Commissary agreement', agency:'Licensed commissary', fee:0, feeNote:'Free agreement', cycle:'annual', applies:['full','limited','prepack'], note:'Required by state law where applicable.'}
  ]}
};
/* Boot-time regression check: permit IDs must be unique across all cities.
 * A collision (like the old Atlanta/Austin at-fire pair) silently resolves
 * records to the wrong agency and fee, so it fails loudly here. */
(function checkPermitIds(){
  const seen={};
  const dupes=[];
  Object.keys(CITIES).forEach(ck=>{
    CITIES[ck].permits.forEach(p=>{
      if(seen[p.id]) dupes.push(p.id+' (in '+seen[p.id]+' and '+ck+')');
      else seen[p.id]=ck;
    });
  });
  if(dupes.length){
    const msg='Curbside: duplicate permit IDs: '+dupes.join('; ');
    try{ console.error(msg); }catch(e){}
    try{ document.addEventListener('DOMContentLoaded', ()=>{ document.body.insertAdjacentHTML('afterbegin','<div style="background:#B73220;color:#fff;padding:12px;font:14px sans-serif">'+esc(msg)+'</div>'); }); }catch(e){}
  }
})();
const EV_STATUSES = [['lead','Lead'],['booked','Booked'],['done','Done']];
/* Atlanta used at-* IDs before 2026-10-08 (colliding with Austin). Existing
 * records are remapped by the city they belong to on load. */
const ATLANTA_ID_MAP = {'at-ga':'ga-health','at-street':'ga-street','at-biz':'ga-biz','at-tax':'ga-tax','at-fire':'ga-fire','at-comm':'ga-comm'};

/* ---------- state ---------- */
const LS_KEY = 'curbside.v1';
let S = null;
function defaultState(){ return {v:1, truckName:'My Truck', city:null, truckType:null, permits:[], customDefs:[], extraCities:[], locations:{}, commissary:{name:'',cost:'',renews:'',days:[],notes:''}, prepVisits:[], inspectionChecks:{}, events:[], revenue:[], onboarded:false}; }
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} try{ if(window.__curbsideSync) window.__curbsideSync.onSave(); }catch(e){} }
function load(){
  try{
    const r=localStorage.getItem(LS_KEY);
    if(r){
      S=JSON.parse(r);
      if(!S.customDefs) S.customDefs=[];
      if(!S.extraCities){ S.extraCities=[]; }
      // backfill + Atlanta ID migration (records carry their own city).
      // Persisted immediately so the stored state never keeps stale fields.
      let dirty=false;
      if(!Array.isArray(S.prepVisits)){ S.prepVisits=[]; dirty=true; }
      if(!S.inspectionChecks){ S.inspectionChecks={}; dirty=true; }
      (S.permits||[]).forEach(sp=>{
        if(!sp.city){ sp.city=S.city; dirty=true; }
        if(sp.city==='atlanta' && ATLANTA_ID_MAP[sp.id]){ sp.id=ATLANTA_ID_MAP[sp.id]; dirty=true; }
      });
      if(dirty) save();
      return;
    }
  }catch(e){}
  S=defaultState();
}
function cityPermits(cityKey, typeKey){
  const c=CITIES[cityKey]; if(!c) return [];
  return c.permits.filter(p=>p.applies.includes(typeKey));
}

/* ---------- sheets (modal) ---------- */
let lastFocus=null;
function openSheet(html, label){
  lastFocus=document.activeElement;
  const w=$('#sheetWrap'); const sh=$('#sheet');
  sh.innerHTML=html;
  delete sh.dataset.paperworkEvent;
  const h=sh.querySelector('h3');
  sh.setAttribute('aria-label', label || (h?h.textContent.trim():'Dialog'));
  w.classList.remove('hidden');
  const f=sh.querySelector('input,textarea,select,button'); if(f) f.focus({preventScroll:true});
}
function closeSheet(){
  $('#sheetWrap').classList.add('hidden'); $('#sheet').innerHTML='';
  if(lastFocus && lastFocus.focus){ try{ lastFocus.focus({preventScroll:true}); }catch(e){} }
  lastFocus=null;
}
$('#sheetWrap').addEventListener('click', e=>{ if(e.target.id==='sheetWrap') closeSheet(); });
document.addEventListener('keydown', e=>{
  if($('#sheetWrap').classList.contains('hidden')) return;
  if(e.key==='Escape'){ closeSheet(); return; }
  if(e.key==='Tab'){ // focus trap: keep keyboard focus inside the sheet
    const els=Array.from($('#sheet').querySelectorAll('button,input,textarea,select,a[href]'))
      .filter(el=>!el.disabled && el.offsetParent!==null);
    if(!els.length) return;
    const first=els[0], last=els[els.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});

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
    const list=cityPermits(obCity, obType);
    $('#obPermitPreview').innerHTML=list.map(p=>
      '<div class="pp-row"><strong>'+esc(p.name)+'</strong><span>'+(p.feeNote?feeLabel(p):(p.fee?feeLabel(p)+'/'+(p.cycle==='onetime'?'one-time':p.cycle==='annual'?'yr':p.cycle):feeLabel(p)))+(p.est?'<em class="est"> est.</em>':'')+'</span></div>'
    ).join('');
    const obEst=list.some(p=>p.est);
    $('#obTotal').textContent=(obEst?'~':'')+money(list.reduce((a,p)=>a+p.fee,0))+(obEst?' (est.)':'');
  }
}
$('#obBack').onclick=()=>{ obCity=null; renderObSteps(); renderOnboard(); };
$('#obBack2').onclick=()=>{ obType=null; renderObSteps(); };
$('#obGo').onclick=()=>{
  S.city=obCity; S.truckType=obType;
  S.permits=cityPermits(obCity,obType).map(p=>({id:p.id, city:obCity, status:'needed', expires:null, cost:p.fee, expiresEst:false}));
  S.extraCities=[];
  S.onboarded=true; save(); enterMain();
};

/* ---------- main shell ---------- */
function enterMain(){
  $('#onboard').classList.add('hidden'); $('#main').classList.remove('hidden');
  brandMark($('#brandMark2'));
  $('#settingsBtn').innerHTML=I.gear;
  $('#truckName').textContent=S.truckName;
  $('#cityLabel').textContent=CITIES[S.city]?CITIES[S.city].name+' · '+TRUCK_TYPES[S.truckType].name:'';
  $('#permitCitySub').textContent=CITIES[S.city]?('Requirements for '+CITIES[S.city].name+' · '+TRUCK_TYPES[S.truckType].name+'. Fees are typical. Verify with the agency.'):'';
  $('#weekPrev').innerHTML=I.chevL; $('#weekNext').innerHTML=I.chevR;
  $$('#tabbar .ti')[0].innerHTML=I.home; $$('#tabbar .ti')[1].innerHTML=I.shield;
  $$('#tabbar .ti')[2].innerHTML=I.pin; $$('#tabbar .ti')[3].innerHTML=I.cal;
  $$('#tabbar .ti')[4].innerHTML=I.cash;
  switchTab('home');
}
$$('#tabbar button').forEach(b=>{ b.onclick=()=>switchTab(b.dataset.tab); });
$$('[data-goto]').forEach(b=>{ b.onclick=()=>switchTab(b.dataset.goto); });
function switchTab(t){
  $$('#tabbar button').forEach(b=>b.classList.toggle('active', b.dataset.tab===t));
  $$('.tab-page').forEach(p=>p.classList.add('hidden'));
  $('#page-'+t).classList.remove('hidden');
  if(t==='home') renderHome(); if(t==='permits'){ renderPermits(); renderCommissary(); }
  if(t==='locations') renderLocations();
  if(t==='events') renderEvents(); if(t==='revenue') renderRevenue();
  window.scrollTo(0,0);
}

/* ---------- alerts + score ---------- */
function permitState(sp,def){
  if(sp.status!=='active') return {level:'needed', days:null};
  const d=daysUntil(sp.expires);
  if(d===null) return {level:unverifiedSp(sp,def)?'unverified':'ok', days:null};
  if(d<0) return {level:'expired', days:d};
  if(d<=30) return {level:'crit', days:d};
  if(d<=90) return {level:'warn', days:d};
  return {level:'ok', days:d};
}
function allPermits(){
  return S.permits.map(sp=>({def:permitDef(sp.id), sp, cityKey:sp.city||S.city})).filter(x=>x.def);
}
function permitDef(id){
  const custom=(S.customDefs||[]).find(p=>p.id===id); if(custom) return custom;
  for(const k of Object.keys(CITIES)) { const f=CITIES[k].permits.find(p=>p.id===id); if(f) return f; }
  return null;
}
function cityNameOf(sp){
  const c=CITIES[sp.city||S.city]; return c?c.name:'';
}
const ALERT_RANK={expired:0,crit:1,warn:2,needed:3};
/* P1-3: a renewing permit (any cycle except one-time) with no expiry date is
 * NOT verified. Blank dates count as unverified everywhere: score, filter,
 * subline, alerts. One-time permits with no date are genuinely done. */
function isRenewing(def){ return !!(def && def.cycle && def.cycle!=='onetime'); }
function unverifiedSp(sp,def){
  return sp.status==='active' && (sp.expiresEst || (isRenewing(def) && !sp.expires));
}
function renderAlerts(){
  const box=$('#alerts'); const items=[];
  allPermits().forEach(({def,sp})=>{
    const st=permitState(sp,def);
    const cityBit=(sp.city&&sp.city!==S.city)?' ('+cityNameOf(sp)+')':'';
    if(sp.status!=='active') items.push({level:'needed', text:'Missing: '+def.name+cityBit, tab:'permits'});
    else if(st.level==='unverified') items.push({level:'warn', text:def.name+cityBit+': no expiry date on file. Enter it from your permit document', tab:'permits'});
    else if(st.level==='expired') items.push({level:'expired', text:def.name+cityBit+' EXPIRED '+approxDays(sp)+Math.abs(st.days)+' days ago. Renew now', tab:'permits'});
    else if(st.level==='crit') items.push({level:'crit', text:def.name+cityBit+' renews in '+approxDays(sp)+st.days+' days', tab:'permits'});
    else if(st.level==='warn') items.push({level:'warn', text:def.name+cityBit+' renews in '+approxDays(sp)+st.days+' days', tab:'permits'});
  });
  if(S.commissary.renews){ const d=daysUntil(S.commissary.renews);
    if(d!==null&&d<=60) items.push({level:d<=14?'crit':'warn', text:'Commissary agreement renews in '+d+' days', tab:'permits'});
  }
  items.sort((a,b)=>ALERT_RANK[a.level]-ALERT_RANK[b.level]);
  /* Fresh installs used to show a wall of "Missing: ..." cards that buried the
     Today card below the fold. Needed permits now collapse into one honest
     summary card: the count is exact and names are shown, never silently
     capped. Expired/crit/warn alerts still render one per permit. */
  const needed=items.filter(a=>a.level==='needed'), others=items.filter(a=>a.level!=='needed');
  let final=items;
  if(needed.length>=3){
    const names=needed.slice(0,2).map(a=>a.text.replace(/^Missing: /,''));
    final=others.concat([{level:'needed',
      text:needed.length+' permits still need setup: '+names.join(', ')+(needed.length>2?' +'+(needed.length-2)+' more':''),
      tab:'permits'}]);
  }
  box.innerHTML=final.map((a,i)=>
    '<div class="alert '+(a.level==='needed'?'warn':a.level)+'">'+I.warn+'<span>'+esc(a.text)+'</span><button data-a="'+i+'">Fix</button></div>'
  ).join('');
  box.querySelectorAll('button').forEach(b=>{ b.onclick=()=>switchTab(final[+b.dataset.a].tab); });
}
function complianceScore(){
  const ps=allPermits(); if(!ps.length) return {good:0,total:0};
  let good=0;
  ps.forEach(({sp,def})=>{ const st=permitState(sp,def); if(sp.status==='active'&&(st.level==='ok'||st.level==='warn')) good++; });
  return {good,total:ps.length};
}

/* ---------- home ---------- */
function weekKeys(offset){ const d=new Date(); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day+offset*7); const out=[]; for(let i=0;i<7;i++){ const x=new Date(d); x.setDate(d.getDate()+i); out.push(fmtKey(x)); } return out; }
function renderHome(){
  renderPaperworkHome();
  renderAlerts();
  const {good,total}=complianceScore();
  const pct=total?Math.round(good/total*100):0;
  $('#scoreNum').textContent=pct;
  $('#scoreRing').style.setProperty('--p',(pct*3.6)+'deg');
  $('#scoreLabel').textContent = total? good+' of '+total+' tracked items OK' : 'Getting set up';
  const act=allPermits().filter(({sp,def})=>sp.status==='active'&&permitState(sp,def).days!==null)
    .sort((a,b)=>permitState(a.sp,a.def).days-permitState(b.sp,b.def).days);
  const unv=act.filter(({sp})=>sp.expiresEst); // nearest unverified item named honestly
  const unvBlank=allPermits().filter(({sp,def})=>sp.status==='active'&&!sp.expires&&isRenewing(def));
  $('#scoreDetail').textContent =
    unv.length ? 'Nearest unverified: '+unv[0].def.name+' (~'+permitState(unv[0].sp,unv[0].def).days+'d, estimated date)'
    : unvBlank.length ? 'Nearest unverified: '+unvBlank[0].def.name+' (no expiry date on file)'
    : act.length ? 'Next renewal: '+act[0].def.name+' ('+permitState(act[0].sp,act[0].def).days+'d'+(act[0].sp.expiresEst?', estimated date':'')+')'
    : 'Add your permits to track renewals';
  // today card
  const tK=todayKey(); const spots=S.locations[tK]||[];
  const logged=S.revenue.some(r=>r.date===tK);
  $('#todayCard').innerHTML='<div class="card today-card"><div class="t-row"><div><strong>'+new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+'</strong>'+
    '<div class="muted">'+(spots.length?spots.map(s=>esc(s.spot)+(s.hours?' · '+esc(s.hours):'')).join('<br>'):'No spot scheduled today')+'</div></div>'+
    '<button class="btn primary small" id="quickRev">'+(logged?'Log another shift':'Log today')+'</button></div></div>';
  $('#quickRev').onclick=()=>revenueSheet(tK);
  // week strip
  const wk=weekKeys(0);
  $('#weekStrip').innerHTML=wk.map(k=>{
    const d=parseKey(k); const spots=(S.locations[k]||[]);
    return '<div class="day-chip'+(k===tK?' today':'')+'"><b>'+d.toLocaleDateString('en-US',{weekday:'short'})+' '+d.getDate()+'</b>'+
      '<span class="spot">'+(spots.length?esc(spots[0].spot)+(spots.length>1?' +'+(spots.length-1):''):'·')+'</span></div>';
  }).join('');
  // revenue this week
  const wset=new Set(wk);
  const rw=S.revenue.filter(r=>wset.has(r.date)).reduce((a,r)=>a+ +r.amount,0);
  $('#revWeek').textContent=money(rw);
  $('#revWeekSub').textContent=S.revenue.filter(r=>wset.has(r.date)).length+' selling shifts logged';
  // next renewal card
  if(act.length){ const st=permitState(act[0].sp,act[0].def);
    $('#nextRenewal').textContent=st.days<0?'OVERDUE':approxDays(act[0].sp)+st.days+' days';
    $('#nextRenewalSub').textContent=act[0].def.name+(act[0].sp.expiresEst?' (estimated date)':'');
  } else { $('#nextRenewal').textContent='·'; $('#nextRenewalSub').textContent='No dated permits'; }
  // upcoming events
  const up=S.events.filter(e=>e.status!=='done'&&e.date>=tK).sort((a,b)=>a.date<b.date?-1:1).slice(0,3);
  $('#homeEvents').innerHTML=up.length?up.map(e=>
    '<div class="spot-row"><div class="s-info"><strong>'+esc(e.name)+'</strong><span>'+fmtDate(e.date)+' · '+e.status+(e.fee?' · '+money(e.fee):'')+'</span></div></div>'
  ).join(''):'<div class="empty">No upcoming events yet.<br><button class="btn small" id="homeAddEvent" style="margin-top:8px">Add a booking</button></div>';
  const hae=$('#homeAddEvent'); if(hae) hae.onclick=()=>switchTab('events');
}

/* ---------- permits ---------- */
let permFilter='all'; // 'all' | 'verify'
function renderTimeline(){
  const ps=allPermits().filter(({sp})=>sp.status==='active'&&sp.expires);
  const head='<div class="tl-head"><h4>12-month renewal timeline</h4><div style="display:flex;gap:4px"><button class="link-btn" id="calBtn" title="Curbside can\'t send reminders itself yet. This downloads a calendar file; your phone\'s calendar will remind you.">Add renewals to calendar</button><button class="link-btn" id="snapBtn">Copy compliance snapshot</button></div></div>';
  if(!ps.length) return '<div class="card">'+head+'<div class="empty">Mark a permit as obtained to see your 12-month renewal timeline.</div></div>';
  const months=[]; const now=new Date();
  for(let i=0;i<12;i++){ const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    months.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'), label:d.toLocaleDateString('en-US',{month:'short'})+(i===0?'*':''), year:d.getFullYear()}); }
  const rows=months.map(mn=>{
    const hits=ps.filter(({sp})=>sp.expires.slice(0,7)===mn.key);
    if(!hits.length) return '';
    return '<div class="tl-row"><span class="tl-month">'+mn.label+'</span><div class="tl-chips">'+hits.map(({def,sp})=>{
      const st=permitState(sp,def);
      const cls=st.level==='crit'||st.level==='expired'?'crit':st.level==='warn'?'warn':'ok';
      return '<span class="pill '+cls+'">'+esc(def.name.length>26?def.name.slice(0,26)+'…':def.name)+'</span>';
    }).join('')+'</div></div>';
  }).join('');
  return '<div class="card">'+head+(rows||'<span class="muted">No renewals due in the next 12 months.</span>')+'</div>';
}
function copySnapshot(){
  const groups=[S.city].concat(S.extraCities||[]).filter(k=>CITIES[k]);
  const lines=[];
  groups.forEach(g=>{
    const ps=allPermits().filter(x=>x.cityKey===g);
    if(!ps.length) return;
    lines.push('== '+CITIES[g].name+' ==');
    ps.forEach(({def,sp})=>{
      const st=permitState(sp,def);
      const s=sp.status!=='active'?'NOT OBTAINED':st.level==='unverified'?'NO EXPIRY DATE ON FILE':st.days===null?'active':st.days<0?'EXPIRED '+approxDays(sp)+Math.abs(st.days)+'d ago':'expires '+(sp.expiresEst?'~':'')+sp.expires+' ('+approxDays(sp)+st.days+'d'+(sp.expiresEst?', estimated':', verified')+')';
      lines.push('- '+def.name+' ('+def.agency+'): '+s);
    });
  });
  const txt=S.truckName+' - '+cityNameOf({city:S.city})+'\nCompliance snapshot '+todayKey()+'\n'+lines.join('\n');
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(
    ()=>{ $('#snapBtn').textContent='Copied!'; setTimeout(()=>{ const b=$('#snapBtn'); if(b) b.textContent='Copy compliance snapshot'; },2000); },
    ()=>{ prompt('Copy your compliance snapshot:', txt); });
}
/* R-7: renewal reminders have no delivery channel of their own (no push,
 * no SMS), so the phone's calendar becomes the channel. One tap downloads
 * a calendar file with a 30-day heads-up for every upcoming renewal.
 * Copy is honest: Curbside can't send reminders itself yet. */
function exportCalendar(){
  const btn=$('#calBtn');
  const say=t=>{ if(btn){ btn.textContent=t; setTimeout(()=>{ const b=$('#calBtn'); if(b) b.textContent='Add renewals to calendar'; },2500); } };
  const items=[];
  const plus30=iso=>{ const d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); };
  const today=todayKey();
  allPermits().forEach(({def,sp})=>{
    if(sp.status!=='active'||!sp.expires||sp.expires<today) return;
    const when=plus30(sp.expires)<today?today:plus30(sp.expires);
    items.push({title:'Renew permit: '+def.name, date:when,
      desc:'Expires '+(sp.expiresEst?'~':'')+sp.expires+(sp.expiresEst?' (estimated date)':' (from your document)')+'. '+def.agency+'. '+S.truckName});
  });
  if(S.commissary.renews&&S.commissary.renews>=today){
    const when=plus30(S.commissary.renews)<today?today:plus30(S.commissary.renews);
    items.push({title:'Renew: commissary agreement', date:when,
      desc:'Agreement renews '+S.commissary.renews+'. '+(S.commissary.name||'')+'. '+S.truckName});
  }
  if(!items.length){ say('No upcoming renewals'); return; }
  const escIcs=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Curbside//Renewals//EN']
    .concat(items.map((e,i)=>['BEGIN:VEVENT',
      'UID:curbside-renew-'+i+'-'+Date.now()+'@curbside',
      'DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+e.date.replace(/-/g,''),
      'SUMMARY:'+escIcs(e.title),
      'DESCRIPTION:'+escIcs(e.desc),
      'END:VEVENT'].join('\r\n')))
    .concat(['END:VCALENDAR']).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
  a.download='curbside-renewals.ics';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} },4000);
  say('Saved! Import it into your calendar');
}
function permitPill(def, sp){
  const st=permitState(sp,def); const done=sp.status==='active';
  if(!done) return '<span class="pill">Not obtained</span>';
  if(st.level==='expired') return '<span class="pill crit">Expired '+approxDays(sp)+Math.abs(st.days)+'d ago</span>';
  if(st.level==='crit') return '<span class="pill crit">'+approxDays(sp)+st.days+' days left</span>';
  if(st.level==='warn') return '<span class="pill warn">'+approxDays(sp)+st.days+' days left</span>';
  if(st.level==='unverified') return '<span class="pill warn">No date on file</span>';
  if(st.days===null) return '<span class="pill ok">Done</span>';
  return '<span class="pill ok">'+approxDays(sp)+st.days+' days left</span>';
}
function renderPermits(){
  renderAlerts();
  $('#permitTimeline').innerHTML=renderTimeline();
  const sb=$('#snapBtn'); if(sb) sb.onclick=copySnapshot;
  const cb=$('#calBtn'); if(cb) cb.onclick=exportCalendar;
  const box=$('#permitList');
  // Stable order: permits stay in their curated definition order no matter
  // how their status changes. Toggling a checkmark only flips that card in
  // place; the list never re-sorts under the user's finger. Urgency still
  // surfaces through the alerts strip at the top (renderAlerts).
  const groups=[S.city].concat(S.extraCities||[]).filter(k=>CITIES[k]);
  const needVerify=allPermits().filter(({sp,def})=>unverifiedSp(sp,def)).length;
  let html='<div class="chip-row" role="group" aria-label="Permit filter">'+
    '<button class="chip'+(permFilter==='all'?' on':'')+'" data-f="all">All ('+allPermits().length+')</button>'+
    '<button class="chip'+(permFilter==='verify'?' on':'')+'" data-f="verify">Needs verification ('+needVerify+')</button></div>';
  groups.forEach((g,gi)=>{
    let ps=allPermits().filter(x=>x.cityKey===g);
    if(permFilter==='verify') ps=ps.filter(({sp,def})=>unverifiedSp(sp,def));
    html+='<div class="city-head"><h3>'+esc(CITIES[g].name)+'</h3>'+
      (gi>0?'<button class="link-btn" data-rmcity="'+g+'">Remove city</button>':'')+'</div>';
    html+=ps.map(({def,sp})=>{
      const done=sp.status==='active';
      return '<div class="permit'+(done?' done':'')+'"><div class="p-top">'+
        '<button class="p-check" data-p="'+sp.id+'" aria-label="Toggle obtained: '+esc(def.name)+'" aria-pressed="'+done+'">'+(done?I.check:'')+'</button>'+
        '<div class="p-body"><strong>'+esc(def.name)+'</strong><span class="muted">'+esc(def.agency)+'</span>'+
        '<div class="p-meta">'+permitPill(def,sp)+'<span class="pill cost">'+feeLabel(def)+estTag(def)+'</span><span class="pill">'+CYCLE_LABEL[def.cycle]+'</span></div>'+
        (done?(sp.expires?'<div class="muted" style="margin-top:6px">Expires '+(sp.expiresEst?'~':'')+fmtDate(sp.expires)+(sp.expiresEst?' <span class="est">(estimated date; tap below to enter the real one)</span>':' <span class="est ok-t">(from your document)</span>')+'</div>'
          :(isRenewing(def)?'<div class="muted" style="margin-top:6px">No expiry date on file. <span class="est">Tap below to enter it from your permit document.</span></div>':'')):'')+
        '<div class="muted" style="margin-top:6px">'+esc(def.note||'')+'</div>'+estLine(def)+
        '<div class="p-actions"><button class="link-btn" data-e="'+sp.id+'">'+(done?'Update expiry':'Set expiry & mark obtained')+'</button>'+
        (sp.custom?'<button class="link-btn" data-d="'+sp.id+'" style="color:var(--mut)">Remove</button>':'')+'</div>'+
        '</div></div></div>';
    }).join('') || '<div class="empty">No permits tracked here yet.</div>';
  });
  html+='<button class="btn ghost" id="addCityBtn" style="margin-top:4px">+ Track another city</button>';
  box.innerHTML=html;
  box.querySelectorAll('.chip').forEach(b=>{ b.onclick=()=>{ permFilter=b.dataset.f; renderPermits(); }; });
  box.querySelectorAll('.p-check').forEach(b=>{ b.onclick=()=>togglePermit(b.dataset.p); });
  box.querySelectorAll('[data-e]').forEach(b=>{ b.onclick=()=>permitDateSheet(b.dataset.e); });
  box.querySelectorAll('[data-d]').forEach(b=>{ b.onclick=()=>{ const id=b.dataset.d; S.permits=S.permits.filter(p=>p.id!==id); S.customDefs=(S.customDefs||[]).filter(d=>d.id!==id); save(); renderPermits(); renderAlerts(); }; });
  box.querySelectorAll('[data-rmcity]').forEach(b=>{ b.onclick=()=>{ const g=b.dataset.rmcity; if(!confirm('Stop tracking '+CITIES[g].name+' permits?')) return; S.extraCities=S.extraCities.filter(k=>k!==g); S.permits=S.permits.filter(p=>p.city!==g); save(); renderPermits(); renderAlerts(); }; });
  $('#addCityBtn').onclick=attachCitySheet;
}
function attachCitySheet(){
  const attached=[S.city].concat(S.extraCities||[]);
  const rest=Object.keys(CITIES).filter(k=>!attached.includes(k));
  openSheet('<h3>Track another city</h3><p class="muted">For trucks that vend in more than one city. Their permits load as extra tracked requirements under their own heading.</p>'+
    (rest.length?rest.map(k=>'<button class="btn ghost city-add" data-c="'+k+'">'+esc(CITIES[k].name)+'<span class="muted" style="margin-left:8px">'+esc(CITIES[k].sub)+'</span></button>').join(''):'<div class="empty">Every city is already tracked.</div>')+
    '<button class="btn ghost" id="acCancel">Cancel</button>', 'Track another city');
  $('#acCancel').onclick=closeSheet;
  $$('#sheet .city-add').forEach(b=>{ b.onclick=()=>{ attachCity(b.dataset.c); }; });
}
function attachCity(key){
  if(!S.extraCities.includes(key)) S.extraCities.push(key);
  cityPermits(key,S.truckType).forEach(p=>{
    if(!S.permits.find(sp=>sp.id===p.id))
      S.permits.push({id:p.id, city:key, status:'needed', expires:null, cost:p.fee, expiresEst:false});
  });
  save(); closeSheet(); renderPermits(); renderAlerts();
}
function togglePermit(id){
  const sp=S.permits.find(p=>p.id===id); const def=permitDef(id);
  if(sp.status==='active'){ sp.status='needed'; sp.expires=null; sp.expiresEst=false; save(); renderPermits(); renderAlerts(); return; }
  const days=CYCLE_DAYS[def.cycle];
  sp.status='active'; sp.expires=days?addDaysKey(todayKey(),days):null;
  sp.expiresEst=!!days; // guessed from the renewal cycle, not a real date: labeled as ~ everywhere
  save(); renderPermits(); renderAlerts();
}
function permitDateSheet(id){
  const sp=S.permits.find(p=>p.id===id); const def=permitDef(id);
  const days=CYCLE_DAYS[def.cycle];
  openSheet('<h3>'+esc(def.name)+'</h3><p class="muted">'+esc(def.agency)+' · '+feeLabel(def)+(def.est?' (est.)':'')+' · '+CYCLE_LABEL[def.cycle]+'</p>'+
    '<label>Expiry date<input type="date" id="pdDate" value="'+(sp.expires||(days?addDaysKey(todayKey(),days):''))+'"></label>'+
    '<fieldset class="radio-group"><legend>How did you get this date?</legend>'+
    '<label class="radio"><input type="radio" name="pdv" value="verified" checked> <span>This is the date on my permit document</span></label>'+
    '<label class="radio"><input type="radio" name="pdv" value="estimate"'+(sp.expiresEst?' checked':'')+'> <span>This is an estimate</span></label></fieldset>'+
    '<p class="muted">Leave the date blank for one-time permits with no renewal. A blank date on a renewing permit shows as needing verification until you enter the real date.</p>'+
    '<button class="btn primary big" id="pdSave">Mark obtained</button><button class="btn ghost" id="pdCancel">Cancel</button>', 'Set permit expiry date');
  $('#pdCancel').onclick=closeSheet;
  $('#pdSave').onclick=()=>{
    sp.status='active';
    const blank=!$('#pdDate').value;
    sp.expires=blank?null:$('#pdDate').value;
    /* P1-3: a blank date on a renewing permit is unverified, never OK. The
     * verified/estimate choice only applies when an actual date is saved. */
    sp.expiresEst=blank?isRenewing(def):($('#sheet input[name="pdv"]:checked').value==='estimate');
    save(); closeSheet(); renderPermits();
  };
}
$('#addPermitBtn').onclick=()=>{
  openSheet('<h3>Add a permit</h3><p class="muted">For city-specific extras not in the list.</p>'+
    '<label>Name<input type="text" id="apName" placeholder="e.g. Special event permit" maxlength="80"></label>'+
    '<label>Agency<input type="text" id="apAgency" placeholder="e.g. ' + esc(CITIES[S.city].name) + ' health dept." maxlength="80"></label>'+
    '<div class="row2"><label>Fee ($)<input type="number" id="apFee" inputmode="decimal" min="0" placeholder="0"></label>'+
    '<label>Renews<select id="apCycle"><option value="annual">Yearly</option><option value="biennial">Every 2 yrs</option><option value="3yr">Every 3 yrs</option><option value="5yr">Every 5 yrs</option><option value="onetime">One-time</option></select></label></div>'+
    '<label>Expiry date<input type="date" id="apExp"></label>'+
    '<fieldset class="radio-group"><legend>How did you get this date?</legend>'+
    '<label class="radio"><input type="radio" name="apv" value="verified" checked> <span>This is the date on my permit document</span></label>'+
    '<label class="radio"><input type="radio" name="apv" value="estimate"> <span>This is an estimate</span></label></fieldset>'+
    '<p class="muted">Blank date on a renewing permit shows as needing verification.</p>'+
    '<button class="btn primary big" id="apSave">Add permit</button><button class="btn ghost" id="apCancel">Cancel</button>', 'Add a permit');
  $('#apCancel').onclick=closeSheet;
  $('#apSave').onclick=()=>{
    const name=$('#apName').value.trim(); if(!name) return;
    const id='custom-'+uid();
    const exp=$('#apExp').value||null;
    const cyc=$('#apCycle').value;
    // register custom def in persisted state (CITIES is static and would not survive reload)
    const def={id, name, agency:$('#apAgency').value.trim()||'Unknown agency', fee:+$('#apFee').value||0, cycle:cyc, applies:[S.truckType], note:'Added by you.', custom:true};
    S.customDefs.push(def);
    /* P1-4: custom expiries enter unverified until confirmed. A date gets the
     * owner's verified/estimate choice; a blank date on a renewing permit
     * counts as unverified (same rule as standard permits). */
    S.permits.push({id, city:S.city, status:exp?'active':'needed', expires:exp,
      expiresEst:exp?($('#sheet input[name="apv"]:checked').value==='estimate'):(cyc!=='onetime'),
      cost:+$('#apFee').value||0, custom:true});
    save(); closeSheet(); renderPermits();
  };
};

/* ---------- inspection readiness ---------- */
/* Auto-derived from live permit data + a short manual tick list. The physical
 * items are general guidance, not jurisdiction requirements. */
const INSPECT_PHYSICAL=[
  {k:'handwash', label:'Handwash station: soap, paper towels, hot water'},
  {k:'thermo', label:'Thermometer on board and calibrated'},
  {k:'temps', label:'Food temperature log filled in for today'},
  {k:'ext', label:'Fire extinguisher tag is current'},
  {k:'coi', label:'Insurance COI saved on your phone'},
  {k:'commletter', label:'Commissary agreement letter on board'},
  {k:'cards', label:'Food handler cards for everyone working today'},
  {k:'waste', label:'Water, waste, and ice plan for today'}
];
function inspectSheet(){
  const paper=[];
  let hasCommPermit=false;
  allPermits().forEach(({def,sp,cityKey})=>{
    const st=permitState(sp,def);
    const cityBit=(cityKey&&cityKey!==S.city)?' ('+cityNameOf({city:cityKey})+')':'';
    // The catalog already tracks the commissary agreement for most cities.
    // When it does, the catalog row is canonical and we skip the separate
    // commissary-tab row so the same requirement never counts twice.
    if(/commissary/i.test(def.name||'')) hasCommPermit=true;
    if(sp.status!=='active') paper.push({ok:false, name:def.name+cityBit, detail:'Not obtained yet'});
    else if(st.level==='unverified') paper.push({ok:false, name:def.name+cityBit, detail:'No expiry date on file'});
    else if(st.level==='expired') paper.push({ok:false, name:def.name+cityBit, detail:'Expired '+(sp.expiresEst?'~':'')+Math.abs(st.days)+' days ago'});
    else paper.push({ok:true, name:def.name+cityBit, detail:sp.expires?('Good through '+(sp.expiresEst?'~':'')+fmtDate(sp.expires)+(sp.expiresEst?' (estimated date)':' (from your document)')):'On file'});
  });
  if(!hasCommPermit){
    const cr=S.commissary.renews?daysUntil(S.commissary.renews):null;
    // A missing renewal date is not readiness: it counts against the total
    // until the owner sets a date on the Commissary tab.
    paper.push({ok:cr!==null&&cr>0, name:'Commissary agreement',
      detail:cr===null?'No renewal date set. Add it in the Commissary section below.':cr<0?'Expired '+Math.abs(cr)+' days ago':'Good through '+fmtDate(S.commissary.renews)});
  }
  const checks=S.inspectionChecks||{};
  const physReady=INSPECT_PHYSICAL.filter(i=>checks[i.k]).length;
  const paperReady=paper.filter(p=>p.ok).length;
  openSheet('<h3>Inspection checklist</h3>'+
    '<p class="muted">General readiness guide. Your city or county may require more. Verify with your health department.</p>'+
    '<div class="check-count"><strong>'+(paperReady+physReady)+' of '+(paper.length+INSPECT_PHYSICAL.length)+' ready</strong></div>'+
    '<h4>Paperwork</h4>'+
    paper.map(p=>'<div class="paper-row '+(p.ok?'ok':'bad')+'"><span class="p-ico">'+(p.ok?I.check:I.warn)+'</span><div><strong>'+esc(p.name)+'</strong><span class="muted">'+esc(p.detail)+'</span></div></div>').join('')+
    '<h4>On the truck</h4>'+
    INSPECT_PHYSICAL.map(i=>'<button type="button" class="check-row'+(checks[i.k]?' on':'')+'" data-ic="'+i.k+'" aria-pressed="'+(!!checks[i.k])+'"><span class="p-check">'+(checks[i.k]?I.check:'')+'</span><span>'+esc(i.label)+'</span></button>').join('')+
    '<button class="btn ghost" id="icClose">Close</button>', 'Inspection checklist');
  $('#icClose').onclick=closeSheet;
  $$('#sheet [data-ic]').forEach(b=>{ b.onclick=()=>{ const k=b.dataset.ic; S.inspectionChecks=S.inspectionChecks||{}; if(S.inspectionChecks[k]) delete S.inspectionChecks[k]; else S.inspectionChecks[k]=true; save(); inspectSheet(); }; });
}
$('#inspectBtn').onclick=inspectSheet;

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
      (spots.length?spots.map((s,i)=>'<div class="spot-row"><div class="s-info"><strong>'+esc(s.spot)+'</strong><span>'+esc(s.addr||'')+(s.hours?' · '+esc(s.hours):'')+'</span></div><button class="del" data-del="'+k+'|'+i+'" aria-label="Remove spot">×</button></div>').join('')
      :'<div class="muted" style="font-size:13px">No spot scheduled.</div>')+'</div>';
  }).join('');
  $('#weekGrid').querySelectorAll('[data-add]').forEach(b=>{ b.onclick=()=>spotSheet(b.dataset.add); });
  $('#weekGrid').querySelectorAll('[data-del]').forEach(b=>{ b.onclick=()=>{ const [k,i]=b.dataset.del.split('|'); S.locations[k].splice(+i,1); if(!S.locations[k].length) delete S.locations[k]; save(); renderLocations(); }; });
}
$('#weekPrev').onclick=()=>{ weekOffset--; renderLocations(); };
$('#weekNext').onclick=()=>{ weekOffset++; renderLocations(); };
/* R-9: Goodfynd publishes each stop to customers; our grid was internal
 * only. One tap shares the week's own spots as text. Nothing is published
 * automatically; the owner chooses where it goes. */
function shareWeek(){
  const btn=$('#shareWeekBtn');
  const say=t=>{ if(btn){ const o=btn.textContent; btn.textContent=t; setTimeout(()=>{ const b=$('#shareWeekBtn'); if(b) b.textContent=o; },2000); } };
  const wk=weekKeys(weekOffset);
  const lines=wk.map(k=>{
    const d=parseKey(k).toLocaleDateString('en-US',{weekday:'short',month:'numeric',day:'numeric'});
    const spots=S.locations[k]||[];
    return d+': '+(spots.length?spots.map(s=>s.spot+(s.hours?' ('+s.hours+')':'')).join(' · '):'none');
  });
  const txt=S.truckName+' this week\n'+lines.join('\n');
  const done=()=>say('Shared!');
  if(navigator.share){ navigator.share({title:S.truckName+' this week', text:txt}).then(done,()=>{}); return; }
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(
    ()=>say('Copied! Paste it anywhere'),
    ()=>{ prompt('Copy your week:', txt); });
}
$('#shareWeekBtn').onclick=shareWeek;
function spotSheet(k){
  openSheet('<h3>Schedule spot</h3><p class="muted">'+fmtDate(k)+'</p>'+
    '<label>Spot name<input type="text" id="spName" placeholder="e.g. Brewery X lot, 5th & Main" maxlength="80"></label>'+
    '<label>Address<input type="text" id="spAddr" placeholder="Optional" maxlength="120"></label>'+
    '<label>Hours<input type="text" id="spHours" placeholder="e.g. 11a–2p, 5–9p" maxlength="40"></label>'+
    '<button class="btn primary big" id="spSave">Add to schedule</button><button class="btn ghost" id="spCancel">Cancel</button>', 'Schedule spot');
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
    b.onclick=()=>{ c.name=$('#comName').value; c.cost=$('#comCost').value; c.renews=$('#comRenews').value; c.notes=$('#comNotes').value;
      c.days=c.days||[]; const i=c.days.indexOf(d); if(i>=0) c.days.splice(i,1); else c.days.push(d); save(); renderCommissary(); };
    dp.appendChild(b);
  });
  const cost=+c.cost||0;
  const rd=c.renews?daysUntil(c.renews):null;
  $('#comSummary').innerHTML='<h4>Summary</h4>'+
    (c.name?'<strong style="font-size:17px">'+esc(c.name)+'</strong>':'<span class="muted">No commissary saved yet.</span>')+
    (cost?'<div class="muted" style="margin-top:6px">'+money(cost)+'/mo = '+money(cost*12)+'/yr</div>':'')+
    (c.days&&c.days.length?'<div class="muted" style="margin-top:4px">Usual days: '+c.days.join(', ')+'</div>':'')+
    (rd!==null?'<div style="margin-top:8px"><span class="pill '+(rd<=30?'crit':rd<=90?'warn':'ok')+'">Agreement '+(rd<0?'expired '+Math.abs(rd)+'d ago':'renews in '+rd+' days')+'</span></div>':'');
  // prep visits: are you using what you pay for?
  const V=S.prepVisits||[];
  const mStart=todayKey().slice(0,7);
  const inM=V.filter(v=>v.date&&v.date.slice(0,7)===mStart);
  const mHrs=inM.reduce((a,v)=>a+(+v.hours||0),0);
  const mExtra=inM.reduce((a,v)=>a+(+v.extra||0),0);
  const cv=$('#comVisits');
  if(cv){
    cv.innerHTML='<div class="page-head"><h4>Prep visits</h4><button class="btn small" id="visitAdd">+ Log visit</button></div>'+
      '<p class="muted" style="font-size:13px">This month: '+inM.length+' visit'+(inM.length===1?'':'s')+' · '+mHrs+' hrs · '+money(mExtra)+' overage</p>'+
      (V.length?V.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,30).map(v=>
        '<div class="rev-row"><div><strong>'+fmtDate(v.date)+'</strong><div class="muted" style="font-size:12px">'+
        (v.hours?v.hours+' hrs':'No hours logged')+(v.extra?' · '+money(v.extra)+' overage':'')+(v.notes?' · '+esc(v.notes):'')+'</div></div>'+
        '<button class="del" data-v="'+v.id+'" aria-label="Remove visit">×</button></div>'
      ).join(''):'<div class="empty">No visits logged yet. Track every drop-off to see what the kitchen really costs you.</div>');
    $('#visitAdd').onclick=visitSheet;
    cv.querySelectorAll('[data-v]').forEach(b=>{ b.onclick=()=>{ S.prepVisits=S.prepVisits.filter(v=>v.id!==b.dataset.v); save(); renderCommissary(); }; });
  }
}
function visitSheet(){
  openSheet('<h3>Log prep visit</h3>'+
    '<div class="row2"><label>Date<input type="date" id="cvDate" value="'+todayKey()+'"></label><label>Hours<input type="number" id="cvHrs" inputmode="decimal" min="0" placeholder="4"></label></div>'+
    '<label>Extra cost ($)<input type="number" id="cvExtra" inputmode="decimal" min="0" placeholder="0"></label>'+
    '<label>Notes<textarea id="cvNotes" rows="2" maxlength="200" placeholder="Prepped for Saturday, used the freezer bay…"></textarea></label>'+
    '<p class="muted">Extra cost covers per-visit overages some commissaries charge above the monthly plan.</p>'+
    '<button class="btn primary big" id="cvSave">Log visit</button><button class="btn ghost" id="cvCancel">Cancel</button>', 'Log prep visit');
  $('#cvCancel').onclick=closeSheet;
  $('#cvSave').onclick=()=>{
    if(!$('#cvDate').value) return;
    S.prepVisits.push({id:uid(), date:$('#cvDate').value, hours:+$('#cvHrs').value||0, extra:+$('#cvExtra').value||0, notes:$('#cvNotes').value.trim()});
    save(); closeSheet(); renderCommissary();
  };
}
$('#comSave').onclick=()=>{
  S.commissary={name:$('#comName').value.trim(), cost:$('#comCost').value, renews:$('#comRenews').value, days:S.commissary.days||[], notes:$('#comNotes').value.trim()};
  save(); renderCommissary();
};

/* ---------- event paperwork: evidence, never a blanket clearance ---------- */
const PW_ICON='<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h5"/></svg>';
const PW_COMMON=[
  {id:'insurance',label:'Insurance / COI expiry',kind:'permit',category:'insurance',help:'Link the insurance record behind your COI. This checks its recorded expiry, not coverage terms or venue delivery.'},
  {id:'coi-sent',label:'COI to venue or organizer',kind:'evidence',optional:true,help:'Record who received the COI and the sent-email subject. A policy date alone does not prove delivery.'},
  {id:'temporary',label:'Temporary food permit for this city',kind:'permit-evidence',category:'temporary',optional:true,help:'Link the issued permit. Record where the copy is kept and its approval for this event, city and date. An application is still pending. If not needed, name the agency and its confirmation.'},
  {id:'rider',label:'Insurance rider / endorsement',kind:'evidence',optional:true,help:'Record the broker confirmation or endorsement location for the venue request. If none is needed, record who confirmed that and why.'},
  {id:'load-in',label:'Venue load-in rules',kind:'evidence',optional:true,help:'After reading the venue email, record its subject and arrival, parking, power, waste and departure instructions.'},
  {id:'commissary',label:'Commissary agreement letter',kind:'permit-evidence',category:'commissary',optional:true,help:'Record where the signed letter is kept and confirm it applies to this booking. The Commissary renewal field has no document provenance; link a verified permit record to verify the date.'},
  {id:'health',label:'Health permit copy',kind:'permit-evidence',category:'health',optional:true,help:'Link the permit and record the copy location and confirmation it applies to this event city and date. Explicitly select a regional or statewide record if it applies.'}
];
const PW_FIRE={id:'fire',label:'Fire / fuel approval, if applicable',kind:'permit-evidence',category:'fire',optional:true,help:'Confirm cooking, propane and generator requirements with the venue or fire authority. Link any issued approval and record its scope and copy location, or who confirmed it is not needed.'};
const PW_DEFAULTS=[
  ['wedding','Wedding','Signed catering agreement','Record the signed agreement location, guest count and agreed service schedule.'],
  ['festival','Festival','Vendor acceptance / booth assignment','Record the organizer acceptance and booth assignment reference.'],
  ['brewery','Brewery pop-up','Site permission / service agreement','Record the brewery permission and agreed service hours.'],
  ['corporate','Corporate catering','Purchase order / vendor onboarding','Record the purchase order or onboarding confirmation reference. Note whether a W-9 was requested and sent; do not enter tax identifiers.'],
  ['street','Street vending','Location / right-of-way authorization','Record the location authorization reference and scope, or the authority that confirmed no separate authorization is needed.'],
  ['private','Private party','Host permission / catering agreement','Record host permission, agreement location, guest count and service schedule.']
].map(([id,label,title,help])=>({id,label,version:1,items:[...PW_COMMON.map(i=>({...i,label:id==='street'&&i.id==='load-in'?'Parking / access rules':i.label})),{id:'agreement',label:title,kind:'evidence',optional:true,help},...(['festival','brewery','street'].includes(id)?[{...PW_FIRE}]:[])]}));
const pwObject=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const pwDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&fmtKey(parseKey(d))===d;
const pwText=(s,n=300)=>typeof s==='string'?s.slice(0,n):'';
function pwTemplates(){
  const templates=new Map(PW_DEFAULTS.map(t=>[t.id,t]));
  (Array.isArray(S.paperworkTemplates)?S.paperworkTemplates:[]).forEach(t=>{
    if(pwObject(t)&&typeof t.id==='string'&&t.label&&Array.isArray(t.items)&&t.items.length&&t.items.every(i=>pwObject(i)&&typeof i.id==='string'&&typeof i.label==='string')&&new Set(t.items.map(i=>i.id)).size===t.items.length) templates.set(t.id,t);
  });
  return [...templates.values()];
}
function pwInstance(e){
  if(!pwObject(e.paperwork)) e.paperwork={version:1,records:{},items:[]};
  if(!pwObject(e.paperwork.records)) e.paperwork.records={};
  return e.paperwork;
}
function pwApplyTemplate(e,id){
  const t=pwTemplates().find(t=>t.id===id), p=pwInstance(e);
  if(t){ p.templateId=t.id; p.templateVersion=t.version; p.items=JSON.parse(JSON.stringify(t.items)); }
  e.eventType=id;
}
function pwItems(e){return pwObject(e.paperwork)&&Array.isArray(e.paperwork.items)?e.paperwork.items.filter(i=>pwObject(i)&&i.id&&i.label):[];}
function pwCity(s){
  const name=CITIES[s]?CITIES[s].name:s;
  return String(name||'').split(',')[0].trim().toLowerCase().replace(/\s+/g,' ');
}
function pwCandidates(e,i){
  const match={insurance:/insurance|\bcoi\b|liability/i,temporary:/temporary|special event/i,health:/health|mobile food|food (service|facility)|dshs/i,commissary:/commissary/i,fire:/fire|propane|lp-gas/i}[i.category];
  return allPermits().filter(x=>match&&match.test(x.def.name)&&(['insurance','commissary'].includes(i.category)||pwCity(x.cityKey)===pwCity(e.city)));
}
function pwSource(e,i,r){
  if(r.permitId){
    if(r.permitId==='@commissary'&&i.category==='commissary') return {sp:{id:'@commissary',status:S.commissary.name?'active':'needed',expires:S.commissary.renews,expiresEst:true},def:{name:'Commissary agreement'}};
    return (i.category==='insurance'?pwCandidates(e,i):allPermits()).find(x=>x.sp.id===r.permitId)||null;
  }
  const choices=pwCandidates(e,i);
  if(choices.length===1) return choices[0];
  if(!choices.length&&i.category==='commissary') return {sp:{id:'@commissary',status:S.commissary.name?'active':'needed',expires:S.commissary.renews,expiresEst:true},def:{name:'Commissary agreement'}};
  return null;
}
function pwContext(e,i,source){
  return JSON.stringify([e.name,e.date,e.city,e.venue,e.eventType,i,source?source.sp:null]);
}
function pwAssess(e,i){
  const r=(e.paperwork.records||{})[i.id]||{}, source=i.kind==='evidence'?null:pwSource(e,i,r);
  const context=pwContext(e,i,source);
  const evidence=!!pwText(r.note).trim()&&r.context===context;
  if(!['permit','permit-evidence','evidence'].includes(i.kind)) return {i,r,source,context,ok:false,detail:'Unsupported check. Review this template.'};
  if(i.optional&&r.disposition==='not-needed'&&evidence) return {i,r,source,context,ok:true,detail:'Not needed, owner confirmation: '+r.note};
  let dateDetail='', dateOK=true;
  if(i.kind!=='evidence'){
    if(!source){dateOK=false;dateDetail=r.permitId?'Linked record is missing.':'Link a permit record. No unique match for this booking.';}
    else {
      const sp=source.sp;
      dateOK=sp.status==='active'&&pwDate(sp.expires)&&sp.expiresEst===false&&sp.expires>=e.date;
      if(i.category==='insurance'&&sp.expires===e.date) dateOK=false;
      dateDetail=source.def.name+': '+(pwDate(sp.expires)?(sp.expiresEst===false?'':'~')+sp.expires+(sp.expiresEst===false?' · verified from document (by you)':' · estimated date'):'no expiry date on file');
      if(sp.status!=='active') dateDetail+=' · not obtained';
      else if(pwDate(sp.expires)&&sp.expires<e.date) dateDetail+=' · expires before event';
      else if(i.category==='insurance'&&sp.expires===e.date) dateDetail+=' · expires on event day; check exact time with broker';
      else if(sp.expiresEst!==false) dateDetail+=' · verify in Permits';
      else if(dateOK) dateDetail+=' · date check passes for event';
    }
  }
  const needsEvidence=i.kind!=='permit';
  const ok=dateOK&&(!needsEvidence||(r.disposition==='recorded'&&evidence));
  const evidenceDetail=needsEvidence?(r.note&&r.disposition!=='pending'&&!evidence?'Booking or permit changed. Review saved evidence.':r.disposition==='recorded'&&evidence?'Owner evidence: '+r.note:'Record evidence or confirm it is not needed.') : 'Auto-derived from live Permits.';
  return {i,r,source,context,ok,detail:[dateDetail,evidenceDetail].filter(Boolean).join(' ')};
}
function pwSummary(e){
  const items=pwItems(e);
  if(!e.eventType||!items.length||!e.city||!e.venue||!pwDate(e.date)) return {missing:1,setup:true,first:'Choose event type, city and venue',rows:[]};
  const rows=items.map(i=>pwAssess(e,i)), missing=rows.filter(x=>!x.ok);
  return {missing:missing.length,first:missing.length?missing[0].i.label:'Date checks and owner evidence recorded',rows};
}
function pwButton(e){
  const s=pwSummary(e);
  return '<button class="pw-entry '+(s.missing?'needs':'')+'" data-paperwork="'+esc(e.id)+'">'+PW_ICON+'<span><strong>'+(s.missing?'Paperwork: '+(s.setup?'set up':s.missing+' to resolve'):'Paperwork: evidence recorded')+'</strong><small>'+esc(s.first)+'</small></span>'+I.chevR+'</button>';
}
function pwBind(root){root.querySelectorAll('[data-paperwork]').forEach(b=>b.onclick=()=>paperworkSheet(b.dataset.paperwork));}
function renderPaperworkHome(){
  const box=$('#homePaperwork'); if(!box) return;
  const list=S.events.filter(e=>e.status==='booked'&&pwSummary(e).missing).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  box.innerHTML=list.length?'<div class="pw-home"><h3>'+list.length+' booking'+(list.length===1?'':'s')+' need paperwork</h3><p>Next to resolve: '+esc(list[0].name)+(pwDate(list[0].date)?' · '+fmtDate(list[0].date):' · date missing')+'</p>'+pwButton(list[0])+'</div>':'';
  pwBind(box);
}
function pwContextFields(e){
  return '<label>Event type<select id="pwType"><option value="">Choose a type</option>'+pwTemplates().map(t=>'<option value="'+esc(t.id)+'"'+(e.eventType===t.id?' selected':'')+'>'+esc(t.label)+'</option>').join('')+'</select></label>'+
    '<label>Event city<input id="pwCity" type="text" maxlength="80" value="'+esc(e.city||'')+'" placeholder="City where you will serve" list="pwCities"></label><datalist id="pwCities">'+Object.values(CITIES).map(c=>'<option value="'+esc(c.name.split(',')[0])+'">').join('')+'</datalist>'+
    '<label>Venue / site<input id="pwVenue" type="text" maxlength="120" value="'+esc(e.venue||'')+'" placeholder="Venue name or vending location"></label>';
}
function paperworkSetup(e){
  const draft=pwObject(e.paperworkSetupDraft)?e.paperworkSetupDraft:e;
  openSheet('<h3>Booking paperwork details</h3><p class="muted">'+esc(e.name)+'. Changing these details keeps your notes and asks you to review them.</p>'+pwContextFields(draft)+
    '<label>Event date<input id="pwDate" type="date" value="'+esc(draft.date||e.date||'')+'"></label><p id="pwError" role="alert"></p><button class="btn primary big" id="pwSetupSave">Save details</button><button class="btn ghost" id="pwBack">Back to paperwork</button>','Booking paperwork details');
  const read=()=>({eventType:$('#pwType').value,city:$('#pwCity').value.trim(),venue:$('#pwVenue').value.trim(),date:$('#pwDate').value});
  $$('#sheet input,#sheet select').forEach(el=>el.oninput=()=>{e.paperworkSetupDraft=read();save();});
  $('#pwBack').onclick=()=>paperworkSheet(e.id);
  $('#pwSetupSave').onclick=()=>{
    const v=read(); if(!v.eventType||!v.city||!v.venue||!pwDate(v.date)){ $('#pwError').textContent='Choose a type and enter a city, venue and valid date.'; return; }
    if(e.eventType!==v.eventType||!pwItems(e).length) pwApplyTemplate(e,v.eventType);
    Object.assign(e,v); delete e.paperworkSetupDraft; save(); renderEvents();renderPaperworkHome();paperworkSheet(e.id);
  };
}
function paperworkSheet(id){
  const e=S.events.find(x=>x.id===id); if(!e) return;
  const s=pwSummary(e);
  const row=x=>'<article class="pw-item '+(x.ok?'':'needs')+'"><div class="pw-item-head"><strong>'+esc(x.i.label)+'</strong><span class="pill '+(x.ok?'ok':'warn')+'">'+(x.ok?'Recorded':'Needs action')+'</span></div><p>'+esc(x.detail)+'</p><button class="btn small" data-pw-item="'+esc(x.i.id)+'">'+(x.i.kind==='permit'?'Review live record':x.ok?'Review evidence':'Record evidence')+'</button></article>';
  const todo=s.rows.filter(x=>!x.ok), done=s.rows.filter(x=>x.ok);
  openSheet('<div class="pw-head"><h3>Booking paperwork</h3><button class="btn small" id="pwClose">Close</button></div><p class="pw-event">'+esc(e.name)+'<br>'+esc([pwDate(e.date)?fmtDate(e.date)+' (booking date)':'Date missing',e.city,e.venue].filter(Boolean).join(' · '))+'</p>'+
    '<div class="pw-status '+(s.missing?'needs':'')+'"><strong>'+(s.setup?'Set up this booking':s.missing?s.missing+' items to resolve':'Evidence recorded for every item')+'</strong><p>Live date checks plus your evidence. Confirm requirements with the venue, broker and issuing agency.</p></div>'+
    '<button class="btn small" id="pwSetup">'+(s.setup?'Choose type, city and venue':'Edit booking details')+'</button>'+
    (s.setup?'': '<h4 class="pw-section">'+(todo.length?'Resolve before service':'No unresolved items')+'</h4>'+todo.map(row).join('')+(done.length?'<details class="pw-done"><summary>'+done.length+' recorded items</summary>'+done.map(row).join('')+'</details>':''))+
    '<p class="muted">Notes and references only. No files are uploaded or sent. Dates labeled verified are entered by you from a document. This guide is not legal advice; verify with the agency.</p>','Booking paperwork');
  $('#sheet').dataset.paperworkEvent=id;
  $('#sheet').scrollTop=0;
  $('#pwClose').onclick=closeSheet;
  $('#pwSetup').onclick=()=>paperworkSetup(e);
  $$('#sheet [data-pw-item]').forEach(b=>b.onclick=()=>paperworkEvidence(e,b.dataset.pwItem));
}
function paperworkEvidence(e,itemId){
  const i=pwItems(e).find(x=>x.id===itemId); if(!i) return;
  const p=pwInstance(e), r=p.records[itemId]||{}, d=pwObject(r.draft)?r.draft:r;
  const x=pwAssess(e,i), isPermit=i.kind!=='evidence';
  const choices=i.category==='insurance'?pwCandidates(e,i):allPermits();
  openSheet('<h3>'+esc(i.label)+'</h3><p>'+esc(i.help||'Record a source and where you can find the evidence.')+'</p><p class="pw-source">'+esc(x.detail)+'</p>'+
    (isPermit?'<label>Live permit record<select id="pwPermit"><option value="">Use a unique matching record</option>'+choices.map(v=>'<option value="'+esc(v.sp.id)+'"'+(d.permitId===v.sp.id?' selected':'')+'>'+esc(v.def.name+' · '+cityNameOf(v.sp))+'</option>').join('')+(i.category==='commissary'?'<option value="@commissary"'+(d.permitId==='@commissary'?' selected':'')+'>Commissary renewal (estimated)</option>':'')+'</select></label><p class="muted">Choose only a record that applies to this item and booking. Cross-city permits need scope evidence.</p><button class="btn small" id="pwPermits">Edit dates / add record in Permits</button>':'')+
    (i.kind==='permit'?'':'<label>Evidence status<select id="pwDisposition"><option value="pending">Pending / requested</option><option value="recorded">Evidence recorded</option>'+(i.optional?'<option value="not-needed">Confirmed not needed</option>':'')+'</select></label><label>Source and evidence<textarea id="pwNote" rows="4" maxlength="300" placeholder="Document location, email subject, recipient, or who confirmed and why">'+esc(d.note||'')+'</textarea></label><p class="muted">Drafts save as you type. Save evidence confirms your source for this booking. Do not enter passwords or tax identifiers.</p>')+
    '<p id="pwError" role="alert"></p><button class="btn primary big" id="pwEvidenceSave">'+(i.kind==='permit'?'Save record link':'Save evidence')+'</button><button class="btn ghost" id="pwBack">Back to paperwork</button>','Paperwork evidence');
  delete $('#sheet').dataset.paperworkEvent;
  if($('#pwDisposition')) $('#pwDisposition').value=['pending','recorded','not-needed'].includes(d.disposition)?d.disposition:'pending';
  if(isPermit&&d.permitId&&!choices.some(v=>v.sp.id===d.permitId)&&d.permitId!=='@commissary') $('#pwPermit').insertAdjacentHTML('beforeend','<option selected value="'+esc(d.permitId)+'">Missing linked record</option>');
  const read=()=>({permitId:$('#pwPermit')?$('#pwPermit').value:'',disposition:$('#pwDisposition')?$('#pwDisposition').value:'pending',note:$('#pwNote')?$('#pwNote').value.trim():''});
  const draft=()=>{p.records[itemId]={...r,draft:read()};save();};
  $$('#sheet input,#sheet textarea,#sheet select').forEach(el=>el.oninput=draft);
  $('#pwBack').onclick=()=>paperworkSheet(e.id);
  if($('#pwPermits')) $('#pwPermits').onclick=()=>{draft();closeSheet();switchTab('permits');};
  $('#pwEvidenceSave').onclick=()=>{
    const v=read();
    if(i.kind!=='permit'&&v.disposition!=='pending'&&!v.note){$('#pwError').textContent='Add the evidence source, or who confirmed this is not needed and why.';return;}
    p.records[itemId]={...v,context:pwContext(e,i,isPermit?pwSource(e,i,v):null),recordedAt:new Date().toISOString()};
    save();renderEvents();renderPaperworkHome();paperworkSheet(e.id);
  };
}

/* ---------- events + ROI ---------- */
/* Net = revenue taken minus fee paid. Both are owner-entered; the result is a
 * personal record, never a tax document. */
function eventNet(e){
  if(!e.result || e.result.revenue===null || e.result.revenue===undefined) return null;
  const fee=+e.result.fee||0, rev=+e.result.revenue||0;
  return {fee, rev, net:rev-fee};
}
function renderEvents(){
  const box=$('#pipeline'); box.innerHTML='';
  EV_STATUSES.forEach(([key,label])=>{
    const col=document.createElement('div'); col.className='pipe-col';
    const list=S.events.filter(e=>e.status===key).sort((a,b)=>a.date<b.date?-1:1);
    col.innerHTML='<h4>'+label+' <span class="count">'+list.length+'</span></h4>';
    list.forEach(e=>{
      const d=document.createElement('div'); d.className='ev-card';
      const net=key==='done'?eventNet(e):null;
      let roiLine='';
      if(net) roiLine='<div class="roi-line"><span class="pill '+(net.net>=0?'ok':'crit')+'">Net '+moneySigned(net.net)+'</span><span class="muted">'+money(net.rev)+' taken · '+money(net.fee)+' fee'+(e.result.notes?' · '+esc(e.result.notes):'')+'</span></div>';
      d.innerHTML='<strong>'+esc(e.name)+'</strong><span class="muted">'+fmtDate(e.date)+(e.fee?' · '+money(e.fee)+' fee':'')+(e.contact?' · '+esc(e.contact):'')+'</span>'+roiLine+pwButton(e)+
        '<div class="ev-foot">'+
        (key!=='lead'?'<button class="btn small" data-mv="'+e.id+'|lead">← Lead</button>':'')+
        (key!=='booked'?'<button class="btn small" data-mv="'+e.id+'|booked">'+(key==='lead'?'Book →':'← Booked')+'</button>':'')+
        (key!=='done'?'<button class="btn small" data-mv="'+e.id+'|done">Done →</button>':'')+
        (key==='done'?'<button class="btn small" data-res="'+e.id+'">'+(e.result?'Edit result':'Log result')+'</button>':'')+
        '<button class="link-btn" data-del="'+e.id+'" style="margin-left:auto">Remove</button></div>';
      col.appendChild(d);
    });
    if(!list.length){ const em=document.createElement('div'); em.className='empty';
    em.textContent=key==='lead'?'No leads yet. Tap + Add booking above.':key==='booked'?'Nothing booked yet.':'Nothing done yet. Log a result when one lands.';
    col.appendChild(em); }
    box.appendChild(col);
  });
  pwBind(box);
  // season totals across done events with logged results
  const done=S.events.filter(e=>e.status==='done').map(e=>({e,net:eventNet(e)})).filter(x=>x.net);
  const fees=done.reduce((a,x)=>a+x.net.fee,0), revs=done.reduce((a,x)=>a+x.net.rev,0);
  const et=$('#eventTotals');
  if(et) et.textContent=done.length
    ? done.length+' done event'+(done.length>1?'s':'')+' with logged results · fees '+money(fees)+' · taken '+money(revs)+' · net '+moneySigned(revs-fees)
    : 'Mark an event Done, then log its result to see which gigs paid.';
  box.querySelectorAll('[data-mv]').forEach(b=>{ b.onclick=()=>{ const [id,st]=b.dataset.mv.split('|'); S.events.find(e=>e.id===id).status=st; save(); renderEvents(); renderHome(); }; });
  box.querySelectorAll('[data-res]').forEach(b=>{ b.onclick=()=>resultSheet(b.dataset.res); });
  box.querySelectorAll('[data-del]').forEach(b=>{ b.onclick=()=>{ S.events=S.events.filter(e=>e.id!==b.dataset.del); save(); renderEvents(); renderHome(); }; });
}
function resultSheet(id){
  const e=S.events.find(x=>x.id===id); if(!e) return;
  const r=e.result||{};
  openSheet('<h3>Log event result</h3><p class="muted">'+esc(e.name)+' · '+fmtDate(e.date)+'</p>'+
    '<div class="row2"><label>Fee paid ($)<input type="number" id="erFee" inputmode="decimal" min="0" placeholder="500" value="'+(r.fee!=null?r.fee:(e.fee||''))+'"></label>'+
    '<label>Revenue taken ($)<input type="number" id="erRev" inputmode="decimal" min="0" placeholder="1800" value="'+(r.revenue!=null?r.revenue:'')+'"></label></div>'+
    '<label>Notes<textarea id="erNotes" rows="2" maxlength="200" placeholder="Slow lunch, big dinner rush…">'+esc(r.notes||'')+'</textarea></label>'+
    '<p class="muted">Net is revenue minus fee. This is your own record of the gig, not a tax document.</p>'+
    '<button class="btn primary big" id="erSave">Save result</button><button class="btn ghost" id="erCancel">Cancel</button>', 'Log event result');
  $('#erCancel').onclick=closeSheet;
  $('#erSave').onclick=()=>{
    const revTxt=$('#erRev').value;
    const rev=(revTxt===''||revTxt==null)?null:+revTxt;
    e.result={fee:+$('#erFee').value||0, revenue:rev, notes:$('#erNotes').value.trim(), on:todayKey()};
    save(); closeSheet(); renderEvents(); renderHome();
  };
}
$('#addEventBtn').onclick=()=>{
  openSheet('<h3>Add booking</h3>'+
    '<label>Event name<input type="text" id="evName" placeholder="e.g. Garcia wedding" maxlength="80"></label>'+
    '<div class="row2"><label>Date<input type="date" id="evDate" value="'+todayKey()+'"></label><label>Fee ($) (optional)<input type="number" id="evFee" inputmode="decimal" min="0" placeholder="500"></label></div>'+
    pwContextFields({})+
    '<label>Contact<input type="text" id="evContact" placeholder="Name / phone" maxlength="80"></label>'+
    '<label>Status<select id="evStatus"><option value="lead">Lead</option><option value="booked">Booked</option><option value="done">Done</option></select></label>'+
    '<button class="btn primary big" id="evSave">Add booking</button><button class="btn ghost" id="evCancel">Cancel</button>', 'Add booking');
  $('#evCancel').onclick=closeSheet;
  $('#evSave').onclick=()=>{
    const name=$('#evName').value.trim(); if(!name||!$('#evDate').value) return;
    const e={id:uid(), name, date:$('#evDate').value, fee:$('#evFee').value, contact:$('#evContact').value.trim(), status:$('#evStatus').value,city:$('#pwCity').value.trim(),venue:$('#pwVenue').value.trim()};
    if($('#pwType').value) pwApplyTemplate(e,$('#pwType').value);
    S.events.push(e);
    save(); closeSheet(); renderEvents(); renderPaperworkHome();
  };
};

/* ---------- revenue (multiple shifts per day allowed) ---------- */
function renderRevenue(){
  const tK=todayKey();
  const wkStart=addDaysKey(tK,-6);
  const inW=S.revenue.filter(r=>r.date>=wkStart);
  const mStart=tK.slice(0,7);
  const inM=S.revenue.filter(r=>r.date.slice(0,7)===mStart);
  $('#revW').textContent=money(inW.reduce((a,r)=>a+ +r.amount,0));
  $('#revM').textContent=money(inM.reduce((a,r)=>a+ +r.amount,0));
  const best=S.revenue.slice().sort((a,b)=>b.amount-a.amount)[0];
  $('#revBest').textContent=best?money(best.amount):'·';
  // chart: last 7 days, summed per date
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
  // top spots: which corners pay, from the owner's own logged shifts
  const bySpot={};
  S.revenue.forEach(r=>{ const name=(r.spot||'').trim(); if(!name) return; const k=name.toLowerCase();
    bySpot[k]=bySpot[k]||{name, n:0, tot:0}; bySpot[k].n++; bySpot[k].tot+=+r.amount; });
  const ranked=Object.values(bySpot).sort((a,b)=>b.tot-a.tot).slice(0,8);
  const oldTs=$('#topSpots'); if(oldTs) oldTs.remove();
  const ts=document.createElement('div'); ts.className='card'; ts.id='topSpots'; ts.style.marginTop='12px';
  ts.innerHTML='<h4>Top spots</h4>'+
    (ranked.length?ranked.map(s=>'<div class="spot-row"><div class="s-info"><strong>'+esc(s.name)+'</strong><span>'+s.n+' shift'+(s.n>1?'s':'')+' · '+money(Math.round(s.tot/s.n))+' avg</span></div><strong>'+money(s.tot)+'</strong></div>').join('')
    :'<div class="empty">Log shifts with a spot name to see which corners pay.</div>');
  $('#revChart').closest('.card').after(ts);
  const list=S.revenue.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,60);
  $('#revList').innerHTML=list.length?list.map(r=>
    '<div class="rev-row"><div><strong>'+money(r.amount)+'</strong><div class="muted" style="font-size:12px">'+fmtDate(r.date)+(r.spot?' · '+esc(r.spot):'')+'</div></div><button class="del" data-r="'+r.id+'" aria-label="Remove revenue entry">×</button></div>'
  ).join(''):'<div class="empty">No revenue logged yet. Log each selling shift.</div>';
  $('#revList').querySelectorAll('[data-r]').forEach(b=>{ b.onclick=()=>{ S.revenue=S.revenue.filter(r=>r.id!==b.dataset.r); save(); renderRevenue(); }; });
}
function revenueSheet(presetDate){
  openSheet('<h3>Log a selling shift</h3><p class="muted">Lunch and dinner count separately. Log each shift and the day totals up.</p>'+
    '<div class="row2"><label>Date<input type="date" id="rvDate" value="'+(presetDate||todayKey())+'"></label><label>Revenue ($)<input type="number" id="rvAmt" inputmode="decimal" min="0" placeholder="850"></label></div>'+
    '<label>Spot<input type="text" id="rvSpot" placeholder="Where did you sell?" maxlength="80"></label>'+
    '<button class="btn primary big" id="rvSave">Log it</button><button class="btn ghost" id="rvCancel">Cancel</button>', 'Log a selling shift');
  $('#rvCancel').onclick=closeSheet;
  $('#rvSave').onclick=()=>{
    /* Negative amounts are never valid revenue: clamp to zero instead of
       poisoning the week/month totals. */
    const amt=Math.max(0,+$('#rvAmt').value); if(!amt||!$('#rvDate').value) return;
    S.revenue.push({id:uid(), date:$('#rvDate').value, amount:amt, spot:$('#rvSpot').value.trim()});
    save(); closeSheet(); renderRevenue(); renderHome();
  };
}
$('#addRevBtn').onclick=()=>revenueSheet();
$('#csvRevBtn').onclick=()=>csvSheet();
function csvSheet(){
  const dates=S.revenue.map(r=>r.date).sort();
  const d0=dates[0]||todayKey();
  openSheet('<h3>Export revenue CSV</h3><p class="muted">For your bookkeeper: date, amount, spot.</p>'+
    '<div class="row2"><label>From<input type="date" id="csvFrom" value="'+d0+'"></label><label>To<input type="date" id="csvTo" value="'+todayKey()+'"></label></div>'+
    '<button class="btn primary big" id="csvGo">Download CSV</button><button class="btn ghost" id="csvCancel">Cancel</button>', 'Export revenue CSV');
  $('#csvCancel').onclick=closeSheet;
  $('#csvGo').onclick=()=>{
    const from=$('#csvFrom').value, to=$('#csvTo').value;
    const rows=S.revenue.filter(r=>r.date>=from&&r.date<=to).sort((a,b)=>a.date<b.date?-1:1);
    const q=s=>'"'+String(s||'').replace(/"/g,'""')+'"';
    const csv='date,amount,spot\n'+rows.map(r=>r.date+','+r.amount+','+q(r.spot)).join('\n')+'\n';
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download='curbside-revenue-'+from+'-to-'+to+'.csv';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
    closeSheet();
  };
}

/* ---------- phone line (text/voice tier config) ---------- */
/* The truck's own local number: customers text it for the menu, location,
   hours, and pickup orders. These fields are what the auto-replies say.
   GET/POST https://sync-proto.lukezhang.si/v1/phone/config with the same
   device-key auth sync.js uses. 404/empty numbers = no line provisioned yet. */
const PHONE_API='https://sync-proto.lukezhang.si';
const PHONE_ICON='<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z"/></svg>';
function phoneAuthKey(){
  try{ return localStorage.getItem('curbside.session_token')||localStorage.getItem('curbside.device_key'); }
  catch(e){ return null; }
}
async function phoneConfigGet(){
  const k=phoneAuthKey();
  if(!k) throw new Error('no device key yet');
  const r=await fetch(PHONE_API+'/v1/phone/config',{headers:{'authorization':'Bearer '+k}});
  if(r.status===404) return {numbers:[]};
  if(!r.ok) throw new Error('http '+r.status);
  return r.json();
}
function phoneFirstNumber(d){ const ns=(d&&d.numbers)||[]; return ns.length?ns[0]:null; }
/* Read config defensively: the server nests fields under config, but a bare
   object with the same keys is accepted too. */
function phoneCfg(n){
  if(!n) return {};
  const c=n.config;
  if(c&&typeof c==='object'&&!Array.isArray(c)) return c;
  const o={};
  ['truck_name','menu','hours','location','owner_mobile'].forEach(k=>{ if(n[k]!=null) o[k]=n[k]; });
  return o;
}
function phoneDigits(n){ return (n&&(n.number||n.phone||n.e164))||''; }
function phoneEmptyHTML(){
  return '<h4>'+PHONE_ICON+' Phone line</h4>'+
    '<p class="phone-empty"><strong>No phone line yet.</strong> It arrives with your text/voice tier: '+
    'your own local number that answers customers by text or voice while you work the window.</p>'+
    '<p class="phone-hint">When the tier is on, this is where you set what the text auto-replies say.</p>';
}
function phoneFormHTML(n){
  const c=phoneCfg(n), num=phoneDigits(n);
  return '<h4>'+PHONE_ICON+' Phone line</h4>'+
    (num?'<div class="phone-num">'+esc(num)+'</div>':'')+
    '<p class="phone-hint">These answers power the text auto-replies. Customers text your number and get these back, even mid-rush.</p>'+
    '<label>Truck name<input type="text" id="phName" maxlength="60" value="'+esc(c.truck_name||'')+'" placeholder="7 Sisters Gourmet"></label>'+
    '<p class="phone-hint">Used in greetings and every reply, so customers know it is you.</p>'+
    '<label>Menu text<textarea id="phMenu" rows="3" maxlength="500" placeholder="Tacos $5, burritos $8, elote $4">'+esc(c.menu||'')+'</textarea></label>'+
    '<p class="phone-hint">What customers get when they text <span class="phone-kbd">MENU</span>.</p>'+
    '<label>Location text<input type="text" id="phLoc" maxlength="120" value="'+esc(c.location||'')+'" placeholder="Pioneer Park, 5th and Main, till 2pm"></label>'+
    '<p class="phone-hint">What customers get when they text <span class="phone-kbd">WHERE</span>. Keep it current and regulars will find you.</p>'+
    '<label>Hours<input type="text" id="phHours" maxlength="80" value="'+esc(c.hours||'')+'" placeholder="Tue to Sun, 11am to 8pm"></label>'+
    '<p class="phone-hint">What customers get when they text <span class="phone-kbd">HOURS</span>.</p>'+
    '<label>Owner mobile<input type="tel" id="phMobile" inputmode="tel" maxlength="20" value="'+esc(c.owner_mobile||'')+'" placeholder="(555) 123-4567"></label>'+
    '<p class="phone-hint">Where pickup orders (<span class="phone-kbd">ORDER</span>) and call alerts go. Customers never see this number.</p>'+
    '<div class="phone-err" id="phMsg" role="status" hidden></div>'+
    '<button class="btn primary big" id="phSave">Save phone line</button>'+
    '<p class="phone-hint">Test it: text <span class="phone-kbd">MENU</span> to '+(num?esc(num)+' ':'your number ')+'and see what your customers get.</p>';
}
function phoneBindForm(){
  $('#phSave').onclick=async ()=>{
    const btn=$('#phSave'), msg=$('#phMsg');
    btn.disabled=true; msg.hidden=true;
    const name=$('#phName').value.trim(), menu=$('#phMenu').value.trim(),
      hours=$('#phHours').value.trim(), loc=$('#phLoc').value.trim(),
      mobile=$('#phMobile').value.trim();
    /* P2-11: client-side validation before anything posts. The two fields
     * the replies depend on are required: the truck name (used in greetings)
     * and the owner mobile (where orders and call alerts go). */
    const say=t=>{ msg.className='phone-err'; msg.textContent=t; msg.hidden=false; btn.disabled=false; };
    if(!name){ say('Give the truck a name. It is used in greetings and every reply.'); return; }
    const digits=mobile.replace(/[^\d]/g,'');
    if(digits.length<10||digits.length>15){ say('Enter a mobile number we can text, like (555) 123-4567. Customers never see this number.'); return; }
    const config={
      truck_name:name, menu:menu, hours:hours, location:loc,
      owner_mobile:mobile
    };
    try{
      const k=phoneAuthKey();
      if(!k) throw new Error('no device key yet');
      const r=await fetch(PHONE_API+'/v1/phone/config',{method:'POST',
        headers:{'authorization':'Bearer '+k,'content-type':'application/json'},
        body:JSON.stringify({config})});
      if(r.status===404) throw new Error('no number on this device');
      if(!r.ok) throw new Error('http '+r.status);
      msg.className='phone-ok'; msg.textContent='Saved. Your text auto-replies use these answers now.'; msg.hidden=false;
    }catch(e){
      /* No raw backend strings reach the owner. */
      msg.className='phone-err'; msg.textContent='Something went wrong. Please try again.'; msg.hidden=false;
    }
    btn.disabled=false;
  };
}
function renderPhoneCard(){
  const host=$('#phoneCard'); if(!host) return;
  host.innerHTML='<h4>'+PHONE_ICON+' Phone line</h4><p class="muted" style="font-size:13px">Loading your phone line...</p>';
  phoneConfigGet().then(d=>{
    const n=phoneFirstNumber(d);
    if(!n){ host.innerHTML=phoneEmptyHTML(); return; }
    host.innerHTML=phoneFormHTML(n);
    phoneBindForm();
  }).catch(()=>{
    host.innerHTML='<h4>'+PHONE_ICON+' Phone line</h4>'+
      '<p class="muted" style="font-size:13px">Could not reach the phone server. '+
      'Check your connection and reopen Settings. Nothing was changed.</p>';
  });
}

/* ---------- settings ---------- */
$('#settingsBtn').onclick=()=>{
  openSheet('<h3>Settings</h3>'+
    '<label>Truck name<input type="text" id="stName" value="'+esc(S.truckName)+'" maxlength="60"></label>'+
    '<div class="set-row"><span>City</span><span class="muted">'+esc(CITIES[S.city]?CITIES[S.city].name:'Not set')+'</span></div>'+
    '<div class="set-row"><span>Operation</span><span class="muted">'+esc(TRUCK_TYPES[S.truckType]?TRUCK_TYPES[S.truckType].name:'Not set')+'</span></div>'+
    '<button class="btn primary big" id="stSave">Save</button>'+
    '<div class="card" style="margin-top:12px" id="phoneCard"></div>'+
    '<div class="card" style="margin-top:12px"><h4>Backup</h4>'+
    '<p class="muted" style="font-size:13px">Download everything as a JSON file, or restore from one. Your backup never leaves your device unless you move the file.</p>'+
    '<div class="backup-row"><button class="btn small" id="bkExport">Export backup</button>'+
    '<label class="btn small" style="margin:0">Import backup<input type="file" id="bkImport" accept="application/json,.json" style="display:none"></label></div></div>'+
    '<div class="card" style="margin-top:12px"><h4>Revenue export</h4>'+
    '<button class="btn small" id="stCsv">Export revenue CSV</button></div>'+
    '<div class="set-row"><span>Privacy</span><a class="link-btn" href="privacy.html" target="_blank" rel="noopener">Read the privacy policy</a></div>'+
    '<button class="danger" id="stReset">Erase all data and start over</button>'+
    '<button class="btn ghost" id="stCancel">Close</button>', 'Settings');
  $('#stCancel').onclick=closeSheet;
  $('#stSave').onclick=()=>{ S.truckName=$('#stName').value.trim()||'My Truck'; $('#truckName').textContent=S.truckName; save(); closeSheet(); };
  $('#bkExport').onclick=exportBackup;
  $('#bkImport').onchange=e=>{ if(e.target.files[0]) importBackup(e.target.files[0]); };
  $('#stCsv').onclick=()=>{ closeSheet(); setTimeout(csvSheet,50); };
  renderPhoneCard();
  try{ if(window.__curbsideSyncUI) window.__curbsideSyncUI(); }catch(e){}
  $('#stReset').onclick=()=>{ if(confirm('Erase everything and restart setup?')){ ['curbside.v1','curbside.device_key','curbside.syncmeta.v1','curbside.lastsync.v1','curbside.syncbase.v1','curbside.oversized.v1'].forEach(k=>{ try{localStorage.removeItem(k);}catch(e){} }); location.reload(); } };
};
function exportBackup(){
  const payload={v:1, app:'curbside', exported:todayKey(), state:S};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));
  a.download='curbside-backup-'+todayKey()+'.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000);
}
/* Exposed for the billing paywall: the owner's data stays exportable even
   when the trial has ended and the overlay blocks the app. */
window.__exportBackup=exportBackup;
/* Clamp a free-text value to the same bound its form field enforces. */
function clampStr(v,n){ v=String(v==null?'':v); return v.length>n?v.slice(0,n):v; }
/* P1-2 (red2): the import clamp covered only truckName; a 500-char
 * commissary.name or 300-char custom permit name blew the phone layout
 * thousands of px wide. Every free-text field is clamped on import to its
 * form's maxlength: truckName 60, commissary name 60, commissary notes 300,
 * custom permit name/agency 80, spot names 80, addresses 120, hours 40,
 * event names/contacts 80, event result notes and visit notes 200.
 * Sync pulls take the same guarded path (see sync.js pull). */
function sanitizeImportedState(st){
  if(!st||typeof st!=='object') return st;
  if(typeof st.truckName==='string') st.truckName=clampStr(st.truckName,60);
  var c=st.commissary;
  if(c&&typeof c==='object'){ c.name=clampStr(c.name,60); c.notes=clampStr(c.notes,300); }
  (Array.isArray(st.customDefs)?st.customDefs:[]).forEach(function(d){
    if(!d||typeof d!=='object') return;
    d.name=clampStr(d.name,80); d.agency=clampStr(d.agency,80);
    if(typeof d.note==='string') d.note=clampStr(d.note,200);
  });
  var locs=(st.locations&&typeof st.locations==='object')?st.locations:{};
  Object.keys(locs).forEach(function(k){
    (Array.isArray(locs[k])?locs[k]:[]).forEach(function(sp){
      if(!sp||typeof sp!=='object') return;
      sp.spot=clampStr(sp.spot,80); sp.addr=clampStr(sp.addr,120); sp.hours=clampStr(sp.hours,40);
    });
  });
  (Array.isArray(st.events)?st.events:[]).forEach(function(e){
    if(!e||typeof e!=='object') return;
    e.name=clampStr(e.name,80); e.contact=clampStr(e.contact,80);
    if(e.result&&typeof e.result==='object'&&typeof e.result.notes==='string') e.result.notes=clampStr(e.result.notes,200);
  });
  (Array.isArray(st.revenue)?st.revenue:[]).forEach(function(r){
    if(!r||typeof r!=='object') return;
    r.spot=clampStr(r.spot,80);
  });
  (Array.isArray(st.prepVisits)?st.prepVisits:[]).forEach(function(v){
    if(!v||typeof v!=='object') return;
    if(typeof v.notes==='string') v.notes=clampStr(v.notes,200);
  });
  return st;
}
function importBackup(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const o=JSON.parse(r.result);
      if(!o||o.v!==1||!o.state) throw new Error('bad');
      const st=o.state;
      if(!Array.isArray(st.permits)||!Array.isArray(st.events)||!Array.isArray(st.revenue)) throw new Error('bad');
      S=st;
      /* P1-2 (red2): clamp every free-text field on import (was: truckName
       * only). See sanitizeImportedState above for the full field list. */
      sanitizeImportedState(st);
      if(!S.customDefs) S.customDefs=[];
      if(!S.extraCities) S.extraCities=[];
      if(!Array.isArray(S.prepVisits)) S.prepVisits=[];
      if(!S.inspectionChecks) S.inspectionChecks={};
      if(!S.locations) S.locations={};
      if(!S.commissary) S.commissary={name:'',cost:'',renews:'',days:[],notes:''};
      save(); closeSheet();
      if(S.onboarded&&S.city) enterMain(); else renderOnboard();
    }catch(e){ alert('That file is not a valid Curbside backup.'); }
  };
  r.readAsText(file);
}

/* ---------- init ---------- */
load();
if(S.onboarded && S.city){ enterMain(); } else { renderOnboard(); }
/* Keep the shared billing trial banner (position:fixed;top:0) from covering the
   topbar: measure the banner and expose its height as --bill-banner-h, which the
   app-local :has() CSS rules use to offset the topbar. */
function billBannerOffset(){
  const b=document.querySelector('.bill-banner');
  document.documentElement.style.setProperty('--bill-banner-h',(b?b.offsetHeight:0)+'px');
}
try{
  new MutationObserver(billBannerOffset).observe(document.body,{childList:true});
  window.addEventListener('resize',billBannerOffset);
  billBannerOffset();
}catch(e){ /* observer unavailable: banner overlap is cosmetic only */ }
/* Recompute date-dependent UI when the app returns to the foreground and on
 * date rollover, not only after a sync pull. */
let lastSeenDay=todayKey();
function rolloverCheck(){
  const k=todayKey();
  if(k!==lastSeenDay){ lastSeenDay=k; refreshUI(); }
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ rolloverCheck(); refreshUI(); } });
setInterval(rolloverCheck, 60000);

/* ---------- sync hooks (prototype backend; see sync.js) ---------- */
function refreshUI(){
  renderAlerts();
  var cur=null;
  $$('.tab-page').forEach(function(p){ if(!p.classList.contains('hidden')) cur=p; });
  if(cur) switchTab(cur.id.replace('page-',''));
  const pwOpen=$('#sheet').dataset.paperworkEvent;
  if(pwOpen&&!$('#sheetWrap').classList.contains('hidden')){
    const focus=document.activeElement, item=focus&&focus.dataset.pwItem, scroll=$('#sheet').scrollTop;
    paperworkSheet(pwOpen);
    if(item) $$('#sheet [data-pw-item]').find(b=>b.dataset.pwItem===item)?.focus({preventScroll:true});
    $('#sheet').scrollTop=scroll;
  }
}
window.__curbside = {
  getS: function(){ return S; },
  saveLocal: function(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} },
  refresh: refreshUI,
  sanitizeState: sanitizeImportedState
};
})();
