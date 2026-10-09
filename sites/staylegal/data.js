/* StayLegal jurisdiction dataset, researched Oct 7, 2026 from city ordinances
   and official guides. Verdicts take the perspective of a NON-OWNER-OCCUPANT
   investor buying a whole home to Airbnb, since that is the primary user.
   verdict: "legal" | "permit" | "banned" */
"use strict";

const STAYLEGAL_DATA = {
  version: "2026-10-10",
  lastChecked: "October 2026",
  cities: [
    {
      id: "los-angeles-ca",
      nightCap: { value: 120, unit: "nights", period: "per calendar year", note: "Applies to unhosted stays. In the I live there view this cap does not bind you." },
      confidence: "hand",
      researched: "October 2026",
      city: "Los Angeles",
      state: "CA",
      neighbors: [
        { city: "Santa Monica", note: "Each has its own, often stricter, short-term rental rules." },
        { city: "West Hollywood", note: "Each has its own, often stricter, short-term rental rules." },
        { city: "Beverly Hills", note: "Each has its own, often stricter, short-term rental rules." }
      ],
      keywords: ["los angeles", "hollywood", "venice", "dtla", "downtown la", "silver lake", "echo park",
        "900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916"],
      verdict: "permit",
      headline: "Legal with a city permit, primary residence only",
      summary: "LA allows home-sharing only in your primary residence (where you live 6+ months a year), capped at 120 nights per year. A dedicated investment property you do not live in is not eligible.",
      permit: { name: "Home-Sharing Registration", issuer: "LA Dept. of City Planning", cost: "$89 / year", renewal: "Annual, renew 30+ days before expiry", url: "https://planning.lacity.gov" },
      limits: [
        { label: "Annual night cap", value: "120 nights" },
        { label: "Primary residence", value: "Required (6+ months/yr)" },
        { label: "Whole-home unhosted stays", value: "Allowed within the cap" },
        { label: "Rent-stabilized / newer ADUs", value: "Ineligible" }
      ],
      taxes: [
        { label: "Transient occupancy tax", value: "14%, platforms collect and remit" }
      ],
      steps: [
        { id: "prove-primary-residency", title: "Prove primary residency", detail: "Government ID plus utility bills, deed, or lease showing you live there." },
        { id: "register-online", title: "Register online", detail: "File through the Home-Sharing portal at planning.lacity.gov and pay $89." },
        { id: "post-your-registration-number", title: "Post your registration number", detail: "It must appear on every listing, even while approval is pending." },
        { id: "keep-records-3-years", title: "Keep records 3 years", detail: "The city can audit your hosted nights against the 120-night cap." }
      ],
      changes: [
        { title: "A different city nearby", detail: "Santa Monica, West Hollywood, and Beverly Hills each have their own, often stricter, rules. The address is the whole verdict." },
        { title: "Extended Home-Sharing", detail: "After 6 months registered (or 60 hosted nights) you can apply to exceed 120 nights: $850/yr administrative clearance." },
        { title: "Your HOA or lease", detail: "An HOA or lease can ban short-term rentals even where the city allows them." }
      ],
      sources: [{ label: "LA Home-Sharing rules guide", url: "https://www.keycafe.com/s/blog/understanding-short-term-rental-regulations-in-los-angeles" }],
      hosted: {
        verdict: "permit",
        headline: "Hosted stays use the same permit",
        summary: "Renting a spare room while you live there follows the same home-sharing registration, the 120-night annual cap counts all hosted nights."
      }
    },
    {
      id: "new-york-ny",
      confidence: "hand",
      researched: "October 2026",
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
        { id: "check-the-prohibited-building-list", title: "Check the prohibited-building list", detail: "If your building opted out, registration is blocked outright." },
        { id: "confirm-lease-and-board-rules", title: "Confirm lease and board rules", detail: "Registration does not override your lease, condo, or co-op rules." },
        { id: "apply-to-the-office-of-special-enforcement", title: "Apply to the Office of Special Enforcement", detail: "Certify primary residence and that you will be present for every stay." },
        { id: "list-only-after-approval", title: "List only after approval", detail: "Display your registration number; platforms must delist unregistered units." }
      ],
      changes: [
        { title: "Renting a spare room", detail: "Hosted stays (you present, max 2 guests) flip this from banned to registrable." },
        { title: "30+ day stays", detail: "Medium-term rentals fall outside Local Law 18 entirely, the route most operators use." },
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
      confidence: "hand",
      researched: "October 2026",
      city: "Austin",
      state: "TX",
      keywords: ["austin", "787", "786"],
      verdict: "permit",
      headline: "Legal with a city license, no owner-occupancy required",
      summary: "Austin licenses short-term rentals by type with no primary-residence requirement. The catches are spacing rules (1,000 ft between STRs), density caps, and licenses that do not transfer when the property sells.",
      permit: { name: "STR Operating License", issuer: "City of Austin Development Services", cost: "~$737 new (2-year term)", renewal: "Every 2 years (~$385)", url: "https://www.austintexas.gov" },
      limits: [
        { label: "Primary residence", value: "Not required" },
        { label: "Spacing", value: "1,000 ft between STRs" },
        { label: "Density", value: "Max 2 per lot; 10% of apartment complexes" },
        { label: "Transfers on sale", value: "No, new owner must re-apply" }
      ],
      taxes: [
        { label: "Hotel occupancy tax", value: "15% combined (6% state + 9% city)" }
      ],
      steps: [
        { id: "verify-spacing-eligibility", title: "Verify spacing eligibility", detail: "Confirm no other licensed STR within 1,000 ft and the lot is under its cap." },
        { id: "apply-in-the-city-portal", title: "Apply in the city portal", detail: "Designate a local agent reachable within 2 hours; pay the fee." },
        { id: "display-the-license-number", title: "Display the license number", detail: "Required in every ad, platforms must show it and remove unlicensed listings." }
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
      confidence: "hand",
      researched: "October 2026",
      city: "Denver",
      state: "CO",
      keywords: ["denver", "802", "800", "801"],
      verdict: "permit",
      headline: "Legal with a license, primary residence only",
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
        { id: "confirm-primary-residence", title: "Confirm primary residence", detail: "The city checks voter, vehicle, and tax records, plus notify your HOA first." },
        { id: "set-up-safety-insurance", title: "Set up safety + insurance", detail: "$1M liability coverage, smoke/CO detectors, fire extinguisher, local contact." },
        { id: "apply-online", title: "Apply online", detail: "Denver Permitting and Licensing Center; two proofs of primary residence required." },
        { id: "get-your-lodger-s-tax-id", title: "Get your Lodger's Tax ID", detail: "Display the license number in all ads; file lodger's tax returns." }
      ],
      changes: [
        { title: "An investment property", detail: "Non-primary residences cannot be licensed, this is the core check for buyers." },
        { title: "Just outside Denver", detail: "Jefferson and Arapahoe counties have their own, sometimes looser, rules." }
      ],
      sources: [{ label: "Denver STR guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/denver-colorado-guide" }],
      hosted: {
        verdict: "permit",
        headline: "This is Denver's only path",
        summary: "Denver only licenses primary residences, so hosting from the home you live in is the standard case, same $150 first-year license."
      }
    },
    {
      id: "miami-fl",
      confidence: "hand",
      researched: "October 2026",
      city: "Miami",
      state: "FL",
      neighbors: [
        { city: "Miami Beach", note: "It is a separate city that bans most short-term rentals in residential areas." }
      ],
      keywords: ["miami", "brickell", "wynwood", "331", "332"],
      verdict: "permit",
      headline: "Legal only where zoning allows lodging, check the parcel",
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
        { id: "check-miami-21-zoning", title: "Check Miami 21 zoning", detail: "Confirm the parcel's transect zone allows transient lodging use." },
        { id: "get-association-approval", title: "Get association approval", detail: "For condos, the association must certify the building, no substitute." },
        { id: "license-with-the-state", title: "License with the state", detail: "FL DBPR vacation rental license; register with FL Dept. of Revenue and Miami-Dade RER." },
        { id: "license-with-the-city", title: "License with the city", detail: "Certificate of Use from Planning & Zoning, then the City Business Tax Receipt." }
      ],
      changes: [
        { title: "Miami Beach", detail: "Separate city, far more restrictive, do not use Miami rules there." },
        { title: "Condo declaration amendments", detail: "An HOA can ban STRs even where zoning allows them." },
        { title: "Enforcement is aggressive", detail: "In 2026 the city ordered a 643-unit Brickell building to stop vacation rentals." }
      ],
      sources: [{ label: "Miami STR regulation guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/miami-florida-guide" }],
      hosted: {
        verdict: "permit",
        headline: "Zoning still decides",
        summary: "Hosting from your own home still needs the DBPR license, Certificate of Use, and county receipts, only where the parcel's zoning allows lodging use."
      }
    },
    {
      id: "palm-springs-ca",
      nightCap: { value: 26, unit: "rental contracts", period: "per calendar year", note: "Applies to every short-term rental in the city." },
      confidence: "hand",
      researched: "October 2026",
      city: "Palm Springs",
      state: "CA",
      keywords: ["palm springs", "9226"],
      verdict: "permit",
      headline: "Investor-friendly permit, with contract caps",
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
        { id: "request-an-activation-code", title: "Request an activation code", detail: "Contact the Dept. of Special Program Compliance to start." },
        { id: "apply-online", title: "Apply online", detail: "Owner signature, TOT registration, $500k+ STR liability insurance, safety inspection, local contact, city knowledge test." },
        { id: "wait-for-written-approval", title: "Wait for written approval", detail: "No advertising until the written approval is issued." }
      ],
      changes: [
        { title: "Your HOA", detail: "HOAs and CC&Rs can ban STRs entirely, you must attest none apply." },
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
      confidence: "hand",
      researched: "October 2026",
      city: "Scottsdale",
      state: "AZ",
      keywords: ["scottsdale", "8525", "8526"],
      verdict: "permit",
      headline: "Legal with a license, no caps, no residency rule",
      summary: "Arizona law bars cities from banning STRs, so Scottsdale licenses them tightly instead: $250/yr, $500k insurance, neighbor notification, but no night caps and no primary-residence requirement.",
      permit: { name: "Short-Term Rental License", issuer: "City of Scottsdale", cost: "$250 / year per property", renewal: "Annual", url: "https://www.scottsdaleaz.gov" },
      limits: [
        { label: "Primary residence", value: "Not required" },
        { label: "Night caps", value: "None" },
        { label: "Liability insurance", value: "$500,000 minimum" },
        { label: "Commercial events", value: "Banned, weddings/parties risk the license" }
      ],
      taxes: [
        { label: "Combined lodging taxes", value: "~12.95% (city + state + county)" }
      ],
      steps: [
        { id: "register-with-the-county-state", title: "Register with the county + state", detail: "Maricopa County Assessor registration and an Arizona TPT tax license first." },
        { id: "apply-on-the-city-portal", title: "Apply on the city portal", detail: "Issued within 7 business days of a complete application; proof of $500k insurance." },
        { id: "notify-the-neighbors", title: "Notify the neighbors", detail: "Within 30 days: license number, address, and 24-hour contact to adjacent homes." }
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
      confidence: "hand",
      researched: "October 2026",
      city: "Nashville",
      state: "TN",
      keywords: ["nashville", "372", "370", "music city"],
      verdict: "banned",
      headline: "Investor whole-home rentals banned in residential zones",
      summary: "Nashville issues new non-owner-occupied STR permits only in commercial and mixed-use districts. A whole-home Airbnb in a normal residential neighborhood is effectively banned, owner-occupied hosting is the only residential path.",
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
        { id: "confirm-the-zoning", title: "Confirm the zoning", detail: "Residential (R/RS/RM) = investor STR not available. Commercial/mixed-use may qualify." },
        { id: "apply-via-metro-codes", title: "Apply via Metro Codes", detail: "Ownership docs, $1M insurance, 24/7 responsible party within 25 miles." },
        { id: "display-the-permit-number", title: "Display the permit number", detail: "Required on every listing; permits are non-transferable." }
      ],
      changes: [
        { title: "Living there yourself", detail: "Owner-occupied hosting is broadly allowed in residential zones, natural person only, no LLCs." },
        { title: "Downtown commercial zones", detail: "The same property can be legal in a DTC or mixed-use district." },
        { title: "Your HOA", detail: "Condo and HOA rules can ban STRs even where Metro allows them." }
      ],
      sources: [{ label: "Nashville STR permit guide", url: "https://riooapp.com/blog/nashville-short-term-rental-permits" }],
      hosted: {
        verdict: "permit",
        headline: "Owner-occupied is the open path",
        summary: "Hosting from your primary residence is broadly allowed in residential zones, natural person only, no LLCs. Same $313/yr STRP permit."
      }
    },
    {
      id: "san-diego-ca",
      confidence: "hand",
      researched: "October 2026",
      city: "San Diego",
      state: "CA",
      neighbors: [
        { city: "Coronado", note: "Each runs its own program with its own restrictions." },
        { city: "Del Mar", note: "Each runs its own program with its own restrictions." }
      ],
      keywords: ["san diego", "mission beach", "921", "920"],
      verdict: "permit",
      headline: "Legal with a tiered license, investor tier is rationed",
      summary: "San Diego's tiered STRO system allows investor whole-home rentals (Tier 3), but licenses are capped at 1% of city housing stock and running out, check live availability before buying.",
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
        { id: "get-a-tot-certificate", title: "Get a TOT certificate", detail: "Prerequisite, no TOT certificate, no license." },
        { id: "identify-your-tier-and-apply", title: "Identify your tier and apply", detail: "STRO portal; Tier 3 enters the waitlist once the cap is hit." },
        { id: "report-quarterly", title: "Report quarterly", detail: "Tier 3 hosts file quarterly activity reports; 2-night minimum stays." }
      ],
      changes: [
        { title: "Tier 3 availability", detail: "This number moves, verify the live counter with the city before making an offer." },
        { title: "Mission Beach", detail: "Tier 4 is a separate capped pool; applications have been closed." },
        { title: "Renting a room", detail: "Tier 2 home-sharing stays open regardless of the investor cap." }
      ],
      sources: [{ label: "San Diego STR regulation guide", url: "https://www.bnbcalc.com/blog/short-term-rental-regulation/san-diego-california-guide" }],
      hosted: {
        verdict: "permit",
        headline: "Tier 2 home-sharing stays open",
        summary: "Renting rooms while you occupy the home 275+ days a year sidesteps the Tier 3 investor cap entirely.",
      permit: { name: "STRO License, Tier 2 (home sharing)", issuer: "City of San Diego", cost: "$317 / 2 years", renewal: "Every 2 years", url: "https://www.sandiego.gov" }
      }
    },
    {
      id: "new-orleans-la",
      confidence: "hand",
      researched: "October 2026",
      city: "New Orleans",
      state: "LA",
      keywords: ["new orleans", "nola", "french quarter", "garden district", "701"],
      verdict: "banned",
      headline: "Non-owner-occupied residential rentals banned",
      summary: "Residential STR permits require a homestead exemption at the address, a pure investment property cannot get one. The investor route is a commercial-zone permit ($1,000/yr), and the French Quarter and Garden District are fully off-limits.",
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
        { id: "confirm-homestead-zoning", title: "Confirm homestead + zoning", detail: "Homestead exemption at the address and an eligible district for the permit type." },
        { id: "apply-via-one-stop", title: "Apply via One Stop", detail: "Floor plan, evacuation plan, noise monitoring, neighbor response plan, licensed operator." },
        { id: "list-only-after-issuance", title: "List only after issuance", detail: "Platforms must delist properties without valid permit numbers." }
      ],
      changes: [
        { title: "Commercial zoning", detail: "A commercial-zone property can get a CSTR permit, the investor path." },
        { title: "LLCs now eligible", detail: "A 2025 federal ruling struck the ban on entity-held permits; city forms may lag." },
        { title: "Block density cap", detail: "Even in an eligible zone, the one-per-block-face rule can block you." }
      ],
      sources: [{ label: "City of New Orleans STR taxes & fees", url: "https://nola.gov/str-taxes-and-fees/" }],
      hosted: {
        verdict: "permit",
        headline: "Homesteaded owners can host",
        summary: "With a homestead exemption at the address, RSTR-Partial or RSTR-Small permits cover hosted stays ($250–500/yr)."
      }
    },
    {
          "id": "key-west-fl",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Key West",
          "state": "FL",
          "keywords": [
            "key west"
          ],
          "verdict": "banned",
          "headline": "New investor whole-home rentals effectively banned",
          "summary": "Key West froze new transient rental licenses in 2002. Only about 850 transferable licenses exist, and they trade privately at high prices. Without one, the minimum legal rental in a residential home is 28 days. Renting to tourists for less than 28 days without a transient license is a city crime carrying up to 60 days in jail and $5,000 in fines per violation.",
          "permit": {
            "name": "Transient Rental License",
            "issuer": "City of Key West",
            "cost": "Not issued to new applicants, only existing transferable licenses",
            "renewal": "N/A",
            "url": ""
          },
          "limits": [
            {
              "label": "Night cap",
              "value": "Effectively banned without a transferable license"
            },
            {
              "label": "Minimum stay",
              "value": "28 days for homes without a transient license"
            },
            {
              "label": "License supply",
              "value": "Capped since 2002, roughly 850 exist and they are bought and sold"
            },
            {
              "label": "Enforcement",
              "value": "Dedicated code officer, jail time and $5,000 fines per violation"
            }
          ],
          "taxes": [
            {
              "label": "State sales tax",
              "value": "6%"
            },
            {
              "label": "County tourist tax",
              "value": "Set by Monroe County, check the current rate"
            }
          ],
          "steps": [
            {
              "id": "do-not-buy-without-a-license",
              "title": "Do not buy without a license",
              "detail": "A whole-home STR only works if the property already holds one of the ~850 transferable transient licenses."
            },
            {
              "id": "verify-the-license-transfers",
              "title": "Verify the license transfers",
              "detail": "Confirm with the city that the specific property's transient license transfers with the sale before closing."
            },
            {
              "id": "consider-monthly-rentals",
              "title": "Consider monthly rentals",
              "detail": "Without a transient license, the legal floor is a 28-day minimum, which means a furnished monthly model instead."
            }
          ],
          "changes": [
            {
              "title": "Your HOA",
              "detail": "Condo associations add their own rental rules on top of the city freeze."
            },
            {
              "title": "County differs",
              "detail": "Unincorporated Monroe County runs a separate Special Vacation Rental Permit system with its own strict rules."
            }
          ],
          "sources": [
            {
              "label": "Key West The Newspaper, transient license reporting",
              "url": "https://thebluepaper.com/citys-deregulation-of-transient-licenses-will-reduce-residential-housing/"
            },
            {
              "label": "Key West Chamber transient rental license info",
              "url": "https://keywestchamber.org/latest-community-news/category/transient-rental"
            }
          ],
          "hosted": {
            "verdict": "banned",
            "headline": "Hosted stays face the same license wall",
            "summary": "Renting any room for under 28 days needs the same transient license. Without one, even a hosted room rental falls under the 28-day minimum."
          }
        },
    {
          "id": "charleston-sc",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Charleston",
          "state": "SC",
          "keywords": [
            "charleston"
          ],
          "verdict": "banned",
          "headline": "Non-owner-occupant whole-home rentals effectively banned",
          "summary": "Charleston's STR ordinance is owner-occupancy based. A Residential STR host must live at the property at least 183 days a year, hold the 4% owner-occupied property tax rate, and register voting and driver's license there. A non-owner-occupant investor cannot get a Residential STR permit at all. The only non-hosted path is a Commercial STR permit, limited to commercially zoned lots inside the small ST Overlay Zone in Cannonborough-Elliotborough.",
          "permit": {
            "name": "Short-Term Rental Permit",
            "issuer": "City of Charleston",
            "cost": "Not available to non-owner-occupants (zoning review fee ~$345 when eligible)",
            "renewal": "Annual",
            "url": "https://charleston-sc.gov/DocumentCenter/View/18524/Short-Term-Rental-Tri-Fold-Application-Guide?bidId="
          },
          "limits": [
            {
              "label": "Owner occupancy",
              "value": "183 days per year minimum plus 4% tax rate and local voter registration"
            },
            {
              "label": "Commercial exception",
              "value": "Non-hosted STRs only in the ST Overlay Zone on commercially zoned lots"
            },
            {
              "label": "Guest cap",
              "value": "Up to four adults per rental"
            },
            {
              "label": "Parking",
              "value": "Three off-street spaces required for most categories"
            }
          ],
          "taxes": [
            {
              "label": "SC accommodations tax",
              "value": "7% (5% state sales tax plus 2% state accommodations tax)"
            }
          ],
          "steps": [
            {
              "id": "accept-the-residency-rule",
              "title": "Accept the residency rule",
              "detail": "A Residential STR permit requires you to make the property your primary residence for at least 183 days a year."
            },
            {
              "id": "or-target-the-overlay-zone",
              "title": "Or target the overlay zone",
              "detail": "The only investor path is a commercially zoned parcel inside the ST Overlay Zone in Cannonborough-Elliotborough."
            },
            {
              "id": "apply-through-the-cap-portal",
              "title": "Apply through the CAP portal",
              "detail": "File online through the city's Customer Access Portal, submit the floor plan, and pass the fire inspection."
            }
          ],
          "changes": [
            {
              "title": "Your HOA",
              "detail": "Condo and HOA documents can ban rentals regardless of city permits."
            },
            {
              "title": "North Charleston differs",
              "detail": "North Charleston is a separate city with a 60-permits-per-district cap and its own $350 application fee."
            }
          ],
          "sources": [
            {
              "label": "City of Charleston STR application guide (official PDF)",
              "url": "https://charleston-sc.gov/DocumentCenter/View/18524/Short-Term-Rental-Tri-Fold-Application-Guide?bidId="
            },
            {
              "label": "BNBCalc Charleston STR guide 2026",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Charleston-South-Carolina-guide"
            }
          ],
          "hosted": {
            "verdict": "permit",
            "headline": "Hosted STRs are the permitted path, with the owner sleeping on-site",
            "summary": "Charleston's Residential STR permit is built for hosts who live there. The host must sleep overnight at the property whenever it is rented, and the city verifies residency through the 4% tax rate, driver's license, and voter registration."
          }
        },
    {
          "id": "hilton-head-island-sc",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Hilton Head Island",
          "state": "SC",
          "keywords": [
            "hilton head island",
            "sea pines",
            "palmetto dunes"
          ],
          "verdict": "permit",
          "headline": "Legal with a town STR permit at $150 per bedroom",
          "summary": "Hilton Head Island runs one of the clearest STR programs in the Southeast. Every rental needs a Town STR permit on top of a Town business license. The permit fee is $150 per bedroom per year, permits renew by April 30, and the permit number must appear in every listing. Permits do not transfer when the property sells.",
          "permit": {
            "name": "Short-Term Rental Permit",
            "issuer": "Town of Hilton Head Island",
            "cost": "$150 per bedroom / year, $250 late fee",
            "renewal": "Annual, by April 30",
            "url": "http://hiltonheadislandsc.gov/business/short_term_rentals/renewals/index.php"
          },
          "limits": [
            {
              "label": "Night cap",
              "value": "None"
            },
            {
              "label": "Parking",
              "value": "Capped at six vehicles per rental"
            },
            {
              "label": "Fire safety",
              "value": "Homes of 3,600 sq ft or more need approved fire safety systems and smoke detection throughout"
            },
            {
              "label": "Transfer",
              "value": "Permits end when the property sells, the buyer applies fresh"
            }
          ],
          "taxes": [
            {
              "label": "SC accommodations tax",
              "value": "7%"
            },
            {
              "label": "Local accommodations tax",
              "value": "Set by Beaufort County, check the current rate"
            }
          ],
          "steps": [
            {
              "id": "get-the-town-business-license",
              "title": "Get the Town business license",
              "detail": "Obtain or renew a Town of Hilton Head Island business license, one license can cover multiple properties."
            },
            {
              "id": "apply-for-the-str-permit",
              "title": "Apply for the STR permit",
              "detail": "File the STR permit application in GovOS, pay $150 per bedroom, and display the permit number in every listing."
            },
            {
              "id": "set-up-the-accommodations-tax",
              "title": "Set up the accommodations tax",
              "detail": "Register to collect and remit the 7% SC accommodations tax, platforms collect it on platform bookings."
            }
          ],
          "changes": [
            {
              "title": "Your HOA",
              "detail": "Plantation and resort community covenants set their own rental rules and access policies."
            },
            {
              "title": "Permits do not transfer",
              "detail": "Do not price a deal on the seller's permit, it ends at closing and you apply under the rules in effect that day."
            }
          ],
          "sources": [
            {
              "label": "Town of Hilton Head Island STR permit renewal page (official)",
              "url": "http://hiltonheadislandsc.gov/business/short_term_rentals/renewals/index.php"
            },
            {
              "label": "Town news release on 2026 STR program changes (official)",
              "url": "https://hiltonheadislandsc.gov/news_detail_T6_R178.php"
            }
          ],
          "hosted": {
            "verdict": "permit",
            "headline": "Hosted stays need the same permit",
            "summary": "The town's STR permit applies to any rental offered short-term, whether or not the owner lives there. A resident renting rooms follows the same per-bedroom fee and business license rules."
          }
        },
    {
          "id": "biloxi-ms",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Biloxi",
          "state": "MS",
          "keywords": [
            "biloxi"
          ],
          "verdict": "permit",
          "headline": "Legal with a $250 annual STR application, only in allowed districts",
          "summary": "Biloxi requires short-term rentals to hold a Short-Term Rental Certificate of Occupancy with a $250 annual application fee, plus a Certificate of Zoning Compliance, a Privilege Tax License, and an occupant limit card. STRs are prohibited in many parts of the city and heavily restricted in others, so zoning confirmation is essential. Airbnb is currently suing the city over those restrictions.",
          "permit": {
            "name": "Short-Term Rental Certificate of Occupancy",
            "issuer": "City of Biloxi",
            "cost": "$250 annual application fee",
            "renewal": "Annual",
            "url": "https://biloxi.ms.us/agendas/planning/2022/STR%20COO-app.pdf?ref=hoaweekly.com"
          },
          "limits": [
            {
              "label": "Night cap",
              "value": "None, but many areas prohibit STRs outright"
            },
            {
              "label": "Zoning",
              "value": "STRs prohibited in many districts, Certificate of Zoning Compliance required"
            },
            {
              "label": "Local contact",
              "value": "Local person able to appear at the property within 30 minutes of a call"
            },
            {
              "label": "Guest register",
              "value": "Owners must keep a guest register available for city inspection"
            }
          ],
          "taxes": [
            {
              "label": "State sales tax",
              "value": "7% on lodging"
            },
            {
              "label": "Local tourism tax",
              "value": "Set by Harrison County, check the current rate"
            }
          ],
          "steps": [
            {
              "id": "confirm-the-zoning",
              "title": "Confirm the zoning",
              "detail": "Get a Certificate of Zoning Compliance from the city before buying, since STRs are banned in many areas."
            },
            {
              "id": "file-the-str-application",
              "title": "File the STR application",
              "detail": "Submit the Short-Term Rental Certificate of Occupancy application with the $250 annual fee to Community Development."
            },
            {
              "id": "add-the-tax-licenses",
              "title": "Add the tax licenses",
              "detail": "Obtain the Privilege Tax License and a free Mississippi sales tax permit through the Department of Revenue's Taxpayer Access Point."
            }
          ],
          "changes": [
            {
              "title": "Your HOA",
              "detail": "Condo and HOA rental rules stack on top of the city's zoning limits."
            },
            {
              "title": "Litigation is pending",
              "detail": "Airbnb sued Biloxi in federal court over its STR restrictions, rules could shift, verify before closing."
            }
          ],
          "sources": [
            {
              "label": "City of Biloxi STR Certificate of Occupancy application (official PDF)",
              "url": "https://biloxi.ms.us/agendas/planning/2022/STR%20COO-app.pdf?ref=hoaweekly.com"
            },
            {
              "label": "Reuters on Airbnb v. Biloxi STR lawsuit",
              "url": "https://www.reuters.com/legal/government/airbnb-sues-mississippi-city-over-short-term-rental-restrictions-2025-11-13/"
            }
          ],
          "hosted": {
            "verdict": "permit",
            "headline": "Hosted stays face the same district limits",
            "summary": "Biloxi's zoning restrictions target the rental use, not ownership. A resident renting rooms in a prohibited district cannot do it either."
          }
        },
    {
          "id": "houston-tx",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Houston",
          "state": "TX",
          "keywords": [
            "houston"
          ],
          "verdict": "permit",
          "headline": "Legal citywide with a Certificate of Registration since January 2026",
          "summary": "Houston's first STR ordinance took effect January 1, 2026 and requires every unit rented under 30 days to hold a Certificate of Registration from the Administration and Regulatory Affairs Department. There is no zoning restriction, no occupancy cap, and no owner-occupancy rule, so investors can operate whole homes anywhere in city limits. Platform delisting of unregistered listings begins January 1, 2027.",
          "permit": {
            "cost": "$275 / year plus a CPI-adjusted admin fee ($33.10 in 2025)",
            "issuer": "City of Houston, Administration and Regulatory Affairs Department",
            "name": "Certificate of Registration",
            "renewal": "Annual",
            "url": "https://www.houstonpermittingcenter.org/news-events/update-administration-regulatory-affairs-department-newly-adopted-short-term-rental"
          },
          "limits": [
            {
              "label": "Zoning",
              "value": "No zoning restrictions citywide"
            },
            {
              "label": "Owner occupancy",
              "value": "Not required"
            },
            {
              "label": "Night cap",
              "value": "None"
            },
            {
              "label": "Per-owner limit",
              "value": "None, but each unit needs its own certificate"
            }
          ],
          "taxes": [
            {
              "label": "Combined hotel tax",
              "value": "17% (6% state, 7% city, 2% Harris County, 2% sports authority)"
            }
          ],
          "steps": [
            {
              "id": "gather-documents",
              "title": "Gather documents",
              "detail": "Prepare owner and property info, a 24-hour emergency contact, tax registration, liability insurance proof, and human trafficking training."
            },
            {
              "id": "apply-at-the-str-portal",
              "title": "Apply at the STR portal",
              "detail": "File the application at str.houstontx.gov and pay the $275 fee plus the admin fee."
            },
            {
              "id": "display-the-number",
              "title": "Display the number",
              "detail": "Post the registration number on every platform listing, since delisting of unregistered listings starts January 2027."
            }
          ],
          "changes": [
            {
              "detail": "The ordinance makes you certify that your deed restrictions or HOA allow short-term rental use.",
              "title": "Your HOA"
            },
            {
              "detail": "From January 1, 2027 the city will notify platforms to remove listings without a valid registration number.",
              "title": "Platform delisting"
            }
          ],
          "sources": [
            {
              "label": "Houston Permitting Center STR ordinance update",
              "url": "https://www.houstonpermittingcenter.org/news-events/update-administration-regulatory-affairs-department-newly-adopted-short-term-rental"
            },
            {
              "label": "BNBCalc Houston STR regulations 2026",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/houston-texas-guide"
            }
          ],
          "hosted": {
            "headline": "Hosted stays need the same certificate",
            "summary": "Renting a room while living there needs the same $275 Certificate of Registration per unit. Houston does not distinguish hosted from unhosted stays.",
            "verdict": "permit"
          }
        },
    {
          "id": "fort-worth-tx",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Fort Worth",
          "state": "TX",
          "keywords": [
            "fort worth"
          ],
          "verdict": "banned",
          "headline": "Banned in all residential zones; only commercial and industrial parcels qualify",
          "summary": "Fort Worth treats STRs as a land-use question, not a paperwork one: every residential district prohibits transient stays under 30 days, and an appeals court upheld the ban in 2026. Legal STRs are allowed only in mixed-use, commercial, and industrial districts, where registration under Chapter 7, Article XIII costs $150 to start and $100 a year to renew. A typical whole home in a residential neighborhood cannot be an Airbnb.",
          "permit": {
            "cost": "$150 first year, $100 / year renewal",
            "issuer": "City of Fort Worth",
            "name": "STR Registration (Chapter 7, Article XIII)",
            "renewal": "Annual",
            "url": "https://www.fortworthtexas.gov/short-term-rentals"
          },
          "limits": [
            {
              "label": "Residential zones",
              "value": "Prohibited in all residential districts"
            },
            {
              "label": "Allowed zones",
              "value": "Mixed-use, commercial, and industrial districts only"
            },
            {
              "label": "Zoning check",
              "value": "Registration requires a passing city zoning confirmation"
            },
            {
              "label": "Transfer",
              "value": "Registration is not transferable to a new owner"
            }
          ],
          "taxes": [
            {
              "label": "City hotel tax",
              "value": "9%"
            },
            {
              "label": "State hotel tax",
              "value": "6%"
            }
          ],
          "steps": [
            {
              "id": "check-zoning-first",
              "title": "Check zoning first",
              "detail": "Run the address through the city's zoning confirmation tool and get a passing determination."
            },
            {
              "id": "register-on-localgov",
              "title": "Register on LocalGov",
              "detail": "Submit the annual STR registration with the zoning confirmation PDF and the $150 fee."
            },
            {
              "id": "file-hotel-tax",
              "title": "File hotel tax",
              "detail": "Maintain a Hotel Occupancy Tax registration and file on LocalGov every period, even at $0."
            }
          ],
          "changes": [
            {
              "detail": "HOA and deed restrictions add a second ban on top of the city's zoning ban.",
              "title": "Your HOA"
            },
            {
              "detail": "You can apply for a rezoning to Planned Development, but approval is not guaranteed.",
              "title": "Zoning changes"
            }
          ],
          "sources": [
            {
              "label": "City of Fort Worth Short-Term Rentals page",
              "url": "https://www.fortworthtexas.gov/short-term-rentals"
            },
            {
              "label": "BNBCalc Fort Worth STR regulations 2026",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/fort-worth-texas-guide"
            }
          ],
          "hosted": {
            "headline": "Hosted stays are banned in residential zones too",
            "summary": "The residential-zone ban covers any stay under 30 days, hosted or not. A room rental inside a home in a residential district is not allowed.",
            "verdict": "banned"
          }
        },
    {
          "id": "flagstaff-az",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Flagstaff",
          "state": "AZ",
          "keywords": [
            "flagstaff"
          ],
          "verdict": "permit",
          "headline": "Legal with a $250 annual city license since July 2026",
          "summary": "Flagstaff requires a Short-Term Rental License for each rental unit, at $250 a year under the July 2026 ordinance (the state maximum fee). Investors face no owner-occupancy rule and no citywide cap, but must carry a TPT license, notify neighbors in writing, run guest sex-offender checks, and meet fire safety rules including extinguishers and disabled grills during Stage 2 fire restrictions.",
          "permit": {
            "cost": "$250 / year per unit (non-refundable)",
            "issuer": "City of Flagstaff",
            "name": "Short-Term Rental License",
            "renewal": "Annual",
            "url": "https://www.flagstaff.az.gov/DocumentCenter/View/93615/STR-License-Fee_Report-2026-Final"
          },
          "limits": [
            {
              "label": "Owner occupancy",
              "value": "Not required"
            },
            {
              "label": "Night cap",
              "value": "None"
            },
            {
              "label": "Permit cap",
              "value": "None"
            },
            {
              "label": "Background checks",
              "value": "Owner and designee face sex-offender and felony screening"
            }
          ],
          "taxes": [
            {
              "label": "Transient lodging tax",
              "value": "11.386% (6.90% state and Coconino County plus 4.486% city)"
            }
          ],
          "steps": [
            {
              "id": "get-a-tpt-license",
              "title": "Get a TPT license",
              "detail": "Obtain an Arizona TPT license through AZTaxes.gov before applying."
            },
            {
              "id": "notify-neighbors",
              "title": "Notify neighbors",
              "detail": "Send written neighborhood notification with the license number and emergency contact."
            },
            {
              "id": "apply-on-the-city-portal",
              "title": "Apply on the city portal",
              "detail": "File through the Flagstaff STR license portal, pass the 7-business-day review, and pay the $250 fee."
            }
          ],
          "changes": [
            {
              "detail": "HOA rules permitting rentals under 30 days control; check them before buying.",
              "title": "Your HOA"
            },
            {
              "detail": "Barbecue grills and fire pits must be disabled during Stage 2 wildfire restrictions.",
              "title": "Fire restrictions"
            }
          ],
          "sources": [
            {
              "label": "City of Flagstaff 2026 STR license fee report",
              "url": "https://www.flagstaff.az.gov/DocumentCenter/View/93615/STR-License-Fee_Report-2026-Final"
            },
            {
              "label": "BNBCalc Flagstaff STR regulations 2026",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Flagstaff-Arizona-guide"
            }
          ],
          "hosted": {
            "headline": "Hosted stays need the same $250 license",
            "summary": "Renting a room while living there requires the same annual license, TPT license, and neighbor notification. Flagstaff has no hosted-only license.",
            "verdict": "permit"
          }
        },
    {
          "id": "colorado-springs-co",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Colorado Springs",
          "state": "CO",
          "keywords": [
            "colorado springs",
            "springs",
            "colorado"
          ],
          "verdict": "permit",
          "headline": "Legal with a $124.95 annual permit; non-owner STRs barred in single-family zones",
          "summary": "Colorado Springs requires an annual Short Term Rental permit from Planning and Community Development at $124.95 a year, non-transferable, with $500,000 in liability insurance. Investors cannot get a non-owner-occupied permit in single-family zones (R-E, R-1 6, R-1 9, single-family planned developments), and in other zones must keep 500 feet of separation from another non-owner STR. Owner-occupied rentals of 185-plus days a year are allowed in any residential zone.",
          "permit": {
            "cost": "$124.95 / year per listing",
            "issuer": "City of Colorado Springs Planning and Community Development",
            "name": "Short Term Rental Permit",
            "renewal": "Annual, no grace period",
            "url": "https://coloradosprings.gov/str?mlid=33616"
          },
          "limits": [
            {
              "label": "Single-family zones",
              "value": "No new non-owner-occupied permits"
            },
            {
              "label": "Separation",
              "value": "500 ft from another non-owner-occupied STR in allowed zones"
            },
            {
              "label": "Transfer",
              "value": "Permit is issued to the owner, not the property"
            },
            {
              "label": "Events",
              "value": "Weddings and large commercial events prohibited"
            }
          ],
          "taxes": [
            {
              "label": "Combined lodging taxes",
              "value": "10.20% (2.90% state, 1.23% county, 1.00% transit, 3.07% city sales tax, 2.00% city lodgers tax)"
            }
          ],
          "steps": [
            {
              "id": "verify-zoning-and-separation",
              "title": "Verify zoning and separation",
              "detail": "Confirm the parcel is outside single-family districts and at least 500 feet from another non-owner STR."
            },
            {
              "id": "apply-on-the-accela-portal",
              "title": "Apply on the Accela portal",
              "detail": "Submit the application with proof of insurance, a 24-hour local contact, and a city sales tax license customer ID."
            },
            {
              "id": "post-and-renew",
              "title": "Post and renew",
              "detail": "Put the permit number on every listing and renew before expiration, since lapsed non-owner permits can be forfeited."
            }
          ],
          "changes": [
            {
              "detail": "HOA and deed restrictions can prohibit STRs the city allows.",
              "title": "Your HOA"
            },
            {
              "detail": "Keep at least $500,000 in liability coverage or qualifying platform coverage on file.",
              "title": "Insurance"
            }
          ],
          "sources": [
            {
              "label": "City of Colorado Springs Short Term Rentals page",
              "url": "https://coloradosprings.gov/str?mlid=33616"
            },
            {
              "label": "BNBCalc Colorado Springs STR regulations 2026",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/colorado-springs-colorado-guide"
            }
          ],
          "hosted": {
            "headline": "Owner-occupied permits work in any residential zone",
            "summary": "Living there 185 or more days a year qualifies you for an owner-occupied permit at the same $124.95 a year, allowed in every zone where residential use is permitted.",
            "verdict": "permit"
          }
        },
    {
          "id": "aspen-co",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Aspen",
          "state": "CO",
          "keywords": [
            "aspen"
          ],
          "verdict": "permit",
          "headline": "Legal with a Classic permit, but zone caps and waitlists apply",
          "summary": "Aspen's STR-C (Classic) permit covers non-owner-occupied whole homes at $394 a year plus a $150 business license, with no annual night cap. The catch is zoning: Classic permits are number-limited in certain residential districts, and new applicants face a waitlist where caps are full. Permits die at closing, so buying a licensed STR does not give you the license.",
          "permit": {
            "cost": "$394 / year plus $150 / year business license",
            "issuer": "City of Aspen",
            "name": "STR-C (Classic) Permit",
            "renewal": "Annual",
            "url": "https://aspen.gov/DocumentCenter/View/8863/STR-Program-Guidelines_92122_Final?bidId="
          },
          "limits": [
            {
              "label": "Zone caps",
              "value": "Classic permits capped in some residential districts; waitlist applies"
            },
            {
              "label": "Transfer",
              "value": "Permit terminates at closing; buyer applies fresh"
            },
            {
              "label": "Night cap",
              "value": "None for STR-C"
            },
            {
              "label": "Advertising",
              "value": "Permit number and max occupancy required on all ads"
            }
          ],
          "taxes": [
            {
              "label": "Lodging taxes",
              "value": "21.3% per night for STR-C properties"
            }
          ],
          "steps": [
            {
              "id": "check-the-zone-cap",
              "title": "Check the zone cap",
              "detail": "Ask the city whether your zone district still has Classic permit capacity or only a waitlist."
            },
            {
              "id": "apply-on-munirevs",
              "title": "Apply on MuniRevs",
              "detail": "File the STR permit application online with the required ownership and property documents."
            },
            {
              "id": "get-the-business-license",
              "title": "Get the business license",
              "detail": "Obtain the $150 annual city business license and display both permit numbers in every ad."
            }
          ],
          "changes": [
            {
              "detail": "Condo and HOA rules can restrict STRs beyond the city permit.",
              "title": "Your HOA"
            },
            {
              "detail": "The seller's permit does not transfer; budget a fresh application and possible waitlist.",
              "title": "Buying licensed property"
            }
          ],
          "sources": [
            {
              "label": "City of Aspen STR Program Guidelines",
              "url": "https://aspen.gov/DocumentCenter/View/8863/STR-Program-Guidelines_92122_Final?bidId="
            },
            {
              "label": "Airbnb Aspen host rules",
              "url": "https://www.airbnb.co.za/help/article/888"
            }
          ],
          "hosted": {
            "headline": "STR-OO fits owner-occupied rentals",
            "summary": "Title owners living there as a primary residence use the STR-OO permit at $394 a year, capped at 120 rental nights a year but not limited by zone caps.",
            "verdict": "permit"
          }
        },
    {
          "id": "vail-co",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Vail",
          "state": "CO",
          "keywords": [
            "vail"
          ],
          "verdict": "permit",
          "headline": "Legal with a $260 annual license; no zoning limits",
          "summary": "Vail requires a Short-Term Rental License for each unit rented under 30 days, at $260 a year in administrative fee ($50 in buildings with onsite management), expiring each February 28 and non-transferable. The town currently imposes no zoning limits on STR location, making the license mostly an administrative exercise with a local representative requirement and fire department inspections for new registrations.",
          "permit": {
            "cost": "$260 / year ($50 in buildings with onsite management)",
            "issuer": "Town of Vail",
            "name": "Short-Term Rental License",
            "renewal": "Annual, expires February 28",
            "url": "https://www.vail.gov/home/showpublisheddocument/4338/638521452610730000"
          },
          "limits": [
            {
              "label": "Zoning",
              "value": "No current location restrictions"
            },
            {
              "label": "Local representative",
              "value": "24/7 contact within 60 minutes, unless onsite management"
            },
            {
              "label": "Transfer",
              "value": "License expires on title transfer; new owner applies fresh"
            },
            {
              "label": "Advertising",
              "value": "Registration number required on all advertising"
            }
          ],
          "taxes": [
            {
              "label": "Combined lodging taxes",
              "value": "10.8% (4.5% town, 2.9% state, 1.5% Eagle County, 0.5% RTA, 1.4% local marketing district)"
            }
          ],
          "steps": [
            {
              "id": "file-the-application",
              "title": "File the application",
              "detail": "Submit the application to the Finance Director with the fee, a habitability affidavit, and a local representative designation."
            },
            {
              "id": "pass-inspection",
              "title": "Pass inspection",
              "detail": "Complete the fire department inspection for new registrations."
            },
            {
              "id": "renew-annually",
              "title": "Renew annually",
              "detail": "Renew each year before February 28 through the town's MuniRevs portal."
            }
          ],
          "changes": [
            {
              "detail": "HOA and deed restrictions can still block STRs in an otherwise eligible unit.",
              "title": "Your HOA"
            },
            {
              "detail": "Town council has studied registration limits and tiered fees, so rules could tighten.",
              "title": "Future caps"
            }
          ],
          "sources": [
            {
              "label": "Town of Vail STR ordinance Chapter 14",
              "url": "https://www.vail.gov/home/showpublisheddocument/4338/638521452610730000"
            },
            {
              "label": "Town of Vail STR FAQs",
              "url": "https://www.vail.gov/home/showpublisheddocument/4219/638654456929530000"
            }
          ],
          "hosted": {
            "headline": "Hosted stays need the same registration",
            "summary": "Renting a room while living there requires the same $260 license and local representative. Vail has no hosted-only license.",
            "verdict": "permit"
          }
        },
    {
          "id": "long-beach-ca",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Long Beach",
          "state": "CA",
          "keywords": [
            "long beach",
            "belmont shore",
            "downtown long beach"
          ],
          "verdict": "permit",
          "headline": "Legal with registration, 800 non-primary slots citywide",
          "summary": "Long Beach registers short-term rentals on two tracks: unlimited primary-residence registrations and a capped pool of 800 non-primary-residence registrations citywide, with 350 of those inside the Coastal Zone. An investor can get a non-primary slot, but slots are limited and do not transfer when the property sells.",
          "permit": {
            "cost": "$500 application review / year",
            "issuer": "City of Long Beach",
            "name": "Short-Term Rental Registration",
            "renewal": "Annual",
            "url": "https://longbeach.gov/lbds/hn/st-rental/"
          },
          "limits": [
            {
              "label": "Non-primary cap",
              "value": "800 citywide, 350 in Coastal Zone"
            },
            {
              "label": "Primary residence",
              "value": "Unlimited registrations"
            },
            {
              "label": "ADUs",
              "value": "Not eligible"
            },
            {
              "label": "Transfer",
              "value": "Registration does not transfer on sale"
            }
          ],
          "taxes": [
            {
              "label": "Transient occupancy tax",
              "value": "13%"
            }
          ],
          "steps": [
            {
              "id": "apply-for-registration",
              "title": "Apply for registration",
              "detail": "Apply through the city's STR program and pay the $500 review fee before advertising."
            },
            {
              "id": "post-your-number",
              "title": "Post your number",
              "detail": "Display your registration number and expiration date on every listing."
            },
            {
              "id": "remit-tot-monthly",
              "title": "Remit TOT monthly",
              "detail": "Report and pay the 13% transient occupancy tax monthly; Airbnb collects it automatically, other platforms do not."
            }
          ],
          "changes": [
            {
              "detail": "Landlords and HOAs can add their building to the city's Prohibited Buildings List, blocking any registration there.",
              "title": "Your HOA"
            },
            {
              "detail": "Residential neighbors can petition to restrict unhosted STRs in their census block group.",
              "title": "Neighborhood petitions"
            }
          ],
          "sources": [
            {
              "label": "City of Long Beach STR page",
              "url": "https://longbeach.gov/lbds/hn/st-rental/"
            },
            {
              "label": "BNBCalc Long Beach 2026 guide",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/long-beach-california-guide"
            }
          ],
          "hosted": {
            "headline": "Hosted stays use the same registration",
            "summary": "A resident host registers on the primary-residence track, which has no citywide cap.",
            "verdict": "permit"
          }
        },
    {
          "id": "santa-monica-ca",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Santa Monica",
          "state": "CA",
          "keywords": [
            "santa monica",
            "ocean park"
          ],
          "verdict": "banned",
          "headline": "Whole-home vacation rentals are illegal citywide",
          "summary": "Santa Monica bans vacation rentals, meaning whole-home short-term stays with the host away, everywhere in the city, and no permit can make one legal. The only legal path is home-sharing: renting rooms in your own primary residence while you stay on site.",
          "permit": {
            "cost": "$100 new / $50 renewal (about $582 total first year with license tax and fees)",
            "issuer": "City of Santa Monica",
            "name": "Home-Share Permit + Business License",
            "renewal": "Annual, expires June 30",
            "url": "https://www.smgov.net/Departments/PCD/Permits/Short-Term-Rental-Home-Share-Ordinance/"
          },
          "limits": [
            {
              "label": "Whole-home STR",
              "value": "Illegal citywide, no permit available"
            },
            {
              "label": "Home-share",
              "value": "Host must live on site during stays"
            },
            {
              "label": "Primary residence",
              "value": "Must have lived there 1+ year"
            },
            {
              "label": "Bookings",
              "value": "Max 2 guest groups at a time"
            }
          ],
          "taxes": [
            {
              "label": "Transient occupancy tax",
              "value": "14%"
            },
            {
              "label": "Nightly fee",
              "value": "$2 / night, collected by Airbnb"
            }
          ],
          "steps": [
            {
              "id": "confirm-primary-residency",
              "title": "Confirm primary residency",
              "detail": "Gather two proofs of residency and proof you have lived in the unit at least a year."
            },
            {
              "id": "apply-for-both-approvals",
              "title": "Apply for both approvals",
              "detail": "Submit the joint Home-Share Permit and Business License application to the city."
            },
            {
              "id": "collect-and-remit-tot",
              "title": "Collect and remit TOT",
              "detail": "Collect 14% transient occupancy tax monthly and renew both approvals each fiscal year."
            }
          ],
          "changes": [
            {
              "detail": "HOA and condo rules can ban home-sharing on top of the city's rules, so check the CC&Rs before you buy.",
              "title": "Your HOA"
            },
            {
              "detail": "Home-share income on a rent-controlled unit is capped at the Maximum Allowable Rent.",
              "title": "Rent control"
            }
          ],
          "sources": [
            {
              "label": "City of Santa Monica home-share ordinance page",
              "url": "https://www.smgov.net/Departments/PCD/Permits/Short-Term-Rental-Home-Share-Ordinance/"
            },
            {
              "label": "Airbnb Santa Monica help article",
              "url": "https://www.airBNB.com/help/article/908"
            }
          ],
          "hosted": {
            "headline": "Home-sharing is the legal path",
            "summary": "Renting rooms in the primary residence you live in is allowed with a Home-Share permit and business license.",
            "verdict": "permit"
          },
          "neighbors": [
            {
              "city": "Los Angeles",
              "note": "Los Angeles city runs its own home-sharing program with different rules. A Santa Monica address follows Santa Monica rules, not LA's."
            }
          ]
        },
    {
          "id": "south-lake-tahoe-ca",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "South Lake Tahoe",
          "state": "CA",
          "keywords": [
            "south lake tahoe",
            "bijou",
            "tahoe keys"
          ],
          "verdict": "permit",
          "headline": "Legal with permit, residential zones capped at 900",
          "summary": "South Lake Tahoe issues Vacation Home Rental permits to investors, but residential areas are capped at 900 total permits under the April 2026 ordinance. Measure T, the old residential ban, was struck down in court in 2025, so the current system is permits plus a hard cap.",
          "permit": {
            "cost": "$548 application, $250-$1,325 / year by occupancy",
            "issuer": "City of South Lake Tahoe",
            "name": "Vacation Home Rental (VHR) Permit",
            "renewal": "Annual",
            "url": "https://www.cityofslt.gov/452/Transient-Occupancy-Tax"
          },
          "limits": [
            {
              "label": "Residential cap",
              "value": "900 permits total"
            },
            {
              "label": "Tourist core",
              "value": "Uncapped"
            },
            {
              "label": "Local manager",
              "value": "Required for residential-area STRs"
            },
            {
              "label": "Violations",
              "value": "3 in 24 months can end the permit"
            }
          ],
          "taxes": [
            {
              "label": "Transient occupancy tax",
              "value": "12%, self-remitted"
            },
            {
              "label": "Tourism district fee",
              "value": "$5.50 / night on agent-managed stays"
            }
          ],
          "steps": [
            {
              "id": "apply-for-the-vhr-permit",
              "title": "Apply for the VHR permit",
              "detail": "Apply to the Community Development Department, pass the inspection, and include the permit number in all ads."
            },
            {
              "id": "hire-a-local-manager",
              "title": "Hire a local manager",
              "detail": "Residential-area rentals must use a local property manager for guest check-in, monitoring, and 24/7 complaint response."
            },
            {
              "id": "remit-tot-yourself",
              "title": "Remit TOT yourself",
              "detail": "Collect and remit the 12% TOT directly to the city; Airbnb and Vrbo do not collect it here."
            }
          ],
          "changes": [
            {
              "detail": "Condo HOAs can prohibit short-term rentals even with a city permit, so read the HOA documents before buying.",
              "title": "Your HOA"
            },
            {
              "detail": "Measure T's ban was struck down in 2025 and the new cap system took effect April 2026, so expect continued tweaks.",
              "title": "Rules are still settling"
            }
          ],
          "sources": [
            {
              "label": "City of South Lake Tahoe TOT page",
              "url": "https://www.cityofslt.gov/452/Transient-Occupancy-Tax"
            },
            {
              "label": "Avalara: SLT caps VHRs at 900",
              "url": "https://www.avalara.com/mylodgetax/en/blog/2026/05/south-lake-tahoe-caps-short-term-rentals-at-900-in-residential-districts.html"
            }
          ],
          "hosted": {
            "headline": "Hosted rentals get a cheaper permit",
            "summary": "The city offers a separate Hosted Rental Permit at $288 for stays where the host is present.",
            "verdict": "permit"
          }
        },
    {
          "id": "palm-desert-ca",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Palm Desert",
          "state": "CA",
          "keywords": [
            "palm desert",
            "el paseo"
          ],
          "verdict": "banned",
          "headline": "Off-site whole-home rentals banned in single-family zones",
          "summary": "Palm Desert bans off-site short-term rentals, where the owner is not present, in the single-family neighborhoods that make up most of the city. Investor whole-home Airbnbs are only possible in resort-zoned, multifamily, or downtown areas, or in HOAs that explicitly allow them, and a moratorium currently blocks new permits in Planned Residential zones.",
          "permit": {
            "cost": "$29 new or renewal",
            "issuer": "City of Palm Desert",
            "name": "Short-Term Rental Permit",
            "renewal": "Annual",
            "url": "https://www.palmdesert.gov/our-city/departments/planning/short-term-rentals"
          },
          "limits": [
            {
              "label": "Single-family zones",
              "value": "Off-site STRs banned"
            },
            {
              "label": "Eligible areas",
              "value": "Resort, multifamily, downtown, or approving HOAs"
            },
            {
              "label": "On-site rentals",
              "value": "Home shares allowed citywide"
            },
            {
              "label": "Moratorium",
              "value": "New permits paused in Planned Residential zones"
            }
          ],
          "taxes": [
            {
              "label": "Transient occupancy tax",
              "value": "11%"
            },
            {
              "label": "Tourism assessment",
              "value": "1% TBID"
            }
          ],
          "steps": [
            {
              "id": "check-your-zoning",
              "title": "Check your zoning",
              "detail": "Confirm the address sits in an eligible zone or an HOA that allows off-site rentals before buying."
            },
            {
              "id": "apply-for-the-permit",
              "title": "Apply for the permit",
              "detail": "Apply or renew through the city, submit the annual HOA approval letter if required, and pay $29."
            },
            {
              "id": "file-taxes-monthly",
              "title": "File taxes monthly",
              "detail": "Remit the 11% TOT plus 1% TBID monthly, even in months with no bookings."
            }
          ],
          "changes": [
            {
              "detail": "If your HOA allows STRs, you must submit a fresh HOA approval letter every year.",
              "title": "Your HOA"
            },
            {
              "detail": "Operating without a permit carries a $5,000 fine per violation.",
              "title": "Fines are steep"
            }
          ],
          "sources": [
            {
              "label": "City of Palm Desert STR page",
              "url": "https://www.palmdesert.gov/our-city/departments/planning/short-term-rentals"
            },
            {
              "label": "Desert Sun Coachella Valley rental rules",
              "url": "https://www.desertsun.com/story/money/real-estate/2026/09/24/airbnb-vrbo-palm-springs-vacation-rental-coachella-valley/91911984007/"
            }
          ],
          "hosted": {
            "headline": "On-site home shares are allowed",
            "summary": "Renting while you stay on site is permitted citywide with the $29 STR permit.",
            "verdict": "permit"
          }
        },
    {
          "id": "honolulu-hi",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Honolulu",
          "state": "HI",
          "keywords": [
            "honolulu",
            "waikiki",
            "kahala"
          ],
          "verdict": "permit",
          "headline": "Legal only in resort zones, $5,000/yr registration",
          "summary": "Under Bill 41, whole-home transient vacation units are legal only in eligible resort zones such as parts of Waikiki, and each unit needs a $5,000-a-year city registration, renewable at $2,500. Investor whole-home rentals in ordinary residential neighborhoods are banned.",
          "permit": {
            "cost": "$5,000 initial / $2,500 renewal per year",
            "issuer": "City and County of Honolulu, Dept. of Planning and Permitting",
            "name": "Transient Vacation Unit Registration",
            "renewal": "Annual",
            "url": "https://www.honolulu.gov/dpp/home/faq/"
          },
          "limits": [
            {
              "label": "Zones",
              "value": "Resort zones only"
            },
            {
              "label": "Occupancy",
              "value": "2 adult guests per bedroom"
            },
            {
              "label": "Insurance",
              "value": "$1M liability required"
            },
            {
              "label": "NUCs",
              "value": "No new non-conforming certificates issued"
            }
          ],
          "taxes": [
            {
              "label": "State transient accommodations tax",
              "value": "11%"
            },
            {
              "label": "County transient accommodations tax",
              "value": "3%"
            }
          ],
          "steps": [
            {
              "id": "confirm-resort-zoning",
              "title": "Confirm resort zoning",
              "detail": "Verify the property sits in an eligible zone with the Department of Planning and Permitting before buying."
            },
            {
              "id": "register-the-unit",
              "title": "Register the unit",
              "detail": "Apply on the Honolulu permitting portal with a title report, insurance certificate, tax licenses, and the informational binder, and pay $5,000."
            },
            {
              "id": "renew-annually",
              "title": "Renew annually",
              "detail": "Renew between 3 months and 1 month before the registration expires, at $2,500 per year."
            }
          ],
          "changes": [
            {
              "detail": "Resort-zone buildings often restrict or ban transient rentals in their own documents, so read them first.",
              "title": "Your HOA"
            },
            {
              "detail": "Transient vacation units are taxed at $9 to $11.50 per $1,000 of value, far above residential rates.",
              "title": "Property tax class"
            }
          ],
          "sources": [
            {
              "label": "Bill 41 (2021) official text",
              "url": "https://hnldoc.ehawaii.gov/hnldoc/document-download?id=12380"
            },
            {
              "label": "Proper Insurance Hawaii STR laws",
              "url": "https://www.proper.insure/regulations/hawaii-airbnb-laws/"
            }
          ],
          "hosted": {
            "headline": "B&Bs are the hosted path",
            "summary": "Bed and breakfast homes, where the host lives on site and rents up to two rooms, register under the same program.",
            "verdict": "permit"
          }
        },
    {
          "id": "kauai-hi",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Kauai (Lihue)",
          "state": "HI",
          "keywords": [
            "kauai",
            "lihue",
            "poipu"
          ],
          "verdict": "banned",
          "headline": "Banned outside Visitor Destination Areas",
          "summary": "Kauai allows transient vacation rentals only inside designated Visitor Destination Areas, such as Princeville, parts of Kapaa and Poipu, or in properties holding a grandfathered Non-Conforming Use Certificate issued before March 2009. No new NCUs are issued, so an investor buying a typical Lihue home cannot legally Airbnb it.",
          "permit": {
            "cost": "$750 / year renewal",
            "issuer": "Kauai County Planning Department",
            "name": "TVR Registration / Non-Conforming Use Certificate",
            "renewal": "Annual, no grace period",
            "url": "https://www.kauai.gov/Government/Departments-Agencies/Planning/Transient-Vacation-Rentals?lang_update=638496329526131136"
          },
          "limits": [
            {
              "label": "Visitor Destination Areas",
              "value": "Only legal zones for new TVRs"
            },
            {
              "label": "NCUs",
              "value": "Grandfathered, pre-2009 only, no new issues"
            },
            {
              "label": "Renewal",
              "value": "Annual, miss it and the right is forfeited"
            },
            {
              "label": "Tax map key",
              "value": "Must appear on all listings"
            }
          ],
          "taxes": [
            {
              "label": "State transient accommodations tax",
              "value": "11%"
            },
            {
              "label": "Kauai county transient accommodations tax",
              "value": "3%"
            }
          ],
          "steps": [
            {
              "id": "verify-vda-or-ncu-status",
              "title": "Verify VDA or NCU status",
              "detail": "Confirm the property's TVR status with the Planning Department using its tax map key before buying."
            },
            {
              "id": "register-or-transfer",
              "title": "Register or transfer",
              "detail": "Register with the Director of Finance, or file the renewal paperwork within 30 days if buying an existing TVR."
            },
            {
              "id": "renew-on-time-every-year",
              "title": "Renew on time every year",
              "detail": "File the annual renewal before the deadline; the county sends no reminders and late renewal forfeits the certificate."
            }
          ],
          "changes": [
            {
              "detail": "Some condo complexes inside VDAs still prohibit nightly rentals in their own rules.",
              "title": "Your HOA"
            },
            {
              "detail": "The new owner must update the county within 30 days of sale to keep the TVR file current.",
              "title": "Ownership changes"
            }
          ],
          "sources": [
            {
              "label": "Kauai County TVR page",
              "url": "https://www.kauai.gov/Government/Departments-Agencies/Planning/Transient-Vacation-Rentals?lang_update=638496329526131136"
            },
            {
              "label": "Kauai County Code Article 17",
              "url": "https://ecode360.com/42671782"
            }
          ],
          "hosted": {
            "headline": "Homestays need county approval",
            "summary": "Hosted homestays are a separate approved category on Kauai, listed alongside TVRs by the Planning Department.",
            "verdict": "permit"
          }
        },
    {
          "id": "chicago-il",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Chicago",
          "state": "IL",
          "keywords": [
            "chicago",
            "wicker park"
          ],
          "verdict": "permit",
          "headline": "Legal with registration, but precincts can ban STRs outright",
          "summary": "Every rental unit needs a Shared Housing Unit Registration from BACP at $250 a year. Investors with more than one unit also need a Shared Housing Unit Operator License. And 25% of registered voters in a precinct can petition to ban shared housing there entirely, so a building can flip from legal to banned without you moving.",
          "permit": {
            "cost": "$250 / year per unit, operator license extra for multi-unit hosts",
            "issuer": "City of Chicago Department of Business Affairs and Consumer Protection (BACP)",
            "name": "Shared Housing Unit Registration",
            "renewal": "Annual",
            "url": "https://www.chicago.gov/content/city/en/sites/chicago-business-licensing/home/sharedhousingregistrationsandaccommodationslicenses.html"
          },
          "limits": [
            {
              "label": "Precinct bans",
              "value": "25% of registered voters in certain residential precincts can petition to prohibit shared housing there, and the option was expanded to more zoning districts in 2020."
            },
            {
              "label": "No single-night stays",
              "value": "The 2020 reform ordinance prohibits single-night reservations for shared housing and vacation rental units to target party houses."
            },
            {
              "label": "Multi-unit operators",
              "value": "Hosts approved for more than one registration must hold a Shared Housing Unit Operator License, with one registration per unit."
            },
            {
              "label": "Nuisance revocation",
              "value": "The city can revoke a registration after one illegal party or overcrowding incident, with a lower threshold for other nuisance conditions."
            }
          ],
          "taxes": [
            {
              "label": "Hotel tax",
              "value": "4.5% Chicago Hotel Accommodation Tax"
            },
            {
              "label": "Surcharge",
              "value": "6% Shared Housing Surcharge, remitted by licensed platforms on bookings they process"
            }
          ],
          "steps": [
            {
              "id": "check-your-precinct-first",
              "title": "Check your precinct first",
              "detail": "Confirm no precinct-level ban covers the address, since voters can outlaw shared housing block by block."
            },
            {
              "id": "apply-directly-to-bacp",
              "title": "Apply directly to BACP",
              "detail": "Submit complete, accurate application details to BACP yourself, not through a platform, with acceptable ID."
            },
            {
              "id": "pay-and-get-the-number",
              "title": "Pay and get the number",
              "detail": "Complete the $250 annual registration payment on the Shared Housing Registration Portal, then list the registration number on approved platforms."
            }
          ],
          "changes": [
            {
              "detail": "Your building or condo association can ban STRs independently of the city, so read the CC&Rs before buying.",
              "title": "Your HOA"
            },
            {
              "detail": "City Council keeps tightening the rules, including precinct opt-outs and pending renter-protection bills, so recheck the ordinance before underwriting.",
              "title": "Rule changes"
            }
          ],
          "sources": [
            {
              "label": "City of Chicago shared housing registrations page",
              "url": "https://www.chicago.gov/content/city/en/sites/chicago-business-licensing/home/sharedhousingregistrationsandaccommodationslicenses.html"
            },
            {
              "label": "Airbnb Chicago registration FAQ",
              "url": "https://www.airbnb.com/help/article/1495/chicago-home-sharing-registration-frequently-asked-questions"
            },
            {
              "label": "2020 reform ordinance coverage",
              "url": "https://www.thesmartcityjournal.com/en/cities/chicago-approves-ordinance-to-reform-shared-housing-industry"
            }
          ],
          "hosted": {
            "headline": "Renting a room while living there follows the same registration path",
            "summary": "Owner-occupied hosts register the same way through BACP at the same $250 annual fee. A single unit avoids the multi-unit operator license.",
            "verdict": "permit"
          }
        },
    {
          "id": "columbus-oh",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Columbus",
          "state": "OH",
          "keywords": [
            "columbus",
            "short north",
            "german village"
          ],
          "verdict": "permit",
          "headline": "Legal citywide with a permit, investors pay a higher annual fee",
          "summary": "Columbus allows short-term rentals citywide, including homes the owner does not live in, under Chapter 598 of the city code. You need the permit before listing: $20 to apply plus $150 a year for a non-primary residence, and the applicant, host, and 24-hour contact each need an annual $32 fingerprint background check.",
          "permit": {
            "cost": "$20 application + $150 / year (non-primary residence)",
            "issuer": "City of Columbus License Section",
            "name": "Short-Term Rental Permit",
            "renewal": "Annual; runs one calendar year from issue",
            "url": "https://www.columbus.gov/files/sharedassets/city/v/1/business-and-development/business-licenses-amp-resources/str_app-2026.pdf"
          },
          "limits": [
            {
              "label": "Background checks",
              "value": "Annual Ohio BCI fingerprint checks at $32 per person are required for the applicant, the host if different, the 24-hour emergency contact, and any property manager."
            },
            {
              "label": "Occupancy",
              "value": "Maximum three guests per bedroom, and the bedroom count must match the Franklin County Auditor's records."
            },
            {
              "label": "Local contact",
              "value": "A 24/7 local contact with their residential address on file is required."
            },
            {
              "label": "Insurance",
              "value": "At least $300,000 in liability coverage is required, and a lapsed policy revokes the permit automatically."
            }
          ],
          "taxes": [
            {
              "label": "STR excise tax",
              "value": "5.1% city short-term rental excise tax, collected from guests and remitted monthly through the CRISP portal by the 20th"
            },
            {
              "label": "State and county lodging tax",
              "value": "Ohio's 5.75% sales tax on lodging and the county lodging tax apply only at five or more guest rooms, so a typical house misses them"
            }
          ],
          "steps": [
            {
              "id": "get-checks-and-good-standing",
              "title": "Get checks and good standing",
              "detail": "Obtain the Ohio BCI background checks and a Letter of Good Standing from the city Income Tax Division."
            },
            {
              "id": "submit-the-application",
              "title": "Submit the application",
              "detail": "File the STR application with the License Section, listing any other STRs you have an interest in."
            },
            {
              "id": "display-the-number",
              "title": "Display the number",
              "detail": "Put your registration number on the listing page once the permit is approved."
            }
          ],
          "changes": [
            {
              "detail": "HOA and condo rules can ban STRs even with a city permit, so verify the governing documents before buying.",
              "title": "Your HOA"
            },
            {
              "detail": "City staff briefed council in 2026 on the licensing program and possible neighbor-notification models, so the rules may evolve.",
              "title": "Rule changes"
            }
          ],
          "sources": [
            {
              "label": "City of Columbus 2026 STR application",
              "url": "https://www.columbus.gov/files/sharedassets/city/v/1/business-and-development/business-licenses-amp-resources/str_app-2026.pdf"
            },
            {
              "label": "Columbus STR guide (2026)",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/columbus-ohio-guide"
            }
          ],
          "hosted": {
            "headline": "Owner-occupied rentals use the same permit at a lower fee",
            "summary": "If the property is your primary residence the annual fee is $75 instead of $150, with the same background checks and occupancy rules.",
            "verdict": "permit"
          }
        },
    {
          "id": "milwaukee-wi",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Milwaukee",
          "state": "WI",
          "keywords": [
            "milwaukee",
            "third ward",
            "bay view"
          ],
          "verdict": "permit",
          "headline": "State Tourist Rooming House license required; the city administers it",
          "summary": "Wisconsin law requires anyone renting a dwelling for under 30 days and more than 10 nights a year to hold a Tourist Rooming House license. In Milwaukee the Department of Neighborhood Services issues and inspects it as the state's agent, with no owner-occupancy rule and no night caps, and Wisconsin's right-to-rent law limits what the city can restrict.",
          "permit": {
            "cost": "Fee set by DNS after application; state benchmark is $296 / year plus a $592 one-time pre-inspection",
            "issuer": "City of Milwaukee Department of Neighborhood Services (as agent of Wisconsin DATCP)",
            "name": "Tourist Rooming House License",
            "renewal": "Annual",
            "url": "http://city.milwaukee.gov/dns/directory/environmental/tourist-rooming-house"
          },
          "limits": [
            {
              "label": "Pre-inspection",
              "value": "The property must pass a health and safety inspection before any new license is issued."
            },
            {
              "label": "Floor plan",
              "value": "The application requires a business plan checklist and a floor plan of the property."
            },
            {
              "label": "Neighbor notice",
              "value": "DNS must mail notice of each new application to the district's council member and every residence within 250 feet."
            },
            {
              "label": "Noise rules",
              "value": "General city noise and disturbance ordinances apply to STR guests."
            }
          ],
          "taxes": [
            {
              "label": "Combined lodging taxes",
              "value": "About 17.9% total: state, county, and city sales tax plus 3% basic and 7% additional local exposition room taxes, collected by marketplace platforms"
            }
          ],
          "steps": [
            {
              "id": "submit-the-application",
              "title": "Submit the application",
              "detail": "Email or mail the state application form, business plan checklist, and floor plan to the DNS Environmental Division."
            },
            {
              "id": "pay-the-fee",
              "title": "Pay the fee",
              "detail": "DNS creates a record after receiving the application and contacts you with payment instructions."
            },
            {
              "id": "pass-inspection",
              "title": "Pass inspection",
              "detail": "Schedule and pass the mandatory pre-inspection before the license issues."
            }
          ],
          "changes": [
            {
              "detail": "Condo and HOA rules can ban STRs regardless of the state license, so verify the governing documents.",
              "title": "Your HOA"
            },
            {
              "detail": "Wisconsin's right-to-rent law (Wis. Stat. 66.1014) restricts local STR rules, but the city added neighbor notification in 2026, so watch for more changes.",
              "title": "Rule changes"
            }
          ],
          "sources": [
            {
              "label": "City of Milwaukee Tourist Rooming House page",
              "url": "http://city.milwaukee.gov/dns/directory/environmental/tourist-rooming-house"
            },
            {
              "label": "Milwaukee STR guide (2026)",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/milwaukee-wisconsin-guide"
            }
          ],
          "hosted": {
            "headline": "No separate owner-occupied tier was found",
            "summary": "The same Tourist Rooming House license covers owner-present rentals.",
            "verdict": "permit"
          }
        },
    {
          "id": "washington-dc",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Washington",
          "state": "DC",
          "keywords": [
            "washington dc",
            "dupont circle"
          ],
          "verdict": "banned",
          "headline": "Investor whole-home rentals are effectively banned",
          "summary": "DC licenses short-term rentals only at the host's primary residence, so an investor who does not live in the unit cannot get a license. A 2026 bill would let DC residents license one second property for up to 90 nights a year, but its status as law was unconfirmed as of early October 2026. Stays are capped at 30 consecutive nights and the transient tax is 15.95%.",
          "permit": {
            "cost": "$104.50 application (reported in city guidance, verify current)",
            "issuer": "DC Department of Licensing and Consumer Protection",
            "name": "Short-Term Rental License (two-year)",
            "renewal": "Every two years",
            "url": "https://mayor.dc.gov/release/mayor-bowser-announces-new-short-term-rental-legislation-create-more-economic-opportunities"
          },
          "limits": [
            {
              "label": "Primary residence",
              "value": "required; investor units do not qualify"
            },
            {
              "label": "Stay cap",
              "value": "30 consecutive nights max"
            },
            {
              "label": "Insurance",
              "value": "$250,000 minimum liability required"
            },
            {
              "label": "Second property",
              "value": "90 nights/year only if 2026 amendment passes"
            }
          ],
          "taxes": [
            {
              "label": "DC transient tax",
              "value": "15.95% (through Sept 30, 2027)"
            }
          ],
          "steps": [
            {
              "id": "check-the-2026-bill-status",
              "title": "Check the 2026 bill status",
              "detail": "Confirm whether the Short-Term Rental Regulation Amendment Act became law before underwriting any investor deal."
            },
            {
              "id": "confirm-primary-residence",
              "title": "Confirm primary residence",
              "detail": "DC Code requires the rental be the host's primary residence, which rules out pure investors today."
            },
            {
              "id": "apply-through-dlcp",
              "title": "Apply through DLCP",
              "detail": "Licensed hosts apply via the DC Department of Licensing and Consumer Protection with proof of residency and insurance."
            }
          ],
          "changes": [
            {
              "detail": "If the property has an HOA, DC requires proof the association allows short-term rentals.",
              "title": "Your HOA"
            },
            {
              "detail": "A bill would add Primary, Secondary, and Special Event license categories, including a 90-night second-property path for DC residents.",
              "title": "Proposed 2026 amendment"
            }
          ],
          "sources": [
            {
              "label": "Mayor Bowser STR legislation announcement",
              "url": "https://mayor.dc.gov/release/mayor-bowser-announces-new-short-term-rental-legislation-create-more-economic-opportunities"
            },
            {
              "label": "DC STR regulations guide",
              "url": "https://www.fsresidential.com/washington-dc/news-events/articles/dc-short-term-rental-regulations-and-laws/"
            }
          ],
          "hosted": {
            "headline": "Owner-occupied units have a clear legal path",
            "summary": "Renting your primary residence while you live there is the model DC's rules were built for, with a license available and no night cap when you are present.",
            "verdict": "permit"
          }
        },
    {
          "id": "philadelphia-pa",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Philadelphia",
          "state": "PA",
          "keywords": [
            "philadelphia",
            "fishtown"
          ],
          "verdict": "permit",
          "headline": "Investor rentals allowed only in commercial or mixed-use zoning",
          "summary": "Philadelphia licenses non-primary-residence STRs as Visitor Accommodation, but only in commercial and mixed-use zoning districts such as CMX-3, CMX-4, and CMX-5. A typical house in a residential zone cannot be an investor STR. The rental license costs $69 per unit per year, and platforms must remove unlicensed listings.",
          "permit": {
            "cost": "$69 per unit / year",
            "issuer": "City of Philadelphia, Dept of Licenses and Inspections",
            "name": "Rental License (hotel/visitor accommodation designation)",
            "renewal": "Annual",
            "url": "https://www.phila.gov/media/20251103115240/L_007_INF_Summary-of-license-fees-Rev-11.2025.pdf"
          },
          "limits": [
            {
              "label": "Zoning",
              "value": "investor STRs limited to commercial/mixed-use districts (CMX-3 and up, RMX)"
            },
            {
              "label": "Residential zones",
              "value": "whole-home investor STRs not allowed"
            },
            {
              "label": "Ad disclosure",
              "value": "license number on every advertisement"
            },
            {
              "label": "Exemption",
              "value": "Limited Lodging license exempts you from a separate rental license"
            }
          ],
          "taxes": [
            {
              "label": "Philadelphia hotel tax",
              "value": "8.5%"
            }
          ],
          "steps": [
            {
              "id": "check-zoning-district",
              "title": "Check zoning district",
              "detail": "Verify the property sits in a commercial or mixed-use district that allows Visitor Accommodation."
            },
            {
              "id": "get-the-rental-license",
              "title": "Get the rental license",
              "detail": "Apply for the Rental License with hotel designation through the city's eCLIPSE portal."
            },
            {
              "id": "publish-your-license-number",
              "title": "Publish your license number",
              "detail": "Put the license number in every ad; Airbnb and Vrbo require it before listing."
            }
          ],
          "changes": [
            {
              "detail": "HOA or condo rules can ban STRs even in commercial zones where the city allows them.",
              "title": "Your HOA"
            },
            {
              "detail": "The city tightened rules via Bill 210081; platforms must delist unlicensed units within 5 business days of notice.",
              "title": "Platform enforcement"
            }
          ],
          "sources": [
            {
              "label": "City of Philadelphia license fee schedule",
              "url": "https://www.phila.gov/media/20251103115240/L_007_INF_Summary-of-license-fees-Rev-11.2025.pdf"
            },
            {
              "label": "BNBCalc Philadelphia guide",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Philadelphia-County-Pennsylvania-Guide"
            }
          ],
          "hosted": {
            "headline": "Owner-occupied units get a cheaper license",
            "summary": "Hosts living in the unit qualify for Limited Lodging at $150 a year and can operate in residential zones, unlike investor units.",
            "verdict": "permit"
          }
        },
    {
          "id": "jersey-city-nj",
"nightCap": { "value": 60, "unit": "nights when you are not present", "period": "per calendar year", "note": "Applies to rentals where you are not present. Switch to the I live there view to see the hosted rules." },
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Jersey City",
          "state": "NJ",
          "keywords": [
            "jersey city",
            "journal square",
            "downtown jersey city"
          ],
          "verdict": "banned",
          "headline": "Non-owner-occupied STRs are effectively banned",
          "summary": "Jersey City's ordinance, upheld by voters and the Third Circuit, limits rentals where the owner is not present to 60 nights a year and bans STRs in buildings with more than four units. Renters cannot host, and rent-controlled units are excluded. An investor buying a whole home to Airbnb full-time has no legal path.",
          "permit": {
            "cost": "$250 initial / $200 renewal",
            "issuer": "Jersey City Division of Housing Preservation",
            "name": "Short-Term Rental Permit (owner-occupied only)",
            "renewal": "Annual",
            "url": "https://www.jcnj.org/UserFiles/Servers/Server_6189660/Image/City Hall/Housing Economic Development/HousingPreservation/2026-07-08 - STR - Updated FAQ.pdf"
          },
          "limits": [
            {
              "label": "Unhosted cap",
              "value": "60 nights per calendar year when owner not present"
            },
            {
              "label": "Building size",
              "value": "banned in buildings over 4 units"
            },
            {
              "label": "Tenants",
              "value": "renters cannot be hosts"
            },
            {
              "label": "Rent-controlled units",
              "value": "barred from STRs"
            }
          ],
          "taxes": [
            {
              "label": "NJ state taxes",
              "value": "about 11.6% combined, platform-collected"
            }
          ],
          "steps": [
            {
              "id": "confirm-owner-occupancy",
              "title": "Confirm owner occupancy",
              "detail": "Confirm the owner lives on site; pure investor STRs are not permitted."
            },
            {
              "id": "apply-for-the-permit",
              "title": "Apply for the permit",
              "detail": "Apply for the permit through the Division of Housing Preservation."
            },
            {
              "id": "respect-the-60-night-cap",
              "title": "Respect the 60-night cap",
              "detail": "Non-owner-present stays are limited to 60 total nights a year."
            }
          ],
          "changes": [
            {
              "detail": "Condos and co-ops commonly ban STRs outright; check the documents.",
              "title": "Your HOA"
            },
            {
              "detail": "A June 2025 amendment refined the rules, but the owner-occupied structure and 60-night cap remain.",
              "title": "2025 amendment"
            }
          ],
          "sources": [
            {
              "label": "Airbnb Jersey City rules",
              "url": "https://www.jcnj.org/UserFiles/Servers/Server_6189660/Image/City Hall/Housing Economic Development/HousingPreservation/2026-07-08 - STR - Updated FAQ.pdf"
            },
            {
              "label": "BNBCalc Hudson County guide",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Hudson-County-New-Jersey-Guide"
            }
          ],
          "hosted": {
            "headline": "Owner-occupied hosts get permits and 60 unhosted nights",
            "summary": "Owners living on site can permit their unit and rent up to two additional units in the building, with 60 nights a year allowed while absent.",
            "verdict": "permit"
          }
        },
    {
          "id": "providence-ri",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Providence",
          "state": "RI",
          "keywords": [
            "providence",
            "federal hill"
          ],
          "verdict": "permit",
          "headline": "Legal with state registration and a city permit",
          "summary": "Every Rhode Island STR registers with the state Department of Business Regulation for $25 a year. Renting a whole unit in Providence also needs a one-year temporary use permit from the city. In the R-1A, R-1, R-3, and R-4 residential districts the unit must be owner-occupied, but outside those districts investors can rent whole units.",
          "permit": {
            "cost": "$25 / year",
            "issuer": "RI Dept of Business Regulation",
            "name": "DBR Short-Term Rental Registration",
            "renewal": "Annual",
            "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Providence-Rhode-Island-guide"
          },
          "limits": [
            {
              "label": "City permit",
              "value": "temporary use permit required for whole-unit rentals"
            },
            {
              "label": "Residential districts",
              "value": "R-1A, R-1, R-3, R-4 require owner-occupancy"
            },
            {
              "label": "Listing display",
              "value": "registration number and expiry on every ad"
            },
            {
              "label": "Definition",
              "value": "stays of 30 nights or fewer"
            }
          ],
          "taxes": [
            {
              "label": "Combined lodging taxes",
              "value": "14% (7% sales + 5% whole-home + 2% local)"
            }
          ],
          "steps": [
            {
              "id": "register-with-the-state",
              "title": "Register with the state",
              "detail": "Register the unit with the RI Department of Business Regulation for $25 a year."
            },
            {
              "id": "get-the-city-permit",
              "title": "Get the city permit",
              "detail": "Whole-unit rentals need a one-year temporary use permit from Inspection and Standards."
            },
            {
              "id": "check-your-zoning-district",
              "title": "Check your zoning district",
              "detail": "Check whether the address sits in an owner-occupancy-required district."
            }
          ],
          "changes": [
            {
              "detail": "HOA and condo rules can ban STRs even where zoning allows them.",
              "title": "Your HOA"
            },
            {
              "detail": "Providence's 2026 zoning update moved the R-4 district into the owner-occupancy group.",
              "title": "2026 zoning update"
            }
          ],
          "sources": [
            {
              "label": "BNBCalc Providence guide",
              "url": "https://www.bnbcalc.com/blog/short-term-rental-regulation/Providence-Rhode-Island-guide"
            },
            {
              "label": "RI Division of Taxation STR FAQs",
              "url": "https://tax.ri.gov/sites/g/files/xkgbur541/files/notice/Short-term-residential-rentals----FAQs----08-28-18-revised.pdf"
            }
          ],
          "hosted": {
            "headline": "Room rentals need only state registration",
            "summary": "Renting a room while you live in the unit needs just the state's $25 DBR registration, no city permit.",
            "verdict": "permit"
          }
        },
    {
          "id": "burlington-vt",
          "confidence": "verified",
          "researched": "October 2026",
          "city": "Burlington",
          "state": "VT",
          "keywords": [
            "burlington"
          ],
          "verdict": "banned",
          "headline": "Investors are shut out; primary residence required",
          "summary": "Burlington's rules are written to block investor STRs: hosts generally cannot register more than one whole-unit rental beyond their primary residence. Whole-unit registration costs $240 a year under the 2026 fee schedule, plus a 9% city housing trust tax on revenue. A non-owner-occupant investor has no path.",
          "permit": {
            "cost": "$240 / year (whole-unit)",
            "issuer": "City of Burlington, Permitting and Inspections",
            "name": "Short-Term Rental Registration",
            "renewal": "Annual (due April 1)",
            "url": "https://www.sevendaysvt.com/legal-notices/ordinancechanges/city-of-burlington-in-the-year-two-thousand-twenty-six-an-ordinance-in-relation-to-minimum-housing-registration-fees-bco-chapter-18-article-ii-section-18-30/"
          },
          "limits": [
            {
              "label": "Unit limit",
              "value": "no more than one whole-unit rental beyond primary residence"
            },
            {
              "label": "Primary residence proof",
              "value": "homestead, voter registration, or utility bills required"
            },
            {
              "label": "Management",
              "value": "host must be the primary host; no property-manager operators"
            },
            {
              "label": "Local contact",
              "value": "Chittenden County contact if owner lives outside the county"
            }
          ],
          "taxes": [
            {
              "label": "City housing trust tax",
              "value": "9% of STR revenue"
            }
          ],
          "steps": [
            {
              "id": "do-not-underwrite-an-investor-str",
              "title": "Do not underwrite an investor STR",
              "detail": "A non-resident investor cannot meet the primary-residence test; treat Burlington as closed."
            },
            {
              "id": "prove-primary-residence",
              "title": "Prove primary residence",
              "detail": "Confirm primary residence with the documents the city requires."
            },
            {
              "id": "register-annually",
              "title": "Register annually",
              "detail": "Register with Permitting and Inspections and pay the whole-unit fee."
            }
          ],
          "changes": [
            {
              "detail": "HOA and condo rules can ban STRs even with a city registration.",
              "title": "Your HOA"
            },
            {
              "detail": "The 2026 fee schedule raised whole-unit registration from $220 to $240 a year.",
              "title": "2026 fee increase"
            }
          ],
          "sources": [
            {
              "label": "City of Burlington 2026 fee ordinance",
              "url": "https://www.sevendaysvt.com/legal-notices/ordinancechanges/city-of-burlington-in-the-year-two-thousand-twenty-six-an-ordinance-in-relation-to-minimum-housing-registration-fees-bco-chapter-18-article-ii-section-18-30/"
            },
            {
              "label": "Checkmate Vermont STR laws",
              "url": "https://www.checkmaterentals.com/blog/vermont-short-term-rental-laws"
            }
          ],
          "hosted": {
            "headline": "Primary-residence hosts can register one whole unit",
            "summary": "A Burlington resident can register their own primary residence as one whole-unit rental, or up to three rooms, at $240 a year.",
            "verdict": "permit"
          }
        }
  ],
  demoAddresses: [
    { label: "LA condo", address: "1200 S Figueroa St, Los Angeles, CA 90015" },
    { label: "Key West house", address: "600 Duval St, Key West, FL 33040" },
    { label: "Charleston home", address: "120 Broad St, Charleston, SC 29401" },
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
