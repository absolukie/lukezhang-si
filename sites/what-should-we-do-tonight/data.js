/* ============================================================
   WHAT SHOULD WE DO TONIGHT? — data.js
   The venue / activity database + content banks.
   Pure data, no DOM. Loaded before engine.js and app.js.

   Venue schema:
   {
     id,            // unique string
     n,             // display name
     kind,          // 'food' | 'dessert' | 'drink' | 'walk' | 'view'
                   // | 'explore' | 'activity' | 'entertainment'
                   // | 'culture' | 'creative' | 'faith'
     area,          // neighborhood / city label
     d,             // drive minutes from HOME_BASE (Menlo Park)
     c: [lo, hi],   // estimated total cost for two, USD
     t,             // duration in minutes
     e: [lo, hi],   // energy range 1-5 this suits
     v: [...],      // vibe tags
     s,             // 'indoor' | 'outdoor' | 'mix'
     so,            // social: 'low' | 'med' | 'high'
     th,            // thinking: 'low' | 'med' | 'high'
     f: [...],      // food kinds (for kind food/dessert/drink)
     u,             // unusual 0-2 (chaos appeal)
     desc,          // 1-2 playful lines
     q,             // Google Maps search query
     seas,          // optional: ['dec'] ['summer'] ['fall'] ['midautumn'] ['feb']
     faith          // optional: true = only when faith toggle on
   }
   HONESTY RULE: entries are category+neighborhood ("Korean BBQ in
   Mountain View") unless the venue is famous enough to name outright.
   Never assert opening hours — the app links to Maps instead.
   ============================================================ */

var DATA = (function () {

  var HOME_BASE = {
    name: "Menlo Park",
    // Drive times below are measured from here. If the home base changes,
    // update HOME_BASE.name in Settings and re-baseline the `d` values
    // per venue.
    lat: 37.4530, lng: -122.1817
  };

  var CUISINES = [
    "Chinese", "Korean", "Japanese", "Vietnamese", "Thai", "Indian",
    "Mexican", "Italian", "American", "Mediterranean", "BBQ", "Hot pot",
    "Sushi", "Dumplings", "Noodles", "Fried chicken", "Pizza",
    "Dessert", "Boba", "Coffee", "Something new", "Surprise us"
  ];

  var VIBES = [
    ["romantic", "❤️", "Romantic"], ["silly", "😂", "Silly"],
    ["cozy", "🛋️", "Cozy"], ["interesting", "🧠", "Interesting"],
    ["playful", "🎮", "Playful"], ["explore", "🌃", "Explore"],
    ["food", "🍜", "Food-focused"], ["peaceful", "🌿", "Peaceful"],
    ["adventurous", "🔥", "Adventurous"], ["meaningful", "🙏", "Meaningful"],
    ["talk", "💬", "Talk"], ["creative", "🎨", "Creative"],
    ["entertainment", "🎵", "Entertainment"], ["latenight", "🌙", "Late-night"]
  ];

  /* ---------------- FOOD ---------------- */
  var VENUES = [
    { id: "kbbq-mv", n: "Korean BBQ in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [60, 95], t: 90, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Korean", "BBQ"], u: 0, desc: "You cook it, you eat it. Loud, sizzly, and impossible to be bored at.", q: "Korean BBQ Mountain View CA" },
    { id: "hotpot-mv", n: "Hot pot in Mountain View", kind: "food", area: "Mountain View", d: 20, c: [50, 80], t: 90, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Hot pot"], u: 0, desc: "Simmering broth, endless ingredients, zero pressure to perform conversation.", q: "hot pot Mountain View CA" },
    { id: "sushi-pa", n: "Sushi in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [55, 100], t: 75, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Japanese", "Sushi"], u: 0, desc: "Quiet, precise, delicious. Order the thing you can't pronounce.", q: "sushi Palo Alto CA" },
    { id: "dumplings-mv", n: "Dumpling house in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [30, 55], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Dumplings"], u: 0, desc: "Soup dumplings demand focus. Chopstick skills will be judged lovingly.", q: "dumpling restaurant Mountain View CA" },
    { id: "ramen-rc", n: "Ramen in Redwood City", kind: "food", area: "Redwood City", d: 12, c: [30, 50], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Japanese", "Noodles"], u: 0, desc: "Steam, slurp, repeat. The official food of not wanting to think.", q: "ramen Redwood City CA" },
    { id: "tacos-rc", n: "Taco crawl in Redwood City", kind: "food", area: "Redwood City", d: 12, c: [25, 45], t: 75, e: [2, 5], v: ["food", "playful", "explore"], s: "mix", so: "med", th: "low", f: ["Mexican"], u: 1, desc: "Three taco spots, one street. Rate every taco. Defend your rankings.", q: "tacos Redwood City CA" },
    { id: "indian-mv", n: "Indian on Castro Street", kind: "food", area: "Mountain View", d: 18, c: [40, 70], t: 75, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Indian"], u: 0, desc: "Order family-style and fight politely over the last piece of naan.", q: "Indian restaurant Castro Street Mountain View CA" },
    { id: "thai-pa", n: "Thai in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [40, 65], t: 70, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Thai"], u: 0, desc: "Pad see ew cures most bad days. Science hasn't checked, but still.", q: "Thai restaurant Palo Alto CA" },
    { id: "italian-pa", n: "Italian in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [60, 110], t: 90, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Italian"], u: 0, desc: "Candlelight, carbs, no phones. The classics are classics for a reason.", q: "Italian restaurant Palo Alto CA" },
    { id: "pizza-mp", n: "Pizza in Menlo Park", kind: "food", area: "Menlo Park", d: 6, c: [30, 55], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "low", th: "low", f: ["Italian", "Pizza", "American"], u: 0, desc: "Six minutes away. Sometimes the best plan is the obvious one.", q: "pizza Menlo Park CA" },
    { id: "chinese-sm", n: "Chinese in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [40, 70], t: 75, e: [1, 5], v: ["food"], s: "indoor", so: "med", th: "low", f: ["Chinese"], u: 0, desc: "San Mateo's Chinese food scene punches way above its weight.", q: "Chinese restaurant San Mateo CA" },
    { id: "viet-sm", n: "Vietnamese in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [30, 55], t: 60, e: [1, 5], v: ["food"], s: "indoor", so: "med", th: "low", f: ["Vietnamese", "Noodles"], u: 0, desc: "Pho first, decisions later.", q: "Vietnamese restaurant San Mateo CA" },
    { id: "kfood-sc", n: "Korean in Santa Clara", kind: "food", area: "Santa Clara", d: 28, c: [45, 80], t: 80, e: [2, 5], v: ["food", "explore"], s: "indoor", so: "med", th: "low", f: ["Korean"], u: 0, desc: "Santa Clara's Korean corridor is worth the drive. Tofu soup heals.", q: "Korean restaurant Santa Clara CA" },
    { id: "dimsum-mv", n: "Dim sum carts", kind: "food", area: "Mountain View", d: 18, c: [35, 60], t: 75, e: [1, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Dumplings"], u: 1, desc: "Point at whatever looks good rolling by. No menu anxiety allowed.", q: "dim sum Mountain View CA" },
    { id: "noodles-sj", n: "Noodle crawl in San Jose", kind: "food", area: "San Jose", d: 30, c: [30, 55], t: 90, e: [2, 5], v: ["food", "explore", "adventurous"], s: "mix", so: "med", th: "low", f: ["Noodles", "Something new"], u: 1, desc: "Two noodle shops, two cuisines. Compare broths like sommeliers.", q: "noodle restaurants San Jose CA" },
    { id: "friedchicken", n: "Fried chicken run", kind: "food", area: "Peninsula", d: 15, c: [25, 45], t: 45, e: [1, 5], v: ["food", "silly"], s: "indoor", so: "low", th: "low", f: ["American", "Fried chicken"], u: 0, desc: "Crispy, fast, zero regrets. Eat in the car like legends.", q: "fried chicken near Menlo Park CA" },
    { id: "med-pa", n: "Mediterranean in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [40, 70], t: 70, e: [1, 5], v: ["food", "peaceful"], s: "indoor", so: "med", th: "low", f: ["Mediterranean"], u: 0, desc: "Hummus, warm pita, and a patio if the weather agrees.", q: "Mediterranean restaurant Palo Alto CA" },
    { id: "ethiopian-sj", n: "Ethiopian in San Jose", kind: "food", area: "San Jose", d: 30, c: [35, 60], t: 75, e: [2, 5], v: ["food", "interesting", "adventurous"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 2, desc: "Eat with your hands, share everything. New cuisine unlocked.", q: "Ethiopian restaurant San Jose CA" },
    { id: "shanghai-mv", n: "Shanghai night", kind: "food", area: "Mountain View", d: 18, c: [40, 70], t: 80, e: [2, 5], v: ["food", "romantic", "explore"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Dumplings", "Noodles"], u: 1, desc: "Soup dumplings, scallion noodles, and practicing your Mandarin on the menu.", q: "Shanghai restaurant Mountain View CA" },
    { id: "izakaya-mv", n: "Izakaya in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [50, 85], t: 80, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Japanese"], u: 0, desc: "Small plates, big fun. Order one thing neither of you has tried.", q: "izakaya Mountain View CA" },
    { id: "peruvian-rc", n: "Peruvian in Redwood City", kind: "food", area: "Redwood City", d: 12, c: [45, 75], t: 75, e: [2, 5], v: ["food", "interesting"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Ceviche and lomo saltado. Your taste buds get a passport stamp.", q: "Peruvian restaurant Redwood City CA" },
    { id: "lao-sj", n: "Lao / Thai-Isaan in San Jose", kind: "food", area: "San Jose", d: 30, c: [35, 60], t: 75, e: [2, 5], v: ["food", "adventurous", "interesting"], s: "indoor", so: "med", th: "low", f: ["Thai", "Something new"], u: 2, desc: "Sticky rice, bold flavors, and dishes you can't get just anywhere.", q: "Lao restaurant San Jose CA" },

    /* ---------------- DESSERT & DRINKS ---------------- */
    { id: "boba-mv", n: "Boba run", kind: "dessert", area: "Mountain View", d: 18, c: [10, 20], t: 25, e: [1, 5], v: ["food", "cozy", "silly"], s: "indoor", so: "low", th: "low", f: ["Boba", "Dessert"], u: 0, desc: "Each person orders for the other. No swapsies.", q: "boba Mountain View CA" },
    { id: "icecream-pa", n: "Ice cream in Palo Alto", kind: "dessert", area: "Palo Alto", d: 12, c: [10, 20], t: 25, e: [1, 5], v: ["food", "romantic", "cozy"], s: "outdoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Walk, lick, talk. The holy trinity of low-effort romance.", q: "ice cream Palo Alto CA" },
    { id: "bakery-mv", n: "Chinese bakery raid", kind: "dessert", area: "Mountain View", d: 18, c: [12, 25], t: 30, e: [1, 5], v: ["food", "playful", "explore"], s: "indoor", so: "low", th: "low", f: ["Dessert", "Chinese"], u: 1, desc: "One of everything that looks interesting. Egg tarts are mandatory.", q: "Chinese bakery Mountain View CA" },
    { id: "cafe-pa", n: "Café hopping", kind: "drink", area: "Palo Alto", d: 12, c: [12, 25], t: 60, e: [1, 5], v: ["cozy", "talk", "peaceful"], s: "indoor", so: "low", th: "low", f: ["Coffee"], u: 0, desc: "Two cafés, two drinks, one long conversation. Bring a question.", q: "coffee Palo Alto CA" },
    { id: "dessert-sm", n: "Dessert in San Mateo", kind: "dessert", area: "San Mateo", d: 20, c: [15, 30], t: 40, e: [1, 5], v: ["food", "romantic"], s: "indoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "San Mateo does dessert properly. Trust the process.", q: "dessert San Mateo CA" },
    { id: "bingsu-sc", n: "Bingsu in Santa Clara", kind: "dessert", area: "Santa Clara", d: 28, c: [15, 30], t: 40, e: [1, 5], v: ["food", "playful"], s: "indoor", so: "low", th: "low", f: ["Dessert", "Korean"], u: 1, desc: "A mountain of shaved ice built for two. Share or suffer.", q: "bingsu Santa Clara CA" },
    { id: "choco-sf", n: "Chocolate run in San Francisco", kind: "dessert", area: "San Francisco", d: 50, c: [20, 40], t: 60, e: [2, 5], v: ["food", "romantic", "explore"], s: "indoor", so: "med", th: "low", f: ["Dessert"], u: 1, desc: "Worth the bridge. Some cravings are non-negotiable.", q: "chocolate San Francisco CA" },
    { id: "dessert-roulette", n: "Dessert roulette downtown", kind: "dessert", area: "Palo Alto", d: 12, c: [15, 30], t: 45, e: [1, 5], v: ["food", "playful", "silly"], s: "mix", so: "low", th: "low", f: ["Dessert", "Surprise us"], u: 2, desc: "Walk downtown. First person to spot a dessert place neither has tried picks it.", q: "dessert Palo Alto CA" },
    { id: "teahouse-mv", n: "Tea house wind-down", kind: "drink", area: "Mountain View", d: 18, c: [12, 25], t: 45, e: [1, 3], v: ["peaceful", "cozy", "talk"], s: "indoor", so: "low", th: "low", f: ["Coffee"], u: 0, desc: "Hot tea, low lights, nowhere to be. The exhale portion of the evening.", q: "tea house Mountain View CA" }
  ];

  /* ---------------- WALKS, VIEWS & OUTDOORS ---------------- */
  VENUES.push(
    { id: "stanford-walk", n: "Stanford evening stroll", kind: "walk", area: "Stanford", d: 12, c: [0, 10], t: 45, e: [1, 5], v: ["romantic", "peaceful", "talk"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Palm Drive at golden hour. Phones away for the first 20 minutes.", q: "Stanford University Palo Alto CA" },
    { id: "bedwell", n: "Bedwell Bayfront sunset", kind: "walk", area: "Menlo Park", d: 8, c: [0, 5], t: 45, e: [1, 5], v: ["romantic", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Your own backyard, basically. Bay views with zero planning required.", q: "Bedwell Bayfront Park Menlo Park CA" },
    { id: "shoreline", n: "Shoreline Lake loop", kind: "walk", area: "Mountain View", d: 18, c: [0, 5], t: 50, e: [2, 5], v: ["peaceful", "explore"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Sailboats, birds, and a flat easy loop. Bring a jacket.", q: "Shoreline Lake Mountain View CA" },
    { id: "baylands", n: "Palo Alto Baylands", kind: "walk", area: "Palo Alto", d: 14, c: [0, 5], t: 50, e: [1, 5], v: ["peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Boardwalks over the marsh as the sky does its thing.", q: "Palo Alto Baylands Nature Preserve" },
    { id: "hmb-beach", n: "Half Moon Bay sunset", kind: "view", area: "Half Moon Bay", d: 32, c: [0, 15], t: 75, e: [2, 5], v: ["romantic", "peaceful", "adventurous"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "The ocean does all the entertaining. You just have to show up.", q: "Half Moon Bay State Beach" },
    { id: "twinpeaks", n: "Twin Peaks night view", kind: "view", area: "San Francisco", d: 55, c: [0, 10], t: 60, e: [2, 5], v: ["romantic", "explore", "latenight"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "The whole glittering city below you. Worth every minute of the drive.", q: "Twin Peaks San Francisco" },
    { id: "pfa", n: "Palace of Fine Arts at night", kind: "view", area: "San Francisco", d: 52, c: [0, 10], t: 45, e: [2, 5], v: ["romantic", "explore"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Lit-up columns and a lagoon. It looks like a movie set because it basically is.", q: "Palace of Fine Arts San Francisco" },
    { id: "skyline-drive", n: "Skyline night drive", kind: "view", area: "Skyline Blvd", d: 20, c: [5, 20], t: 60, e: [1, 5], v: ["peaceful", "romantic", "talk"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "No destination. Good playlist. Pull over for the city lights.", q: "Skyline Boulevard Woodside CA scenic overlook" },
    { id: "stargaze", n: "Stargazing pullout", kind: "view", area: "Santa Cruz Mountains", d: 35, c: [0, 10], t: 60, e: [1, 5], v: ["romantic", "peaceful", "meaningful"], s: "outdoor", so: "low", th: "low", f: [], u: 2, desc: "Drive up until the sky gets dark. Blanket, thermos, constellations.", q: "Santa Cruz Mountains stargazing pullout" },
    { id: "sj-rose", n: "San Jose Rose Garden stroll", kind: "walk", area: "San Jose", d: 30, c: [0, 5], t: 40, e: [1, 5], v: ["romantic", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Thousands of roses and hardly anyone there on weeknights.", q: "San Jose Municipal Rose Garden" },
    { id: "ferry-sf", n: "Ferry Building + waterfront", kind: "explore", area: "San Francisco", d: 50, c: [10, 40], t: 90, e: [2, 5], v: ["explore", "food", "romantic"], s: "mix", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Graze the food stalls, then walk the Embarcadero as it lights up.", q: "Ferry Building San Francisco" },
    { id: "sawyer-golden", n: "Sawyer Camp golden hour", kind: "walk", area: "San Mateo", d: 22, c: [0, 5], t: 60, e: [2, 5], v: ["peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "A flat lakeside trail that glows at sunset. Out and back, no commitment.", q: "Sawyer Camp Trail San Mateo CA" }
  );

  /* ---------------- CITY EXPLORING ---------------- */
  VENUES.push(
    { id: "santana", n: "Santana Row evening", kind: "explore", area: "San Jose", d: 30, c: [0, 60], t: 90, e: [2, 5], v: ["explore", "romantic", "entertainment"], s: "mix", so: "high", th: "low", f: [], u: 0, desc: "People-watch, window-shop, and let the evening decide what happens.", q: "Santana Row San Jose CA" },
    { id: "castro-mv", n: "Castro Street wander", kind: "explore", area: "Mountain View", d: 18, c: [0, 40], t: 75, e: [1, 5], v: ["explore", "food", "cozy"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Bookstore, boba, dinner, dessert — the whole night on one street.", q: "Castro Street Mountain View CA" },
    { id: "univave-pa", n: "University Ave stroll", kind: "explore", area: "Palo Alto", d: 12, c: [0, 40], t: 60, e: [1, 5], v: ["explore", "romantic", "food"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "The classic Peninsula evening. Pick a direction and wander.", q: "University Avenue Palo Alto CA" },
    { id: "courthouse-rc", n: "Courthouse Square", kind: "explore", area: "Redwood City", d: 12, c: [0, 30], t: 60, e: [1, 5], v: ["explore", "entertainment"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Often has live music or a movie night. Check what's on, then just go.", q: "Courthouse Square Redwood City CA" },
    { id: "downtown-sm", n: "Downtown San Mateo", kind: "explore", area: "San Mateo", d: 20, c: [0, 40], t: 75, e: [2, 5], v: ["explore", "food"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Underrated downtown with great food blocks and a fun energy.", q: "Downtown San Mateo CA" },
    { id: "japantown-sj", n: "Japantown San Jose", kind: "explore", area: "San Jose", d: 32, c: [0, 50], t: 90, e: [2, 5], v: ["explore", "food", "interesting"], s: "mix", so: "med", th: "low", f: ["Japanese"], u: 1, desc: "One of America's last Japantowns. Shops, snacks, and stories.", q: "Japantown San Jose CA" },
    { id: "haight-sf", n: "Haight-Ashbury wander", kind: "explore", area: "San Francisco", d: 55, c: [0, 40], t: 90, e: [3, 5], v: ["explore", "adventurous", "interesting"], s: "outdoor", so: "med", th: "low", f: [], u: 2, desc: "Vintage shops and weird wonderful people. Keep an open mind.", q: "Haight Ashbury San Francisco" },
    { id: "mission-food", n: "Mission food crawl", kind: "food", area: "San Francisco", d: 55, c: [40, 80], t: 120, e: [3, 5], v: ["food", "adventurous", "explore"], s: "mix", so: "med", th: "low", f: ["Mexican", "Something new"], u: 2, desc: "Burrito, then pupusas, then something you've never heard of. Pace yourselves.", q: "Mission District food San Francisco" },
    { id: "neighborhood-roulette", n: "Random neighborhood draw", kind: "explore", area: "Bay Area", d: 40, c: [20, 60], t: 120, e: [3, 5], v: ["adventurous", "explore", "silly"], s: "mix", so: "med", th: "low", f: [], u: 2, desc: "Close your eyes, point at the map. Eat at the first 4.5-star spot you find there.", q: "Bay Area neighborhoods" }
  );

  /* ---------------- ACTIVITIES & ENTERTAINMENT ---------------- */
  VENUES.push(
    { id: "movies", n: "Movie night out", kind: "entertainment", area: "Peninsula", d: 15, c: [30, 50], t: 150, e: [1, 4], v: ["cozy", "entertainment"], s: "indoor", so: "low", th: "low", f: [], u: 0, desc: "Big screen, bigger popcorn. The zero-decision classic.", q: "movie theater near Menlo Park CA" },
    { id: "drivein", n: "West Wind drive-in", kind: "entertainment", area: "San Jose", d: 35, c: [25, 45], t: 150, e: [1, 4], v: ["romantic", "silly", "cozy"], s: "outdoor", so: "low", th: "low", f: [], u: 2, desc: "A real drive-in theater. Bring blankets and gas-station snacks like teenagers.", q: "West Wind Capitol Drive-In San Jose" },
    { id: "karaoke-sj", n: "Karaoke in K-town", kind: "entertainment", area: "San Jose", d: 32, c: [40, 80], t: 120, e: [3, 5], v: ["silly", "playful", "entertainment", "latenight"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Private room, zero audience, maximum drama. Duets only.", q: "karaoke San Jose CA" },
    { id: "escape", n: "Escape room", kind: "activity", area: "Peninsula", d: 20, c: [60, 90], t: 75, e: [3, 5], v: ["playful", "interesting", "adventurous"], s: "indoor", so: "low", th: "high", f: [], u: 1, desc: "You two against the clock. Find out how you handle pressure together.", q: "escape room near Menlo Park CA" },
    { id: "arcade", n: "Arcade / pinball night", kind: "activity", area: "Peninsula", d: 18, c: [20, 40], t: 75, e: [2, 5], v: ["playful", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Twenty dollars in quarters and a high-score rivalry.", q: "arcade near Menlo Park CA" },
    { id: "bowling", n: "Bowling", kind: "activity", area: "Peninsula", d: 18, c: [30, 55], t: 90, e: [2, 5], v: ["playful", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 0, desc: "Loser buys dessert. Gutter balls are a love language.", q: "bowling near Menlo Park CA" },
    { id: "minigolf", n: "Mini golf", kind: "activity", area: "Peninsula", d: 20, c: [25, 45], t: 75, e: [2, 5], v: ["playful", "silly", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Windmills, trash talk, and a comeback on hole 17.", q: "mini golf near Menlo Park CA" },
    { id: "boardgame-cafe", n: "Board game café", kind: "activity", area: "Peninsula", d: 18, c: [20, 40], t: 120, e: [1, 4], v: ["playful", "cozy", "interesting"], s: "indoor", so: "med", th: "med", f: ["Coffee", "Dessert"], u: 0, desc: "Hundreds of games, someone to teach them, and snacks on demand.", q: "board game cafe Bay Area CA" },
    { id: "comedy", n: "Comedy show", kind: "entertainment", area: "Bay Area", d: 30, c: [40, 90], t: 120, e: [2, 5], v: ["silly", "entertainment", "latenight"], s: "indoor", so: "high", th: "low", f: [], u: 1, desc: "Laugh until it hurts. Don't sit in the front row.", q: "comedy show Bay Area tonight" },
    { id: "jazz", n: "Live jazz night", kind: "entertainment", area: "Bay Area", d: 30, c: [40, 100], t: 120, e: [2, 5], v: ["romantic", "entertainment"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Dim lights, live horns, and a table for two.", q: "live jazz Bay Area" },
    { id: "theater", n: "Community theater", kind: "entertainment", area: "Peninsula", d: 20, c: [40, 80], t: 150, e: [2, 4], v: ["interesting", "entertainment", "romantic"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Local theater is weird and wonderful. Go in with zero expectations.", q: "community theater Peninsula Bay Area" },
    { id: "cantor", n: "Cantor Arts Center", kind: "culture", area: "Stanford", d: 12, c: [0, 10], t: 75, e: [2, 4], v: ["interesting", "peaceful", "romantic"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "Free, beautiful, and way quieter than you'd expect. Wander the Rodin garden after.", q: "Cantor Arts Center Stanford" },
    { id: "techmuseum", n: "The Tech Interactive", kind: "culture", area: "San Jose", d: 30, c: [30, 50], t: 120, e: [2, 5], v: ["playful", "interesting"], s: "indoor", so: "med", th: "med", f: [], u: 1, desc: "A science museum that wants you to touch everything. Act like kids.", q: "The Tech Interactive San Jose" },
    { id: "winchester", n: "Winchester Mystery House", kind: "activity", area: "San Jose", d: 32, c: [40, 70], t: 90, e: [2, 5], v: ["interesting", "adventurous", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "A mansion built by someone who refused to stop renovating. Respect.", q: "Winchester Mystery House San Jose" },
    { id: "paintnite", n: "Paint & sip night", kind: "creative", area: "Peninsula", d: 20, c: [50, 90], t: 120, e: [2, 4], v: ["creative", "romantic", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Two canvases, one bottle of wine, zero artistic standards.", q: "paint and sip Bay Area" },
    { id: "pottery", n: "Pottery class", kind: "creative", area: "Peninsula", d: 22, c: [60, 110], t: 120, e: [2, 4], v: ["creative", "romantic"], s: "indoor", so: "med", th: "med", f: [], u: 1, desc: "Ghost-style, minus the pressure. Your lopsided mugs will be treasures.", q: "pottery class Bay Area" },
    { id: "cookingclass", n: "Cooking class for two", kind: "creative", area: "Peninsula", d: 20, c: [80, 140], t: 150, e: [2, 5], v: ["food", "creative", "interesting"], s: "indoor", so: "med", th: "med", f: ["Something new"], u: 1, desc: "Learn a cuisine together, then eat your homework.", q: "cooking class Bay Area couples" },
    { id: "bookstore", n: "Bookstore + coffee mission", kind: "explore", area: "Palo Alto", d: 12, c: [10, 30], t: 60, e: [1, 4], v: ["cozy", "interesting", "talk"], s: "indoor", so: "low", th: "low", f: ["Coffee"], u: 0, desc: "Each person picks a book for the other. Wrap them. Exchange at dessert.", q: "bookstore Palo Alto CA" },
    { id: "grocery-adventure", n: "International grocery adventure", kind: "explore", area: "Mountain View", d: 18, c: [20, 40], t: 60, e: [2, 5], v: ["explore", "playful", "interesting", "food"], s: "indoor", so: "low", th: "low", f: ["Something new"], u: 2, desc: "Find the weirdest snack in the store. Buy it. Regret nothing.", q: "Asian grocery store Mountain View CA" }
  );

  /* ---------------- SEASONAL ---------------- */
  VENUES.push(
    { id: "lights-drive", n: "Holiday lights drive", kind: "view", area: "Peninsula", d: 15, c: [5, 20], t: 60, e: [1, 5], v: ["romantic", "cozy", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Thermoses of hot chocolate required. Loser of rock-paper-scissors drives.", q: "Christmas lights neighborhoods Bay Area", seas: ["dec"] },
    { id: "mooncake", n: "Mid-Autumn mooncakes + lantern walk", kind: "dessert", area: "Mountain View", d: 18, c: [15, 35], t: 75, e: [1, 5], v: ["food", "romantic", "meaningful"], s: "mix", so: "low", th: "low", f: ["Dessert", "Chinese"], u: 1, desc: "Mooncakes from the bakery, then a slow walk under the actual moon.", q: "mooncakes Mountain View CA", seas: ["midautumn"] },
    { id: "nightmarket", n: "Night market evening", kind: "food", area: "Bay Area", d: 30, c: [20, 50], t: 120, e: [2, 5], v: ["food", "explore", "adventurous"], s: "outdoor", so: "high", th: "low", f: ["Something new"], u: 2, desc: "Lanterns, street food, crowds. Summer nights were made for this.", q: "night market Bay Area", seas: ["summer", "midautumn"] },
    { id: "pumpkin", n: "Pumpkin patch + cider", kind: "explore", area: "Half Moon Bay", d: 32, c: [15, 40], t: 90, e: [2, 5], v: ["silly", "romantic", "explore"], s: "outdoor", so: "med", th: "low", f: [], u: 1, desc: "Pick the ugliest pumpkin. Carve it at home. Name it.", q: "pumpkin patch Half Moon Bay", seas: ["fall"] },
    { id: "valentine", n: "Fancy Valentine's dinner", kind: "food", area: "Palo Alto", d: 12, c: [120, 200], t: 120, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Italian", "Surprise us"], u: 0, desc: "The one night a year where over-the-top is the whole point.", q: "romantic restaurant Palo Alto CA", seas: ["feb"] }
  );

  /* ---------------- FAITH ---------------- */
  VENUES.push(
    { id: "prayerwalk", n: "Evening prayer walk", kind: "faith", area: "Menlo Park", d: 6, c: [0, 0], t: 40, e: [1, 5], v: ["meaningful", "peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Walk the neighborhood and pray out loud for each other. Simple, powerful.", q: "Bedwell Bayfront Park Menlo Park CA", faith: true },
    { id: "worship-night", n: "Worship night", kind: "faith", area: "Peninsula", d: 15, c: [0, 20], t: 60, e: [1, 4], v: ["meaningful", "peaceful"], s: "indoor", so: "med", th: "low", f: [], u: 0, desc: "Find a midweek worship gathering, or make your own in the living room.", q: "worship night Bay Area church", faith: true },
    { id: "serve", n: "Serve together", kind: "faith", area: "Peninsula", d: 20, c: [0, 20], t: 120, e: [2, 4], v: ["meaningful", "interesting"], s: "mix", so: "med", th: "low", f: [], u: 1, desc: "Pack food boxes, write encouragement notes, show up for someone.", q: "volunteer opportunities Peninsula Bay Area", faith: true },
    { id: "gratitude-walk", n: "Gratitude walk + dessert", kind: "faith", area: "Palo Alto", d: 12, c: [10, 25], t: 60, e: [1, 5], v: ["meaningful", "peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Take turns naming things you're grateful for. End with something sweet.", q: "Stanford Dish trail Palo Alto", faith: true }
  );

  /* ---------------- STAY-HOME IDEAS ----------------
     Schema: { id, n, desc, c:[lo,hi], t, e:[lo,hi], v:[...], twist, faith? } */
  var HOME_IDEAS = [
    { id: "h-pizza", n: "Homemade pizza showdown", desc: "Dough from the store, toppings from the fridge.", c: [15, 30], t: 90, e: [2, 5], v: ["playful", "food", "creative"], twist: "Each person makes a pizza for the other. Blind judging. Loser does dishes." },
    { id: "h-sushi", n: "Sushi-making night", desc: "Grocery-store fish, a YouTube tutorial, zero judgment.", c: [20, 40], t: 90, e: [2, 5], v: ["food", "creative", "playful"], twist: "Ugliest roll has to be eaten first. Chopstick-only rule." },
    { id: "h-dumpling", n: "Dumpling folding battle", desc: "Premade wrappers, your favorite filling.", c: [15, 30], t: 90, e: [2, 5], v: ["food", "playful"], twist: "Fold 20 each. Prettiest 5 get photographed; the rest get eaten." },
    { id: "h-tastetest", n: "$20 convenience store taste test", desc: "The legendary format.", c: [20, 20], t: 75, e: [1, 5], v: ["silly", "playful", "food"], twist: "Each person gets $10 and 15 minutes: one drink, one sweet, one salty, one wildcard. Blindfold taste-off. Winner picks the movie." },
    { id: "h-mystery", n: "Mystery ingredient challenge", desc: "Chopped, but make it romantic.", c: [15, 30], t: 90, e: [3, 5], v: ["creative", "food", "playful"], twist: "Each picks one mystery ingredient for the other. 45 minutes. Go." },
    { id: "h-coop", n: "Co-op game night", desc: "One couch, one screen, one shared objective.", c: [0, 0], t: 120, e: [1, 4], v: ["playful", "cozy"], twist: "Loser makes the snacks for round two. No mercy, no pausing." },
    { id: "h-puzzle", n: "Puzzle + playlist night", desc: "1000 pieces of quiet teamwork.", c: [0, 15], t: 120, e: [1, 3], v: ["cozy", "peaceful"], twist: "Each person adds 10 songs to a shared playlist as you go. No skips." },
    { id: "h-movie", n: "Movie with a twist", desc: "Not just a movie. A production.", c: [0, 15], t: 150, e: [1, 3], v: ["cozy", "silly"], twist: "Theme the snacks to the movie. Costumes optional but encouraged. Phones in another room." },
    { id: "h-doc", n: "Documentary + debate", desc: "Learn something, then argue about it lovingly.", c: [0, 0], t: 120, e: [1, 4], v: ["interesting", "talk"], twist: "Each person picks a documentary for the other. Loser of rock-paper-scissors goes first." },
    { id: "h-spa", n: "Spa night", desc: "The bathroom becomes a resort.", c: [10, 30], t: 75, e: [1, 2], v: ["romantic", "peaceful", "cozy"], twist: "Face masks, foot soaks, phone on silent. Take turns giving shoulder massages." },
    { id: "h-picnic", n: "Indoor picnic", desc: "Blanket fort on the living room floor.", c: [20, 40], t: 75, e: [1, 4], v: ["romantic", "cozy", "food"], twist: "Fancy cheese mandatory. Eat by candlelight. No utensils for dessert." },
    { id: "h-boba", n: "Blind boba experiment", desc: "Science, but delicious.", c: [12, 20], t: 45, e: [1, 5], v: ["silly", "food", "playful"], twist: "Buy 4 different bobas. Taste blind, rank them, defend your rankings." },
    { id: "h-tea", n: "Tea tasting", desc: "Slow down on purpose.", c: [5, 15], t: 45, e: [1, 3], v: ["peaceful", "cozy"], twist: "Three teas, scored on aroma, taste, and vibes. Winner is the evening's tea master." },
    { id: "h-trip", n: "Trip-planning night", desc: "Dream out loud together.", c: [0, 0], t: 90, e: [1, 4], v: ["interesting", "talk", "meaningful"], twist: "Pick a dream trip (Seoul? Shanghai?). Plan it like it's happening next month." },
    { id: "h-photos", n: "Photo-memory night", desc: "Your camera roll is a time machine.", c: [0, 0], t: 60, e: [1, 3], v: ["romantic", "talk", "meaningful"], twist: "Scroll to this month last year. Tell the stories again. Pick 5 to print." },
    { id: "h-bible", n: "Bible study for two", desc: "One passage, two perspectives.", c: [0, 0], t: 45, e: [1, 4], v: ["meaningful", "peaceful"], twist: "Read a short passage somewhere cozy. Each shares one thing that stood out.", faith: true },
    { id: "h-prayer", n: "Prayer + worship night", desc: "Slow, unhurried, together.", c: [0, 0], t: 45, e: [1, 3], v: ["meaningful", "peaceful"], twist: "Play a worship playlist. Pray out loud for each other. No rushing.", faith: true },
    { id: "h-cards", n: "Conversation cards", desc: "Questions you'd never think to ask.", c: [0, 10], t: 60, e: [1, 4], v: ["talk", "meaningful", "romantic"], twist: "Write 10 questions for each other. Draw randomly. Answer honestly." },
    { id: "h-fakevacay", n: "Fake vacation draft", desc: "Fantasy sports, but for trips.", c: [0, 0], t: 75, e: [2, 4], v: ["silly", "creative", "talk"], twist: "$500 budget, two weeks. Present competing itineraries. Winner gets bragging rights." },
    { id: "h-draw", n: "Drawing challenge", desc: "No erasing. That's the rule.", c: [0, 10], t: 60, e: [1, 4], v: ["creative", "silly", "playful"], twist: "Draw each other from memory in 10 minutes. Sign and date the masterpieces." },
    { id: "h-bake", n: "Baking challenge", desc: "Flour everywhere, love everywhere.", c: [10, 25], t: 90, e: [2, 4], v: ["food", "creative", "playful"], twist: "Same recipe, separate batches. Blind taste test. Loser cleans the kitchen." },
    { id: "h-snacks", n: "International snack tasting", desc: "A world tour from the couch.", c: [25, 45], t: 60, e: [1, 5], v: ["food", "playful", "interesting"], twist: "Grocery run first (Mitsuwa? Ranch 99?), then rate everything 1–10." },
    { id: "h-stars", n: "Backyard stargazing", desc: "The universe is free.", c: [0, 10], t: 60, e: [1, 3], v: ["romantic", "peaceful"], twist: "Blanket, hot drinks, and a constellation app. Find three you didn't know." },
    { id: "h-build", n: "Build something together", desc: "Teamwork you can touch.", c: [0, 20], t: 90, e: [2, 4], v: ["creative", "playful"], twist: "Lego set, that IKEA box, or the thing in the garage. Document the chaos." },
    { id: "h-notes", n: "Encouragement notes night", desc: "Write the things you think but don't say.", c: [0, 5], t: 45, e: [1, 3], v: ["meaningful", "romantic"], twist: "Write each other a letter about the last month. Seal them. Open next year.", faith: true }
  ];

  /* ============================================================
     EXPANSION PACK (2026-09-26)
     127 new venues + 40 new home ideas + weekend-trip dataset.
     All entries follow the schema documented at the top of this file.
     Drive times measured from Menlo Park.
     ============================================================ */

  /* ---------------- MORE FOOD ---------------- */
  VENUES.push(
    { id: "sichuan-mv", n: "Sichuan in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [35, 65], t: 75, e: [2, 5], v: ["food", "adventurous"], s: "indoor", so: "med", th: "low", f: ["Chinese"], u: 1, desc: "Mapo tofu and dan dan noodles. Order the spice level you deserve, not the one you can handle.", q: "Sichuan restaurant Mountain View CA" },
    { id: "cantonese-sm", n: "Cantonese BBQ in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [35, 60], t: 70, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Chinese"], u: 0, desc: "Char siu, roast duck, and rice that needs no introduction.", q: "Cantonese BBQ San Mateo CA" },
    { id: "taiwanese-mv", n: "Taiwanese in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [30, 55], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Chinese"], u: 0, desc: "Beef noodle soup and popcorn chicken. Comfort food with a passport.", q: "Taiwanese restaurant Mountain View CA" },
    { id: "yunnan-sj", n: "Yunnan rice noodles in San Jose", kind: "food", area: "San Jose", d: 30, c: [25, 50], t: 60, e: [2, 5], v: ["food", "interesting"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Noodles"], u: 1, desc: "Crossing-the-bridge noodles, assembled tableside. Dinner and a show.", q: "Yunnan restaurant San Jose CA" },
    { id: "wonton-mv", n: "Wonton noodle shop", kind: "food", area: "Mountain View", d: 18, c: [25, 45], t: 45, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "low", th: "low", f: ["Chinese", "Noodles"], u: 0, desc: "Springy noodles, plump wontons, clear broth. Simple done perfectly.", q: "wonton noodle Mountain View CA" },
    { id: "claypot-sm", n: "Clay pot rice night", kind: "food", area: "San Mateo", d: 20, c: [35, 60], t: 70, e: [2, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Chinese"], u: 1, desc: "Crispy rice crust at the bottom is the whole point. Fight for it politely.", q: "clay pot rice San Mateo CA" },
    { id: "handnoodle-mv", n: "Hand-pulled noodle show", kind: "food", area: "Mountain View", d: 18, c: [25, 50], t: 60, e: [2, 5], v: ["food", "interesting"], s: "indoor", so: "med", th: "low", f: ["Chinese", "Noodles"], u: 2, desc: "Watch them slap and stretch your noodles to order. Dinner with a performance.", q: "hand pulled noodles Mountain View CA" },
    { id: "congee-sm", n: "Late-night congee", kind: "food", area: "San Mateo", d: 20, c: [20, 40], t: 50, e: [1, 4], v: ["food", "cozy", "latenight"], s: "indoor", so: "low", th: "low", f: ["Chinese"], u: 1, desc: "Silky congee and fried dough sticks. The gentlest late-night food there is.", q: "congee San Mateo CA" },
    { id: "kfc-sc", n: "Korean fried chicken in Santa Clara", kind: "food", area: "Santa Clara", d: 28, c: [30, 55], t: 60, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Korean", "Fried chicken"], u: 0, desc: "Twice-fried, impossibly crispy. Get the yangnyeom and thank us later.", q: "Korean fried chicken Santa Clara CA" },
    { id: "soontofu-sc", n: "Soon tofu in Santa Clara", kind: "food", area: "Santa Clara", d: 28, c: [30, 55], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Korean"], u: 0, desc: "Bubbling stone pots of silky tofu soup. Pick your spice, commit fully.", q: "soon tofu Santa Clara CA" },
    { id: "bibimbap-mv", n: "Bibimbap in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [30, 50], t: 55, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Korean"], u: 0, desc: "Mix it aggressively. The crispy rice bits are the prize.", q: "bibimbap Mountain View CA" },
    { id: "japcurry-mv", n: "Japanese curry in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [25, 45], t: 50, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "low", th: "low", f: ["Japanese"], u: 0, desc: "Thick, sweet-savory curry over rice. The hug of Japanese comfort food.", q: "Japanese curry Mountain View CA" },
    { id: "udon-pa", n: "Udon in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [25, 45], t: 50, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "low", th: "low", f: ["Japanese", "Noodles"], u: 0, desc: "Chewy handmade noodles in clean broth. Slurping is mandatory.", q: "udon Palo Alto CA" },
    { id: "omakase-pa", n: "Omakase in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [150, 260], t: 120, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Japanese", "Sushi"], u: 1, desc: "Put yourselves in the chef's hands. Twelve courses of pure trust.", q: "omakase Palo Alto CA" },
    { id: "shabu-sm", n: "Shabu-shabu in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [45, 75], t: 80, e: [2, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Japanese"], u: 0, desc: "Swish-swish. Thin-sliced beef, two dipping sauces, total zen.", q: "shabu shabu San Mateo CA" },
    { id: "teppan-sj", n: "Teppanyaki in San Jose", kind: "food", area: "San Jose", d: 30, c: [60, 100], t: 90, e: [3, 5], v: ["food", "playful", "entertainment"], s: "indoor", so: "med", th: "low", f: ["Japanese"], u: 1, desc: "Onion volcano. Shrimp in the pocket. Dinner and a show, literally.", q: "teppanyaki San Jose CA" },
    { id: "pho-sj", n: "Pho in Little Saigon", kind: "food", area: "San Jose", d: 32, c: [25, 45], t: 55, e: [1, 5], v: ["food"], s: "indoor", so: "med", th: "low", f: ["Vietnamese", "Noodles"], u: 0, desc: "San Jose's Little Saigon does pho properly. Herbs by the handful.", q: "pho Little Saigon San Jose CA" },
    { id: "banhmi-sj", n: "Banh mi crawl in San Jose", kind: "food", area: "San Jose", d: 32, c: [15, 30], t: 60, e: [2, 5], v: ["food", "playful", "explore"], s: "mix", so: "low", th: "low", f: ["Vietnamese"], u: 1, desc: "Two shops, two sandwiches. Judge the baguette crunch scientifically.", q: "banh mi San Jose CA" },
    { id: "burmese-sm", n: "Burmese in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [30, 55], t: 65, e: [2, 5], v: ["food", "interesting"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Tea leaf salad: fermented, crunchy, unlike anything else. Conversion guaranteed.", q: "Burmese restaurant San Mateo CA" },
    { id: "malaysian-sj", n: "Malaysian in San Jose", kind: "food", area: "San Jose", d: 30, c: [30, 55], t: 65, e: [2, 5], v: ["food", "adventurous"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 2, desc: "Laksa, roti canai, char kuey teow. Three countries on one menu.", q: "Malaysian restaurant San Jose CA" },
    { id: "filipino-dc", n: "Filipino in Daly City", kind: "food", area: "Daly City", d: 40, c: [30, 55], t: 70, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Adobo, sisig, and ube everything for dessert. Daly City is the spot.", q: "Filipino restaurant Daly City CA" },
    { id: "persian-pa", n: "Persian in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [45, 80], t: 80, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Saffron rice, tender kebabs, and the crispiest tahdig you will fight over.", q: "Persian restaurant Palo Alto CA" },
    { id: "turkish-mv", n: "Turkish in Mountain View", kind: "food", area: "Mountain View", d: 18, c: [40, 70], t: 75, e: [2, 5], v: ["food", "cozy"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Pide, kebabs, and baklava that ruins all other baklava.", q: "Turkish restaurant Mountain View CA" },
    { id: "afghan-fremont", n: "Afghan in Fremont", kind: "food", area: "Fremont", d: 40, c: [35, 60], t: 75, e: [2, 5], v: ["food", "interesting"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Fremont's Afghan corridor is legendary. Pumpkin with yogurt sauce. Trust.", q: "Afghan restaurant Fremont CA" },
    { id: "greek-pa", n: "Greek in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [45, 75], t: 75, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Mediterranean"], u: 0, desc: "Grilled octopus, lemon potatoes, and a patio made for lingering.", q: "Greek restaurant Palo Alto CA" },
    { id: "tapas-sf", n: "Tapas in San Francisco", kind: "food", area: "San Francisco", d: 55, c: [60, 110], t: 100, e: [3, 5], v: ["food", "romantic", "adventurous"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Small plates, big night. Order in waves and never stop.", q: "tapas San Francisco CA" },
    { id: "french-pa", n: "French bistro in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [70, 130], t: 100, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["Surprise us"], u: 0, desc: "Duck confit, good wine, low lighting. Fancy without the fuss.", q: "French bistro Palo Alto CA" },
    { id: "steak-pa", n: "Steakhouse in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [120, 220], t: 120, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["American"], u: 0, desc: "The full treat-yourselves playbook: steak, sides, and zero regrets.", q: "steakhouse Palo Alto CA" },
    { id: "seafood-hmb", n: "Seafood in Half Moon Bay", kind: "food", area: "Half Moon Bay", d: 32, c: [60, 110], t: 90, e: [2, 5], v: ["food", "romantic"], s: "indoor", so: "med", th: "low", f: ["American"], u: 1, desc: "Cioppino with an ocean view. Watch the fog roll in over dessert.", q: "seafood restaurant Half Moon Bay CA" },
    { id: "chowder-sf", n: "Clam chowder at the Wharf", kind: "food", area: "San Francisco", d: 55, c: [35, 60], t: 75, e: [2, 5], v: ["food", "explore"], s: "mix", so: "med", th: "low", f: ["American"], u: 1, desc: "Bread bowl, sea lions, and the tourist thing done right.", q: "clam chowder Fisherman's Wharf San Francisco" },
    { id: "deli-pa", n: "Jewish deli in Palo Alto", kind: "food", area: "Palo Alto", d: 12, c: [30, 55], t: 60, e: [1, 5], v: ["food", "cozy"], s: "indoor", so: "low", th: "low", f: ["American"], u: 0, desc: "Pastrami stacked to the ceiling. Split a pickle, obviously.", q: "deli Palo Alto CA" },
    { id: "hawaiian-sm", n: "Hawaiian in San Mateo", kind: "food", area: "San Mateo", d: 20, c: [30, 55], t: 60, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Spam musubi, loco moco, and shave ice for dessert. Aloha, weeknight.", q: "Hawaiian restaurant San Mateo CA" },
    { id: "cuban-rc", n: "Cuban in Redwood City", kind: "food", area: "Redwood City", d: 12, c: [35, 60], t: 70, e: [2, 5], v: ["food", "playful"], s: "indoor", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Ropa vieja and plantains with live-music energy.", q: "Cuban restaurant Redwood City CA" },
    { id: "tacotruck-epa", n: "Taco truck run", kind: "food", area: "East Palo Alto", d: 10, c: [15, 30], t: 30, e: [2, 5], v: ["food", "silly", "latenight"], s: "outdoor", so: "low", th: "low", f: ["Mexican"], u: 1, desc: "Al pastor off the trompo late at night. Some of the best tacos have no address.", q: "taco truck East Palo Alto CA" }
  );

  /* ---------------- MORE DESSERT & DRINKS ---------------- */
  VENUES.push(
    { id: "gelato-pa", n: "Gelato in Palo Alto", kind: "dessert", area: "Palo Alto", d: 12, c: [10, 20], t: 25, e: [1, 5], v: ["food", "romantic"], s: "outdoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Pistachio vs. stracciatella. There are no wrong answers.", q: "gelato Palo Alto CA" },
    { id: "churro-rc", n: "Churros in Redwood City", kind: "dessert", area: "Redwood City", d: 12, c: [10, 20], t: 30, e: [1, 5], v: ["food", "playful"], s: "mix", so: "low", th: "low", f: ["Dessert", "Mexican"], u: 0, desc: "Fresh, hot, cinnamon-dusted. Get the cajeta dip.", q: "churros Redwood City CA" },
    { id: "matcha-pa", n: "Matcha cafe in Palo Alto", kind: "drink", area: "Palo Alto", d: 12, c: [12, 25], t: 40, e: [1, 5], v: ["cozy", "peaceful"], s: "indoor", so: "low", th: "low", f: ["Coffee"], u: 0, desc: "Ceremonial-grade calm. Try the strawberry matcha cloud.", q: "matcha cafe Palo Alto CA" },
    { id: "shavedice-mv", n: "Taiwanese shaved ice", kind: "dessert", area: "Mountain View", d: 18, c: [12, 25], t: 35, e: [1, 5], v: ["food", "playful"], s: "indoor", so: "low", th: "low", f: ["Dessert", "Chinese"], u: 1, desc: "Fluffy milk snow with mango and condensed milk. Share or don't.", q: "Taiwanese shaved ice Mountain View CA" },
    { id: "taiyaki-sj", n: "Taiyaki in San Jose", kind: "dessert", area: "San Jose", d: 30, c: [10, 20], t: 30, e: [1, 5], v: ["food", "silly"], s: "indoor", so: "low", th: "low", f: ["Dessert", "Japanese"], u: 1, desc: "Fish-shaped cakes with custard inside. Eat the tail first. Rules are rules.", q: "taiyaki San Jose CA" },
    { id: "frenchbakery-pa", n: "French bakery run", kind: "dessert", area: "Palo Alto", d: 12, c: [15, 30], t: 35, e: [1, 5], v: ["food", "romantic"], s: "indoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Croissants, caneles, and a box to take home for tomorrow.", q: "French bakery Palo Alto CA" },
    { id: "winebar-la", n: "Wine bar in Los Altos", kind: "drink", area: "Los Altos", d: 15, c: [40, 80], t: 90, e: [2, 5], v: ["romantic", "cozy", "talk"], s: "indoor", so: "low", th: "low", f: [], u: 0, desc: "Flights, a cheese plate, and a long slow evening.", q: "wine bar Los Altos CA" },
    { id: "sake-sj", n: "Sake tasting in San Jose", kind: "drink", area: "San Jose", d: 30, c: [50, 90], t: 75, e: [2, 5], v: ["interesting", "food"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Junmai vs. ginjo, explained by someone passionate. You will have opinions after.", q: "sake tasting San Jose CA" },
    { id: "speakeasy-sf", n: "Speakeasy in San Francisco", kind: "drink", area: "San Francisco", d: 55, c: [50, 100], t: 90, e: [3, 5], v: ["romantic", "entertainment", "latenight"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "Unmarked door, craft cocktails, main-character energy.", q: "speakeasy San Francisco CA" },
    { id: "hotchoc-pa", n: "Hot chocolate crawl", kind: "dessert", area: "Palo Alto", d: 12, c: [15, 30], t: 60, e: [1, 5], v: ["food", "cozy", "romantic"], s: "mix", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Three cafes, three hot chocolates, one winner. December only.", q: "hot chocolate Palo Alto CA", seas: ["dec"] }
  );

  /* ---------------- MORE WALKS, VIEWS & OUTDOORS ---------------- */
  VENUES.push(
    { id: "dish", n: "Stanford Dish hike", kind: "walk", area: "Stanford", d: 12, c: [0, 5], t: 90, e: [3, 5], v: ["peaceful", "adventurous"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "The classic Bay Area hill. Cows, views, and a real sense of accomplishment.", q: "Stanford Dish trail" },
    { id: "bigwalk", n: "The big walk", kind: "walk", area: "Peninsula", d: 12, c: [0, 10], t: 150, e: [3, 5], v: ["peaceful", "talk", "adventurous"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Pick the longest trail and commit: three hours, no phones, one big conversation.", q: "Sawyer Camp Trail San Mateo CA" },
    { id: "rancho", n: "Rancho San Antonio", kind: "walk", area: "Los Altos", d: 15, c: [0, 5], t: 90, e: [2, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Deer, wild turkeys, and a historic farm. The easy wild.", q: "Rancho San Antonio Los Altos" },
    { id: "pulgas", n: "Pulgas Ridge", kind: "walk", area: "San Carlos", d: 12, c: [0, 5], t: 75, e: [3, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "A real climb with a real payoff view. Awe guaranteed.", q: "Pulgas Ridge Preserve" },
    { id: "filoli", n: "Filoli Gardens", kind: "culture", area: "Woodside", d: 15, c: [40, 70], t: 120, e: [2, 5], v: ["romantic", "peaceful", "interesting"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "A grand estate fifteen minutes away. Gardens that end arguments.", q: "Filoli Gardens Woodside CA" },
    { id: "huddart", n: "Huddart Park redwoods", kind: "walk", area: "Woodside", d: 18, c: [0, 10], t: 120, e: [3, 5], v: ["peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Old-growth redwoods without the Santa Cruz crowds.", q: "Huddart Park Woodside CA" },
    { id: "wunderlich", n: "Wunderlich Park", kind: "walk", area: "Woodside", d: 15, c: [0, 5], t: 90, e: [3, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Redwoods and a historic stable. Quiet even on weekends.", q: "Wunderlich Park Woodside CA" },
    { id: "pescadero", n: "Pescadero pie run", kind: "explore", area: "Pescadero", d: 35, c: [15, 40], t: 150, e: [2, 5], v: ["food", "explore", "romantic"], s: "mix", so: "low", th: "low", f: [], u: 1, desc: "Drive the coast, eat the famous pie, say hi to the farm goats.", q: "Pescadero CA pie" },
    { id: "pigeon", n: "Pigeon Point Lighthouse", kind: "view", area: "Pescadero", d: 40, c: [0, 15], t: 75, e: [2, 5], v: ["romantic", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "One of the tallest lighthouses in America, all to yourselves at sunset.", q: "Pigeon Point Lighthouse" },
    { id: "fitzgerald", n: "Fitzgerald Marine Reserve", kind: "explore", area: "Moss Beach", d: 35, c: [0, 10], t: 90, e: [2, 5], v: ["interesting", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Tidepools full of starfish at low tide. Check the tide chart first.", q: "Fitzgerald Marine Reserve Moss Beach" },
    { id: "devilsslide", n: "Devil's Slide Trail", kind: "walk", area: "Pacifica", d: 35, c: [0, 10], t: 90, e: [3, 5], v: ["adventurous", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "A cliffside trail over the ocean. Dramatic in the best way.", q: "Devil's Slide Trail Pacifica" },
    { id: "mori", n: "Mori Point", kind: "walk", area: "Pacifica", d: 35, c: [0, 10], t: 60, e: [2, 5], v: ["peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Short climb, huge ocean payoff. Whale spotting in season.", q: "Mori Point Pacifica" },
    { id: "montara", n: "Montara Mountain", kind: "walk", area: "Montara", d: 38, c: [0, 10], t: 150, e: [4, 5], v: ["adventurous"], s: "outdoor", so: "low", th: "low", f: [], u: 2, desc: "The real deal: a serious climb. Bring water and earn the view.", q: "Montara Mountain Trail" },
    { id: "sanpedro", n: "San Pedro Valley Park", kind: "walk", area: "Pacifica", d: 35, c: [0, 5], t: 90, e: [2, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Waterfall trail in winter, wildflowers in spring. Always quiet.", q: "San Pedro Valley Park Pacifica" },
    { id: "landsend", n: "Lands End", kind: "walk", area: "San Francisco", d: 55, c: [0, 15], t: 120, e: [3, 5], v: ["adventurous", "romantic", "explore"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Cypress cliffs, the ocean, and the Sutro Baths ruins. The city's best walk.", q: "Lands End San Francisco" },
    { id: "sutro", n: "Sutro Baths ruins at sunset", kind: "view", area: "San Francisco", d: 55, c: [0, 10], t: 60, e: [2, 5], v: ["romantic", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Crumbling bathhouse ruins against the Pacific. Hauntingly beautiful.", q: "Sutro Baths San Francisco" },
    { id: "coyote", n: "Coyote Point", kind: "walk", area: "San Mateo", d: 18, c: [0, 10], t: 60, e: [1, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Bay views, a marina, and planes landing overhead. Underrated.", q: "Coyote Point San Mateo" },
    { id: "fosterlevee", n: "Foster City levee walk", kind: "walk", area: "Foster City", d: 15, c: [0, 5], t: 60, e: [1, 5], v: ["peaceful", "talk"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Flat, easy, and glowing at golden hour. The zero-excuses walk.", q: "Foster City levee" },
    { id: "alviso", n: "Alviso Marina County Park", kind: "explore", area: "Alviso", d: 28, c: [0, 5], t: 60, e: [1, 5], v: ["interesting", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 2, desc: "A ghost-town marina on the bay's edge. Weird, quiet, wonderful.", q: "Alviso Marina County Park" },
    { id: "donedwards", n: "Don Edwards Wildlife Refuge", kind: "walk", area: "Fremont", d: 25, c: [0, 5], t: 60, e: [1, 5], v: ["peaceful", "interesting"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Salt ponds, boardwalks, and a million birds. Bring binoculars.", q: "Don Edwards National Wildlife Refuge" },
    { id: "foothills", n: "Foothills Nature Preserve", kind: "walk", area: "Palo Alto", d: 12, c: [0, 5], t: 75, e: [2, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Palo Alto's hidden 1,400 acres. Lake, meadows, total calm.", q: "Foothills Nature Preserve Palo Alto" },
    { id: "arastradero", n: "Arastradero Preserve", kind: "walk", area: "Palo Alto", d: 12, c: [0, 5], t: 75, e: [2, 5], v: ["peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Rolling grasslands and a lake loop. The locals' favorite.", q: "Pearson Arastradero Preserve Palo Alto" },
    { id: "applepick", n: "Apple picking", kind: "explore", area: "Pescadero", d: 35, c: [15, 40], t: 90, e: [2, 5], v: ["playful", "food"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Fill a bag, eat three on the spot. Cider donuts mandatory.", q: "apple picking Pescadero CA", seas: ["fall"] }
  );

  /* ---------------- MORE CITY EXPLORING ---------------- */
  VENUES.push(
    { id: "losaltos-dt", n: "Downtown Los Altos", kind: "explore", area: "Los Altos", d: 15, c: [0, 40], t: 60, e: [1, 5], v: ["explore", "cozy"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Small-town main street with genuinely good food. Low key, high charm.", q: "downtown Los Altos CA" },
    { id: "losgatos-dt", n: "Los Gatos evening", kind: "explore", area: "Los Gatos", d: 28, c: [0, 50], t: 90, e: [2, 5], v: ["explore", "romantic"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Cute downtown, wine bars, and mountain-town energy.", q: "downtown Los Gatos CA" },
    { id: "saratoga", n: "Saratoga village", kind: "explore", area: "Saratoga", d: 30, c: [0, 40], t: 75, e: [2, 5], v: ["explore", "peaceful"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "One perfect street: wine tasting, bookshop, dinner.", q: "Saratoga village CA" },
    { id: "campbell-dt", n: "Downtown Campbell", kind: "explore", area: "Campbell", d: 28, c: [0, 40], t: 75, e: [2, 5], v: ["explore", "playful"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Fun main street with a retro theater and great patios.", q: "downtown Campbell CA" },
    { id: "willowglen", n: "Willow Glen", kind: "explore", area: "San Jose", d: 30, c: [0, 40], t: 75, e: [1, 5], v: ["explore", "cozy"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Tree-lined Lincoln Ave: antiques, bakeries, and ice cream.", q: "Willow Glen San Jose CA" },
    { id: "burlingame", n: "Burlingame Ave", kind: "explore", area: "Burlingame", d: 20, c: [0, 50], t: 75, e: [2, 5], v: ["explore", "romantic"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "The Peninsula's prettiest shopping street. Window-shop, then commit.", q: "Burlingame Avenue CA" },
    { id: "sancarlos", n: "Laurel Street, San Carlos", kind: "explore", area: "San Carlos", d: 15, c: [0, 40], t: 60, e: [1, 5], v: ["explore", "cozy"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "The City of Good Living lives up to it. Easy, walkable, tasty.", q: "Laurel Street San Carlos CA" },
    { id: "hmb-dt", n: "Half Moon Bay downtown", kind: "explore", area: "Half Moon Bay", d: 32, c: [0, 40], t: 75, e: [2, 5], v: ["explore", "romantic"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Main Street shops, then the beach for sunset. The full combo.", q: "downtown Half Moon Bay CA" },
    { id: "pacifica", n: "Pacifica pier + tacos", kind: "explore", area: "Pacifica", d: 35, c: [20, 50], t: 90, e: [2, 5], v: ["explore", "food"], s: "mix", so: "med", th: "low", f: ["Mexican"], u: 1, desc: "Watch surfers from the pier, then find the taco spot the locals queue for.", q: "Pacifica pier CA" },
    { id: "sausalito", n: "Sausalito evening", kind: "explore", area: "Sausalito", d: 60, c: [20, 60], t: 120, e: [2, 5], v: ["explore", "romantic"], s: "mix", so: "med", th: "low", f: [], u: 1, desc: "Across the bridge for waterfront wine and houseboat dreams.", q: "downtown Sausalito CA" },
    { id: "menlopark-dt", n: "Downtown Menlo Park", kind: "explore", area: "Menlo Park", d: 6, c: [0, 30], t: 60, e: [1, 5], v: ["explore", "cozy"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Your own downtown, finally explored properly. Santa Cruz Ave has range.", q: "Santa Cruz Avenue Menlo Park CA" },
    { id: "stanfordmall", n: "Stanford Shopping Center stroll", kind: "explore", area: "Palo Alto", d: 12, c: [0, 40], t: 60, e: [1, 5], v: ["explore"], s: "mix", so: "med", th: "low", f: [], u: 0, desc: "Open-air, flowers everywhere, and a fancy grocery for snack supplies.", q: "Stanford Shopping Center Palo Alto" }
  );

  /* ---------------- MORE ACTIVITIES & ENTERTAINMENT ---------------- */
  VENUES.push(
    { id: "iceskate", n: "Ice skating", kind: "activity", area: "Peninsula", d: 25, c: [30, 60], t: 90, e: [2, 5], v: ["playful", "romantic"], s: "indoor", so: "low", th: "low", f: [], u: 1, desc: "Hold hands, fall down, laugh about it. Winter's best date.", q: "ice skating rink Bay Area CA", seas: ["dec", "feb"] },
    { id: "climbing", n: "Indoor climbing", kind: "activity", area: "Peninsula", d: 25, c: [40, 70], t: 120, e: [3, 5], v: ["playful", "adventurous"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Belay each other. Trust falls, but vertical and fun.", q: "indoor climbing gym Bay Area CA" },
    { id: "axethrow", n: "Axe throwing", kind: "activity", area: "Peninsula", d: 25, c: [50, 80], t: 75, e: [3, 5], v: ["playful", "silly", "adventurous"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "Surprisingly therapeutic. Loser admits the other is always right.", q: "axe throwing Bay Area CA" },
    { id: "archery", n: "Archery range", kind: "activity", area: "Bay Area", d: 30, c: [50, 90], t: 90, e: [2, 5], v: ["interesting", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "Channel your inner archer. Beginner lessons make it easy.", q: "archery range Bay Area CA" },
    { id: "vr", n: "VR arcade", kind: "activity", area: "Peninsula", d: 20, c: [40, 80], t: 75, e: [2, 5], v: ["playful", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Fight zombies, climb Everest, or just flail hilariously.", q: "VR arcade Bay Area CA" },
    { id: "gokart", n: "Go-karting", kind: "activity", area: "Bay Area", d: 30, c: [60, 100], t: 75, e: [3, 5], v: ["playful", "silly"], s: "outdoor", so: "med", th: "low", f: [], u: 1, desc: "Settle every argument at 40 mph. Photo finish required.", q: "go kart Bay Area CA" },
    { id: "topgolf", n: "Topgolf", kind: "activity", area: "San Jose", d: 32, c: [60, 110], t: 120, e: [2, 5], v: ["playful", "food"], s: "outdoor", so: "med", th: "low", f: [], u: 1, desc: "Golf for people who don't golf. Nachos between swings.", q: "Topgolf San Jose CA" },
    { id: "drivingrange", n: "Driving range", kind: "activity", area: "Peninsula", d: 15, c: [20, 45], t: 60, e: [2, 5], v: ["playful"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Whack a bucket of balls into the void. Cheap therapy.", q: "driving range near Menlo Park CA" },
    { id: "batting", n: "Batting cages", kind: "activity", area: "Peninsula", d: 25, c: [25, 50], t: 60, e: [2, 5], v: ["playful", "silly"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "Take turns pitching and swinging. Home run equals dessert.", q: "batting cages Bay Area CA" },
    { id: "trampoline", n: "Trampoline park", kind: "activity", area: "Bay Area", d: 28, c: [40, 70], t: 75, e: [3, 5], v: ["silly", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Dodgeball on trampolines. You will be sore. Worth it.", q: "trampoline park Bay Area CA" },
    { id: "paddleboard", n: "Paddleboarding at Shoreline", kind: "activity", area: "Mountain View", d: 18, c: [40, 80], t: 90, e: [3, 5], v: ["adventurous", "playful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Calm water, easy rentals, and pelicans as your audience.", q: "paddleboard rental Shoreline Lake Mountain View" },
    { id: "surf", n: "Surf lesson in Pacifica", kind: "activity", area: "Pacifica", d: 38, c: [120, 200], t: 150, e: [4, 5], v: ["adventurous"], s: "outdoor", so: "med", th: "low", f: [], u: 2, desc: "Two hours, one instructor, endless wipeouts. Stand up once and never forget it.", q: "surf lesson Pacifica CA" },
    { id: "salsa", n: "Salsa class", kind: "activity", area: "Peninsula", d: 20, c: [30, 60], t: 90, e: [3, 5], v: ["romantic", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Beginner class, then social dancing. Step on each other's feet lovingly.", q: "salsa class Bay Area CA" },
    { id: "glassblow", n: "Glassblowing class", kind: "creative", area: "Bay Area", d: 30, c: [120, 180], t: 120, e: [2, 4], v: ["creative", "interesting"], s: "indoor", so: "med", th: "med", f: [], u: 2, desc: "Make a paperweight from molten glass. Fire plus art equals unforgettable.", q: "glassblowing class Bay Area CA" },
    { id: "candlemaking", n: "Candle-making workshop", kind: "creative", area: "Peninsula", d: 20, c: [60, 100], t: 90, e: [2, 4], v: ["creative", "romantic"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Blend your own scent. Name it something ridiculous together.", q: "candle making workshop Bay Area CA" },
    { id: "terrarium", n: "Terrarium workshop", kind: "creative", area: "Peninsula", d: 20, c: [50, 90], t: 75, e: [2, 4], v: ["creative", "peaceful"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Build a tiny world in a jar. Keep it alive as a couple's project.", q: "terrarium workshop Bay Area CA" },
    { id: "flowers", n: "Flower arranging class", kind: "creative", area: "Peninsula", d: 18, c: [60, 100], t: 75, e: [2, 4], v: ["creative", "romantic"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Learn the florist's tricks, take home a bouquet you made.", q: "flower arranging class Bay Area CA" },
    { id: "trivia", n: "Trivia night", kind: "entertainment", area: "Peninsula", d: 15, c: [20, 50], t: 120, e: [2, 5], v: ["playful", "interesting"], s: "indoor", so: "med", th: "med", f: [], u: 0, desc: "Two brains, one team name. Defend your honor in round five.", q: "trivia night near Menlo Park CA" },
    { id: "bingo", n: "Bingo night", kind: "entertainment", area: "Peninsula", d: 15, c: [15, 35], t: 90, e: [1, 5], v: ["silly", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Embrace your inner retiree. The dabbers are serious business.", q: "bingo night Bay Area CA" },
    { id: "openmic", n: "Open mic night", kind: "entertainment", area: "Peninsula", d: 20, c: [10, 30], t: 90, e: [2, 5], v: ["entertainment", "interesting"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Poets, comics, and brave souls. Applaud generously, judge silently.", q: "open mic night Bay Area CA" },
    { id: "magicshow", n: "Magic show", kind: "entertainment", area: "Bay Area", d: 30, c: [50, 100], t: 90, e: [2, 5], v: ["entertainment", "interesting"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Close-up magic will break your brain in the best way.", q: "magic show Bay Area CA" },
    { id: "balloon-napa", n: "Hot air balloon ride", kind: "activity", area: "Napa Valley", d: 85, c: [400, 600], t: 180, e: [2, 5], v: ["romantic", "adventurous"], s: "outdoor", so: "low", th: "low", f: [], u: 2, desc: "Sunrise over the vineyards in a balloon basket. The splurge of splurges — book the dawn slot.", q: "hot air balloon ride Napa Valley CA" },
    { id: "planetarium", n: "Planetarium show", kind: "culture", area: "San Francisco", d: 55, c: [25, 50], t: 90, e: [2, 4], v: ["romantic", "interesting"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "Recline under the universe and feel wonderfully small together.", q: "planetarium San Francisco CA" },
    { id: "aquarium", n: "Monterey Bay Aquarium", kind: "culture", area: "Monterey", d: 90, c: [80, 140], t: 240, e: [2, 5], v: ["interesting", "romantic"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Sea otters holding hands. The kelp forest. A full-day wonder.", q: "Monterey Bay Aquarium" },
    { id: "nightlife", n: "Cal Academy NightLife", kind: "culture", area: "San Francisco", d: 55, c: [50, 90], t: 180, e: [3, 5], v: ["interesting", "playful", "adventurous"], s: "indoor", so: "high", th: "low", f: [], u: 2, desc: "The museum after dark, 21+, with DJs and cocktails. Thursday nights.", q: "California Academy of Sciences NightLife" },
    { id: "afterdark", n: "Exploratorium After Dark", kind: "culture", area: "San Francisco", d: 55, c: [50, 90], t: 180, e: [3, 5], v: ["interesting", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "The science museum, adults-only, after hours. Touch everything.", q: "Exploratorium After Dark San Francisco" },
    { id: "bungeefit", n: "Bungee fitness class", kind: "activity", area: "Peninsula", d: 25, c: [40, 70], t: 75, e: [4, 5], v: ["playful", "adventurous", "silly"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "Strapped to the ceiling, bouncing through a workout. Hilarious and hard.", q: "bungee fitness class Bay Area CA" },
    { id: "bathhouse", n: "Japanese bathhouse", kind: "activity", area: "San Francisco", d: 40, c: [80, 140], t: 150, e: [1, 4], v: ["peaceful", "romantic"], s: "indoor", so: "low", th: "low", f: [], u: 1, desc: "Hot pools, saunas, and total silence. Leave reborn.", q: "Japanese bathhouse San Francisco CA" },
    { id: "strawberry", n: "Strawberry picking", kind: "activity", area: "Peninsula", d: 30, c: [15, 40], t: 90, e: [2, 5], v: ["playful", "food"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Eat one for every three in the basket. That is the rule.", q: "strawberry picking Bay Area CA", seas: ["summer"] }
  );

  /* ---------------- MORE CULTURE ---------------- */
  VENUES.push(
    { id: "deyoung", n: "de Young Museum", kind: "culture", area: "San Francisco", d: 55, c: [25, 50], t: 150, e: [2, 4], v: ["interesting", "romantic"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "American art plus the tower's 360-degree view. Go on a free first Tuesday.", q: "de Young Museum San Francisco" },
    { id: "sfmoma", n: "SFMOMA", kind: "culture", area: "San Francisco", d: 55, c: [40, 70], t: 150, e: [2, 4], v: ["interesting"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "Seven floors of modern art and a living wall. Pick your favorite piece each.", q: "SFMOMA San Francisco" },
    { id: "legion", n: "Legion of Honor", kind: "culture", area: "San Francisco", d: 58, c: [25, 50], t: 120, e: [2, 4], v: ["interesting", "romantic"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "European masters on a cliff above the ocean. Criminally underrated.", q: "Legion of Honor San Francisco" },
    { id: "conservatory", n: "Conservatory of Flowers", kind: "culture", area: "San Francisco", d: 55, c: [15, 35], t: 75, e: [1, 4], v: ["romantic", "peaceful"], s: "indoor", so: "low", th: "low", f: [], u: 1, desc: "A Victorian greenhouse full of orchids and butterflies.", q: "Conservatory of Flowers San Francisco" },
    { id: "teagarden", n: "Japanese Tea Garden", kind: "culture", area: "San Francisco", d: 55, c: [15, 30], t: 75, e: [1, 4], v: ["peaceful", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 0, desc: "The oldest public Japanese garden in the US. Tea and fortune cookies.", q: "Japanese Tea Garden San Francisco" },
    { id: "montalvo", n: "Montalvo Arts Center", kind: "culture", area: "Saratoga", d: 32, c: [0, 30], t: 90, e: [2, 4], v: ["interesting", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "A villa, gardens, and hiking trails with art installations.", q: "Montalvo Arts Center Saratoga CA" },
    { id: "sjma", n: "San Jose Museum of Art", kind: "culture", area: "San Jose", d: 30, c: [15, 30], t: 90, e: [2, 4], v: ["interesting"], s: "indoor", so: "low", th: "med", f: [], u: 1, desc: "Small, sharp, and easy to see in an hour. Downtown after.", q: "San Jose Museum of Art" },
    { id: "napa", n: "Napa Valley wine tasting day", kind: "activity", area: "Napa Valley", d: 80, c: [140, 280], t: 300, e: [3, 5], v: ["romantic", "food", "adventurous"], s: "mix", so: "med", th: "low", f: ["Something new"], u: 1, desc: "Three wineries, one long lunch, and a designated driver plan. The full day trip.", q: "wine tasting Napa Valley CA" }
  );

  /* ---------------- MORE CREATIVE ---------------- */
  VENUES.push(
    { id: "photowalk", n: "Golden hour photo walk", kind: "creative", area: "Palo Alto", d: 12, c: [0, 10], t: 75, e: [2, 5], v: ["creative", "romantic"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Phones only. Theme: golden. Loser buys the coffee after.", q: "Stanford campus Palo Alto CA" },
    { id: "filmphoto", n: "Film photography date", kind: "creative", area: "Peninsula", d: 15, c: [20, 50], t: 120, e: [2, 5], v: ["creative", "romantic"], s: "mix", so: "low", th: "low", f: [], u: 2, desc: "One disposable camera each, 27 shots, no previews. Develop together.", q: "buy disposable camera Bay Area" },
    { id: "sketchpark", n: "Sketch night at the park", kind: "creative", area: "Menlo Park", d: 10, c: [0, 15], t: 75, e: [1, 4], v: ["creative", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Sketchbooks and the sunset. Bad drawings encouraged.", q: "Flood Park Menlo Park CA" },
    { id: "zine", n: "Make a zine together", kind: "creative", area: "Palo Alto", d: 12, c: [15, 30], t: 90, e: [2, 4], v: ["creative", "playful"], s: "indoor", so: "low", th: "low", f: [], u: 2, desc: "Cut, paste, and staple your own tiny magazine about your life.", q: "art supply store Palo Alto CA" },
    { id: "muralhunt", n: "Mural hunt in San Jose", kind: "explore", area: "San Jose", d: 30, c: [0, 20], t: 90, e: [2, 5], v: ["creative", "explore"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Downtown SJ's walls are a gallery. Photograph your top five.", q: "murals downtown San Jose CA" },
    { id: "swing", n: "Swing dance lesson", kind: "activity", area: "Peninsula", d: 20, c: [30, 60], t: 90, e: [3, 5], v: ["romantic", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 1, desc: "Lindy hop basics, then a social dance. Dips optional, laughter guaranteed.", q: "swing dance lesson Bay Area CA" },
    { id: "improv", n: "Improv class drop-in", kind: "activity", area: "Bay Area", d: 25, c: [30, 60], t: 120, e: [3, 5], v: ["silly", "playful"], s: "indoor", so: "med", th: "low", f: [], u: 2, desc: "Yes, and... a night of saying yes. You will surprise yourselves.", q: "improv class Bay Area CA" },
    { id: "bodega", n: "Bodega Bay day trip", kind: "explore", area: "Bodega Bay", d: 110, c: [40, 90], t: 210, e: [2, 5], v: ["romantic", "peaceful", "explore"], s: "mix", so: "low", th: "low", f: [], u: 1, desc: "Back to the coast: oysters, the harbor, and that famous headland.", q: "Bodega Bay CA" }
  );

  /* ---------------- MORE FAITH ---------------- */
  VENUES.push(
    { id: "sunrisehike", n: "Sunrise worship hike", kind: "faith", area: "Peninsula", d: 20, c: [0, 10], t: 90, e: [3, 5], v: ["meaningful", "peaceful"], s: "outdoor", so: "low", th: "low", f: [], u: 1, desc: "Hike up in the dark, worship as the sun comes up. Bring thermoses.", q: "Windy Hill Preserve Portola Valley CA", faith: true },
    { id: "carols", n: "Carols by candlelight", kind: "faith", area: "Peninsula", d: 20, c: [0, 30], t: 90, e: [1, 5], v: ["meaningful", "romantic"], s: "indoor", so: "med", th: "low", f: [], u: 0, desc: "Find a candlelight Christmas service and sing every verse.", q: "candlelight Christmas service Bay Area", seas: ["dec"], faith: true },
    { id: "beachcleanup", n: "Beach cleanup serve day", kind: "faith", area: "Half Moon Bay", d: 32, c: [0, 10], t: 120, e: [2, 4], v: ["meaningful", "interesting"], s: "outdoor", so: "med", th: "low", f: [], u: 1, desc: "Serve the coast you love. Gloves, bags, and lunch after.", q: "beach cleanup Half Moon Bay CA", faith: true },
    { id: "praypicnic", n: "Prayer + picnic", kind: "faith", area: "Palo Alto", d: 12, c: [20, 40], t: 90, e: [1, 5], v: ["meaningful", "romantic", "peaceful"], s: "outdoor", so: "low", th: "low", f: ["Dessert"], u: 0, desc: "Pack a picnic, pray over the next season, watch the sky.", q: "Foothills Nature Preserve Palo Alto", faith: true }
  );

  /* ---------------- MORE STAY-HOME IDEAS ----------------
     Schema: { id, n, desc, c:[lo,hi], t, e:[lo,hi], v:[...], twist, faith? } */
  HOME_IDEAS.push(
    { id: "h-jurassic", n: "Jurassic Park movie night", desc: "The original. Accept no substitutes.", c: [10, 25], t: 150, e: [1, 3], v: ["cozy", "entertainment"], twist: "Dino chicken nuggets and jungle juice. Pause to debate: would you survive?" },
    { id: "h-soundmusic", n: "Sound of Music sing-along", desc: "The hills are alive...", c: [0, 15], t: 180, e: [1, 3], v: ["cozy", "romantic", "silly"], twist: "Subtitles ON. Full volume for Do-Re-Mi. Austrian snacks optional." },
    { id: "h-hook", n: "Hook movie night", desc: "Bangarang!", c: [10, 20], t: 150, e: [1, 3], v: ["cozy", "silly"], twist: "Lost-boy feast: colorful foods only. Rufio would approve." },
    { id: "h-johnwick", n: "John Wick 1 action night", desc: "Yeah, he is thinking he is back.", c: [10, 20], t: 150, e: [2, 4], v: ["entertainment", "playful"], twist: "The first one only. Cocktails, low lights, no talking during the Red Circle scene." },
    { id: "h-horror", n: "Horror movie marathon", desc: "Your favorite genre, fully embraced.", c: [10, 25], t: 180, e: [2, 4], v: ["entertainment", "silly"], twist: "Two horror picks each, lights off, blanket fort required. Pause whenever someone needs a break." },
    { id: "h-minecraft", n: "Minecraft night", desc: "Block by block.", c: [0, 0], t: 120, e: [1, 4], v: ["playful", "cozy"], twist: "Same world, one goal: build your dream house by midnight. No mercy rule for creepers." },
    { id: "h-brawlstars", n: "Brawl Stars showdown", desc: "Duo queue, glory for us.", c: [0, 0], t: 60, e: [2, 4], v: ["playful"], twist: "Duo showdown, best of five. Loser makes the popcorn for the next round." },
    { id: "h-aoe", n: "Age of Empires II night", desc: "Wololo.", c: [0, 0], t: 120, e: [2, 4], v: ["playful", "interesting"], twist: "Co-op against the AI, then 1v1. Loser has to say wololo for a week." },
    { id: "h-retro", n: "Retro game night", desc: "16-bit everything.", c: [0, 0], t: 90, e: [1, 4], v: ["playful", "silly"], twist: "Emulator plus two controllers. Beat a classic or die trying." },
    { id: "h-escape-home", n: "Escape room at home", desc: "Print-and-play heist.", c: [10, 20], t: 90, e: [2, 4], v: ["playful", "interesting"], twist: "Buy a print-and-play escape kit. Timer on. Work the clues like detectives." },
    { id: "h-90day", n: "90 Day Fiance night", desc: "Your favorite beautiful trainwreck.", c: [0, 10], t: 120, e: [1, 3], v: ["silly", "entertainment"], twist: "Two episodes, predictions before each. Score points for calling the drama." },
    { id: "h-reality", n: "Reality TV roulette", desc: "Whatever the algorithm gives.", c: [0, 10], t: 90, e: [1, 3], v: ["silly", "entertainment"], twist: "Each picks a wild reality show the other has never seen. Commit to the pilot." },
    { id: "h-tacotuesday", n: "Taco Tuesday at home", desc: "Better than the restaurant.", c: [20, 35], t: 75, e: [2, 5], v: ["food", "playful"], twist: "Homemade tortillas if you are brave. Hot sauce ranking mandatory." },
    { id: "h-ramenlab", n: "Homemade ramen lab", desc: "Broth science.", c: [20, 35], t: 90, e: [2, 5], v: ["food", "creative"], twist: "Same base broth, different toppings each. Blind taste test at the end." },
    { id: "h-pasta", n: "Fresh pasta from scratch", desc: "Flour, eggs, patience.", c: [15, 30], t: 120, e: [2, 4], v: ["food", "creative", "romantic"], twist: "Roll it by hand. Ugly shapes taste the same. Sauce showdown after." },
    { id: "h-hotpot-home", n: "Home hot pot", desc: "The full spread.", c: [40, 70], t: 120, e: [2, 5], v: ["food", "cozy"], twist: "Split the pot: spicy and mild. Grocery run to Ranch 99 first." },
    { id: "h-brunch-home", n: "Fancy brunch at home", desc: "Weekend energy, any night.", c: [20, 40], t: 90, e: [1, 4], v: ["food", "romantic"], twist: "Pancakes, eggs, mimosas (or mockmosas). Eat in pajamas, obviously." },
    { id: "h-cheeseboard", n: "Epic cheese board + wine", desc: "Charcuterie championship.", c: [30, 55], t: 60, e: [1, 3], v: ["food", "romantic"], twist: "Each builds half the board blind. Reveal, compare, devour." },
    { id: "h-sundae", n: "Ice cream sundae bar", desc: "Build your masterpiece.", c: [15, 30], t: 45, e: [1, 5], v: ["food", "silly"], twist: "Six toppings minimum. Most architectural sundae wins." },
    { id: "h-ferment", n: "Fermentation project", desc: "Kimchi starts tonight.", c: [15, 30], t: 60, e: [1, 3], v: ["food", "interesting"], twist: "Start kimchi or pickles together. Taste-test in a week. Science you can eat." },
    { id: "h-tiedye", n: "Tie-dye night", desc: "Hippie hour.", c: [15, 30], t: 90, e: [1, 4], v: ["creative", "silly"], twist: "White tees plus dye kits in the backyard. Wear the results on your next date." },
    { id: "h-candles-home", n: "Candle making at home", desc: "Soy wax plus your scent.", c: [20, 40], t: 75, e: [1, 3], v: ["creative", "romantic"], twist: "Pour two candles: one for each of you. Light them on your next home date." },
    { id: "h-scrapbook", n: "Scrapbook the year", desc: "Glue sticks and memories.", c: [15, 30], t: 120, e: [1, 3], v: ["creative", "romantic", "meaningful"], twist: "Print your favorite 20 photos from this year. Captions required." },
    { id: "h-bobross", n: "Bob Ross paint-along", desc: "Happy little trees.", c: [10, 25], t: 90, e: [1, 3], v: ["creative", "silly"], twist: "Same episode, same canvas size. No judgment, only happy accidents." },
    { id: "h-origami", n: "Origami challenge", desc: "Paper, patience, precision.", c: [0, 10], t: 60, e: [1, 3], v: ["creative", "playful"], twist: "YouTube tutorial, 10 cranes each. Most perfect crane wins." },
    { id: "h-clay", n: "Sculpt each other from clay", desc: "Air-dry edition.", c: [10, 20], t: 75, e: [1, 4], v: ["creative", "silly"], twist: "30 minutes, eyes open. Sign and date the masterpieces." },
    { id: "h-fireside", n: "Fireside + hot cocoa", desc: "Fire pit or candle cluster.", c: [10, 25], t: 75, e: [1, 2], v: ["cozy", "romantic"], twist: "Marshmallows, wool blankets, and deep questions by firelight." },
    { id: "h-massage", n: "Massage trade night", desc: "20 minutes each.", c: [0, 15], t: 60, e: [1, 2], v: ["romantic", "peaceful"], twist: "Tutorial, nice oil, phones off. No falling asleep on duty." },
    { id: "h-slowdance", n: "Living room slow dance", desc: "One playlist, no talking.", c: [0, 0], t: 45, e: [1, 3], v: ["romantic"], twist: "Five songs, slow dancing, eye contact. Corny and perfect." },
    { id: "h-loveletters", n: "Love letter writing", desc: "Pen and paper.", c: [0, 10], t: 60, e: [1, 3], v: ["romantic", "meaningful"], twist: "Write about the last six months. Seal, swap, read aloud." },
    { id: "h-firstdate", n: "Recreate your first date", desc: "At-home edition.", c: [20, 40], t: 90, e: [2, 4], v: ["romantic", "silly"], twist: "Same food, same outfits if they still fit. Tell the story again." },
    { id: "h-balcony", n: "Balcony dinner", desc: "Restaurant: home.", c: [25, 45], t: 75, e: [1, 3], v: ["romantic", "food"], twist: "Real plates, candles, and the nice drinks. Dress up for no one." },
    { id: "h-karaoke-home", n: "Living room karaoke", desc: "YouTube plus hairbrush mics.", c: [0, 10], t: 90, e: [2, 4], v: ["silly", "playful", "entertainment"], twist: "Duets only. Score each other brutally. Encore mandatory." },
    { id: "h-trivia-home", n: "Home trivia showdown", desc: "Head to head.", c: [0, 10], t: 60, e: [2, 4], v: ["playful", "interesting"], twist: "20 questions each, written in secret. Loser does dishes for a week." },
    { id: "h-thrift", n: "Thrifted outfit challenge", desc: "$15 each at the thrift store.", c: [30, 30], t: 90, e: [2, 4], v: ["silly", "playful"], twist: "Buy each other an outfit. Fashion show at home. Wear the winner out." },
    { id: "h-commercial", n: "Film a fake commercial", desc: "Directors: you two.", c: [0, 0], t: 75, e: [2, 4], v: ["silly", "creative"], twist: "Advertise a household object dramatically. Premiere it for yourselves." },
    { id: "h-chinese", n: "Chinese practice night", desc: "Ni hao, date night.", c: [15, 30], t: 60, e: [1, 4], v: ["interesting", "talk"], twist: "Flashcards plus dumplings from the freezer. Practice ordering food in Mandarin." },
    { id: "h-cocktail", n: "Cocktail lab", desc: "Shake, stir, sip.", c: [25, 45], t: 75, e: [2, 4], v: ["food", "playful"], twist: "Invent a signature couples cocktail. Name it. Defend it." },
    { id: "h-skillshare", n: "Teach each other a skill", desc: "Professor for a night.", c: [0, 15], t: 90, e: [2, 4], v: ["interesting", "talk"], twist: "30 minutes each: teach something you are good at. Patience required." },
    { id: "h-dreambattle", n: "Dream trip budget battle", desc: "$1,000 fantasy draft.", c: [0, 0], t: 60, e: [1, 4], v: ["silly", "talk"], twist: "Plan competing dream weekends on $1,000. Present like Shark Tank." }
  );

  /* ---------------- WEEKEND TRIPS ----------------
     Schema:
     TRIPS = { <id>: {
       id, n, emoji, d (drive min from Menlo Park), tagline,
       charge: [{ n, q, note }]            // Tesla supercharger stops (tesla mode only)
       stay, campStay, budgetStay,         // lodging lines
       days: [{ title, stops: [{ n, area, tag, time, desc, c:[lo,hi], q, tesla? }],
                alt: [stopA, stopB] }]     // one alt is picked per generation
     } }
     stop tags: 'drive' | 'charge' | 'food' | 'view' | 'activity' | 'chill'
     tesla: true = only shown when the Tesla toggle is on                */
  var TRIPS = {
    tahoe: {
      id: "tahoe", n: "Lake Tahoe", emoji: "🌲", d: 210,
      tagline: "Alpine air, impossibly blue water, and more stars than you have ever seen.",
      charge: [
        { n: "Charge in Sacramento", q: "Tesla Supercharger Sacramento CA", note: "Top up while you grab dinner to go. Last easy fast-charge before the climb." },
        { n: "Charge in Truckee", q: "Tesla Supercharger Truckee CA", note: "Quick top-up on the way home with a Donner Lake view." }
      ],
      stay: "A cabin or lake-view Airbnb near South Lake Tahoe. Book early for weekends.",
      budgetStay: "A budget motel in South Lake Tahoe — you will barely be in the room anyway.",
      campStay: "Car-camp it: Tesla camp mode keeps you warm all night. Reserve a site at Camp Richardson or Nevada Beach, pack sleeping pads and real layers.",
      days: [
        { title: "Friday — The drive up",
          stops: [
            { n: "Hit the road", area: "I-80 East", tag: "drive", time: "Fri 5:30 PM", desc: "Leave right after work with snacks loaded. The drive is half the adventure.", c: [10, 25], q: "I-80 East Sacramento CA" },
            { n: "Charge in Sacramento", area: "Sacramento", tag: "charge", time: "Fri 7:30 PM", desc: "Top up while you grab dinner to go. Last easy fast-charge before the climb.", c: [15, 30], q: "Tesla Supercharger Sacramento CA", tesla: true },
            { n: "Late dinner in South Lake Tahoe", area: "South Lake Tahoe", tag: "food", time: "Fri 9:30 PM", desc: "Arrive, check in, and eat somewhere cozy. You have earned it.", c: [50, 100], q: "restaurants South Lake Tahoe CA" }
          ],
          alt: [] },
        { title: "Saturday — The big day",
          stops: [
            { n: "Emerald Bay overlook", area: "Emerald Bay", tag: "view", time: "Sat 9:00 AM", desc: "The postcard view, in person. Go early to beat the crowds.", c: [0, 0], q: "Emerald Bay State Park Lake Tahoe" },
            { n: "Rubicon Trail hike", area: "D.L. Bliss State Park", tag: "activity", time: "Sat 11:00 AM", desc: "Cliffside trail with turquoise water the whole way. As far as you like, then back.", c: [0, 10], q: "Rubicon Trail D.L. Bliss State Park" },
            { n: "Beach afternoon", area: "Nevada Beach", tag: "chill", time: "Sat 2:00 PM", desc: "Claim a spot, swim if you are brave, nap if you are smart.", c: [0, 0], q: "Nevada Beach Lake Tahoe" },
            { n: "Dinner + stargazing", area: "South Lake Tahoe", tag: "food", time: "Sat 7:00 PM", desc: "Hearty dinner, then drive somewhere dark. The Milky Way is the show.", c: [60, 110], q: "restaurants South Lake Tahoe CA" }
          ],
          alt: [
            { n: "Kayak the east shore", area: "Sand Harbor", tag: "activity", time: "Sat 4:00 PM", desc: "Rent kayaks and paddle the clearest water in California.", c: [60, 100], q: "kayak rental Sand Harbor Lake Tahoe" },
            { n: "Heavenly gondola ride", area: "Heavenly Village", tag: "view", time: "Sat 4:00 PM", desc: "Ride up for panoramic lake views and a drink at the top.", c: [80, 120], q: "Heavenly gondola South Lake Tahoe" }
          ] },
        { title: "Sunday — Ease home",
          stops: [
            { n: "Brunch with a view", area: "South Lake Tahoe", tag: "food", time: "Sun 10:00 AM", desc: "Slow brunch. No rushing — the lake is not going anywhere.", c: [35, 65], q: "brunch South Lake Tahoe CA" },
            { n: "Charge in Truckee", area: "Truckee", tag: "charge", time: "Sun 1:00 PM", desc: "Quick top-up with a Donner Lake detour on the way home.", c: [15, 30], q: "Tesla Supercharger Truckee CA", tesla: true },
            { n: "Home", area: "Menlo Park", tag: "drive", time: "Sun 5:00 PM", desc: "Roll in with mountain air in your lungs and full hearts.", c: [10, 25], q: "Menlo Park CA" }
          ],
          alt: [] }
      ]
    },
    hmb: {
      id: "hmb", n: "Half Moon Bay", emoji: "🌊", d: 32,
      tagline: "Thirty-five minutes away, a whole different world: fog, cliffs, and the best sunsets on the Peninsula.",
      charge: [
        { n: "Top up in San Mateo", q: "Tesla Supercharger San Mateo CA", note: "Honestly you will not even need it — it is 35 minutes away. But range anxiety is real." }
      ],
      stay: "A cozy inn on Main Street or an Airbnb with an ocean view.",
      budgetStay: "A simple motel near the beach — fall asleep to the foghorn either way.",
      campStay: "Car-camp at Half Moon Bay State Beach (reserve ahead) — fall asleep to the waves in camp mode.",
      days: [
        { title: "Friday — Sunset arrival",
          stops: [
            { n: "Drive over the hill", area: "Highway 92", tag: "drive", time: "Fri 6:00 PM", desc: "Twenty minutes of winding road and you are in another world.", c: [0, 10], q: "Highway 92 Half Moon Bay CA" },
            { n: "Sunset at the beach", area: "Half Moon Bay State Beach", tag: "view", time: "Fri 7:00 PM", desc: "The ocean does all the entertaining. You just have to show up.", c: [0, 0], q: "Half Moon Bay State Beach" },
            { n: "Seafood dinner", area: "Half Moon Bay", tag: "food", time: "Fri 8:30 PM", desc: "Cioppino or fish and chips, steps from the water.", c: [60, 110], q: "seafood restaurant Half Moon Bay CA" }
          ],
          alt: [] },
        { title: "Saturday — The coast day",
          stops: [
            { n: "Coastal Trail walk", area: "Half Moon Bay Coastside Trail", tag: "activity", time: "Sat 10:00 AM", desc: "Flat blufftop trail with ocean views the entire way.", c: [0, 0], q: "Half Moon Bay Coastside Trail" },
            { n: "Downtown + lunch", area: "Main Street", tag: "food", time: "Sat 12:30 PM", desc: "Shops, bakeries, and lunch on Main Street.", c: [30, 60], q: "Main Street Half Moon Bay CA" },
            { n: "Sunset + dinner", area: "Poplar Beach", tag: "food", time: "Sat 6:30 PM", desc: "Golden hour on the sand, then dinner as the fog rolls in.", c: [50, 90], q: "Poplar Beach Half Moon Bay" }
          ],
          alt: [
            { n: "Pillar Point tidepools", area: "Moss Beach", tag: "activity", time: "Sat 3:00 PM", desc: "Starfish and anemones at low tide. Check the tide chart.", c: [0, 10], q: "Fitzgerald Marine Reserve Moss Beach" },
            { n: "Pescadero pie run", area: "Pescadero", tag: "food", time: "Sat 3:00 PM", desc: "Twenty minutes down the coast for the famous pie.", c: [15, 40], q: "Pescadero CA pie" }
          ] },
        { title: "Sunday — Slow morning",
          stops: [
            { n: "Brunch in town", area: "Half Moon Bay", tag: "food", time: "Sun 10:00 AM", desc: "Long brunch, no agenda.", c: [35, 65], q: "brunch Half Moon Bay CA" },
            { n: "Mavericks viewpoint", area: "Pillar Point", tag: "view", time: "Sun 12:00 PM", desc: "Stand where the big-wave surfers launch in winter.", c: [0, 0], q: "Mavericks Pillar Point Half Moon Bay" },
            { n: "Home", area: "Menlo Park", tag: "drive", time: "Sun 2:00 PM", desc: "Back over the hill, salty and happy.", c: [0, 10], q: "Menlo Park CA" }
          ],
          alt: [] }
      ]
    },
    bigsur: {
      id: "bigsur", n: "Big Sur", emoji: "🏔️", d: 150,
      tagline: "The most dramatic coastline in America, two and a half hours from your couch.",
      charge: [
        { n: "Charge in Monterey", q: "Tesla Supercharger Monterey CA", note: "Fill up in Monterey — chargers get scarce past Carmel." },
        { n: "Charge in Carmel", q: "Tesla Supercharger Carmel CA", note: "Top up on the way home after the coast drive." }
      ],
      stay: "A cabin in the redwoods or a room in Carmel. Book way ahead — Big Sur sells out.",
      budgetStay: "A motel in Monterey and day-trip into Big Sur. Same views, half the price.",
      campStay: "Pfeiffer Big Sur State Park campsites (reserve the minute they release) or Tesla camp mode. Layers. Always layers.",
      days: [
        { title: "Friday — Down the coast",
          stops: [
            { n: "Drive Highway 1", area: "Highway 1 South", tag: "drive", time: "Fri 5:00 PM", desc: "Leave after work. Every turnout is a photo stop — allow extra time.", c: [10, 25], q: "Highway 1 Monterey to Big Sur" },
            { n: "Charge in Monterey", area: "Monterey", tag: "charge", time: "Fri 7:00 PM", desc: "Fill up in Monterey — chargers get scarce past Carmel.", c: [15, 30], q: "Tesla Supercharger Monterey CA", tesla: true },
            { n: "Dinner in Carmel", area: "Carmel-by-the-Sea", tag: "food", time: "Fri 8:30 PM", desc: "Storybook village, excellent food. Stroll after dinner.", c: [60, 110], q: "restaurants Carmel by the Sea CA" }
          ],
          alt: [] },
        { title: "Saturday — The icons",
          stops: [
            { n: "Bixby Bridge", area: "Big Sur", tag: "view", time: "Sat 10:00 AM", desc: "The famous arch bridge. Park at the turnout and take the photo.", c: [0, 0], q: "Bixby Creek Bridge Big Sur" },
            { n: "McWay Falls", area: "Julia Pfeiffer Burns State Park", tag: "view", time: "Sat 12:00 PM", desc: "An 80-foot waterfall onto the beach. Short trail, huge payoff.", c: [0, 10], q: "McWay Falls Big Sur" },
            { n: "Dinner on the cliffs", area: "Big Sur", tag: "food", time: "Sat 7:00 PM", desc: "The legendary cliffside dinner spot. Reserve weeks ahead.", c: [120, 200], q: "restaurants Big Sur CA" }
          ],
          alt: [
            { n: "Pfeiffer Beach", area: "Big Sur", tag: "view", time: "Sat 3:00 PM", desc: "Purple sand, sea arches, and big waves. The locals' favorite.", c: [0, 10], q: "Pfeiffer Beach Big Sur" },
            { n: "Andrew Molera hike", area: "Big Sur", tag: "activity", time: "Sat 3:00 PM", desc: "Bluffs, beach, and redwoods in one loop trail.", c: [0, 10], q: "Andrew Molera State Park Big Sur" }
          ] },
        { title: "Sunday — Ease home",
          stops: [
            { n: "Brunch in Carmel", area: "Carmel-by-the-Sea", tag: "food", time: "Sun 10:00 AM", desc: "Slow brunch in the village.", c: [35, 65], q: "brunch Carmel by the Sea CA" },
            { n: "17-Mile Drive", area: "Pebble Beach", tag: "drive", time: "Sun 12:30 PM", desc: "The Lone Cypress and ocean mansions on the way home.", c: [10, 15], q: "17 Mile Drive Pebble Beach CA" },
            { n: "Charge in Carmel", area: "Carmel", tag: "charge", time: "Sun 2:00 PM", desc: "Top up on the way home after the coast drive.", c: [15, 30], q: "Tesla Supercharger Carmel CA", tesla: true },
            { n: "Home", area: "Menlo Park", tag: "drive", time: "Sun 5:30 PM", desc: "Back up Highway 1, already planning the next one.", c: [10, 25], q: "Menlo Park CA" }
          ],
          alt: [] }
      ]
    }
  };




  /* ---------------- TITLES ----------------
     tags: lowenergy, highenergy, cheap, treat, food, dessert, romantic,
     cozy, adventurous, explore, silly, sf, chaos, faith, talk, outdoor,
     short (<=2h), home, surprise */
  var TITLES = [
    { t: "The Zero-Effort Date", tags: ["lowenergy"] },
    { t: "Do Not Make Us Think", tags: ["lowenergy"] },
    { t: "Maximum Cozy, Minimum Effort", tags: ["lowenergy", "cozy"] },
    { t: "We Actually Left the House", tags: ["lowenergy", "silly"] },
    { t: "Operation Dumpling", tags: ["food"] },
    { t: "Snack Quest", tags: ["food", "silly"] },
    { t: "Chaos, But Make It Dinner", tags: ["chaos", "food"] },
    { t: "Dessert Is Dinner", tags: ["dessert"] },
    { t: "The Sugar Spiral", tags: ["dessert", "silly"] },
    { t: "Menlo Park Escape", tags: ["explore"] },
    { t: "Bay Area Roulette", tags: ["adventurous", "explore"] },
    { t: "You two vs. San Francisco", tags: ["sf", "adventurous"] },
    { t: "Accidentally Romantic Tuesday", tags: ["romantic"] },
    { t: "The Main Character Evening", tags: ["romantic", "explore"] },
    { t: "The Golden Hour Plan", tags: ["outdoor", "romantic"] },
    { t: "The $30 Date", tags: ["cheap"] },
    { t: "Ballin' on a Budget", tags: ["cheap", "silly"] },
    { t: "The 'We Deserve This' Night", tags: ["treat"] },
    { t: "Treat Yourselves (Doctor's Orders)", tags: ["treat", "silly"] },
    { t: "The 45-Minute Adventure", tags: ["short", "adventurous"] },
    { t: "Two Phones Down, One Night Out", tags: ["talk"] },
    { t: "Holy & Hungry", tags: ["faith", "food"] },
    { t: "The Couch Is Lava", tags: ["home", "silly"] },
    { t: "Home Base Heroes", tags: ["home"] },
    { t: "Plot Twist: Staying In", tags: ["home", "silly"] },
    { t: "The Spontaneity Protocol", tags: ["chaos"] },
    { t: "No Notes, Just Vibes", tags: ["chaos", "silly"] },
    { t: "The Unplanned Plan", tags: ["surprise"] },
    { t: "Trust the Process", tags: ["surprise", "silly"] },
    { t: "Low Battery, High Standards", tags: ["lowenergy", "treat"] },
    { t: "Full Send Friday", tags: ["highenergy", "adventurous"] },
    { t: "The Great Peninsula Crawl", tags: ["explore", "food"] },
    { t: "Cozy Season Champions", tags: ["cozy", "romantic"] },
    { t: "Brain On, Phones Off", tags: ["talk"] },
    { t: "The Slow Evening", tags: ["cozy", "lowenergy"] }
  ];

  /* ---------------- MINI CHALLENGES ---------------- */
  var CHALLENGES = [
    { t: "Phones away for the first 30 minutes. First one to check owes dessert.", tags: [] },
    { t: "Each person gets $10 to choose dessert for the other. No vetoes.", tags: ["food", "dessert"] },
    { t: "Order one thing neither of you has ever tried.", tags: ["food"] },
    { t: "Take one photo tonight that represents the evening. No retakes.", tags: ["outdoor", "explore"] },
    { t: "Each person picks one stop. No complaining about the other's pick.", tags: [] },
    { t: "Ask each other one random question from the conversation deck.", tags: ["talk"] },
    { t: "Rate every food item out of 10. Ties broken by rock-paper-scissors.", tags: ["food"] },
    { t: "Flip a coin to decide the final stop: heads dessert, tails adventure.", tags: ["adventurous"] },
    { t: "Let the other person order your drink. Live with it.", tags: ["food"] },
    { t: "Find the weirdest item in the store and buy it.", tags: ["explore", "silly"] },
    { t: "Whoever loses rock-paper-scissors chooses dessert.", tags: ["dessert", "silly"] },
    { t: "Don't use Google Maps for the final 5-minute walk. Trust your instincts.", tags: ["explore", "outdoor"] },
    { t: "Compliment a stranger (genuinely). Report back.", tags: ["adventurous", "silly"] },
    { t: "Learn to say 'thank you' in the cuisine's language before you order.", tags: ["food"] },
    { t: "No talking about work until dessert. Violations cost $1 to the date jar.", tags: ["talk"] },
    { t: "Take the long way home, on purpose.", tags: ["romantic", "outdoor"] },
    { t: "Hold hands the entire walk. Non-negotiable.", tags: ["romantic"] },
    { t: "Each write down a prediction for the night. Closest guess wins.", tags: ["silly"] }
  ];

  /* ---------------- CONVERSATION QUESTIONS ---------------- */
  var CONVOS = [
    "What is something you hope is different about our life one year from now?",
    "What trip would you take tomorrow if logistics didn't matter?",
    "What is something you've appreciated about me recently?",
    "What is a small adventure we could have this month?",
    "What would our ideal Saturday look like?",
    "What is a small thing that made you happy this week?",
    "If we could live anywhere for one year, where would it be?",
    "What is something you want to learn together?",
    "What was the best date we've ever had, and why?",
    "What is a dream you've never told me about?",
    "How have we changed since we got married?",
    "What tradition should we start?",
    "What is something you want more of in our life together?",
    "What would you do with a completely free weekend?",
    "What is something kind someone did for you lately?",
    "If tonight had a theme song, what would it be?",
    "What is a fear you've mostly gotten over?",
    "What do you want our home to feel like?"
  ];

  /* ---------------- LOADING LINES ---------------- */
  var LOADING = [
    "Consulting the Date Night Council…",
    "Analyzing vibes…",
    "Determining whether leaving the house is worth it…",
    "Checking your compatibility with tonight…",
    "Rejecting boring ideas…",
    "Calculating snack probability…",
    "Cross-referencing couch comfort levels…",
    "Bribing the traffic gods…",
    "Asking the group chat (it's just us)…",
    "Polishing the itinerary…",
    "Removing all options involving decision fatigue…",
    "Finalizing tonight's main character energy…"
  ];

  var FAKE_STATS = [
    ["Leaving-the-house probability", "%"],
    ["Snack probability", "%"],
    ["Likelihood we get dessert anyway", "%"],
    ["Chance we say “this was actually fun”", "%"],
    ["Probability of a second stop", "%"],
    ["Odds Luke falls asleep before 11", "%"]
  ];

  function seasonOf(date) {
    var m = date.getMonth(); // 0-11
    var d = date.getDate();
    if (m === 11) return "dec";
    if (m === 1 && d <= 20) return "feb";
    if (m === 9 || m === 10) return "fall";
    if (m >= 5 && m <= 7) return "summer";
    // Mid-Autumn Festival ~ mid-Sept to early Oct (lunar); approximate
    if ((m === 8 && d >= 10) || (m === 9 && d <= 10)) return "midautumn";
    if (m === 9 || m === 10) return "fall";
    return "normal";
  }

  /* ---------------- MORE TITLES ---------------- */
  TITLES.push(
    { t: "The Great Weekend Escape", tags: ["adventurous", "explore"] },
    { t: "Three Days, Zero Regrets", tags: ["adventurous"] },
    { t: "Tahoe or Bust", tags: ["adventurous", "explore"] },
    { t: "Coast Mode: Activated", tags: ["romantic", "explore"] },
    { t: "The Tesla Road Trip", tags: ["adventurous", "explore"] },
    { t: "Camp Mode: Engaged", tags: ["adventurous", "silly"] },
    { t: "Operation Get Out of Town", tags: ["adventurous", "explore"] },
    { t: "The Anti-Boring Protocol", tags: ["chaos"] },
    { t: "Certified Fresh Evening", tags: ["surprise", "silly"] },
    { t: "The 'Remember When' Machine", tags: ["romantic"] }
  );

  /* ---------------- MORE MINI CHALLENGES ---------------- */
  CHALLENGES.push(
    { t: "Find the best bite of the night and describe it like a food critic.", tags: ["food"] },
    { t: "Take a photo of each other laughing. No posed shots.", tags: [] },
    { t: "Learn one new fact about the place you're in.", tags: ["explore", "interesting"] },
    { t: "Split one dessert with two spoons and zero regrets.", tags: ["dessert"] },
    { t: "Text one friend a photo and make them jealous.", tags: ["silly"] },
    { t: "Say yes to the next spontaneous suggestion, no matter what.", tags: ["chaos", "adventurous"] },
    { t: "End the night naming your top 3 moments.", tags: ["romantic", "talk"] },
    { t: "Order for each other without asking. Commit to the bit.", tags: ["food", "playful"] }
  );

  /* ---------------- MORE CONVERSATION QUESTIONS ---------------- */
  CONVOS.push(
    "What is a small thing I do that you love?",
    "If we had a free Saturday in a new city, how would we spend it?",
    "What is something you want us to be known for as a couple?",
    "What would you do if you knew you could not fail?",
    "What is your favorite memory of us from this year?",
    "If our life was a movie, what genre would it be right now?",
    "What is one thing you want to get better at together?",
    "What does a perfect ordinary day look like to you?"
  );

  /* ---------------- MORE LOADING LINES ---------------- */
  LOADING.push(
    "Fueling up the Tesla (metaphorically)...",
    "Checking the tide charts...",
    "Polishing the 3-day itinerary...",
    "Rejecting the boring stuff...",
    "Counting dumplings...",
    "Asking Tahoe if it is ready for you..."
  );

  return {
    HOME_BASE: HOME_BASE,
    CUISINES: CUISINES,
    VIBES: VIBES,
    VENUES: VENUES,
    HOME_IDEAS: HOME_IDEAS,
    TITLES: TITLES,
    CHALLENGES: CHALLENGES,
    CONVOS: CONVOS,
    LOADING: LOADING,
    FAKE_STATS: FAKE_STATS,
    TRIPS: TRIPS,
    seasonOf: seasonOf
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = DATA;
