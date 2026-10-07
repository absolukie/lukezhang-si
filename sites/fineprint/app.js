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

/* ---------- Sample contracts ---------- */
const SAMPLES = {
car: {name:"Apex Auto Shield — Vehicle Service Contract (sample)",
text:
"APEX AUTO SHIELD\nVEHICLE SERVICE CONTRACT — PLATINUM COVERAGE\n\nThis Vehicle Service Contract (the \u201cContract\u201d) is between you, the Contract Holder, and Apex Auto Shield LLC (the \u201cAdministrator\u201d). Please read this entire Contract carefully. Coverage begins 30 days or 1,000 miles after the Contract purchase date, whichever occurs first (the \u201cWaiting Period\u201d). No claims will be honored during the Waiting Period.\n\nCOVERAGE: Subject to the terms herein, the Administrator agrees to pay for the repair or replacement of the following components due to mechanical breakdown: engine, transmission, drive axle, and turbocharger, up to an aggregate limit of $5,000 for the life of this Contract. In no event shall the Administrator\u2019s total liability exceed $5,000.\n\nEXCLUSIONS: This Contract does not cover: (a) any repair necessitated by normal wear and tear; (b) seals and gaskets; (c) pre-existing conditions known or unknown to the Contract Holder; (d) damage caused by overheating, regardless of cause; (e) consequential damage or resulting damage to non-covered parts; (f) any vehicle used for commercial use, including ridesharing, delivery, or for-hire service such as Uber or Lyft; (g) any vehicle with modifications, aftermarket parts, lift kits, or non-OEM components; (h) any vehicle with a salvage, rebuilt, or branded title, or with prior flood damage; (i) failures caused by rust or corrosion.\n\nMAINTENANCE REQUIREMENTS: The Contract Holder must maintain the vehicle in accordance with the manufacturer\u2019s recommendations and must provide maintenance records and proof of maintenance upon request. Engine oil and filter must be changed every 3,000 miles without exception. Failure to furnish complete service history shall be grounds for denial of any claim, as determined by the Administrator in its sole discretion.\n\nCLAIM PROCEDURE: The Contract Holder must obtain prior authorization before any repair work begins. Repairs performed without prior authorization will not be covered. All repairs must be performed at an authorized repair facility designated by the Administrator. Teardown and diagnostic charges are the responsibility of the Contract Holder and are not covered under any circumstances. The Administrator may, at its sole discretion, elect to use remanufactured or used parts. Betterment and depreciation charges may be deducted from approved claims.\n\nDEDUCTIBLE: A $100 deductible applies per visit.\n\nCANCELLATION: You may cancel within 30 days for a full refund. After 30 days, cancellation refunds are calculated on a pro-rata basis less claims paid and a $50 administrative cancellation fee. This Contract is non-transferable and may not be assigned.\n\nOTHER TERMS: Failure to pay any monthly installment within 10 days shall cause this Contract to lapse, and all coverage shall terminate. Any dispute arising under this Contract shall be resolved by binding arbitration, and the parties waive any right to participate in a class action. Coverage terminates when the vehicle exceeds 150,000 miles."},
home: {name:"Homestead Home Warranty — Systems Plan (sample)",
text:
"HOMESTEAD HOME WARRANTY\nRESIDENTIAL SERVICE PLAN — SYSTEMS COVERAGE\n\nThis Service Plan (the \u201cPlan\u201d) is issued by Homestead Warranty Services Inc. (the \u201cCompany\u201d). Coverage begins 30 days after enrollment. There is a $75 trade call fee due for each service visit.\n\nCOVERED SYSTEMS: Heating, cooling, plumbing, and electrical systems, subject to an aggregate limit of $5,000 per term.\n\nEXCLUSIONS: The Plan does not cover: (a) pre-existing conditions; (b) rust or corrosion; (c) systems not installed to building code; (d) consequential damage to walls, floors, or finishes resulting from a covered failure.\n\nCLAIM PROCEDURE: Service may be performed by any licensed contractor of your choice, or by a Company-authorized contractor. For repairs over $500, the Plan Holder must obtain prior authorization before work is performed.\n\nMAINTENANCE: The Plan Holder is responsible for routine maintenance and must provide service records upon request.\n\nCANCELLATION: Cancellation within 30 days of enrollment entitles the Plan Holder to a full refund. Thereafter, refunds are pro-rata less a $25 cancellation fee. This Plan is transferable to a new homeowner for a $25 transfer fee.\n\nDISPUTES: Disputes shall first be submitted to non-binding mediation. If mediation fails, either party may pursue remedies in small claims court or through binding arbitration, at the Plan Holder\u2019s choice."}
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

function renderResults(text, name, opts){
  opts = opts || {};
  const hits = analyze(text);
  const score = scoreOf(hits);
  const v = verdictFor(score);
  const id = opts.id || ("a" + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36));
  currentAnalysis = {id:id, text:text, name:name, score:score, hits:hits.map(function(h){
    return {title:h.rule.title, sev:h.rule.sev, count:h.matches.length};
  }), date:new Date().toISOString()};

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
    pill(counts.high, "dealbreakers", "var(--hi-r)") +
    pill(counts.med, "cautions", "var(--hi-y)") +
    pill(counts.low, "notes", "var(--hi-b)") +
    pill(counts.pos, "good signs", "var(--hi-g)") +
    (counts.q ? pill(counts.q, "need your eyes", "var(--hi-b)") : "");
  function pill(n, label, bg){
    return '<span class="count-pill" style="background:'+bg+'">'+n+" "+label+"</span>";
  }

  // category breakdown
  const cats = {};
  hits.forEach(function(h){ cats[h.rule.cat] = (cats[h.rule.cat]||0) + 1; });
  $("cat-break").innerHTML = Object.keys(cats).sort().map(function(c){
    return '<span class="cat-pill">'+esc(c)+": "+cats[c]+"</span>";
  }).join("");

  // top-3 traps summary (finance-office glance) — questions are not verdicts
  const order3 = {high:0, med:1, low:2, pos:3};
  const top3 = hits.filter(function(h){return !h.question;}).slice().sort(function(a,b){return order3[a.rule.sev]-order3[b.rule.sev];}).slice(0,3);
  $("top3").innerHTML = top3.length
    ? "<h4>Top traps at a glance</h4><ol>" + top3.map(function(h){
        return "<li><span class='t-sev' style='color:" +
          (h.rule.sev==="high"?"var(--red)":h.rule.sev==="med"?"var(--amber)":h.rule.sev==="pos"?"var(--green)":"var(--blue)") +
          "'>"+SEV_LABEL[h.rule.sev]+"</span> — "+esc(h.rule.title)+"</li>";
      }).join("") + "</ol>"
    : "";

  $("copy-report").onclick = function(){
    const v = verdictFor(score);
    let txt = "FinePrint report — " + name + "\nDeal score: " + score + "/100 — " + v[0] + "\n\n";
    const order = {high:0, med:1, low:2, pos:3};
    hits.slice().sort(function(a,b){return order[a.rule.sev]-order[b.rule.sev];}).forEach(function(h){
      txt += "[" + SEV_LABEL[h.rule.sev].toUpperCase() + "] " + h.rule.title +
        (h.matches.length>1 ? " (x"+h.matches.length+")" : "") + "\n" + h.rule.explain + "\n\n";
    });
    txt += "Checklist before signing: google the company + complaints/scam/BBB, check your state AG, ask two mechanics if they accept it.\n— Pattern-based scan, not legal advice.";
    const done = function(){ toast("Report copied. Text it to whoever needs it."); };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(done, function(){ fallbackCopy(txt); done(); });
    } else { fallbackCopy(txt); done(); }
  };
  function fallbackCopy(t){
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); }catch(e){}
    document.body.removeChild(ta);
  }

  renderDoc(text, hits);
  renderFlags(hits);
  renderChecklist(id);
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
        '<div class="flag-head"><span class="sev sev-low">Question</span><h3>'+esc(r.title)+' — needs your eyes</h3></div>' +
        '<div class="quote">"…'+quote+'…"</div>' +
        "<p><strong>This might be a false positive.</strong> The surrounding sentence says the opposite of the usual trap" +
        (h.questionWhy ? ' ("…'+esc(h.questionWhy.trim())+'…")' : "") +
        ". Read the clause yourself before deciding.</p>" +
        '<div class="tip"><strong>What to do</strong><br>'+esc(r.tip)+"</div>" +
        '<p style="font-size:12.5px;color:var(--ink2)">Category: '+esc(r.cat)+'</p>' +
        "</div>";
    }
    return '<div class="flag" id="flag-'+hits.indexOf(h)+'">' +
      '<div class="flag-head"><span class="sev sev-'+r.sev+'">'+SEV_LABEL[r.sev]+'</span><h3>'+esc(r.title)+'</h3>' +
      (h.matches.length>1 ? '<span class="count">×'+h.matches.length+'</span>' : "") + "</div>" +
      '<div class="quote">“…'+quote+'…”</div>' +
      "<p>"+esc(r.explain)+"</p>" +
      '<div class="tip"><strong>What to do</strong><br>'+esc(r.tip)+"</div>" +
      '<p style="font-size:12.5px;color:var(--ink2)">Category: '+esc(r.cat)+'</p>' +
      "</div>";
  }).join("");
}

function renderChecklist(analysisId){
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
    cb.setAttribute("aria-label", item);
    cb.addEventListener("change", function(){
      let d = storeGet(ckey, []);
      if(cb.checked && d.indexOf(i) < 0) d.push(i);
      if(!cb.checked) d = d.filter(function(x){return x!==i;});
      storeSet(ckey, d);
      label.classList.toggle("done", cb.checked);
    });
    const sp = document.createElement("span"); sp.className = "txt"; sp.textContent = item;
    label.appendChild(cb); label.appendChild(sp); box.appendChild(label);
  });
}

function saveAnalysis(a){
  const all = storeGet("fineprint_analyses", []);
  all.unshift({id:a.id, date:a.date, name:(a.name||"Pasted contract").slice(0,60), score:a.score, flags:a.hits.length, text:a.text});
  storeSet("fineprint_analyses", all.slice(0,20));
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
    row.appendChild(nm); row.appendChild(sc); row.appendChild(open); row.appendChild(del);
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
