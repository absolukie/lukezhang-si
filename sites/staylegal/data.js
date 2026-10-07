/* StayLegal jurisdiction dataset — researched Oct 7, 2026 from city ordinances
   and official guides. Verdicts take the perspective of a NON-OWNER-OCCUPANT
   investor buying a whole home to Airbnb, since that is the primary user.
   verdict: "legal" | "permit" | "banned" */
"use strict";

const STAYLEGAL_DATA = {
  version: "2026-10-07",
  lastChecked: "October 2026",
  cities: [
    {
      id: "los-angeles-ca",
      city: "Los Angeles",
      state: "CA",
      keywords: ["los angeles", "hollywood", "venice", "dtla", "downtown la", "silver lake", "echo park",
        "900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916"],
      verdict: "permit",
      headline: "Legal with a city permit — primary residence only",
      summary: "LA allows home-sharing only in your primary residence (where you live 6+ months a year), capped at 120 nights per year. A dedicated investment property you do not live in is not eligible.",
      permit: { name: "Home-Sharing Registration", issuer: "LA Dept. of City Planning", cost: "$89 / year", renewal: "Annual — renew 30+ days before expiry", url: "https://planning.lacity.gov" },
      limits: [
        { label: "Annual night cap", value: "120 nights" },
        { label: "Primary residence", value: "Required (6+ months/yr)" },
        { label: "Whole-home unhosted stays", value: "Allowed within the cap" },
        { label: "Rent-stabilized / newer ADUs", value: "Ineligible" }
      ],
      taxes: [
        { label: "Transient occupancy tax", value: "14% — platforms collect and remit" }
      ],
      steps: [
        { title: "Prove primary residency", detail: "Government ID plus utility bills, deed, or lease showing you live there." },
        { title: "Register online", detail: "File through the Home-Sharing portal at planning.lacity.gov and pay $89." },
        { title: "Post your registration number", detail: "It must appear on every listing, even while approval is pending." },
        { title: "Keep records 3 years", detail: "The city can audit your hosted nights against the 120-night cap." }
      ],
      changes: [
        { title: "A different city nearby", detail: "Santa Monica, West Hollywood, and Beverly Hills each have their own — often stricter — rules. The address is the whole verdict." },
        { title: "Extended Home-Sharing", detail: "After 6 months registered (or 60 hosted nights) you can apply to exceed 120 nights: $850/yr administrative clearance." },
        { title: "Your HOA or lease", detail: "An HOA or lease can ban short-term rentals even where the city allows them." }
      ],
      sources: [{ label: "LA Home-Sharing rules guide", url: "https://www.keycafe.com/s/blog/understanding-short-term-rental-regulations-in-los-angeles" }],
      hosted: {
        verdict: "permit",
        headline: "Hosted stays use the same permit",
        summary: "Renting a spare room while you live there follows the same home-sharing registration — the 120-night annual cap counts all hosted nights."
      }
    },
    {
      id: "new-york-ny",
      city: "New York",
      state: "NY",
      keywords: ["new york", "manhattan", "brooklyn", "queens", "bronx", "staten island", "100", "101", "102", "103", "104", "111", "112", "113", "114"],
      verdict: "banned",
      headline: "Whole-home rentals under 30 days effectively banned",
      summary: "Under Local Law 18, short stays are only legal if the host lives in the unit during the stay, with max 2 guests. Renting out an entire apartment while you are away is prohibited, and platforms must block unregistered listings.",
      permit: { name: "Short-Term Rental Registration", issuer: "Mayor's Office of Special Enforcement", cost: "$145 application (non-refundable)", renewal: "Up to 4 years", url: "https://www.nyc.gov" },
      limits: [
        { label: "Whole-home stays under 30 days", value: "Prohibited" },
        { label: "Hosted stays", value: "Allowed with registration, host present" },
        { label: "Max paying guests", value: "2" },
        { label: "Building opt-out list", value: "Owners can block registration entirely" }
      ],
      taxes: [
        { label: "Combined occupancy taxes", value: "~14.75% + $1.50–$2.00/night" }
      ],
      steps: [
        { title: "Check the prohibited-building list", detail: "If your building opted out, registration is blocked outright." },
        { title: "Confirm lease and board rules", detail: "Registration does not override your lease, condo, or co-op rules." },
        { title: "Apply to the Office of Special Enforcement", detail: "Certify primary residence and that you will be present for every stay." },
        { title: "List only after approval", detail: "Display your registration number; platforms must delist unregistered units." }
      ],
      changes: [
        { title: "Renting a spare room", detail: "Hosted stays (you present, max 2 guests) flip this from banned to registrable." },
        { title: "30+ day stays", detail: "Medium-term rentals fall outside Local Law 18 entirely — the route most operators use." },
        { title: "1–2 family homes", detail: "Different treatment under state Multiple Dwelling Law; still check local rules." }
      ],
      sources: [{ label: "NYC STR rules guide (Local Law 18)", url: "https://www.keycafe.com/s/blog/understanding-new-york-citys-short-term-rental-regulations" }],
      hosted: {
        verdict: "permit",
        headline: "Hosted stays are registrable",
        summary: "If you live in the unit and stay present for the entire visit (max 2 guests), you can register under Local Law 18. This is the only legal short-stay path in NYC."
      }
    },
    {
      id: "austin-tx",
      city: "Austin",
      state: "TX",
      keywords: ["austin", "787", "786"],
      verdict: "permit",
      headline: "Legal with a city license — no owner-occupancy required",
      summary: "Austin licenses short-term rentals by type with no primary-residence requirement. The catches are spacing rules (1,000 ft between STRs), density caps, and licenses that do not transfer when the property sells.",
      permit: { name: "STR Operating License", issuer: "City of Austin Development Services", cost: "~$737 new (2-year term)", renewal: "Every 2 years (~$385)", url: "https://www.austintexas.gov" },
      limits: [
        { label: "Primary residence", value: "Not required" },
        { label: "Spacing", value: "1,000 ft between STRs" },
        { label: "Density", value: "Max 2 per lot; 10% of apartment complexes" },
        { label: "Transfers on sale", value: "No — new owner must re-apply" }
      ],
      taxes: [
        { label: "Hotel occupancy tax", value: "15% combined (6% state + 9% city)" }
      ],
      steps: [
        { title: "Verify spacing eligibility", detail: "Confirm no other licensed STR within 1,000 ft and the lot is under its cap." },
        { title: "Apply in the city portal", detail: "Designate a local agent reachable within 2 hours; pay the fee." },
        { title: "Display the license number", detail: "Required in every ad — platforms must show it and remove unlicensed listings." }
      ],
      changes: [
        { title: "Buying an existing Airbnb", detail: "The license dies on sale. Price the property as if you are starting from zero." },
        { title: "Type 2 (non-owner-occupied)", detail: "Investor units face the same spacing rules; a 2026 moratorium briefly froze new Type 2 applications." },
        { title: "Your HOA", detail: "Deed restrictions can still ban STRs where the city allows them." }
      ],
      sources: [{ label: "Austin STR rules (2025 overhaul)", url: "https://www.lodgify.com/blog/short-term-rental-rules-texas/" }],
      hosted: {
        verdict: "permit",
        headline: "Same license, same rules",
        summary: "Hosted stays need the same STR Operating License. Spacing (1,000 ft) and density caps still apply to the address."
      }
    },
    {
      id: "denver-co",
      city: "Denver",
      state: "CO",
      keywords: ["denver", "802", "800", "801"],
      verdict: "permit",
      headline: "Legal with a license — primary residence only",
      summary: "Denver licenses short-term rentals only in the host's primary residence, with no annual night cap. A separate investment property you do not live in cannot be licensed.",
      permit: { name: "Short-Term Rental License", issuer: "Denver Dept. of Licensing", cost: "$150 first year, then $100/yr", renewal: "Annual", url: "https://www.denvergov.org" },
      limits: [
        { label: "Primary residence", value: "Required (city verifies)" },
        { label: "Annual night cap", value: "None" },
        { label: "Liability insurance", value: "$1M required" },
        { label: "HOA notification", value: "Required before applying" }
      ],
      taxes: [
        { label: "Lodger's tax", value: "10.75% (host files own return)" },
        { label: "State sales tax", value: "2.9% if platform does not collect" }
      ],
      steps: [
        { title: "Confirm primary residence", detail: "The city checks voter, vehicle, and tax records — plus notify your HOA first." },
        { title: "Set up safety + insurance", detail: "$1M liability coverage, smoke/CO detectors, fire extinguisher, local contact." },
        { title: "Apply online", detail: "Denver Permitting and Licensing Center; two proofs of primary residence required." },
        { title: "Get your Lodger's Tax ID", detail: "Display the license number in all ads; file lodger's tax returns." }
      ],
      changes: [
        { title: "An investment property", detail: "Non-primary residences cannot be licensed — this is the core check for buyers." },
        { title: "Just outside Denver", detail: "Jefferson and Arapahoe counties have their own, sometimes looser, rules." }
      ],
      sources: [{ label: "Denver STR guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/denver-colorado-guide" }],
      hosted: {
        verdict: "permit",
        headline: "This is Denver's only path",
        summary: "Denver only licenses primary residences, so hosting from the home you live in is the standard case — same $150 first-year license."
      }
    },
    {
      id: "miami-fl",
      city: "Miami",
      state: "FL",
      keywords: ["miami", "brickell", "wynwood", "331", "332"],
      verdict: "permit",
      headline: "Legal only where zoning allows lodging — check the parcel",
      summary: "Miami does not ban STRs outright (state preemption), but zoning decides everything: single-family homes in T3/T4-R zones are ineligible, and condos need association certification. Expect three layers of licensing: state, city, and county.",
      permit: { name: "FL DBPR License + City Certificate of Use + Business Tax Receipt", issuer: "State DBPR, City of Miami, Miami-Dade County", cost: "~$230 state + city/county fees (annual)", renewal: "Annual", url: "https://www.miami.gov" },
      limits: [
        { label: "Zoning", value: "Lodging use must be allowed for the parcel" },
        { label: "Single-family in T3/T4-R", value: "Ineligible" },
        { label: "Condo buildings", value: "Association must certify; >25% transient triggers R-1 code" },
        { label: "Responsible party", value: "24/7 contact required" }
      ],
      taxes: [
        { label: "State + county tourist taxes", value: "6% state + Miami-Dade tourist taxes (confirm exact rate with RER)" }
      ],
      steps: [
        { title: "Check Miami 21 zoning", detail: "Confirm the parcel's transect zone allows transient lodging use." },
        { title: "Get association approval", detail: "For condos, the association must certify the building — no substitute." },
        { title: "License with the state", detail: "FL DBPR vacation rental license; register with FL Dept. of Revenue and Miami-Dade RER." },
        { title: "License with the city", detail: "Certificate of Use from Planning & Zoning, then the City Business Tax Receipt." }
      ],
      changes: [
        { title: "Miami Beach", detail: "Separate city, far more restrictive — do not use Miami rules there." },
        { title: "Condo declaration amendments", detail: "An HOA can ban STRs even where zoning allows them." },
        { title: "Enforcement is aggressive", detail: "In 2026 the city ordered a 643-unit Brickell building to stop vacation rentals." }
      ],
      sources: [{ label: "Miami STR regulation guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/miami-florida-guide" }],
      hosted: {
        verdict: "permit",
        headline: "Zoning still decides",
        summary: "Hosting from your own home still needs the DBPR license, Certificate of Use, and county receipts — only where the parcel's zoning allows lodging use."
      }
    },
    {
      id: "palm-springs-ca",
      city: "Palm Springs",
      state: "CA",
      keywords: ["palm springs", "9226"],
      verdict: "permit",
      headline: "Investor-friendly permit — with contract caps",
      summary: "Palm Springs welcomes investor STRs with no owner-occupancy requirement, but caps you at 26 rental contracts per year and limits new certificates to 20% of homes per neighborhood.",
      permit: { name: "Vacation Rental Registration Certificate", issuer: "City of Palm Springs", cost: "$1,046 / year", renewal: "Annual", url: "https://www.palmspringsca.gov" },
      limits: [
        { label: "Rental contracts", value: "Max 26 per year" },
        { label: "Neighborhood cap", value: "20% of homes per neighborhood" },
        { label: "One certificate per owner", value: "Business entities cannot hold one" },
        { label: "Property type", value: "Single-family homes only" }
      ],
      taxes: [
        { label: "Transient occupancy tax", value: "11.5% + 1% tourism assessment" }
      ],
      steps: [
        { title: "Request an activation code", detail: "Contact the Dept. of Special Program Compliance to start." },
        { title: "Apply online", detail: "Owner signature, TOT registration, $500k+ STR liability insurance, safety inspection, local contact, city knowledge test." },
        { title: "Wait for written approval", detail: "No advertising until the written approval is issued." }
      ],
      changes: [
        { title: "Your HOA", detail: "HOAs and CC&Rs can ban STRs entirely — you must attest none apply." },
        { title: "Homeshare option", detail: "Renting part of your own home has a cheaper $261 certificate with different rules." }
      ],
      sources: [{ label: "Palm Springs STR rules", url: "https://avantstay.com/str-management/palm-springs/rules" }],
      hosted: {
        verdict: "permit",
        headline: "Cheaper homeshare certificate",
        summary: "Renting part of the home you live in qualifies for the $261 homeshare certificate instead of the $1,046 full vacation-rental certificate.",
      permit: { name: "Homeshare Certificate", issuer: "City of Palm Springs", cost: "$261 / year", renewal: "Annual", url: "https://www.palmspringsca.gov" }
      }
    },
    {
      id: "scottsdale-az",
      city: "Scottsdale",
      state: "AZ",
      keywords: ["scottsdale", "8525", "8526"],
      verdict: "permit",
      headline: "Legal with a license — no caps, no residency rule",
      summary: "Arizona law bars cities from banning STRs, so Scottsdale licenses them tightly instead: $250/yr, $500k insurance, neighbor notification — but no night caps and no primary-residence requirement.",
      permit: { name: "Short-Term Rental License", issuer: "City of Scottsdale", cost: "$250 / year per property", renewal: "Annual", url: "https://www.scottsdaleaz.gov" },
      limits: [
        { label: "Primary residence", value: "Not required" },
        { label: "Night caps", value: "None" },
        { label: "Liability insurance", value: "$500,000 minimum" },
        { label: "Commercial events", value: "Banned — weddings/parties risk the license" }
      ],
      taxes: [
        { label: "Combined lodging taxes", value: "~12.95% (city + state + county)" }
      ],
      steps: [
        { title: "Register with the county + state", detail: "Maricopa County Assessor registration and an Arizona TPT tax license first." },
        { title: "Apply on the city portal", detail: "Issued within 7 business days of a complete application; proof of $500k insurance." },
        { title: "Notify the neighbors", detail: "Within 30 days: license number, address, and 24-hour contact to adjacent homes." }
      ],
      changes: [
        { title: "Your HOA", detail: "HOA rules can still prohibit STRs in specific communities." },
        { title: "Hosting events", detail: "Using the property as an event venue flips the legal category and can cost the license for a year." }
      ],
      sources: [{ label: "Scottsdale STR rules", url: "https://www.str-exchange.com/states-and-territories-of-the-united-states/scottsdale-arizona" }],
      hosted: {
        verdict: "permit",
        headline: "Same license",
        summary: "Renting rooms uses the same $250/yr STR license. Neighbor notification and $500k insurance still required."
      }
    },
    {
      id: "nashville-tn",
      city: "Nashville",
      state: "TN",
      keywords: ["nashville", "372", "370", "music city"],
      verdict: "banned",
      headline: "Investor whole-home rentals banned in residential zones",
      summary: "Nashville issues new non-owner-occupied STR permits only in commercial and mixed-use districts. A whole-home Airbnb in a normal residential neighborhood is effectively banned — owner-occupied hosting is the only residential path.",
      permit: { name: "STRP Permit (Short Term Rental Property)", issuer: "Metro Nashville Codes Administration", cost: "$313 / year", renewal: "Annual (365-day term)", url: "https://www.nashville.gov" },
      limits: [
        { label: "Non-owner-occupied in residential zones", value: "No new permits since 2022" },
        { label: "Owner-occupied", value: "Allowed in residential zones" },
        { label: "Max occupancy", value: "12 (2 per bedroom + 4)" },
        { label: "Minimum stay", value: "24 hours; 30-day max" }
      ],
      taxes: [
        { label: "Occupancy + sales tax", value: "6% metro + $2.50/night + 9.25% state" }
      ],
      steps: [
        { title: "Confirm the zoning", detail: "Residential (R/RS/RM) = investor STR not available. Commercial/mixed-use may qualify." },
        { title: "Apply via Metro Codes", detail: "Ownership docs, $1M insurance, 24/7 responsible party within 25 miles." },
        { title: "Display the permit number", detail: "Required on every listing; permits are non-transferable." }
      ],
      changes: [
        { title: "Living there yourself", detail: "Owner-occupied hosting is broadly allowed in residential zones — natural person only, no LLCs." },
        { title: "Downtown commercial zones", detail: "The same property can be legal in a DTC or mixed-use district." },
        { title: "Your HOA", detail: "Condo and HOA rules can ban STRs even where Metro allows them." }
      ],
      sources: [{ label: "Nashville STR permit guide", url: "https://riooapp.com/blog/nashville-short-term-rental-permits" }],
      hosted: {
        verdict: "permit",
        headline: "Owner-occupied is the open path",
        summary: "Hosting from your primary residence is broadly allowed in residential zones — natural person only, no LLCs. Same $313/yr STRP permit."
      }
    },
    {
      id: "san-diego-ca",
      city: "San Diego",
      state: "CA",
      keywords: ["san diego", "mission beach", "921", "920"],
      verdict: "permit",
      headline: "Legal with a tiered license — investor tier is rationed",
      summary: "San Diego's tiered STRO system allows investor whole-home rentals (Tier 3), but licenses are capped at 1% of city housing stock and running out — check live availability before buying.",
      permit: { name: "STRO License (Short-Term Residential Occupancy)", issuer: "City of San Diego", cost: "Tier 3: $1,170 / 2 years", renewal: "Every 2 years", url: "https://www.sandiego.gov" },
      limits: [
        { label: "Tier 3 investor cap", value: "1% of housing stock (~800 left)" },
        { label: "Tier 2 home-share", value: "Host must live there 275+ days/yr" },
        { label: "Tier 1 part-time", value: "Max 20 days/yr, no residency rule" },
        { label: "One STR per owner", value: "Across all tiers" }
      ],
      taxes: [
        { label: "Transient occupancy tax", value: "11.75–13.75% by location" }
      ],
      steps: [
        { title: "Get a TOT certificate", detail: "Prerequisite — no TOT certificate, no license." },
        { title: "Identify your tier and apply", detail: "STRO portal; Tier 3 enters the waitlist once the cap is hit." },
        { title: "Report quarterly", detail: "Tier 3 hosts file quarterly activity reports; 2-night minimum stays." }
      ],
      changes: [
        { title: "Tier 3 availability", detail: "This number moves — verify the live counter with the city before making an offer." },
        { title: "Mission Beach", detail: "Tier 4 is a separate capped pool; applications have been closed." },
        { title: "Renting a room", detail: "Tier 2 home-sharing stays open regardless of the investor cap." }
      ],
      sources: [{ label: "San Diego STR regulation guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/san-diego-california-guide" }],
      hosted: {
        verdict: "permit",
        headline: "Tier 2 home-sharing stays open",
        summary: "Renting rooms while you occupy the home 275+ days a year sidesteps the Tier 3 investor cap entirely.",
      permit: { name: "STRO License — Tier 2 (home sharing)", issuer: "City of San Diego", cost: "$317 / 2 years", renewal: "Every 2 years", url: "https://www.sandiego.gov" }
      }
    },
    {
      id: "new-orleans-la",
      city: "New Orleans",
      state: "LA",
      keywords: ["new orleans", "nola", "french quarter", "garden district", "701"],
      verdict: "banned",
      headline: "Non-owner-occupied residential rentals banned",
      summary: "Residential STR permits require a homestead exemption at the address — a pure investment property cannot get one. The investor route is a commercial-zone permit ($1,000/yr), and the French Quarter and Garden District are fully off-limits.",
      permit: { name: "RSTR / CSTR Owner Permit + Operator Permit", issuer: "City of New Orleans STR Administration", cost: "RSTR $250–500/yr · CSTR $1,000/yr", renewal: "Annual", url: "https://nola.gov" },
      limits: [
        { label: "Residential permits", value: "Homestead exemption required" },
        { label: "French Quarter / Garden District", value: "Banned" },
        { label: "Density", value: "One STR per block face in residential areas" },
        { label: "Commercial STRs", value: "Capped at 25% of units per building" }
      ],
      taxes: [
        { label: "Per-night + percentage", value: "$5/night + 5% parish + 6.75% occupancy + $0.50/night" }
      ],
      steps: [
        { title: "Confirm homestead + zoning", detail: "Homestead exemption at the address and an eligible district for the permit type." },
        { title: "Apply via One Stop", detail: "Floor plan, evacuation plan, noise monitoring, neighbor response plan, licensed operator." },
        { title: "List only after issuance", detail: "Platforms must delist properties without valid permit numbers." }
      ],
      changes: [
        { title: "Commercial zoning", detail: "A commercial-zone property can get a CSTR permit — the investor path." },
        { title: "LLCs now eligible", detail: "A 2025 federal ruling struck the ban on entity-held permits; city forms may lag." },
        { title: "Block density cap", detail: "Even in an eligible zone, the one-per-block-face rule can block you." }
      ],
      sources: [{ label: "City of New Orleans STR taxes & fees", url: "https://nola.gov/str-taxes-and-fees/" }],
      hosted: {
        verdict: "permit",
        headline: "Homesteaded owners can host",
        summary: "With a homestead exemption at the address, RSTR-Partial or RSTR-Small permits cover hosted stays ($250–500/yr)."
      }
    }
  ],
  demoAddresses: [
    { label: "LA condo", address: "1200 S Figueroa St, Los Angeles, CA 90015" },
    { label: "Manhattan apartment", address: "88 Pine St, New York, NY 10005" },
    { label: "Austin house", address: "600 Congress Ave, Austin, TX 78701" },
    { label: "Denver home", address: "1700 Lincoln St, Denver, CO 80203" },
    { label: "Miami condo", address: "1000 Brickell Ave, Miami, FL 33131" },
    { label: "Palm Springs villa", address: "200 S Palm Canyon Dr, Palm Springs, CA 92262" },
    { label: "Scottsdale house", address: "4000 N Scottsdale Rd, Scottsdale, AZ 85251" },
    { label: "Nashville home", address: "500 Broadway, Nashville, TN 37203" },
    { label: "San Diego house", address: "800 W Harbor Dr, San Diego, CA 92101" },
    { label: "New Orleans house", address: "500 Bourbon St, New Orleans, LA 70130" }
  ]
};
