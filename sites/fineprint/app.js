/* FinePrint rules engine + UI. Pattern-based, transparent, runs fully offline. */
(function(){
"use strict";

/* ---------- Detection rules ---------- */
/* sev: high = dealbreaker, med = caution, low = note, pos = good sign */
const RULES = [
{id:"wear-tear", cat:"Exclusions", sev:"high", title:"'Wear and tear' exclusion",
 pats:["wear and tear","normal wear"],
 explain:"This is the single most-used denial phrase in the industry. Almost every mechanical failure can be described as 'wear and tear' if the company wants it to be. With this clause, they decide what counts as a defect versus normal aging, and you cannot appeal their judgment.",
 tip:"Ask: which specific parts are covered regardless of wear? If the answer is vague, the coverage is vague."},
{id:"pre-existing", cat:"Exclusions", sev:"high", title:"Pre-existing condition exclusion",
 pats:["pre-?existing"],
 explain:"Anything the company claims existed before your coverage started is not covered. Since they were not inspecting your car or home before you signed, this is easy to invoke and hard for you to disprove.",
 tip:"Get an independent inspection right before coverage starts and keep the dated report."},
{id:"sole-discretion", cat:"Claim process", sev:"high", title:"'Sole discretion' denial language",
 pats:["sole discretion","at our discretion","as determined by (us|the administrator|the company)"],
 explain:"The contract lets the company decide claims however it wants. Combined with any exclusion clause, this means denials are effectively unappealable. Look for a defined dispute or appeal process instead.",
 tip:"A fair contract names an appeal process or third-party arbitrator. 'Sole discretion' with no appeal is a walk-away sign."},
{id:"seals-gaskets", cat:"Exclusions", sev:"high", title:"Seals and gaskets excluded",
 pats:["seals? and gaskets?"],
 explain:"Seals and gaskets are cheap parts whose failure causes expensive damage (a $20 seal fails, the $4,000 transmission cooks). Excluding them while 'covering' the transmission is one of the oldest traps in vehicle service contracts.",
 tip:"Ask specifically: if a covered part fails because a seal failed, is the repair covered? Get it in writing."},
{id:"overheat", cat:"Exclusions", sev:"high", title:"Overheating exclusion",
 pats:["overheat"],
 explain:"If your engine overheats and you keep driving even a short distance, resulting damage is excluded. The trap: temperature gauges lag, and many drivers do not notice immediately. This turns a covered failure into your fault.",
 tip:"If you ever see the temperature gauge climb, pull over immediately and call a tow. Document the tow receipt."},
{id:"agg-cap", cat:"Money caps", sev:"high", title:"Aggregate claim cap",
 pats:["aggregate limit","shall not exceed \\$?[\\d,]+","maximum (benefit|liability|obligation)"],
 explain:"There is a hard ceiling on everything the company will ever pay you. Compare it to the price of the contract: if you paid $2,500 and the cap is $5,000, one transmission repair eats nearly the whole policy.",
 tip:"Divide the cap by the contract price. If one major repair nearly exhausts it, you are buying very little."},
{id:"arbitration", cat:"Legal rights", sev:"high", title:"Binding arbitration clause",
 pats:["binding arbitration"],
 explain:"You give up your right to sue in court. Disputes go to a private arbitrator, a process the company uses constantly and you will use once. You also typically give up joining class actions.",
 tip:"Some contracts let you opt out of arbitration within 30 days of signing by mailing a letter. Check for that."},
{id:"class-waiver", cat:"Legal rights", sev:"high", title:"Class action waiver",
 pats:["class action.{0,40}waiv","waiv.{0,40}class action"],
 explain:"You agree not to join other customers in a group lawsuit, even if the company systematically denies valid claims. This removes the one threat that keeps warranty companies honest at scale.",
 tip:"This plus binding arbitration means your only remedy is a process the company controls."},
{id:"maint-records", cat:"Maintenance traps", sev:"high", title:"Maintenance records required",
 pats:["maintenance records","proof of maintenance","service (records|history)","documented maintenance"],
 explain:"The number-one real-world denial trigger. If you cannot produce receipts proving every oil change and service was done on schedule, your claim can be denied regardless of what actually broke.",
 tip:"From day one, keep every receipt in one folder. A missing $40 oil-change receipt can void a $4,000 claim."},
{id:"oil-interval", cat:"Maintenance traps", sev:"med", title:"Strict oil-change interval",
 pats:["every 3,000 miles","3,000-?mile.{0,30}oil","oil change.{0,40}every \\d"],
 explain:"Many contracts demand oil changes far more often than your car's manufacturer requires. Miss the interval by a few hundred miles and a future engine claim can be denied on maintenance grounds.",
 tip:"Compare the interval to your owner's manual. If the contract is stricter than the manufacturer, it is a denial tripwire."},
{id:"dealer-only", cat:"Maintenance traps", sev:"med", title:"Repairs restricted to approved shops",
 pats:["authorized (repair|service) (facility|center|provider)","approved repair","only at (a|an|the).{0,30}(dealer|authorized)"],
 explain:"You cannot just take the car to your trusted mechanic. Approved shops are fewer, often pricier, and some mechanics refuse warranty-company work entirely because getting paid is a hassle.",
 tip:"Before signing, call two local shops and ask: do you accept work under this company's contracts?"},
{id:"prior-auth", cat:"Claim process", sev:"med", title:"Prior authorization required",
 pats:["prior authorization","pre-?authorization","must obtain approval","authorization.{0,30}before.{0,30}(repair|work|service)"],
 explain:"No work can start until the company approves it, which can take days. Your car sits at the shop while you wait, and any work done before approval is not covered.",
 tip:"Ask for the average authorization turnaround in writing, and whether rental coverage applies during the wait."},
{id:"teardown", cat:"Claim process", sev:"med", title:"Teardown / diagnostic costs on you",
 pats:["teardown","diagnostic (charges|costs|fees?)"],
 explain:"To prove a covered failure, the shop may need to disassemble the engine or transmission. If the claim is then denied, you pay for the disassembly and reassembly out of pocket, often $500+.",
 tip:"Ask: if a claim is denied after teardown, who pays? Get the answer before you need it."},
{id:"betterment", cat:"Money caps", sev:"med", title:"Betterment / depreciation charges",
 pats:["betterment","depreciat"],
 explain:"The company can reduce your payout because the replacement part is 'better' than your worn one, or depreciate parts by age and mileage. Your $3,000 repair approval can arrive as a $1,800 check.",
 tip:"Ask for an example: a 5-year-old car needs a new transmission. What exactly would they pay?"},
{id:"per-claim-ded", cat:"Money caps", sev:"med", title:"Deductible per visit, not per repair",
 pats:["deductible.{0,30}per (visit|claim|repair|occurrence)","\\$\\d+ deductible"],
 explain:"A deductible charged per visit means three separate shop visits for one underlying problem cost you three deductibles. Per-repair deductibles on related failures add up fast.",
 tip:"Clarify: one problem, two visits, is that one deductible or two?"},
{id:"waiting-period", cat:"Timing", sev:"med", title:"Waiting period before coverage starts",
 pats:["waiting period","coverage begins.{0,40}\\d+ days","\\d+ days or [\\d,]+ miles"],
 explain:"Nothing is covered for the first 30 days or 1,000 miles. If something breaks on day 29, you pay. This exists to block people from buying coverage for an already-broken car, but it burns honest buyers too.",
 tip:"Mark the exact date coverage begins on your calendar. Do not assume it starts at signing."},
{id:"cancel-fee", cat:"Cancellation", sev:"med", title:"Cancellation fees and pro-rata math",
 pats:["cancellation fee","pro-?rata","less (any )?claims paid","administrative fee"],
 explain:"Cancel and you do not get what you expect back. 'Pro-rata less claims paid' can mean one approved claim wipes out most of your refund, and flat cancellation fees ($25-$75) come off the top.",
 tip:"Do the math before signing: if you cancel at month 6 with one $800 claim paid, what is your refund?"},
{id:"commercial-use", cat:"Exclusions", sev:"med", title:"Commercial / rideshare use excluded",
 pats:["commercial use","ridesharing","uber|lyft","delivery (service|use)","for hire"],
 explain:"Drive for Uber, DoorDash, or use the car for any paid work and coverage is void. Many buyers do not realize their side gig disqualifies them until claim time.",
 tip:"If you earn any money with the vehicle, disclose it in writing and get written confirmation of coverage."},
{id:"mods", cat:"Exclusions", sev:"med", title:"Modifications void coverage",
 pats:["modifications?","aftermarket","lift kit","non-?factory","non-?oem"],
 explain:"Aftermarket parts, lift kits, engine tunes, even non-factory wheels can void coverage on related systems. The definition of 'modification' is usually left to the company.",
 tip:"If your vehicle has any aftermarket part, list them in the application and keep the company's written response."},
{id:"rust", cat:"Exclusions", sev:"med", title:"Rust / corrosion excluded",
 pats:["\\brust\\b","corrosion"],
 explain:"Common in home warranties and vehicle contracts alike. Rust is gradual, so almost any aging pipe, water heater, or underbody part can be blamed on corrosion and denied.",
 tip:"For home warranties especially: ask how they distinguish a sudden pipe burst from corrosion."},
{id:"gradual-leak", cat:"Exclusions", sev:"med", title:"Only 'sudden' leaks covered",
 pats:["gradual","sudden.{0,20}(leak|failure|breakdown)"],
 explain:"Plumbing leaks are covered only if sudden. But most leaks start gradually, which means the company can almost always argue the leak predates your discovery of it.",
 tip:"At the first sign of any water issue, document with dated photos immediately."},
{id:"code-viol", cat:"Exclusions", sev:"med", title:"Code violations / improper installation excluded",
 pats:["code violation","improper installation","not installed to code","building code"],
 explain:"Home warranty staple: if the original builder or a previous owner installed something wrong, it is not covered. In older homes, this excludes a remarkable amount.",
 tip:"On an older home, assume some systems are non-code. Ask which ones they would still cover."},
{id:"per-term-cap", cat:"Money caps", sev:"high", title:"Low per-term dollar cap",
 pats:["\\$[\\d,]+ per (term|year|contract)","limit of \\$[\\d,]+"],
 explain:"Home warranty contracts often cap total payouts per term at amounts like $1,500, barely one appliance replacement. The cap is the real coverage, not the brochure's list of systems.",
 tip:"Price one realistic repair (e.g., a new HVAC compressor) and compare it to the cap."},
{id:"trade-fee", cat:"Money caps", sev:"low", title:"Trade call / service fee",
 pats:["trade (call|service) fee","service fee.{0,20}\\$\\d+","dispatch fee"],
 explain:"You pay a fee ($60-$125 typical) every time a technician is dispatched, even if nothing is repaired or the claim is denied. Multiple visits for one problem multiply the fee.",
 tip:"Budget the fee per visit, not per problem."},
{id:"consequential", cat:"Exclusions", sev:"med", title:"Consequential damage excluded",
 pats:["consequential","resulting damage","secondary damage"],
 explain:"If a covered part fails and destroys a non-covered part next to it, only the first part is paid for. The expensive collateral damage is yours.",
 tip:"Ask for a concrete example relevant to your car or home's most expensive system."},
{id:"non-transfer", cat:"Cancellation", sev:"low", title:"Contract is non-transferable",
 pats:["non-?transferable","not transferable","may not be (transferred|assigned)"],
 explain:"You cannot transfer remaining coverage to a buyer if you sell the car or home. Transferable contracts add resale value; non-transferable ones die with your ownership.",
 tip:"If you might sell within the contract term, transferability is worth real money."},
{id:"lapse", cat:"Cancellation", sev:"med", title:"Missed payment cancels coverage",
 pats:["failure to pay","lapse","payment.{0,20}(delinquent|late|missed)","cancel.{0,20}non-?payment"],
 explain:"One missed monthly payment can void the entire contract, including coverage for problems that started while you were paid up. Reinstatement is rarely offered.",
 tip:"Set autopay. A $60 missed payment should not cost you a $4,000 claim."},
{id:"salvage", cat:"Exclusions", sev:"med", title:"Salvage / flood history excluded",
 pats:["salvage","flood damage","rebuilt title","branded title"],
 explain:"Any prior salvage, flood, or branded title voids coverage. Fine for most buyers, but verify your vehicle's history independently rather than trusting the seller.",
 tip:"Run the VIN through the national title database before buying the warranty."},
{id:"mileage-cap", cat:"Money caps", sev:"med", title:"Mileage ceiling on coverage",
 pats:["in excess of [\\d,]+ miles","coverage (ends|terminates).{0,30}mile","up to [\\d,]+ miles"],
 explain:"Coverage ends at a mileage cap regardless of time remaining. High-mileage drivers can burn through a 3-year contract in 18 months.",
 tip:"Divide the remaining miles by your annual driving. That is your real contract length."},
{id:"rental-limit", cat:"Money caps", sev:"low", title:"Token rental / loss-of-use benefit",
 pats:["loss of use","rental.{0,30}\\$\\d+","rental.{0,30}per day"],
 explain:"The 'free rental car' benefit is often $25-$35/day for a few days, which does not cover an actual rental. Treat it as a coupon, not coverage.",
 tip:"Price a real rental in your area for a week. Compare."},
{id:"money-back", cat:"Good signs", sev:"pos", title:"30-day money-back window",
 pats:["30-?day.{0,40}(full refund|money-?back|cancel)","full refund.{0,40}30 days"],
 explain:"A full-refund cancellation window is a genuinely good sign. It gives you time to have a mechanic review the contract and cancel if the exclusions are worse than the pitch.",
 tip:"Use it. Take the contract to an independent mechanic within the first two weeks."},
{id:"any-shop", cat:"Good signs", sev:"pos", title:"Repairs at any licensed shop",
 pats:["any (licensed|ase-?certified|qualified) (repair|service) (facility|shop)","your choice of (repair|service)"],
 explain:"Being able to use your own trusted mechanic, rather than an 'authorized' network, removes a whole category of friction and denial risk.",
 tip:"Confirm by phone that your preferred shop will actually work with this administrator."}
];

const RULESET_V = (function(){
  const source = JSON.stringify(RULES.map(function(r){ return [r.id, r.pats.join("|"), r.sev]; }));
  let hash = 0x811c9dc5;
  for(let i=0; i<source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0,8);
})();

/* ---------- Sample contracts ---------- */
const SAMPLES = {
car: {name:"Apex Auto Shield: Vehicle Service Contract (sample)",
text:
"APEX AUTO SHIELD\nVEHICLE SERVICE CONTRACT: PLATINUM COVERAGE\n\nThis Vehicle Service Contract (the \u201cContract\u201d) is between you, the Contract Holder, and Apex Auto Shield LLC (the \u201cAdministrator\u201d). Please read this entire Contract carefully. Coverage begins 30 days or 1,000 miles after the Contract purchase date, whichever occurs first (the \u201cWaiting Period\u201d). No claims will be honored during the Waiting Period.\n\nCOVERAGE: Subject to the terms herein, the Administrator agrees to pay for the repair or replacement of the following components due to mechanical breakdown: engine, transmission, drive axle, and turbocharger, up to an aggregate limit of $5,000 for the life of this Contract. In no event shall the Administrator\u2019s total liability exceed $5,000.\n\nEXCLUSIONS: This Contract does not cover: (a) any repair necessitated by normal wear and tear; (b) seals and gaskets; (c) pre-existing conditions known or unknown to the Contract Holder; (d) damage caused by overheating, regardless of cause; (e) consequential damage or resulting damage to non-covered parts; (f) any vehicle used for commercial use, including ridesharing, delivery, or for-hire service such as Uber or Lyft; (g) any vehicle with modifications, aftermarket parts, lift kits, or non-OEM components; (h) any vehicle with a salvage, rebuilt, or branded title, or with prior flood damage; (i) failures caused by rust or corrosion.\n\nMAINTENANCE REQUIREMENTS: The Contract Holder must maintain the vehicle in accordance with the manufacturer\u2019s recommendations and must provide maintenance records and proof of maintenance upon request. Engine oil and filter must be changed every 3,000 miles without exception. Failure to furnish complete service history shall be grounds for denial of any claim, as determined by the Administrator in its sole discretion.\n\nCLAIM PROCEDURE: The Contract Holder must obtain prior authorization before any repair work begins. Repairs performed without prior authorization will not be covered. All repairs must be performed at an authorized repair facility designated by the Administrator. Teardown and diagnostic charges are the responsibility of the Contract Holder and are not covered under any circumstances. The Administrator may, at its sole discretion, elect to use remanufactured or used parts. Betterment and depreciation charges may be deducted from approved claims.\n\nDEDUCTIBLE: A $100 deductible applies per visit.\n\nCANCELLATION: You may cancel within 30 days for a full refund. After 30 days, cancellation refunds are calculated on a pro-rata basis less claims paid and a $50 administrative cancellation fee. This Contract is non-transferable and may not be assigned.\n\nOTHER TERMS: Failure to pay any monthly installment within 10 days shall cause this Contract to lapse, and all coverage shall terminate. Any dispute arising under this Contract shall be resolved by binding arbitration, and the parties waive any right to participate in a class action. Coverage terminates when the vehicle exceeds 150,000 miles."},
home: {name:"Homestead Home Warranty: Systems Plan (sample)",
text:
"HOMESTEAD HOME WARRANTY\nRESIDENTIAL SERVICE PLAN: SYSTEMS COVERAGE\n\nThis Service Plan (the \u201cPlan\u201d) is issued by Homestead Warranty Services Inc. (the \u201cCompany\u201d). Coverage begins 30 days after enrollment. There is a $75 trade call fee due for each service visit.\n\nCOVERED SYSTEMS: Heating, cooling, plumbing, and electrical systems, subject to an aggregate limit of $5,000 per term.\n\nEXCLUSIONS: The Plan does not cover: (a) pre-existing conditions; (b) rust or corrosion; (c) systems not installed to building code; (d) consequential damage to walls, floors, or finishes resulting from a covered failure.\n\nCLAIM PROCEDURE: Service may be performed by any licensed contractor of your choice, or by a Company-authorized contractor. For repairs over $500, the Plan Holder must obtain prior authorization before work is performed.\n\nMAINTENANCE: The Plan Holder is responsible for routine maintenance and must provide service records upon request.\n\nCANCELLATION: Cancellation within 30 days of enrollment entitles the Plan Holder to a full refund. Thereafter, refunds are pro-rata less a $25 cancellation fee. This Plan is transferable to a new homeowner for a $25 transfer fee.\n\nDISPUTES: Disputes shall first be submitted to non-binding mediation. If mediation fails, either party may pursue remedies in small claims court or through binding arbitration, at the Plan Holder\u2019s choice."}
};

/* ---------- Reputation checklist ---------- */
const CHECKLIST = [
"Search: \u201c[company name]\u201d + complaints",
"Search: \u201c[company name]\u201d + scam / lawsuit",
"Check the BBB profile: rating, complaint count, and how complaints were resolved",
"Search your state attorney general\u2019s site for enforcement actions",
"Find the underwriter: who actually pays claims? An unnamed administrator is a red flag",
"Check how long the company has existed (new companies fold; old ones have track records)",
"Ask two local mechanics: \u201cdo you accept work under this contract?\u201d",
"Read the exclusions section yourself, end to end, with a highlighter",
"Have an independent mechanic review the contract inside the 30-day window"
];

/* ---------- Engine ---------- */
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
const SEV_W = {high:7, med:3, low:1, pos:-5};
const SEV_LABEL = {high:"Dealbreaker", med:"Caution", low:"Note", pos:"Good sign"};

/* ---------- Negation / coverage-positive detection (iteration 4) ----------
   A pattern hit means little if the surrounding sentence says the opposite:
   "Seals and gaskets are covered" or "Maintenance records are not required".
   Such hits are demoted to questions, not verdicts, and carry zero score weight. */
const POSITIVE_CTX = /(\b(are|is|will be|remains?)\s+covered\b|\bnot\s+(required|necessary)\b|\bno\s+[a-z\s]{0,25}?\brequired\b|\boptional\b|\bincluded\s+in\s+(coverage|this\s+(contract|plan))\b|\bcovered\s+in\s+full\b)/i;

function sentenceAround(text, idx){
  let s = idx;
  while(s > 0 && !/[.!?;\n]/.test(text[s-1]) && idx - s < 300) s--;
  let e = idx;
  while(e < text.length && !/[.!?;\n]/.test(text[e]) && e - idx < 300) e++;
  return text.slice(s, e);
}

function analyze(text){
  const hits = [];
  RULES.forEach(function(rule, ri){
    const matches = [];
    rule.pats.forEach(function(p){
      const re = new RegExp(p, "gi");
      let m;
      while((m = re.exec(text)) !== null){
        if(m[0].length < 3) continue;
        matches.push({start:m.index, end:m.index + m[0].length, snippet:m[0]});
        if(matches.length > 40) break;
      }
    });
    if(matches.length){
      // dedupe near-identical spans
      const uniq = [];
      matches.sort(function(a,b){return a.start-b.start;});
      matches.forEach(function(mt){
        if(!uniq.some(function(u){return Math.abs(u.start-mt.start) < 12 && Math.abs(u.end-mt.end) < 12;})) uniq.push(mt);
      });
      const hit = {rule:rule, ri:ri, matches:uniq.slice(0,12)};
      // negation check: if every match sits in coverage-positive language,
      // this is a question, not a verdict
      if(rule.sev !== "pos"){
        let certain = 0, why = "";
        hit.matches.forEach(function(mt){
          const sent = sentenceAround(text, mt.start);
          const pm = POSITIVE_CTX.exec(sent);
          if(pm){ why = pm[0]; } else { certain++; }
        });
        if(!certain){ hit.question = true; hit.questionWhy = why; }
      }
      hits.push(hit);
    }
  });
  return hits;
}

function scoreOf(hits){
  let s = 100;
  hits.forEach(function(h){
    if(h.question) return; // questions are not verdicts: zero score weight
    const w = SEV_W[h.rule.sev];
    const n = Math.min(h.matches.length, 3);
    // diminishing: first hit full weight, repeats add half each
    s -= w * (1 + 0.5 * (n - 1));
  });
  return Math.max(0, Math.min(100, Math.round(s)));
}

function verdictFor(score){
  if(score >= 80) return ["Looks reasonable","Few major traps detected. Still read the exclusions yourself before signing.","#1e7a34"];
  if(score >= 60) return ["Proceed with caution","Real traps found. Price them into your decision or negotiate.","#b97e0c"];
  if(score >= 40) return ["Trap-heavy","Multiple dealbreakers. This contract protects the company more than you.","#c25a1e"];
  return ["Walk away","This contract is engineered to deny claims. Do not sign it in a finance office.","#c92a1e"];
}

/* ---------- Rendering ---------- */
const $ = function(id){return document.getElementById(id);};
let currentAnalysis = null;

/* ---------- Guarded storage (iteration 4) ---------- */
function storeGet(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    const v = JSON.parse(raw);
    if(Array.isArray(fallback)) return Array.isArray(v) ? v : fallback;
    return (v === null || typeof v === "undefined") ? fallback : v;
  }catch(e){ return fallback; }
}
function storeSet(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch(e){ return false; }
}

function toast(msg){
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(function(){t.classList.remove("show");}, 2600);
}

/* ---------- Pass 1 shared helpers ---------- */
const SEV_ORDER = {high:0, med:1, low:2, pos:3};
function rankedHits(hits){
  return hits.filter(function(h){return !h.question;}).sort(function(a,b){return SEV_ORDER[a.rule.sev]-SEV_ORDER[b.rule.sev];});
}
let storageCooling = false;
function storageWarning(message){
  if(storageCooling) return;
  storageCooling = true;
  toast("Storage full: " + message);
  setTimeout(function(){storageCooling = false;}, 3000);
}
function fallbackCopy(t){
  const ta = document.createElement("textarea"), active = document.activeElement;
  ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  let copied = false;
  try{ copied = document.execCommand("copy"); }catch(e){}
  ta.remove();
  if(active) active.focus({preventScroll:true});
  return copied;
}
async function copyText(text, message){
  try{
    if(!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    toast(message);
  }catch(e){ toast(fallbackCopy(text) ? message : "Could not copy. Please try again."); }
}
const FINANCE_QUESTIONS = {
  "wear-tear":["Which parts are covered when they fail from wear and tear? Show me the coverage in writing.", "Ordinary aging could otherwise be used to deny a repair."],
  "pre-existing":["What evidence would you use to call a failure pre-existing, and will you accept a dated inspection?", "An inspection can help establish the condition when coverage starts."],
  "sole-discretion":["Who can review a denial made at your sole discretion, and where is that appeal process written?", "A defined appeal gives you a way to challenge the decision."],
  "seals-gaskets":["If an excluded seal or gasket damages a covered part, will you pay for the whole repair?", "A cheap seal can cause an expensive failure."],
  "overheat":["If a covered part causes overheating, which resulting repairs will you pay for?", "The overheating exclusion may remove coverage for the larger repair."],
  "agg-cap":["What is the total payout cap, and how much remains after one major repair?", "A single claim could exhaust the contract's remaining value."],
  "arbitration":["Can I opt out of binding arbitration, and what is the deadline and exact process?", "The clause limits how you can challenge a denied claim."],
  "class-waiver":["Does this waive my right to join a class action, and can I opt out in writing?", "You may have to pursue a dispute on your own."],
  "maint-records":["Exactly which maintenance receipts must I keep, and can one missing receipt cause a denial?", "Missing paperwork can become a reason to reject a claim."],
  "dealer-only":["Which nearby repair shops can I use, and will my own mechanic be approved?", "Shop restrictions can delay repairs and limit your options."],
  "prior-auth":["How long does repair authorization take, and who pays for a rental while I wait?", "Work started before approval may not be reimbursed."],
  "betterment":["For a major repair on my vehicle, show me the payout after betterment and depreciation deductions.", "An approved claim can still leave a large bill for you."],
  "waiting-period":["What exact date and mileage must I reach before coverage starts?", "Failures during the waiting period may be excluded."],
  "cancel-fee":["If I cancel after six months with an $800 paid claim, what exact refund would I receive?", "Fees and prior claims can greatly reduce a refund."],
  "commercial-use":["Will my delivery, rideshare, or other paid driving be covered? Put the answer in writing.", "Paid use can disqualify the vehicle from coverage."],
  "per-term-cap":["What is the payout cap per term, and would it cover a full major system replacement?", "A low cap can cover only a fraction of a large repair."],
  "trade-fee":["Is the service fee due on every visit, including repeat visits and denied claims?", "Repeated dispatch fees can add up for one problem."],
  "lapse":["What grace period applies to a missed payment, and can coverage be reinstated?", "A payment lapse can leave repairs without coverage."],
  "mileage-cap":["At what exact odometer reading does coverage end, even if time remains?", "Your driving rate may shorten the usable contract term."]
};
function financeQuestions(hits){
  return rankedHits(hits).filter(function(h){return h.rule.sev === "high" || h.rule.sev === "med";}).slice(0,3).map(function(h){
    const q = FINANCE_QUESTIONS[h.rule.id];
    return {ask:q ? q[0] : 'Your contract flags "' + h.rule.title + '". Ask them to explain exactly what it means for a real claim, and get the answer in writing.', why:q ? q[1] : h.rule.explain};
  });
}
function questionsHTML(questions){
  return "<ol>" + questions.map(function(q){return '<li>“' + esc(q.ask) + '”<p>' + esc(q.why) + '</p></li>';}).join("") + "</ol>";
}
function buildPrintReport(a, hits){
  const top = rankedHits(hits).slice(0,3), questions = financeQuestions(hits);
  const checks = $("check-items").querySelectorAll("input");
  $("print-report").innerHTML = '<h1>FinePrint one-pager</h1><header><strong>' + esc(a.name || "Pasted contract") + '</strong><p>' + esc(new Date(a.date).toLocaleDateString()) + '</p><p>Deal score: ' + a.score + '/100: ' + esc(verdictFor(a.score)[0]) + '</p><p>scored with rule set v' + RULESET_V + '</p></header>' +
    '<h2>Top 3 traps</h2>' + (top.length ? '<ol>' + top.map(function(h){return '<li><strong>' + SEV_LABEL[h.rule.sev] + ':</strong> ' + esc(h.rule.title) + '</li>';}).join("") + '</ol>' : '<p>No traps detected.</p>') +
    (questions.length ? '<h2>3 questions for the finance office</h2>' + questionsHTML(questions) : '') +
    '<h2>Before you sign: the reputation check</h2><ul class="print-checklist">' + CHECKLIST.map(function(item,i){return '<li>' + (checks[i] && checks[i].checked ? '[x] ' : '[ ] ') + esc(item) + '</li>';}).join("") + '</ul><footer>Not legal advice. Pattern-based scan.</footer>';
}

// fp-share-v1
async function shareScore(a, hits){
  try{
    const canvas = document.createElement("canvas");
    canvas.width = 1800; canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if(!ctx) throw new Error("Canvas unavailable");
    const ink = "#1c1a15", font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    const v = verdictFor(a.score);
    ctx.fillStyle = "#faf7ef"; ctx.fillRect(0,0,1800,1200);
    ctx.strokeStyle = ink; ctx.lineWidth = 12; ctx.strokeRect(6,6,1788,1188);
    function text(value,x,y,size,color,weight){
      ctx.font = (weight || 400) + " " + size + "px " + font;
      ctx.fillStyle = color || ink; ctx.fillText(value,x,y);
    }
    function wrap(value,x,y,width,size,color,weight){
      ctx.font = (weight || 400) + " " + size + "px " + font;
      const words = value.split(/\s+/); let line = "";
      words.forEach(function(word){
        const next = line ? line + " " + word : word;
        if(line && ctx.measureText(next).width > width){text(line,x,y,size,color,weight);y+=size*1.3;line=word;}
        else line=next;
      });
      if(line) text(line,x,y,size,color,weight);
      return y;
    }
    text("FinePrint",90,130,76,ink,900);
    text("Warranty red-flag reader",94,184,30);
    text(String(a.score),90,424,240,ink,900);
    const scoreWidth = ctx.measureText(String(a.score)).width;
    text("/100",105+scoreWidth,424,54,ink,700);
    text(v[0].toUpperCase(),94,510,54,v[2],900);
    wrap(v[1],94,566,1600,30);
    text("Top traps",94,674,36,ink,800);
    const colors = {high:"#c92a1e",med:"#b97e0c",low:"#1a5fa8",pos:"#1e7a34"};
    const top = rankedHits(hits).slice(0,3);
    top.forEach(function(h,i){
      const y = 706+i*84;
      ctx.fillStyle=colors[h.rule.sev];ctx.fillRect(94,y,264,52);
      text(SEV_LABEL[h.rule.sev].toUpperCase(),110,y+35,27,"#fff",800);
      wrap(h.rule.title,382,y+36,1310,32,ink,600);
    });
    if(!top.length) text("No traps detected.",94,754,32);
    ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(94,996);ctx.lineTo(1706,996);ctx.stroke();
    text("projects.lukezhang.si/fineprint",94,1054,36,ink,800);
    text("Paste your contract, get a deal score",94,1105,30);
    text("Pattern-based scan. Not legal advice.",94,1150,24);
    const blob = await new Promise(function(resolve,reject){canvas.toBlob(function(b){if(b) resolve(b);else reject(new Error("PNG unavailable"));},"image/png");});
    const file = new File([blob],"fineprint-score.png",{type:"image/png"});
    let shared = false;
    try{
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"FinePrint score card",text:"Deal score: " + a.score + "/100. " + v[0] + "."});
        shared = true;
      }
    }catch(shareErr){ shared = false; } // permission denied or dismissed: fall through to the clipboard/download branch
    if(!shared){
      // clipboard image write is gated behind a permission that can be denied;
      // fall through to the download branch on any failure instead of aborting
      let copied = false;
      try{
        if(navigator.clipboard && window.ClipboardItem){
          await navigator.clipboard.write([new window.ClipboardItem({"image/png":blob})]);
          toast("Score card copied as an image. Paste it anywhere.");
          copied = true;
        }
      }catch(clipErr){}
      if(!copied){
        const url = URL.createObjectURL(blob), link = document.createElement("a");
        link.href=url;link.download="fineprint-score.png";document.body.appendChild(link);link.click();link.remove();
        setTimeout(function(){URL.revokeObjectURL(url);},1000);
        toast("Score card downloaded.");
      }
    }
  }catch(e){toast("Could not build the score card.");}
}

function feedbackData(){
  const data = storeGet("fineprint_feedback", {});
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}
function feedbackVote(data,id){
  const v = data[id] || {};
  const mine = v.mine === "up" || v.mine === "down" ? v.mine : null;
  return {up:Math.max(mine === "up" ? 1 : 0, Number.isSafeInteger(v.up) ? v.up : 0), down:Math.max(mine === "down" ? 1 : 0, Number.isSafeInteger(v.down) ? v.down : 0), mine:mine};
}
function feedbackRow(id){
  const v = feedbackVote(feedbackData(),id);
  const votesSoFar = v.up + v.down;
  function button(dir){
    const path = dir === "up" ? 'M8 10l4-7c2 0 3 1 2 4l-1 3h5c2 0 3 1 2 3l-2 7H8zM3 10h5v10H3z' : 'M8 14l4 7c2 0 3-1 2-4l-1-3h5c2 0 3-1 2-3l-2-7H8zM3 4h5v10H3z';
    return '<button class="btn btn-ghost btn-small" data-vote="' + dir + '" aria-label="' + (dir === "up" ? 'This flag was right' : 'This flag was not right') + '" aria-pressed="' + (v.mine === dir) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg><span>' + v[dir] + '</span></button>';
  }
  // counts stay hidden until the first vote on this device: empty tallies are noise
  const counts = votesSoFar > 0
    ? '<span class="feedback-counts" aria-live="polite">' + v.up + ' found this right · ' + v.down + ' did not, on this device</span>'
    : '';
  return '<div class="feedback" data-rule="' + id + '"><span>Was this flag right?</span>' + button("up") + button("down") + counts + '</div>';
}

function compareContracts(){
  const texts = [$("compare-a").value.trim(), $("compare-b").value.trim()];
  if(texts.some(function(t){return t.length < 200;})){toast("Paste at least 200 characters into each contract to compare.");return;}
  const results = texts.map(function(t){
    const hits=analyze(t), flags=rankedHits(hits), score=scoreOf(hits), cats={};
    hits.forEach(function(h){ if(!h.question) cats[h.rule.cat]=(cats[h.rule.cat]||0)+1; });
    return {flags:flags,score:score,verdict:verdictFor(score)[0],cats:cats,high:flags.filter(function(h){return h.rule.sev==="high";}).length,med:flags.filter(function(h){return h.rule.sev==="med";}).length};
  });
  const diff = Math.abs(results[0].score-results[1].score);
  const banner = diff < 5 ? "Too close to call" : "Contract " + (results[0].score > results[1].score ? "A" : "B") + " wins by " + diff + " points";
  let report = "FinePrint comparison\n" + banner + "\n\n";
  const cards = results.map(function(r,i){
    const label = i ? "B" : "A";
    const only = r.flags.filter(function(h){return !results[1-i].flags.some(function(other){return h.rule.id===other.rule.id;});});
    const categories = Object.keys(r.cats).sort();
    report += "Contract " + label + ": " + r.score + "/100, " + r.verdict + "\n" + r.high + (r.high===1?" dealbreaker, ":" dealbreakers, ") + r.med + (r.med===1?" caution":" cautions") + "\nOnly in " + label + ":\n" + (only.length ? only.map(function(h){return "- " + h.rule.title;}).join("\n") : "None") + "\nCategories: " + (categories.map(function(c){return c + ": " + r.cats[c];}).join(", ") || "None") + "\n\n";
    return '<div class="compare-score"><h3>Contract ' + label + '</h3><strong>' + r.score + '/100</strong><p>' + esc(r.verdict) + '</p><p>' + r.high + (r.high===1?" dealbreaker · ":" dealbreakers · ") + r.med + (r.med===1?" caution":" cautions") + '</p><h4>Only in ' + label + '</h4>' + (only.length ? '<ul>' + only.map(function(h){return '<li>' + esc(h.rule.title) + '</li>';}).join("") + '</ul>' : '<p>None</p>') + '<div class="cat-break">' + categories.map(function(c){return '<span class="cat-pill">' + esc(c) + ': ' + r.cats[c] + '</span>';}).join("") + '</div></div>';
  }).join("");
  report += "Rule set v" + RULESET_V + ".\nPattern-based scan. Not legal advice.";
  $("compare-results").innerHTML = '<h3>' + banner + '</h3><div class="compare-grid">' + cards + '</div><div class="input-actions"><button class="btn btn-ghost" id="copy-comparison">Copy comparison report</button></div>';
  $("compare-results").hidden = false;
  $("copy-comparison").onclick = function(){copyText(report,"Comparison report copied.");};
}

/* ---------- Cancellation-refund estimator (pass 2) ----------
   On-device regexes over the cancellation language, beyond the cancel-fee
   detection rule: full-refund window, pro-rata math, flat fees, claims-paid
   offsets, no-refund language. $0 marginal cost, pattern-based like the rest. */
function parseRefundTerms(text){
  const terms = {fullWindowDays:null, proRata:false, claimsOffset:false, adminFee:null, noRefund:false};
  let m = /(?:cancel|cancellation|terminat)[\s\S]{0,90}?within\s+(\d+)\s+days[\s\S]{0,90}?(full refund|money-?back)/i.exec(text)
        || /(\d+)\s*-?\s*day[\s\S]{0,60}?(full refund|money-?back)/i.exec(text);
  if(m) terms.fullWindowDays = parseInt(m[1], 10);
  m = /\$\s*([\d,]+)\s*(?:administrative|cancellation)\s+(?:cancellation\s+)?fee/i.exec(text)
    || /(?:administrative|cancellation)\s+(?:cancellation\s+)?fee[\s\S]{0,24}?\$([\d,]+)/i.exec(text);
  if(m) terms.adminFee = parseInt(m[1].replace(/,/g,""), 10);
  terms.proRata = /pro-?rata/i.test(text);
  terms.claimsOffset = /less\s+(?:any\s+)?claims?\s+paid/i.test(text);
  terms.noRefund = /\bno\s+refund\b|non-?refundable/i.test(text);
  return terms;
}
function refundFmt(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
function renderRefundCard(text){
  const box = $("refund-card");
  const terms = parseRefundTerms(text);
  const detected = [];
  if(terms.fullWindowDays) detected.push("Full refund if you cancel within " + terms.fullWindowDays + " days.");
  if(terms.proRata) detected.push("Refunds after the window are calculated pro-rata (unused portion).");
  if(terms.claimsOffset) detected.push("Claims already paid are deducted from the refund.");
  if(terms.adminFee != null) detected.push(refundFmt(terms.adminFee) + " administrative fee is deducted.");
  if(terms.noRefund) detected.push("No-refund language detected: after any window, refunds may be $0.");
  if(!detected.length){
    box.hidden = false;
    box.innerHTML = "<h3>Cancellation refund estimate</h3>" +
      "<p style='font-size:14px;color:var(--ink2);margin:6px 0 0'>No cancellation or refund language was detected in this contract, so there is nothing to estimate from. Check the cancellation section yourself before the window closes.</p>";
    return;
  }
  box.hidden = false;
  box.innerHTML = "<h3>Cancellation refund estimate</h3>" +
    "<ul>" + detected.map(function(d){return "<li>" + esc(d) + "</li>";}).join("") + "</ul>" +
    '<div class="refund-grid">' +
      '<label>Contract price ($)<input id="refund-price" type="number" inputmode="decimal" min="0" step="1" value=""></label>' +
      '<label>Cancel after (months)<input id="refund-months" type="number" inputmode="numeric" min="0" step="1" value="6"></label>' +
      '<label>Contract term (months)<input id="refund-term" type="number" inputmode="numeric" min="1" step="1" value="36"></label>' +
      '<label>Claims paid so far ($)<input id="refund-claims" type="number" inputmode="decimal" min="0" step="1" value="0"></label>' +
    "</div>" +
    '<div class="refund-out" id="refund-out"></div>' +
    '<div class="refund-math" id="refund-math"></div>' +
    '<div class="refund-note">Estimate only, built from the detected cancellation language above. The administrator does its own math, so confirm the number with them before you act on it.</div>';
  const num = function(id){ const v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
  function update(){
    const price = num("refund-price"), months = num("refund-months"),
          term = Math.max(1, num("refund-term")), claims = num("refund-claims");
    const out = $("refund-out"), math = $("refund-math");
    if(!(price > 0)){ out.textContent = "Enter the contract price to get an estimate."; math.textContent = ""; return; }
    const elapsedDays = months * 30;
    if(terms.noRefund && !(terms.fullWindowDays && elapsedDays < terms.fullWindowDays)){
      out.textContent = "Estimated refund: $0";
      math.textContent = "The contract's no-refund language appears to apply after the window.";
      return;
    }
    if(terms.fullWindowDays && elapsedDays < terms.fullWindowDays){
      const r = Math.max(0, price - claims);
      out.textContent = "Estimated refund: " + refundFmt(r);
      math.textContent = "Inside the " + terms.fullWindowDays + "-day full-refund window: " +
        refundFmt(price) + " contract price" + (claims > 0 ? " minus " + refundFmt(claims) + " in paid claims" : "") + ".";
      return;
    }
    if(terms.proRata){
      const unused = Math.max(0, 1 - months / term);
      const r = Math.max(0, Math.round(price * unused - claims - (terms.adminFee || 0)));
      out.textContent = "Estimated refund: " + refundFmt(r);
      let bits = refundFmt(price) + " x " + Math.round(unused * 100) + "% unused (" + months + " of " + term + " months)";
      if(claims > 0) bits += " minus " + refundFmt(claims) + " in paid claims";
      if(terms.adminFee != null) bits += " minus " + refundFmt(terms.adminFee) + " fee";
      math.textContent = "Pro-rata math: " + bits + ".";
      return;
    }
    out.textContent = "No refund formula detected";
    math.textContent = "The contract mentions cancellation but no usable refund formula was found. Ask the administrator for the exact number.";
  }
  ["refund-price","refund-months","refund-term","refund-claims"].forEach(function(id){
    $(id).addEventListener("input", update);
  });
  update();
}

/* ---------- Company name extraction + reputation deep-links (pass 3) ----------
   The checklist used to say "[company name]". The name is usually in the
   contract's first line or in an "X LLC" phrasing, so we pull it out and turn
   the checklist chores into one-tap pre-filled searches. */
function extractCompany(text){
  const m = text.match(/([A-Z][\w&'\u2019.\- ]{2,60}?)\s+(LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Holdings?|Warranty\sServices\sInc\.?)/);
  if(m) return m[1].replace(/^[\s"'“”'‘]+|[\s"'“”'‘]+$/g,"").trim() || null;
  const lines = text.split(/\n/).map(function(l){return l.trim();}).filter(Boolean);
  const first = lines[0] || "";
  if(first.length > 3 && first.length < 64 && !/(contract|plan|policy|coverage|agreement|protection)/i.test(first)) return first;
  return null;
}
function checklistLinks(i, company){
  if(!company) return [];
  const q = encodeURIComponent(company);
  if(i===0) return [{href:"https://www.google.com/search?q=" + q + "+complaints", text:"Search complaints"}];
  if(i===1) return [{href:"https://www.google.com/search?q=" + q + "+scam+OR+lawsuit", text:"Search scam / lawsuit"}];
  if(i===2) return [{href:"https://www.bbb.org/search?find_text=" + q, text:"Search BBB"}];
  return [];
}

/* ---------- Claim-denial fight kit (pass 3) ----------
   The post-purchase pain point: "my claim was denied, now what?" Maps the
   denial reason to the exact clause in YOUR contract, explains why the
   company leans on it, gives a phone script, and builds a template appeal
   letter. Pure template logic over existing engine data. Zero LLM calls. */
const FIGHT_REASONS = [
 {id:"wear-tear", label:"They said it was wear and tear", ruleIds:["wear-tear"],
  script:"I need the specific inspection that showed this was wear rather than a mechanical breakdown. I have my maintenance records here. Point me to the sentence in the contract that lets you make that call."},
 {id:"pre-existing", label:"They said it was a pre-existing condition", ruleIds:["pre-existing"],
  script:"What inspection did you complete before my coverage started? I can show a dated inspection report from the week before enrollment that documents this part as sound."},
 {id:"maint-records", label:"They said I lack maintenance records", ruleIds:["maint-records"],
  script:"I have receipts for every service interval the contract requires. I will send them today. What is the email for the review team, and when will you reopen the claim?"},
 {id:"seals-gaskets", label:"They said seals and gaskets are excluded", ruleIds:["seals-gaskets"],
  script:"I understand seals are listed as excluded. Confirm in writing whether the resulting damage to the covered part is being denied because of the seal exclusion, and on what inspection."},
 {id:"overheat", label:"They said I kept driving while overheating", ruleIds:["overheat"],
  script:"I stopped the vehicle as soon as the gauge rose. Tell me what evidence you have that driving continued after overheating, and send the denial with the exact clause cited."},
 {id:"prior-auth", label:"They said I never got prior authorization", ruleIds:["prior-auth"],
  script:"I have the name, date, and time of the person who authorized this repair. I need the denial in writing with the exact clause that voids the authorization."}
];
const FIGHT_GENERIC_SCRIPT = "Please cite the exact sentence in my contract that supports this denial, and the evidence you relied on. I need this in writing, not over the phone.";

function renderFightKit(text, hits, company){
  const box = $("fight-kit");
  box.hidden = false;
  const hasArb = hits.some(function(h){return h.rule.id === "arbitration";});
  box.innerHTML = '<h2>Claim denied? Fight it with the contract.</h2>' +
    '<p class="sub">Tap the reason they gave you, or paste the denial letter. FinePrint pulls the exact clause from your contract, shows why the company leans on it, and drafts your appeal letter. Template text, not legal advice.</p>' +
    '<div class="chip-row">' + FIGHT_REASONS.map(function(r){
      return '<button class="denial-chip" data-reason="' + r.id + '" aria-pressed="false">' + esc(r.label) + '</button>';
    }).join("") + '</div>' +
    '<details class="denial-paste"><summary>Or paste the denial letter</summary>' +
    '<textarea id="denial-letter" aria-label="Denial letter text" placeholder="Paste the denial letter or email text here..."></textarea>' +
    '<div class="input-actions" style="margin-top:8px"><button class="btn btn-ghost btn-small" id="denial-scan">Scan the denial letter</button></div>' +
    '<div id="denial-detected"></div></details>' +
    '<div id="denial-out"></div>' +
    '<div class="escalate"><strong>The escalation ladder</strong><ol>' +
    '<li>Get the denial in writing, with the exact clause cited. A phone "no" is not a denial.</li>' +
    '<li>Send the appeal letter below. Keep a copy and the tracking number.</li>' +
    '<li>File with your state attorney general\u2019s consumer protection office and the BBB (<a href="https://www.bbb.org/search" target="_blank" rel="noopener">search BBB</a>).</li>' +
    (hasArb
      ? '<li>This contract has binding arbitration, so small claims court may not be available. Check whether the 30-day opt-out window is still open, then talk to a consumer attorney.</li>'
      : '<li>Last step: small claims court. Bring the contract, the denial letter, and your maintenance records.</li>') +
    '</ol></div>';
  box.querySelectorAll(".denial-chip").forEach(function(chip){
    chip.addEventListener("click", function(){
      box.querySelectorAll(".denial-chip").forEach(function(c){c.setAttribute("aria-pressed","false");});
      chip.setAttribute("aria-pressed","true");
      const r = FIGHT_REASONS.filter(function(x){return x.id === chip.dataset.reason;})[0];
      showFightCase(r.ruleIds, r.label, r.script, text, hits, company);
      $("denial-out").scrollIntoView({behavior:"smooth", block:"nearest"});
    });
  });
  $("denial-scan").addEventListener("click", function(){
    const t = $("denial-letter").value.trim();
    if(t.length < 60){ toast("Paste a bit more of the denial letter first."); return; }
    const dh = analyze(t).filter(function(h){return !h.question && h.rule.sev !== "pos";});
    const det = $("denial-detected");
    if(!dh.length){
      det.innerHTML = '<p style="font-size:14px;color:var(--ink2)">No known denial phrases matched this letter. That is common: denial letters are written to sound final without citing the contract. Try the reason chips above, or ask the company for the exact clause.</p>';
      return;
    }
    det.innerHTML = '<p style="font-size:14px;font-weight:700">Detected reasons in the letter:</p><div class="chip-row">' +
      dh.map(function(h, i){ return '<button class="denial-chip" data-dhi="' + i + '">' + esc(h.rule.title) + '</button>'; }).join("") + '</div>';
    det.querySelectorAll("[data-dhi]").forEach(function(chip){
      chip.addEventListener("click", function(){
        const h = dh[parseInt(chip.dataset.dhi, 10)];
        const fr = FIGHT_REASONS.filter(function(x){return x.id === h.rule.id;})[0];
        showFightCase([h.rule.id], 'They said: "' + h.rule.title + '"', fr ? fr.script : FIGHT_GENERIC_SCRIPT, text, hits, company);
        $("denial-out").scrollIntoView({behavior:"smooth", block:"nearest"});
      });
    });
  });
}

function showFightCase(ruleIds, reasonLabel, script, text, hits, company){
  const out = $("denial-out");
  const rules = RULES.filter(function(r){return ruleIds.indexOf(r.id) >= 0;});
  const contractHits = hits.filter(function(h){return ruleIds.indexOf(h.rule.id) >= 0 && !h.question;});
  const sentences = [];
  contractHits.forEach(function(h){
    h.matches.forEach(function(mt){
      const s = sentenceAround(text, mt.start).trim().replace(/\s+/g," ");
      if(s && sentences.indexOf(s) < 0) sentences.push(s);
    });
  });
  const clauseHtml = sentences.length
    ? sentences.slice(0,3).map(function(s){
        return '<div class="fight-clause">"' + esc(s.length > 280 ? s.slice(0,280) + "..." : s) + '"</div>';
      }).join("")
    : '<p style="font-size:14px">Your contract does not contain this language, which weakens their argument. Ask them to cite the exact sentence in your contract that supports the denial.</p>';
  out.innerHTML = '<div class="fight-case"><h3>' + esc(reasonLabel) + '</h3>' +
    '<p class="fight-label">The clause they are leaning on</p>' + clauseHtml +
    '<p class="fight-label">Why this works for them</p>' +
    '<p style="font-size:14px">' + esc(rules.map(function(r){return r.explain;}).join(" ")) + '</p>' +
    '<div class="tip"><strong>What to say on the phone</strong><br>"' + esc(script) + '"</div>' +
    '<div class="input-actions" style="margin-top:10px"><button class="btn btn-ghost btn-small" id="ap-toggle">Build my appeal letter</button></div>' +
    '<div id="ap-form" hidden></div></div>';
  $("ap-toggle").addEventListener("click", function(){ renderAppealForm(company, reasonLabel); });
}

function renderAppealForm(company, reasonLabel){
  const f = $("ap-form");
  f.hidden = false;
  f.innerHTML = '<div class="appeal-form">' +
    '<label>Your name<input id="ap-name" autocomplete="name"></label>' +
    '<label>Phone<input id="ap-phone" autocomplete="tel"></label>' +
    '<label>Email<input id="ap-email" autocomplete="email"></label>' +
    '<label>Company<input id="ap-company" value="' + esc(company || "") + '"></label>' +
    '<label>Claim number<input id="ap-claim" autocomplete="off"></label>' +
    '<label>Repair denied<input id="ap-repair" placeholder="e.g. transmission replacement"></label>' +
    '<label>Denial date<input id="ap-date" type="date"></label>' +
    '<label class="full">Reason they gave<input id="ap-reason" value="' + esc(reasonLabel) + '"></label>' +
    '<label class="full">Your evidence, one per line<textarea id="ap-evidence" rows="3" placeholder="Complete oil-change receipts, every interval"></textarea></label>' +
    '</div>' +
    '<div class="input-actions" style="margin-top:10px"><button class="btn btn-primary btn-small" id="ap-generate">Generate letter</button></div>' +
    '<div class="appeal-preview" id="ap-preview" hidden></div>';
  $("ap-generate").addEventListener("click", generateAppeal);
  f.scrollIntoView({behavior:"smooth", block:"nearest"});
}

function generateAppeal(){
  const v = function(id){ return $(id).value.trim(); };
  const name = v("ap-name"), phone = v("ap-phone"), email = v("ap-email"),
        company = v("ap-company"), claim = v("ap-claim"), repair = v("ap-repair"),
        date = v("ap-date"), reason = v("ap-reason"), evidence = v("ap-evidence");
  if(!company || !claim || !repair){ toast("Fill in company, claim number, and repair first."); return; }
  const evLines = evidence.split(/\n/).map(function(l){return l.trim();}).filter(Boolean);
  const letter =
    "Subject: Appeal of denied claim " + claim + "\n\n" +
    "Dear " + company + " claims department,\n\n" +
    "On " + (date || "[date of denial]") + ", you denied my claim " + claim + " for " + repair + ". Your letter cited: " + (reason || "[reason]") + ".\n\n" +
    "I ask you to reconsider:\n" +
    (evLines.length ? evLines.map(function(l){return "- " + l;}).join("\n") : "- [your evidence, e.g. complete maintenance receipts]") + "\n\n" +
    "Please respond in writing within 14 days with the exact contract language you are relying on. If I do not hear back, I will file complaints with my state attorney general's consumer protection office and the Better Business Bureau, and I will consider small claims court.\n\n" +
    "Sincerely,\n" + (name || "[your name]") + ((phone || email) ? "\n" + [phone, email].filter(Boolean).join(" | ") : "");
  const pv = $("ap-preview");
  pv.innerHTML = "";
  pv.hidden = false;
  const pre = document.createElement("div");
  pre.style.whiteSpace = "pre-wrap";
  pre.textContent = letter;
  pv.appendChild(pre);
  const btn = document.createElement("button");
  btn.className = "btn btn-ghost btn-small";
  btn.style.marginTop = "10px";
  btn.textContent = "Copy appeal letter";
  btn.addEventListener("click", function(){ copyText(letter, "Appeal letter copied."); });
  pv.appendChild(btn);
  pv.scrollIntoView({behavior:"smooth", block:"nearest"});
}

function renderResults(text, name, opts){
  opts = opts || {};
  const hits = analyze(text);
  const score = scoreOf(hits);
  const v = verdictFor(score);
  const id = opts.id || ("a" + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36));
  const company = extractCompany(text);
  currentAnalysis = {id:id, text:text, name:name, score:score, rv:RULESET_V, company:company, hits:hits.map(function(h){
    return {title:h.rule.title, sev:h.rule.sev, count:h.matches.length};
  }), date:new Date().toISOString()};

  $("score-version").textContent = "scored with rule set v" + RULESET_V;
  $("results").style.display = "block";
  var scoreNum = $("score-num");
  var stamp = $("stamp");
  stamp.classList.remove("slam");
  scoreNum.classList.remove("falling");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(score < 40 && !reduceMotion){
    // the walk-away moment: score falls from 100, then the stamp slams down
    scoreNum.style.color = v[2];
    scoreNum.classList.add("falling");
    (function(){
      var t0 = performance.now(), dur = 1100, from = 100;
      (function tick(t){
        var k = Math.min(1,(t-t0)/dur), e = k*k; // accelerating fall
        scoreNum.textContent = Math.round(from + (score-from)*e);
        if(k<1){ requestAnimationFrame(tick); }
        else { scoreNum.classList.remove("falling"); stamp.classList.add("slam"); }
      })(t0);
    })();
  } else {
    scoreNum.textContent = score;
    scoreNum.style.color = v[2];
  }
  $("score-fill").style.width = score + "%";
  $("score-fill").style.background = v[2];
  $("score-verdict").textContent = v[0];
  $("score-verdict").style.color = v[2];
  $("score-sub").textContent = v[1];

  const counts = {high:0, med:0, low:0, pos:0, q:0};
  hits.forEach(function(h){ if(h.question) counts.q += 1; else counts[h.rule.sev] += 1; });
  $("count-row").innerHTML =
    pill(counts.high, "dealbreaker", "dealbreakers", "var(--hi-r)") +
    pill(counts.med, "caution", "cautions", "var(--hi-y)") +
    pill(counts.low, "note", "notes", "var(--hi-b)") +
    pill(counts.pos, "good sign", "good signs", "var(--hi-g)") +
    (counts.q ? pill(counts.q, "need your eyes", "need your eyes", "var(--hi-b)") : "");
  function pill(n, one, many, bg){
    return '<span class="count-pill" style="background:'+bg+'">'+n+" "+(n===1?one:many)+"</span>";
  }

  // category breakdown
  const cats = {};
  hits.forEach(function(h){ cats[h.rule.cat] = (cats[h.rule.cat]||0) + 1; });
  $("cat-break").innerHTML = Object.keys(cats).sort().map(function(c){
    return '<span class="cat-pill">'+esc(c)+": "+cats[c]+"</span>";
  }).join("");

  // top-3 traps summary (finance-office glance): questions are not verdicts
  const top3 = rankedHits(hits).slice(0,3);
  $("top3").innerHTML = top3.length
    ? "<h4>Top traps at a glance</h4><ol>" + top3.map(function(h){
        return "<li><span class='t-sev' style='color:" +
          (h.rule.sev==="high"?"var(--red)":h.rule.sev==="med"?"var(--amber)":h.rule.sev==="pos"?"var(--green)":"var(--blue)") +
          "'>"+SEV_LABEL[h.rule.sev]+"</span>: "+esc(h.rule.title)+"</li>";
      }).join("") + "</ol>"
    : "";

  const questions = financeQuestions(hits);
  $("qa-card").hidden = !questions.length;
  $("qa-card").innerHTML = questions.length ? '<h3>3 questions for the finance office</h3>' + questionsHTML(questions) : "";
  renderRefundCard(text);
  $("share-score").onclick = function(){ shareScore(currentAnalysis, hits); };
  $("print-onepager").onclick = function(){ buildPrintReport(currentAnalysis, hits); window.print(); };
  window.onbeforeprint = function(){ buildPrintReport(currentAnalysis, hits); };

  $("copy-report").onclick = function(){
    const v = verdictFor(score);
    let txt = "FinePrint report: " + name + "\nDeal score: " + score + "/100: " + v[0] + "\n\n";
    const order = {high:0, med:1, low:2, pos:3};
    hits.slice().sort(function(a,b){return order[a.rule.sev]-order[b.rule.sev];}).forEach(function(h){
      txt += "[" + SEV_LABEL[h.rule.sev].toUpperCase() + "] " + h.rule.title +
        (h.matches.length>1 ? " (x"+h.matches.length+")" : "") + "\n" + h.rule.explain + "\n\n";
    });
    txt += "Checklist before signing: google the company + complaints/scam/BBB, check your state AG, ask two mechanics if they accept it.\nPattern-based scan, not legal advice.";
    if(questions.length) txt += "\n\n3 questions for the finance office\n" + questions.map(function(q){ return '"' + q.ask + '"\n' + q.why; }).join("\n\n");
    txt += "\n\nRule set v" + RULESET_V + ".";
    copyText(txt, "Report copied. Text it to whoever needs it.");
  };

  renderDoc(text, hits);
  renderFlags(hits);
  renderChecklist(id, company);
  renderFightKit(text, hits, company);
  if(opts.save !== false) saveAnalysis(currentAnalysis); // render != create: reopening a saved analysis must not duplicate it
  renderSaved();
  $("results").scrollIntoView({behavior:"smooth", block:"start"});
}

function renderDoc(text, hits){
  // collect spans, sort, drop overlaps
  let spans = [];
  hits.forEach(function(h, hi){
    h.matches.forEach(function(m){
      spans.push({start:m.start, end:m.end, hi:hi, sev:h.question ? "low" : h.rule.sev, q:h.question});
    });
  });
  spans.sort(function(a,b){ return a.start - b.start || b.end - a.end; });
  const kept = [];
  spans.forEach(function(s){
    if(!kept.some(function(k){ return s.start < k.end && s.end > k.start; })) kept.push(s);
  });
  kept.sort(function(a,b){return a.start-b.start;});
  let out = "", pos = 0;
  kept.forEach(function(s, i){
    out += esc(text.slice(pos, s.start));
    const label = s.q ? "Possible false positive: " + hits[s.hi].rule.title
                      : SEV_LABEL[s.sev] + ": " + hits[s.hi].rule.title;
    out += '<mark class="sev-'+s.sev+'" data-hi="'+s.hi+'" id="mk-'+i+'" title="'+esc(label)+'">'+esc(text.slice(s.start, s.end))+"</mark>";
    pos = s.end;
  });
  out += esc(text.slice(pos));
  $("doc-view").innerHTML = out;
  // clicking a highlight jumps to its flag card
  $("doc-view").querySelectorAll("mark").forEach(function(mk){
    mk.addEventListener("click", function(){
      switchTab("flags");
      const card = $("flag-"+mk.getAttribute("data-hi"));
      if(card){ card.scrollIntoView({behavior:"smooth", block:"center"}); card.style.outline="3px solid var(--ink)"; setTimeout(function(){card.style.outline="";},1600); }
    });
  });
}

function renderFlags(hits){
  const box = $("flag-list");
  if(!hits.length){
    box.innerHTML = '<div class="flag"><div class="flag-head"><h3>No flags found</h3></div><p>None of the 30+ trap patterns matched this text. That does not mean it is safe: cleverly worded contracts can dodge pattern matching. Read the exclusions section yourself.</p></div>';
    return;
  }
  const order = {high:0, med:1, low:2, pos:3};
  const sorted = hits.slice().sort(function(a,b){
    // questions sink below verdicts of the same severity
    const aq = a.question ? 0.5 : 0, bq = b.question ? 0.5 : 0;
    return (order[a.rule.sev]+aq)-(order[b.rule.sev]+bq);
  });
  box.innerHTML = sorted.map(function(h, i){
    const r = h.rule;
    const quote = esc(h.matches[0].snippet.length > 140 ? h.matches[0].snippet.slice(0,140)+"…" : h.matches[0].snippet);
    if(h.question){
      return '<div class="flag" id="flag-'+hits.indexOf(h)+'">' +
        '<div class="flag-head"><span class="sev sev-low">Question</span><h3>'+esc(r.title)+': needs your eyes</h3></div>' +
        '<div class="quote">"…'+quote+'…"</div>' +
        "<p><strong>This might be a false positive.</strong> The surrounding sentence says the opposite of the usual trap" +
        (h.questionWhy ? ' ("…'+esc(h.questionWhy.trim())+'…")' : "") +
        ". Read the clause yourself before deciding.</p>" +
        '<div class="tip"><strong>What to do</strong><br>'+esc(r.tip)+"</div>" +
        '<p style="font-size:12.5px;color:var(--ink2)">Category: '+esc(r.cat)+'</p>' + feedbackRow(r.id) +
        "</div>";
    }
    return '<div class="flag" id="flag-'+hits.indexOf(h)+'">' +
      '<div class="flag-head"><span class="sev sev-'+r.sev+'">'+SEV_LABEL[r.sev]+'</span><h3>'+esc(r.title)+'</h3>' +
      (h.matches.length>1 ? '<span class="count">×'+h.matches.length+'</span>' : "") + "</div>" +
      '<div class="quote">“…'+quote+'…”</div>' +
      "<p>"+esc(r.explain)+"</p>" +
      '<div class="tip"><strong>What to do</strong><br>'+esc(r.tip)+"</div>" +
      '<p style="font-size:12.5px;color:var(--ink2)">Category: '+esc(r.cat)+'</p>' + feedbackRow(r.id) +
      "</div>";
  }).join("");
}

function renderChecklist(analysisId, company){
  const box = $("check-items");
  // checklist state is scoped to the analyzed contract, not global
  const ckey = "fineprint_checklist_" + (analysisId || "none");
  const done = storeGet(ckey, []);
  box.innerHTML = "";
  CHECKLIST.forEach(function(item, i){
    const label = document.createElement("label");
    label.className = "check-item" + (done.indexOf(i) >= 0 ? " done" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = done.indexOf(i) >= 0;
    cb.setAttribute("aria-label", item.replace("[company name]", company || "the company"));
    cb.addEventListener("change", function(){
      let d = storeGet(ckey, []);
      if(cb.checked && d.indexOf(i) < 0) d.push(i);
      if(!cb.checked) d = d.filter(function(x){return x!==i;});
      if(!storeSet(ckey, d)) storageWarning("checklist change not saved");
      label.classList.toggle("done", cb.checked);
    });
    const sp = document.createElement("span"); sp.className = "txt";
    if(company && item.indexOf("[company name]") >= 0){
      const parts = item.split("[company name]");
      sp.appendChild(document.createTextNode(parts[0]));
      const b = document.createElement("strong"); b.textContent = company; sp.appendChild(b);
      sp.appendChild(document.createTextNode(parts[1] || ""));
    } else {
      sp.textContent = item;
    }
    checklistLinks(i, company).forEach(function(l){
      sp.appendChild(document.createTextNode(" "));
      const a = document.createElement("a");
      a.href = l.href; a.target = "_blank"; a.rel = "noopener"; a.className = "check-link";
      a.textContent = l.text + " ";
      a.appendChild(extIcon());
      sp.appendChild(a);
    });
    label.appendChild(cb); label.appendChild(sp); box.appendChild(label);
  });
}
function extIcon(){
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12"); svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.9"); svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round"); svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M14 4h6v6M20 4l-9 9M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5");
  svg.appendChild(p);
  return svg;
}

function saveAnalysis(a){
  const all = storeGet("fineprint_analyses", []);
  all.unshift({id:a.id, date:a.date, name:(a.name||"Pasted contract").slice(0,60), score:a.score, rv:RULESET_V, flags:a.hits.length, text:a.text});
  if(!storeSet("fineprint_analyses", all.slice(0,20))){
    storageWarning("this analysis could not be saved.");
    return;
  }
  try{ if(window.__fineprintSync) window.__fineprintSync.onSave(); }catch(e){}
}

/* ---------- sync bridge (prototype backend; see sync.js) ---------- */
let fpBridgeS = null;
window.__fineprint = {
  getS: function(){ fpBridgeS = { analyses: storeGet("fineprint_analyses", []) }; return fpBridgeS; },
  saveLocal: function(){ if (fpBridgeS) storeSet("fineprint_analyses", fpBridgeS.analyses); },
  refresh: function(){ renderSaved(); }
};

function renderSaved(){
  const box = $("saved-list");
  // validate: only real analyses with text survive (guards corrupt storage)
  const all = storeGet("fineprint_analyses", []).filter(function(a){
    return a && typeof a.text === "string" && a.text.length > 0 && typeof a.score === "number";
  });
  // analyses over the 100KB sync cap stay device-only; badge them honestly
  let bigMap = {};
  try { bigMap = JSON.parse(localStorage.getItem("fineprint.oversized.v1") || "{}") || {}; } catch(e){}
  if(!all.length){ box.innerHTML = '<p class="saved-empty">No saved analyses yet. Analyze a contract and it will appear here.</p>'; return; }
  box.innerHTML = "";
  all.forEach(function(a){
    const row = document.createElement("div"); row.className = "saved-item";
    const nm = document.createElement("span"); nm.className = "nm";
    nm.textContent = a.name + " · " + new Date(a.date).toLocaleDateString();
    const sc = document.createElement("span"); sc.className = "sc"; sc.textContent = a.score;
    const open = document.createElement("button"); open.textContent = "Open";
    // render != create: reopening must not save a duplicate
    open.addEventListener("click", function(){ renderResults(a.text, a.name, {save:false, id:a.id || ("old"+a.date)}); });
    const del = document.createElement("button"); del.textContent = "Delete";
    del.addEventListener("click", function(){
      const rest = storeGet("fineprint_analyses", []).filter(function(x){return x.id!==a.id;});
      storeSet("fineprint_analyses", rest);
      try{ if(window.__fineprintSync) window.__fineprintSync.onSave(); }catch(e){}
      renderSaved(); toast("Deleted.");
    });
    row.appendChild(nm); row.appendChild(sc);
    if (a.id && bigMap["analyses:" + a.id]){
      const badge = document.createElement("span"); badge.className = "devonly";
      badge.textContent = "device only";
      badge.title = "Over the 100KB sync cap: saved on this device, not backed up.";
      row.appendChild(badge);
    }
    row.appendChild(open); row.appendChild(del);
    box.appendChild(row);
  });
}

function switchTab(which){
  const doc = which === "doc";
  $("tab-doc").setAttribute("aria-selected", doc ? "true" : "false");
  $("tab-flags").setAttribute("aria-selected", doc ? "false" : "true");
  $("doc-view").style.display = doc ? "" : "none";
  $("legend").style.display = doc ? "" : "none";
  $("flag-list").style.display = doc ? "none" : "";
}

/* ---------- Wire up ---------- */
$("compare-toggle").addEventListener("click",function(){
  $("compare-sec").hidden = !$("compare-sec").hidden;
  this.setAttribute("aria-expanded",String(!$("compare-sec").hidden));
  if(!$("compare-sec").hidden) $("compare-a").focus();
});
$("compare-sample-a").addEventListener("click",function(){ $("compare-a").value=SAMPLES.car.text; $("compare-results").hidden=true; });
$("compare-sample-b").addEventListener("click",function(){ $("compare-b").value=SAMPLES.home.text; $("compare-results").hidden=true; });
["compare-a","compare-b"].forEach(function(id){$(id).addEventListener("input",function(){ $("compare-results").hidden=true; });});
$("compare-run").addEventListener("click",compareContracts);
$("flag-list").addEventListener("click",function(event){
  const button = event.target.closest("button[data-vote]");
  if(!button) return;
  const row = button.closest(".feedback"), id = row.dataset.rule, dir = button.dataset.vote;
  const data = feedbackData(), v = feedbackVote(data,id);
  const next = v.mine === dir ? null : dir;
  if(v.mine) v[v.mine] = Math.max(0,v[v.mine]-1);
  if(next) v[next]++;
  v.mine=next;data[id]=v;
  if(!storeSet("fineprint_feedback",data)){storageWarning("this vote could not be saved.");return;}
  row.outerHTML=feedbackRow(id);
  const updated = $("flag-list").querySelector('.feedback[data-rule="'+id+'"]');
  updated.querySelector('[data-vote="'+dir+'"]').focus({preventScroll:true});
  toast("Thanks. Your vote helps tune the detector.");
});

$("tab-doc").addEventListener("click", function(){switchTab("doc");});
$("tab-flags").addEventListener("click", function(){switchTab("flags");});

$("sample-car").addEventListener("click", function(){
  $("contract").value = SAMPLES.car.text;
  renderResults(SAMPLES.car.text, SAMPLES.car.name);
  toast("Shady car contract loaded. Look at that score.");
});
$("sample-home").addEventListener("click", function(){
  $("contract").value = SAMPLES.home.text;
  renderResults(SAMPLES.home.text, SAMPLES.home.name);
  toast("Home warranty loaded.");
});

$("analyze").addEventListener("click", function(){
  const t = $("contract").value.trim();
  if(t.length < 200){ toast("Paste a bit more contract text first (at least a paragraph)."); return; }
  renderResults(t, "Pasted contract");
});

$("clear").addEventListener("click", function(){
  $("contract").value = "";
  $("results").style.display = "none";
  $("fight-kit").hidden = true;
  // reset the print closure so Ctrl+P agrees with the print button: nothing to print
  currentAnalysis = null;
  window.onbeforeprint = null;
  $("print-report").innerHTML = "";
  toast("Cleared.");
});

$("file").addEventListener("change", function(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = function(){ $("contract").value = String(r.result || "").slice(0, 200000); toast("File loaded. Hit Analyze."); };
  r.readAsText(f);
  e.target.value = "";
});

renderSaved();

/* first-run tip: point at the magic moment (iteration 4) */
(function(){
  var tip = $("first-tip");
  try{
    if(!localStorage.getItem("fineprint-tip-seen")) tip.hidden = false;
  }catch(e){ tip.hidden = false; }
  $("first-tip-x").addEventListener("click", function(){
    tip.hidden = true;
    try{ localStorage.setItem("fineprint-tip-seen","1"); }catch(e){}
  });
})();
})();
