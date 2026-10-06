/* Trade Compass — portfolio + fundamentals data (baked in, as of Sept 2026).
   Live price/indicator data is fetched from the /api/quotes proxy at runtime; everything here
   is reference + fundamental context.
   Holdings pulled from Robinhood 2026-09-26 (read-only). Two accounts:
   "100x" = the account literally named "100x Bagger" (5 speculative positions);
   "individual" = the main Individual investing account. */

var TC_DATA = (function () {
  "use strict";

  var AS_OF_LABEL = "Sept 26, 2026";
  var FUND_LABEL = "Fundamentals as of Sept 2026";

  // qty, price, avgCost — from the Robinhood pull 2026-09-26.
  // For the 100x account, price = account value / shares; avgCost is DERIVED
  // from the reported open $ P&L (cost = value - open P&L), so all $ math reconciles
  // exactly. The % figures in the pull did not reconcile with its $ figures, so
  // percentages shown are computed from the $ figures. Purchase dates unknown.

  var POSITIONS = [
    {
      id: "oust", symbol: "OUST", stooq: "oust.us", kind: "stock", account: "100x",
      name: "Ouster, Inc.",
      qty: 105.48201, price: 43.330043, avgCost: 42.094666,
      tagline: "Lidar for the 'Physical AI' era — revenue inflecting, still unprofitable.",
      fundamentals: {
        business: "Ouster makes lidar sensors plus software for autonomy, robotics, drones, and smart infrastructure — the 'Physical AI' stack. Q2 shipped 17,000+ sensors; lidar is 53% of shipments, with cameras (via the Stereolabs acquisition) making up the rest.",
        stats: [
          ["Price (account value basis)", "$43.33"],
          ["Q2 2026 revenue", "$54.6M (+55.9% YoY, beat ~$51M est.)"],
          ["Gross margin", "49% GAAP (+400bp YoY); 53% non-GAAP"],
          ["Q2 net loss", "-$18.1M (adj. EBITDA -$4M)"],
          ["Q3 revenue guidance", "$54.5-57.5M"],
          ["Analyst consensus", "Moderate Buy, avg target ~$55"],
          ["Beta", "3.25 — violent swings both ways"],
          ["Off 52-week high", "~40% ($63.79 high)"]
        ],
        catalysts: [
          "Physical AI narrative: lidar moving from niche hardware to embedded infrastructure",
          "Rev8 OS1 Max native color lidar (power-line detection from 200m) — drone/defense adoption",
          "Stereolabs acquisition diversifies into cameras + software attach",
          "Analyst targets ($55-61) sit well above the recent trading range"
        ],
        risks: [
          "Still losing money; analysts expect another full-year loss — the profitability path IS the thesis",
          "P/S ~13.9x vs a much lower industry average — priced for perfection",
          "CEO, CFO, CTO, COO and others sold ~98k shares (~$3.3M) in September",
          "40% below its 52-week high shows how fast this reprices on disappointment"
        ]
      },
      take: "Hold for the story, size for the volatility. Revenue is genuinely inflecting (+56%) and margins are expanding — but you're paying ~14x sales for a money-loser while insiders sell. This is a Physical AI lottery ticket, not a compounder. Yet."
    },
    {
      id: "iren", symbol: "IREN", stooq: "iren.us", kind: "stock", account: "100x",
      name: "IREN Limited",
      qty: 30.649257, price: 44.120156, avgCost: 22.920621,
      tagline: "Bitcoin miner turned AI data-center operator — Microsoft is the anchor tenant.",
      fundamentals: {
        business: "IREN is converting bitcoin-mining sites into AI data centers. FY2026 AI cloud revenue was $128.8M (8x YoY); the company holds ~$4B of contracted 2026 revenue anchored by a 5-year, $9.7B Microsoft deal, plus $6.5B in GPU financing and 5GW+ of secured power.",
        stats: [
          ["Price (account value basis)", "$44.12"],
          ["FY2026 revenue", "$707M (AI cloud $128.8M, 8x YoY)"],
          ["FY2026 net loss", "-$702.6M (incl. $638.8M non-cash impairments)"],
          ["Contracted 2026 revenue", "~$4B; 5-yr $9.7B Microsoft deal"],
          ["Power pipeline", "5GW+; NVIDIA Exemplar Cloud status"],
          ["JPMorgan", "Overweight, $65 target"],
          ["Rothschild Redburn", "Neutral, $40 target — AI story priced in"],
          ["2026 capacity", "Described as largely sold out"]
        ],
        catalysts: [
          "$9.7B Microsoft contract — hyperscaler validation doesn't get bigger",
          "2026 capacity largely sold out; late-stage talks for 2027-28",
          "JPMorgan $65 target implies ~45%+ upside",
          "AI Cloud customer base broadening (Cohere, Perplexity, Figure AI...)"
        ],
        risks: [
          "Losing $700M+/year with massive capex ahead — dilution risk is real",
          "Neocloud GPU pricing pressure could compress returns on the buildout",
          "Trades below its 200-day moving average; sentiment-driven, high beta",
          "One Neutral initiation ($40) argues the AI transformation is already priced"
        ]
      },
      take: "The Microsoft contract is the real deal — $9.7B doesn't happen by accident. But you're buying a company losing $700M a year that must spend billions more to deliver it. Bull case: contracted cash flows. Bear case: dilution and GPU pricing. Hold, don't chase — it sits below its 200-day for a reason."
    },
    {
      id: "tssi", symbol: "TSSI", stooq: "tssi.us", kind: "stock", account: "100x",
      name: "TSS, Inc.",
      qty: 267.647698, price: 9.881684, avgCost: 5.557754,
      tagline: "The only profitable name in the 100x account — AI data-center plumber.",
      fundamentals: {
        business: "TSS integrates AI and high-performance-computing infrastructure for data centers: rack integration, systems engineering, facilities management. It's deliberately shifting from low-margin procurement to higher-margin systems integration (now 39% of revenue vs 22% a year ago).",
        stats: [
          ["Price (account value basis)", "$9.88"],
          ["Q2 2026 revenue", "$35.1M (-20% YoY, intentional mix shift)"],
          ["Systems integration", "+46% YoY to $13.9M"],
          ["Adj. EBITDA", "+12% to $4.5M; net income $1.4M (profitable)"],
          ["2026 adj. EBITDA guide", "Upper end of $20-22M"],
          ["Balance sheet", "$67.7M cash vs $16.1M debt"],
          ["Consensus", "Moderate Buy, $16.17 target (+64%)"],
          ["Market cap", "~$252M; 52wk $6.87-$21.77"]
        ],
        catalysts: [
          "$17M NVIDIA Vera Rubin readiness investment completing — Q4 recurring revenue driver",
          "Procurement guided to rebound toward $30-40M/quarter in Q3",
          "$16.17 consensus target = +64% from current levels",
          "Only profitable, cash-rich name in the account — rerate candidate"
        ],
        risks: [
          "Tiny $252M market cap — illiquid and volatile; down ~47% over the past year",
          "Top-line revenue still shrinking — the mix shift has to keep working",
          "Customer concentration in the AI capex cycle; a buildout pause hits hard"
        ]
      },
      take: "The odd one out — actually profitable, $68M cash, almost no debt. The market doesn't care because headline revenue is shrinking through the pivot. If Vera Rubin integration revenue lands in Q4 as guided, the rerate could be sharp. Best risk/reward of the five, in my view."
    },
    {
      id: "btdr", symbol: "BTDR", stooq: "btdr.us", kind: "stock", account: "100x",
      name: "Bitdeer Technologies Group",
      qty: 417.442041, price: 11.580003, avgCost: 7.536160,
      tagline: "Bitcoin miner becoming an AI landlord — contracts are converting.",
      fundamentals: {
        business: "Bitdeer runs bitcoin mining (84 EH/s under management, 1,310 BTC mined in August) and is converting its powered land into AI data centers: 206.5 MW of secured AI-cloud capacity, ~$86M ARR, a $4.7B 16-year Norway lease, and a fully-committed Malaysia site expected to bring $800M+ revenue.",
        stats: [
          ["Price (account value basis)", "$11.58"],
          ["Q2 2026 revenue", "$228.8M (vs $155.6M prior year)"],
          ["Q2 gross profit", "-$8.5M (negative margin — the red flag)"],
          ["AI cloud secured", "206.5 MW; ~$86M ARR"],
          ["Signed AI contracts", "$4.7B Norway lease; $800M+ Malaysia"],
          ["AI pipeline", "$7B — management estimate, NOT backlog"],
          ["52-week range", "$6.92-$27.80; reclaimed 200-day MA in Sept"]
        ],
        catalysts: [
          "Signed, contracted AI revenue diversifying away from bitcoin",
          "Customer prepayments funding GPU buildout — less dilution than peers",
          "Stock reclaimed its 200-day MA on AI news, not crypto news",
          "Simply Wall St flagged ~43% undervaluation on the AI deal flow"
        ],
        risks: [
          "Negative gross margin last quarter — the core operation is burning cash",
          "The $7B 'pipeline' has no customer offtake yet — it's hope, not backlog",
          "Still ~58% below the 52-week high; bitcoin price remains a swing factor",
          "History of earnings misses (Q1: -$0.68 vs -$0.37 expected)"
        ]
      },
      take: "Two companies in one: a bitcoin miner with negative gross margins, and an AI infrastructure story with real signed contracts. Your +26% says the market is starting to price the second one. Let the contracts convert to revenue before adding a dollar."
    },
    {
      id: "rcat", symbol: "RCAT", stooq: "rcat.us", kind: "stock", account: "100x",
      name: "Red Cat Holdings, Inc.",
      qty: 441.703427, price: 6.699993, avgCost: 2.296066,
      tagline: "Military drones — revenue up 527%, losses still enormous.",
      fundamentals: {
        business: "Red Cat builds small military drones (Teal 2, AI-enabled Black Widow) for the U.S. Army's Short-Range Reconnaissance program, a European NATO ally, and Ukraine-bound Hellcat systems — plus Blue Ops unmanned surface vessels. It's riding the Pentagon's 'buy American' drone push.",
        stats: [
          ["Price (account value basis)", "$6.70"],
          ["Q2 2026 revenue", "$20.19M (+527% YoY)"],
          ["Q2 net loss", "-$35.26M (operating margin -187%)"],
          ["2026 revenue target", "$150-180M (reaffirmed)"],
          ["Analyst targets", "$15-20 (Evercore: Outperform)"],
          ["Policy tailwinds", "FCC foreign-drone restrictions; drone tariff cuts"],
          ["Off 52-week high", "~56% ($18.78 high); ~35x trailing revenue"]
        ],
        catalysts: [
          "$150-180M 2026 target = ~4x 2025 revenue if hit",
          "DoD tailwinds: $1.5T military budget, FCC ban on foreign drones",
          "Analyst targets $15-20 imply 2-3x from current levels",
          "Contract wins (Army SRR, NATO ally) de-risk the story quarter by quarter"
        ],
        risks: [
          "Loses $35M a quarter on $20M of revenue — the burn is extreme",
          "CEO sold 150k shares (~$1.57M); a director sold 65k — while pitching growth",
          "~35x trailing revenue leaves zero room for a missed quarter",
          "Contract timing is lumpy — one delayed Army order reprices the stock fast"
        ]
      },
      take: "The highest-octane name here: +40% open P&L on your $2.30 cost basis, revenue up 527%, and a $150-180M target. But it incinerates $35M a quarter and the CEO is selling. This is a story stock — it works if DoD contracts land on schedule. Protect that cost basis with a plan, not hope."
    },
    {
      id: "spy", symbol: "SPY", stooq: "spy.us", kind: "etf", account: "individual",
      name: "SPDR S&P 500 ETF Trust",
      qty: 5.631493, price: 772.04, avgCost: 660.76,
      tagline: "The whole U.S. large-cap market in one ticker — the portfolio core.",
      fundamentals: {
        business: "SPY tracks the S&P 500: the 500 largest U.S. listed companies, cap-weighted. One share buys ~$772 of instant diversification across tech (~1/3 of the index), healthcare, financials, and every other sector.",
        stats: [
          ["Index level (9/25 close)", "7,743.41"],
          ["2026 record close", "7,798.99 (Aug 13)"],
          ["YTD gain", "+13.1%"],
          ["Forward P/E", "19.1x (5-yr avg: 19.8x)"],
          ["Expense ratio", "0.0945%"],
          ["Dividend yield", "~1.2%"]
        ],
        catalysts: [
          "AI capex cycle still driving S&P earnings growth into 2027",
          "Seasonally strongest quarter ahead (November averages +2.6%)",
          "FactSet: index P/E below its 5-year average despite record prices"
        ],
        risks: [
          "10-year Treasury at 5.2% — valuation headwind for equities",
          "Brent crude near $100 on Middle East tensions",
          "Narrow breadth: on Sept 22, 30 S&P stocks hit new lows vs 7 new highs on a +1.49% index day — a pattern seen only in 1929 and 1999"
        ]
      },
      take: "Hold. This is 87% of invested capital and it's doing exactly what a core should do: +16.8% with zero effort. Don't get cute with the foundation."
    },
    {
      id: "googl", symbol: "GOOGL", stooq: "googl.us", kind: "stock", account: "individual",
      name: "Alphabet Inc. (Class A)",
      qty: 1.062633, price: 344.01, avgCost: 95.34,
      tagline: "Google, YouTube, Cloud — the cheapest megacap in the portfolio.",
      fundamentals: {
        business: "Alphabet's money comes from Google Search and YouTube ads, with Google Cloud the growth engine and 'Other Bets' (Waymo, Verily) the lottery tickets. ~$4.2T market cap.",
        stats: [
          ["Market cap", "$4.2T"],
          ["P/E (trailing)", "~17x (S&P 500: ~25x)"],
          ["PEG ratio", "1.03"],
          ["Net margin", "54.8%"],
          ["ROE", "51.3%"],
          ["Dividend", "$0.22/qtr (~0.3% yield)"],
          ["52-week range", "$235.84 – $408.61"],
          ["Analyst consensus", "Buy, avg target $422 (+23%)"]
        ],
        catalysts: [
          "Q2 2026: EPS $9.11 vs $2.89 expected; revenue $119.8B — beat on both",
          "Gemini AI monetization across Search, Cloud, and Workspace",
          "Trades at 17x earnings vs 25x for the S&P — cheapest of the megacaps"
        ],
        risks: [
          "Q2 EPS was flattered by a one-time SpaceX IPO investment gain — core EPS lower",
          "Gemini escaped a safety sandbox in a test; ex-safety-chief warnings on risks to kids",
          "Appealing a $425M privacy verdict; ad revenue is cyclical"
        ]
      },
      take: "Hold. Up 261% on a $366 stub — this is a winner you let run. At 17x earnings with a $422 average analyst target, it's the best value of the big-tech names here."
    },
    {
      id: "aapl", symbol: "AAPL", stooq: "aapl.us", kind: "stock", account: "individual",
      name: "Apple Inc.",
      qty: 0.394482, price: 341.46, avgCost: 141.25,
      tagline: "iPhone 17 supercycle + first $5T company — priced for perfection.",
      fundamentals: {
        business: "Apple sells iPhones (~half of revenue), Mac/iPad/Wearables, and the high-margin Services segment (App Store, AppleCare, subscriptions) marching toward $100B/year. 2.5B active devices = unmatched distribution.",
        stats: [
          ["Market cap", "~$5.0T (first ever)"],
          ["All-time high", "$344.94 (Sept 2026)"],
          ["P/E (trailing)", "39.1x"],
          ["Forward P/E", "37.1x"],
          ["Revenue (TTM)", "$466.8B (+14.2% YoY)"],
          ["Net margin", "27.6%"],
          ["Dividend", "$0.27/qtr (~0.3% yield)"],
          ["Analyst avg target", "$337.61 (below current price)"]
        ],
        catalysts: [
          "iPhone 17 supercycle: iPhone revenue +22% last quarter",
          "Foldable 'iPhone Duo' launches October 2026; analysts see $528B revenue in 2027",
          "Net income +20% YoY through first nine months of FY2026"
        ],
        risks: [
          "39x trailing earnings is a full price — the average analyst target ($337.61) sits BELOW the stock",
          "Q3 EPS got a $0.11/share one-time tariff reimbursement; core growth was ~22%, not 29%",
          "China demand and tariff policy remain swing factors"
        ]
      },
      take: "Hold, but watch. Up 142% and sitting at all-time highs on 39x earnings with analysts' average target below the price — the easy money here is made. Let it ride, don't add up here."
    },
    {
      id: "grab", symbol: "GRAB", stooq: "grab.us", kind: "stock", account: "individual",
      name: "Grab Holdings Ltd.",
      qty: 7.827487, price: 3.15, avgCost: 6.39,
      tagline: "Southeast Asia's superapp — finally profitable, stock doesn't care yet.",
      fundamentals: {
        business: "Grab is the Uber + DoorDash + digital bank of Southeast Asia: ride-hailing, food/grocery delivery, and fintech across 8 countries. 53.9M monthly transacting users, $6.46B quarterly on-demand GMV.",
        stats: [
          ["Market cap", "~$13.1B at $3.15"],
          ["Q2 2026 revenue", "$997M (+22% YoY)"],
          ["Adj. EBITDA", "$168M (+54%), 16.9% margin"],
          ["Net income", "Positive since 2025 ($268M FY2025)"],
          ["P/E (trailing)", "~25x"],
          ["Buybacks", "$1.75B authorized; $400M accelerated repurchase Aug 2026"],
          ["Next earnings", "Nov 3, 2026"]
        ],
        catalysts: [
          "Profitability inflection is real: first operating profit, margins expanding every quarter",
          "Fintech guided to breakeven in H2 2026 — removes the last loss-making segment",
          "$900M of buybacks to execute over the next 12 months",
          "Simply Wall St DCF estimate: $8.33 vs $3.72 (Aug 2026)"
        ],
        risks: [
          "Down ~7% since the Q2 beat — market still doesn't trust the story",
          "Competition from Sea Ltd / Gojek; take-rate pressure on rides",
          "Financial services still losing money ($15M EBITDA loss in Q2)",
          "Emerging-market regulatory and currency risk"
        ]
      },
      take: "Hold as the speculative stub — but know what you own. The business inflected to real profitability and the stock fell anyway. That's either opportunity or a value trap; the Nov 3 earnings report is the next catalyst that decides."
    },
    {
      id: "grabcall", symbol: "GRAB 1/21/28 $7 Call", stooq: null, kind: "option", account: "individual",
      name: "GRAB Call — $7 strike, expires Jan 21, 2028",
      qty: 1, price: 0.25, avgCost: 2.00, contractSize: 100,
      strike: 7.00, expiryISO: "2028-01-21", refPrice: 3.15,
      tagline: "The leveraged stub — down 87.5% with 16 months left.",
      fundamentals: {
        business: "One contract controls 100 GRAB shares at a $7 strike until Jan 21, 2028. It only has value at expiry if GRAB is above $7 — and only profits above the $9.00 breakeven ($7 strike + $2.00 premium paid). Right now it's 100% time value: $0 intrinsic, $0.25 extrinsic.",
        stats: [
          ["Premium paid", "$2.00 ($200 total)"],
          ["Current value", "$0.25 ($25 total)"],
          ["Strike", "$7.00"],
          ["Breakeven at expiry", "$9.00 (+186% from $3.15)"],
          ["Intrinsic value", "$0.00"],
          ["Time value", "$0.25 (all of it)"]
        ],
        catalysts: [
          "Any sharp GRAB rally reprices this fast — options are convex",
          "16 months is still real time for a turnaround story to play out",
          "Implied: market prices low odds, so a surprise cuts both ways"
        ],
        risks: [
          "Down 87.5% — the market is saying the $9 breakeven is unlikely",
          "Theta decay accelerates in the final 6–9 months",
          "If GRAB is below $7 at expiry, this goes to exactly $0"
        ]
      },
      take: "Be honest with yourself: would you pay $0.25 for this today? If yes, hold it as a lottery ticket and forget it exists until late 2027. If no, the sunk $175 is gone either way — don't let it decide for you."
    },
    {
      id: "eth", symbol: "ETH", stooq: "eth.usd", kind: "crypto", account: "individual",
      name: "Ethereum",
      qty: 0.024099, price: 2689.30, avgCost: 4115.52,
      tagline: "The DeFi settlement layer — institutions buying, rates fighting it.",
      fundamentals: {
        business: "Ethereum is the programmable blockchain: DeFi, stablecoins, and tokenized assets settle here. 35.6% of all ETH is staked (earning ~2.6%), and U.S. spot ETFs now hold ~$16.7B.",
        stats: [
          ["Price", "$2,689"],
          ["Market cap", "~$335B"],
          ["2026 range", "$1,506 – $3,403"],
          ["Spot ETF cumulative inflows", "$13.85B (5-day streak: $746.5M)"],
          ["Staked supply", "35.6% (up from 29.8% a year ago)"],
          ["Staking yield", "~2.6% vs 5.2% 10-yr Treasury"],
          ["Resistance", "$2,705 – $2,800"]
        ],
        catalysts: [
          "ETF inflows running 5 straight sessions; institutions accumulating via regulated products",
          "Glamsterdam protocol upgrade approaching testnet",
          "Exchange balances at multi-year lows — thin liquid supply magnifies upside"
        ],
        risks: [
          "Staking yields 2.6% vs 5.2% on Treasuries — the income case for institutions is broken until rates fall",
          "Clarity Act failed in the Senate (49–50) — U.S. regulatory overhang persists",
          "Layer-2s capturing activity that used to pay ETH fees"
        ]
      },
      take: "Hold / watch. Down 35% but the institutional bid (ETF streak, staking lockup) is the strongest in crypto. This is a rates trade now: if the Fed pivots dovish, ETH rips; until then it grinds."
    },
    {
      id: "sol", symbol: "SOL", stooq: "sol.usd", kind: "crypto", account: "individual",
      name: "Solana",
      qty: 0.48502, price: 120.50, avgCost: 204.55,
      tagline: "The high-speed chain — ETF bid strong, but usage fees collapsed 97%.",
      fundamentals: {
        business: "Solana is the high-throughput blockchain: sub-second settlement, tiny fees, home to memecoin trading, payments, and now $465M in tokenized equities — more than any other chain.",
        stats: [
          ["Price", "$120.50"],
          ["Market cap", "~$69B"],
          ["Jan 2025 peak", "$295 (needs +152% to reclaim)"],
          ["Spot ETF cumulative inflows", "$1.6B (12 straight weeks)"],
          ["ETF net assets", "$1.96B"],
          ["Daily network fees", "~$1M (down 97% from $33M peak)"],
          ["Support / resistance", "$108–110 / $118–125"]
        ],
        catalysts: [
          "Alpenglow network upgrade lands ~Sept 28 — binary volatility catalyst",
          "12 straight weeks of ETF inflows; staking yield inside the ETF wrapper",
          "Up 21% this week — strongest momentum in crypto right now"
        ],
        risks: [
          "Network fees down 97% from peak — usage isn't validating the price",
          "Still 59% below the Jan 2025 high despite the ETF bid",
          "High-beta: falls harder than ETH/BTC in every drawdown"
        ]
      },
      take: "Hold / watch. Best near-term setup of the two cryptos (ETF streak + upgrade + momentum), but you're down 41% and the fee collapse is a real fundamental red flag. Don't add until usage recovers."
    }
  ];

  var BUYING_POWER = 712.26;
  var ACCOUNT_TOTAL = 5834.91;
  var X100_TOTAL = 16360.99;

  // ---- 100x bagger thesis: the real "100x Bagger" account (5 speculative names) ----
  var THESIS100X = {
    account: "100x Bagger",
    total: 16360.99,
    openPnl: 5570.65,
    mustGoRight: [
      "AI data-center demand stays red-hot through 2027-28 — IREN, BTDR, and TSSI all ride this wave",
      "Defense drone budgets convert to actual Red Cat orders on schedule ($150-180M target)",
      "Lidar crosses from pilot projects to scaled deployments — Ouster's software attach is the margin story",
      "No dilutive equity raises at bad prices — every one of these is capital-hungry",
      "Profitability arrives before patience runs out — only TSSI makes money today",
      "Bitcoin stays elevated — it still drives BTDR's mining leg and IREN's residual exposure"
    ],
    verdict: "This account is up 25% and every name has a real story: a $9.7B Microsoft contract, Army drone programs, a profitable AI integrator. But 100x from here means OUST at $4,333 and RCAT at $670 — prices implying $50B+ companies. Single names have done it in true manias; almost nobody holds through the multiple 50% drawdowns it takes to get there. Treat these as five lottery tickets with improving fundamentals, not a retirement plan — and decide now what 'enough' looks like, because hope is not an exit strategy."
  };

  return {
    AS_OF_LABEL: AS_OF_LABEL,
    FUND_LABEL: FUND_LABEL,
    POSITIONS: POSITIONS,
    BUYING_POWER: BUYING_POWER,
    ACCOUNT_TOTAL: ACCOUNT_TOTAL,
    X100_TOTAL: X100_TOTAL,
    THESIS100X: THESIS100X
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TC_DATA;
