/* Hangtime content bank: seed songs, match questions, quests, chains, achievements */
"use strict";
var HT = window.HT || (window.HT = {});

/* ---------------- seed songs (~44 well-known) ---------------- */
HT.SEED_SONGS = [
  ["Blinding Lights","The Weeknd"],["Die For You","The Weeknd"],
  ["Bohemian Rhapsody","Queen"],["Hotel California","Eagles"],
  ["Sweet Child O' Mine","Guns N' Roses"],["Billie Jean","Michael Jackson"],
  ["Thriller","Michael Jackson"],["Smells Like Teen Spirit","Nirvana"],
  ["Wonderwall","Oasis"],["Mr. Brightside","The Killers"],
  ["Shape of You","Ed Sheeran"],["Bad Guy","Billie Eilish"],
  ["Levitating","Dua Lipa"],["Anti-Hero","Taylor Swift"],
  ["Cruel Summer","Taylor Swift"],["Shake It Off","Taylor Swift"],
  ["Rolling in the Deep","Adele"],["Someone Like You","Adele"],
  ["Uptown Funk","Mark Ronson ft. Bruno Mars"],["Happy","Pharrell Williams"],
  ["Despacito","Luis Fonsi ft. Daddy Yankee"],["Old Town Road","Lil Nas X"],
  ["God's Plan","Drake"],["Lose Yourself","Eminem"],
  ["HUMBLE.","Kendrick Lamar"],["SICKO MODE","Travis Scott"],
  ["Flowers","Miley Cyrus"],["As It Was","Harry Styles"],
  ["Watermelon Sugar","Harry Styles"],["good 4 u","Olivia Rodrigo"],
  ["drivers license","Olivia Rodrigo"],["STAY","The Kid LAROI & Justin Bieber"],
  ["Peaches","Justin Bieber"],["Señorita","Shawn Mendes & Camila Cabello"],
  ["Shallow","Lady Gaga & Bradley Cooper"],["Perfect","Ed Sheeran"],
  ["All of Me","John Legend"],["Thinking Out Loud","Ed Sheeran"],
  ["Hey Jude","The Beatles"],["Let It Be","The Beatles"],
  ["Imagine","John Lennon"],["Dancing Queen","ABBA"],
  ["Don't Stop Me Now","Queen"],["Viva La Vida","Coldplay"]
];

/* ---------------- match questions (66) ----------------
   c: category key. o: 3-5 options. */
HT.MATCH_CATS = {
  food:   { name: "Food",          icon: "🍜" },
  travel: { name: "Travel",        icon: "🌎" },
  social: { name: "Social Battery",icon: "🔋" },
  money:  { name: "Money",         icon: "💰" },
  life:   { name: "Lifestyle",     icon: "🛋️" },
  fun:    { name: "Entertainment", icon: "🎮" },
  self:   { name: "Personality",   icon: "🧠" },
  us:     { name: "Us",            icon: "💞" },
  chaos:  { name: "Chaos",         icon: "🔥" }
};

HT.MATCH_QUESTIONS = [
/* FOOD (8) */
{c:"food",q:"Ideal dinner?",o:["Fancy restaurant","Takeout on the couch","Street food adventure","Cook together"]},
{c:"food",q:"Pineapple on pizza?",o:["Obviously yes","Absolutely not","I'll allow it","I don't care, it's pizza"]},
{c:"food",q:"How adventurous are you with food?",o:["I'll try anything once","Mostly adventurous","Pretty picky","Chicken nuggets are a food group"]},
{c:"food",q:"Pick a cuisine for life:",o:["Italian","Japanese","Mexican","Indian","Thai"]},
{c:"food",q:"Breakfast is…",o:["The best meal","Just coffee","Skipped entirely","Brunch or nothing"]},
{c:"food",q:"Cereal: before or after milk?",o:["Cereal first, obviously","Milk first (chaos)","I don't eat cereal"]},
{c:"food",q:"How do you feel about leftovers?",o:["Love them","Tolerate them","Absolutely not","Leftovers? Never heard of them"]},
{c:"food",q:"Ideal dessert?",o:["Chocolate everything","Ice cream","Fruit-based","I skip dessert"]},
/* TRAVEL (8) */
{c:"travel",q:"Beach, city, or mountains?",o:["Beach","City","Mountains","Somewhere weird"]},
{c:"travel",q:"Travel style?",o:["Detailed itinerary","Loose plan","Completely spontaneous","I just follow"]},
{c:"travel",q:"Luxury hotel or cool Airbnb?",o:["Luxury hotel","Cool Airbnb","Hostel is fine","Sleeping under stars"]},
{c:"travel",q:"On vacation you…",o:["Sightsee from sunrise","Sleep in, then explore","One big thing per day","Pool. All day."]},
{c:"travel",q:"Window or aisle?",o:["Window","Aisle","Middle (psychopath)","I drive"]},
{c:"travel",q:"How early for the airport?",o:["3+ hours early","2 hours, standard","Sprinting to the gate","I miss flights"]},
{c:"travel",q:"Souvenirs?",o:["Fridge magnets","Local snacks","Something handmade","Photos are enough"]},
{c:"travel",q:"Road trip soundtrack?",o:["One perfect playlist","Podcasts","Audiobooks","Chaotic aux battle"]},
/* SOCIAL (6) */
{c:"social",q:"Ideal Friday night?",o:["Big party","Dinner with friends","Date night","Stay home","Gaming / movie night"]},
{c:"social",q:"How often do you want to socialize?",o:["Every day","Few times a week","Weekends only","Monthly, max"]},
{c:"social",q:"At a party you are…",o:["Center of attention","Floating between groups","Deep convo in a corner","Didn't want to come"]},
{c:"social",q:"Group chat energy?",o:["100+ messages a day","Active but sane","Replies in 3-5 business days","Muted"]},
{c:"social",q:"Meeting new people is…",o:["My favorite thing","Fine in small doses","Exhausting","A hard no"]},
{c:"social",q:"Recharge by…",o:["More people (extrovert)","Alone time (introvert)","Depends on the day","Naps"]},
/* MONEY (6) */
{c:"money",q:"Are you a spender or saver?",o:["Spender","Saver","Spender in denial","Saver with one weakness"]},
{c:"money",q:"You'd rather spend on…",o:["Travel","Food","Clothes","Technology","Experiences"]},
{c:"money",q:"Splitting the bill?",o:["Split evenly","Pay for exactly mine","Take turns treating","Whoever suggests pays"]},
{c:"money",q:"An unexpected $500: what happens?",o:["Straight to savings","Fun money, obviously","Half and half","Already spent it mentally"]},
{c:"money",q:"Budgeting style?",o:["Spreadsheet wizard","Rough mental math","What budget?","Aspirational"]},
{c:"money",q:"Sale shopping?",o:["Only buy on sale","Buy when I want it","Sales are a trap","What's money"]},
/* LIFESTYLE (8) */
{c:"life",q:"Early bird or night owl?",o:["Up at dawn","Night owl","Neither, I'm tired always","Depends"]},
{c:"life",q:"Your space is…",o:["Spotless","Organized chaos","Lived-in","A crime scene"]},
{c:"life",q:"Planner or spontaneous?",o:["Color-coded calendar","General plan","Spontaneous","Plans stress me out"]},
{c:"life",q:"Fitness level?",o:["Gym is my second home","Active-ish","Walks count","What's a gym"]},
{c:"life",q:"Shopping tolerance?",o:["Love it, all day","One hour max","Online only","I'd rather do anything else"]},
{c:"life",q:"Laundry philosophy?",o:["Folded immediately","Clean pile / dirty pile","Chair. The chair knows","Laundry day is a myth"]},
{c:"life",q:"Ideal weekend morning?",o:["Workout + errands","Slow coffee","Sleep until noon","Adventure"]},
{c:"life",q:"How many plants do you own?",o:["A jungle","A few survivors","One, barely alive","Plants fear me"]},
/* ENTERTAINMENT (8) */
{c:"fun",q:"Movies or TV shows?",o:["Movies","TV shows","YouTube rabbit holes","I don't watch stuff"]},
{c:"fun",q:"Concert or club?",o:["Concert","Club","Neither, I'm home","Festival"]},
{c:"fun",q:"Board games or video games?",o:["Board games","Video games","Both","Card games count?"]},
{c:"fun",q:"Comedy or drama?",o:["Comedy","Drama","Horror","Documentaries"]},
{c:"fun",q:"Rewatch comfort show?",o:["The Office","Friends","Parks & Rec","Anime","I don't rewatch"]},
{c:"fun",q:"Karaoke: are you in?",o:["First to grab the mic","After two drinks","Audience only","Absolutely not"]},
{c:"fun",q:"Podcasts?",o:["Daily listener","True crime only","Comedy pods","What's a podcast"]},
{c:"fun",q:"Sport you actually watch?",o:["Basketball","Football","Soccer","Esports","None, proudly"]},
/* PERSONALITY (8) */
{c:"self",q:"How competitive are you?",o:["Win at all costs","Friendly competitive","Only board games","I let people win"]},
{c:"self",q:"How stubborn are you?",o:["Extremely","Selectively","I can be convinced","Go with the flow"]},
{c:"self",q:"How adventurous are you?",o:["Skydiving soon","Hiking yes, cliffs no","New restaurant = adventure","Couch is adventure"]},
{c:"self",q:"How emotional are you?",o:["Cry at commercials","Feelings, but private","Stoic","Emotionally unavailable (joking)"]},
{c:"self",q:"Alone time needed?",o:["Daily, non-negotiable","Some each week","Barely any","What is alone"]},
{c:"self",q:"Decision making?",o:["Fast and confident","Research everything","Ask everyone first","Coin flip"]},
{c:"self",q:"Risk tolerance?",o:["YOLO","Calculated risks","Low risk only","Risk? Never met her"]},
{c:"self",q:"Are you the planner of the group?",o:["Always","Sometimes","Never","I just show up"]},
/* US / RELATIONSHIP (6) */
{c:"us",q:"What matters most?",o:["Quality time","Humor","Loyalty","Communication","Shared interests"]},
{c:"us",q:"Communication throughout the day?",o:["Constant texting","Check-ins","Only when needed","Carrier pigeon"]},
{c:"us",q:"Separate activities: comfortable?",o:["Totally, healthy","Mostly","A little jealous","We do everything together"]},
{c:"us",q:"Apology style?",o:["Immediate and thorough","Give me an hour","Actions > words","I'm never wrong (kidding)"]},
{c:"us",q:"Love language?",o:["Quality time","Words","Gifts","Acts of service","Physical touch"]},
{c:"us",q:"Conflict style?",o:["Talk it out now","Cool down first","Avoid at all costs","Competitive debate"]},
/* CHAOS (8) */
{c:"chaos",q:"Zombie apocalypse strategy?",o:["Barricade and ration","Find a boat","Join the zombies","I have a plan (won't share)"]},
{c:"chaos",q:"Rich and unknown, or famous and comfortable?",o:["Rich and unknown","Famous and comfortable","Famous AND rich","Off-grid entirely"]},
{c:"chaos",q:"Dogs or cats?",o:["Dogs","Cats","Both","Neither (suspicious)"]},
{c:"chaos",q:"Aliens: real or not?",o:["Obviously real","Probably","Nope","I AM one"]},
{c:"chaos",q:"Deserted island survival?",o:["Thriving","Surviving","Dead in a week","Rescued by dolphins"]},
{c:"chaos",q:"Who'd get arrested for something stupid?",o:["Me, definitely","The other person","Both of us","Neither (liars)"]},
{c:"chaos",q:"Pick a superpower:",o:["Teleport","Read minds","Time stop","Invisibility","Flight"]},
{c:"chaos",q:"You're suddenly a ghost. First move?",o:["Haunt my friends","Travel free","Finish unfinished business","Nap eternally"]}
];

/* ---------------- side quests (110) ----------------
   t: title, d: easy|medium|chaotic, time: minutes,
   loc: home|outside|restaurant|mall|anywhere|datenight|friends,
   b: free|10|25|any (budget), p: solo|2|4|5 (players),
   tag: outdoor|friends|date|chaotic (for achievements) */
HT.QUESTS = [
/* AT HOME */
{n:"Attic Archaeologist",t:"Find the oldest object in your home. Bonus points if it still works.",d:"easy",time:15,loc:["home"],b:["free"],p:["solo","2"]},
{n:"Snack Scientist",t:"Invent the weirdest snack combination you can actually tolerate. Document it.",d:"easy",time:15,loc:["home"],b:["free","10"],p:["solo","2","4"]},
{n:"Tower of Junk",t:"Build the tallest tower possible using only random household objects.",d:"easy",time:15,loc:["home"],b:["free"],p:["solo","2","4"]},
{n:"Kitchen Drama",t:"Take the most dramatic photo possible in your kitchen. Think movie poster.",d:"easy",time:10,loc:["home"],b:["free"],p:["solo","2"]},
{n:"Infomercial Star",t:"Everyone picks a random object. Invent and perform a fake 30-second commercial for it.",d:"medium",time:15,loc:["home"],b:["free"],p:["2","4","5"]},
{n:"Blind Portrait",t:"Draw a portrait of each other without looking at the paper. Sign and date them.",d:"medium",time:15,loc:["home"],b:["free"],p:["2"]},
{n:"Magic Minute",t:"Learn a 15-second magic trick from the internet and perform it.",d:"medium",time:30,loc:["home"],b:["free"],p:["solo","2"]},
{n:"Shelf Museum",t:"Rearrange one shelf to look like a museum exhibit, complete with tiny labels.",d:"easy",time:15,loc:["home"],b:["free"],p:["solo","2"]},
{n:"Color Hunt",t:"Find 5 things in your home that are the exact same color. Line them up.",d:"easy",time:10,loc:["home"],b:["free"],p:["solo","2"]},
{n:"Fridge Poet",t:"Write a haiku about the contents of your fridge. Read it aloud dramatically.",d:"easy",time:10,loc:["home"],b:["free"],p:["solo","2","4"]},
{n:"Fort Night",t:"Build a blanket fort and eat dinner inside it. No phones allowed in the fort.",d:"medium",time:30,loc:["home"],b:["free"],p:["2","4"]},
{n:"Spoon Face",t:"See how many spoons you can balance on your face at once. Photo evidence required.",d:"easy",time:10,loc:["home"],b:["free"],p:["solo","2","4"]},
{n:"Shelf Librarian",t:"Alphabetize your bookshelf or spice rack. Feel the satisfaction.",d:"easy",time:20,loc:["home"],b:["free"],p:["solo"]},
{n:"Nature Documentary",t:"Film a fake nature documentary about your pet, plant, or roommate.",d:"medium",time:20,loc:["home"],b:["free"],p:["solo","2","4"]},
{n:"Letter Menu",t:"Cook a meal where every ingredient starts with the same letter.",d:"chaotic",time:45,loc:["home"],b:["25"],p:["2","4"]},
{n:"Photo Favorites",t:"Go through your camera roll and make a favorites album of the 10 best.",d:"easy",time:15,loc:["home","anywhere"],b:["free"],p:["solo"]},
{n:"Donation Dash",t:"Find 3 things to donate. Bag them up right now.",d:"easy",time:20,loc:["home"],b:["free"],p:["solo","2"]},
{n:"New Cuisine Night",t:"Cook a dish from a cuisine you've never made before.",d:"medium",time:60,loc:["home"],b:["25"],p:["solo","2","4"]},
{n:"Indoor Picnic",t:"Lay a blanket on the floor and have a full picnic indoors.",d:"easy",time:30,loc:["home"],b:["free","10"],p:["2","4"]},
{n:"Origami Hour",t:"Learn to fold an origami crane. Race to finish first.",d:"medium",time:20,loc:["home"],b:["free"],p:["solo","2","4"]},
{n:"Silent Library",t:"Everyone must be completely silent for 20 minutes. First to talk loses.",d:"chaotic",time:20,loc:["home"],b:["free"],p:["4","5"]},
/* OUTSIDE */
{n:"Heart Hunter",t:"Find something shaped like a heart. Nature counts, graffiti counts.",d:"easy",time:15,loc:["outside","anywhere"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Album Cover",t:"Take a photo that looks like an album cover. Pose like you mean it.",d:"easy",time:15,loc:["outside","anywhere"],b:["free"],p:["solo","2","4"],tag:["outdoor"]},
{n:"Weird Under $5",t:"Find the weirdest store item under $5. You don't have to buy it.",d:"easy",time:20,loc:["outside"],b:["10"],p:["solo","2"],tag:["outdoor"]},
{n:"Local Tourist",t:"Take a picture pretending you're a tourist in your own city.",d:"easy",time:20,loc:["outside"],b:["free"],p:["2","4"],tag:["outdoor"]},
{n:"Faux Fancy",t:"Find something that looks expensive but isn't. Photograph it like a luxury ad.",d:"medium",time:20,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Random Direction",t:"Pick a random direction and walk for 10 minutes. See where you end up.",d:"medium",time:30,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Dog Spotting",t:"Photograph 5 different dogs (from a respectful distance, don't chase).",d:"medium",time:30,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Best Free View",t:"Find the best free view within walking distance. Watch the sky for 5 minutes.",d:"easy",time:30,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Chalk Kindness",t:"Leave a kind chalk message on a sidewalk for a stranger to find.",d:"easy",time:15,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Cloud Stories",t:"Find 3 clouds and invent a full backstory for each one.",d:"easy",time:15,loc:["outside"],b:["free"],p:["2","4"],tag:["outdoor"]},
{n:"Epic Boring",t:"Take the most boring photo possible, then caption it like it's epic.",d:"easy",time:10,loc:["outside","anywhere"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Band Name Street",t:"Find a street name that would make a great band name.",d:"easy",time:20,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Red Car Rally",t:"Race: who can spot the most red cars in 5 minutes?",d:"easy",time:10,loc:["outside"],b:["free"],p:["2","4"],tag:["outdoor"]},
{n:"Corner Store Roulette",t:"Buy a snack you've never tried from the nearest corner store.",d:"easy",time:15,loc:["outside"],b:["10"],p:["solo","2"],tag:["outdoor"]},
{n:"Old Soul Block",t:"Find the oldest building on your block and learn one fact about it.",d:"medium",time:30,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Duck Duty",t:"Feed ducks at a pond (birdseed or peas — never bread).",d:"easy",time:30,loc:["outside"],b:["free","10"],p:["solo","2"],tag:["outdoor"]},
{n:"Free Library Note",t:"Find a Little Free Library and leave a kind note inside a book.",d:"easy",time:20,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Sunset Showdown",t:"Sunset photo contest. Everyone shoots, group votes on the winner.",d:"easy",time:30,loc:["outside"],b:["free"],p:["2","4","5"],tag:["outdoor"]},
{n:"Plant Detective",t:"Identify 3 plants using a plant ID app. Become briefly insufferable about it.",d:"easy",time:20,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"New Route",t:"Walk a route you've never taken before. Notice 3 new things.",d:"easy",time:30,loc:["outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
/* WITH FRIENDS */
{n:"Funniest Find",t:"Everyone gets 3 minutes to find the funniest thing nearby. Vote on a winner.",d:"easy",time:10,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Hot Take Roulette",t:"Everyone anonymously writes a hot take. Read them aloud and guess who wrote each.",d:"medium",time:20,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Movie Poster",t:"Take a group photo recreating a famous movie poster.",d:"medium",time:20,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Room Conspiracy",t:"Invent a fake conspiracy theory about something in the room. Most convincing wins.",d:"medium",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Dare Dealer",t:"Each person gives someone else a ridiculous (but safe) challenge to complete.",d:"medium",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Speed Secrets",t:"Two truths and a lie, speed round. 60 seconds per person.",d:"easy",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Order Roulette",t:"At a cafe, everyone orders for someone else. No take-backs.",d:"medium",time:30,loc:["friends","restaurant"],b:["25"],p:["4","5"],tag:["friends"]},
{n:"Lip-Sync Battle",t:"30-second lip-sync battle. Props encouraged, dignity optional.",d:"chaotic",time:20,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends","chaotic"]},
{n:"Compliment War",t:"Compliment battle: most creative genuine compliment wins. No insults allowed.",d:"easy",time:10,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Blind Playlist",t:"Build a group playlist where each person adds one song without seeing the others.",d:"easy",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"PowerPoint Night",t:"Everyone makes a 3-slide presentation on a nonsense topic. Present with full confidence.",d:"chaotic",time:60,loc:["friends","home"],b:["free"],p:["4","5"],tag:["friends","chaotic"]},
{n:"Telephone Pictionary",t:"Play telephone pictionary: draw, guess, draw. Watch it fall apart beautifully.",d:"medium",time:20,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Emoji Experiment",t:"Everyone texts their mom the same random emoji. Compare replies.",d:"chaotic",time:10,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends","chaotic"]},
{n:"Freeze Dance",t:"Freeze dance tournament. Last one dancing does the dishes.",d:"easy",time:15,loc:["friends","home"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Handshake Lab",t:"Invent an official secret handshake for your friend group. It must have at least 5 moves.",d:"easy",time:10,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Compliment Roast",t:"Roast battle where only compliments are allowed. Most devastating kindness wins.",d:"medium",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Blind Taste Test",t:"Blind taste test with 3 snacks. Guess each one. Loser buys next round.",d:"medium",time:20,loc:["friends","home"],b:["10"],p:["4","5"],tag:["friends"]},
{n:"Mystery Karaoke",t:"Karaoke, but everyone sings a song they've never heard before. Commit fully.",d:"chaotic",time:30,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends","chaotic"]},
{n:"Twist Story",t:"Group story, one sentence each. Every 4th sentence must include a plot twist.",d:"easy",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Meme Reenactment",t:"Recreate a famous meme as a group. Post it or it didn't happen.",d:"medium",time:15,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Theme Song",t:"Make up an official theme song for your friend group. Perform it.",d:"medium",time:20,loc:["friends","anywhere"],b:["free"],p:["4","5"],tag:["friends"]},
/* DATE NIGHT */
{n:"New Bite",t:"Pick a food neither of you has ever tried. Order it.",d:"medium",time:30,loc:["datenight","restaurant"],b:["25"],p:["2"],tag:["date"]},
{n:"Drink Swap",t:"Choose each other's drink for the night. No vetoes.",d:"easy",time:20,loc:["datenight","restaurant"],b:["25"],p:["2"],tag:["date"]},
{n:"Us in One Photo",t:"Take one picture that represents your relationship. Just one — make it count.",d:"easy",time:10,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"First Meeting",t:"Pretend you're meeting for the first time. Introduce yourselves to each other.",d:"medium",time:20,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"Five Dollar Gift",t:"Each person has $5 to buy the other something. Most thoughtful gift wins.",d:"medium",time:30,loc:["datenight","outside"],b:["10"],p:["2"],tag:["date"]},
{n:"Dessert Dinner",t:"Dessert-only dinner. Order dessert first like the adults you are.",d:"medium",time:45,loc:["datenight","restaurant"],b:["25"],p:["2"],tag:["date"]},
{n:"Constellation Club",t:"Go stargaze and invent your own constellations. Name them after inside jokes.",d:"easy",time:30,loc:["datenight","outside"],b:["free"],p:["2"],tag:["date"]},
{n:"Six-Word Story",t:"Write each other a 6-word love story. Read them aloud.",d:"easy",time:10,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"First Date Redux",t:"Recreate a photo from your first date as closely as possible.",d:"medium",time:30,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"Thrift Stylist",t:"Thrift store challenge: pick the best $10 outfit for each other. Fashion show after.",d:"chaotic",time:60,loc:["datenight","outside"],b:["10"],p:["2"],tag:["date","chaotic"]},
{n:"Childhood Plate",t:"Cook each other's favorite childhood meal. No recipe peeking.",d:"medium",time:60,loc:["datenight","home"],b:["25"],p:["2"],tag:["date"]},
{n:"Living Room Slow Dance",t:"Slow dance in the living room to whatever song plays next. Full commitment.",d:"easy",time:10,loc:["datenight","home"],b:["free"],p:["2"],tag:["date"]},
{n:"Hundred Dollar Trip",t:"Plan a dream trip with a $100 budget. Present your itinerary like a pitch.",d:"medium",time:30,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"Admiration Exchange",t:"Write down 3 things you admire about each other. Exchange and read aloud.",d:"easy",time:15,loc:["datenight","anywhere"],b:["free"],p:["2"],tag:["date"]},
{n:"Book Matchmaker",t:"Go to a bookstore and pick a book for each other. Explain your choice.",d:"medium",time:45,loc:["datenight","outside"],b:["25"],p:["2"],tag:["date"]},
/* RESTAURANT / BAR */
{n:"Menu Adventure",t:"Order something you've never tried before. No safe picks.",d:"easy",time:30,loc:["restaurant"],b:["25"],p:["solo","2","4"]},
{n:"Menu Roulette",t:"Each person picks one menu item for someone else to eat.",d:"medium",time:30,loc:["restaurant","friends"],b:["25"],p:["2","4","5"],tag:["friends"]},
{n:"Serious Critics",t:"Rate the restaurant like absurdly serious food critics. Use words like 'mouthfeel'.",d:"medium",time:30,loc:["restaurant"],b:["free"],p:["2","4"]},
{n:"Table Lore",t:"Invent a detailed fake backstory for another table. Do NOT bother them.",d:"medium",time:20,loc:["restaurant"],b:["free"],p:["2","4"]},
{n:"Dessert First",t:"Order dessert before anything else. Live a little.",d:"easy",time:20,loc:["restaurant"],b:["25"],p:["solo","2","4"]},
{n:"Server's Secret",t:"Ask your server for their favorite off-menu or underrated item. Order it.",d:"medium",time:30,loc:["restaurant"],b:["25"],p:["2","4"]},
{n:"Ingredient Detective",t:"Pick one dish and try to guess every ingredient in it.",d:"medium",time:30,loc:["restaurant"],b:["25"],p:["2"]},
{n:"Napkin Gallery",t:"Napkin art contest. Best drawing wins; loser tips extra.",d:"easy",time:20,loc:["restaurant"],b:["free"],p:["2","4"]},
{n:"Chopstick Challenge",t:"If you've never used chopsticks, tonight's the night. Full meal, no fork.",d:"easy",time:20,loc:["restaurant"],b:["25"],p:["solo","2"]},
{n:"Appetizer Tour",t:"Skip entrees. Order 3 appetizers to share instead.",d:"easy",time:30,loc:["restaurant"],b:["25"],p:["2","4"]},
/* MALL */
{n:"Mall Oddities",t:"Find the weirdest product in the mall. Photograph it for the group chat.",d:"easy",time:30,loc:["mall"],b:["free"],p:["solo","2","4"],tag:["outdoor"]},
{n:"Window Bingo",t:"Window-shopping bingo: find 9 specific items across stores. First to finish wins.",d:"medium",time:45,loc:["mall","friends"],b:["free"],p:["4","5"],tag:["friends"]},
{n:"Outrageous Fitting",t:"Try on the most outrageous outfit you can find. Photo only, no purchase.",d:"medium",time:30,loc:["mall"],b:["free"],p:["2","4"]},
{n:"Food Court World Tour",t:"Everyone gets food from a different cuisine at the food court. Share everything.",d:"medium",time:45,loc:["mall","friends"],b:["25"],p:["4","5"],tag:["friends"]},
{n:"Color Quest",t:"Find something in your favorite color in 5 different stores.",d:"easy",time:30,loc:["mall"],b:["free"],p:["solo","2"]},
{n:"Kind Narrator",t:"People-watch and invent kind, wholesome life stories for strangers (quietly, kindly).",d:"medium",time:30,loc:["mall"],b:["free"],p:["2"]},
/* ANYWHERE / CHAOTIC */
{n:"Accent Hour",t:"Speak in terrible accents for 5 minutes. Commit or perish.",d:"chaotic",time:10,loc:["anywhere","friends"],b:["free"],p:["2","4","5"],tag:["chaotic","friends"]},
{n:"Trailer Park",t:"Film a 30-second movie trailer starring your friends. Dramatic voiceover required.",d:"chaotic",time:30,loc:["anywhere"],b:["free"],p:["2","4","5"],tag:["chaotic"]},
{n:"Object Hero",t:"Everyone invents a superhero based on the first object they see. Draw the costume.",d:"chaotic",time:15,loc:["anywhere"],b:["free"],p:["2","4","5"],tag:["chaotic"]},
{n:"Weird Aisle",t:"Walk into a store and find the single weirdest product. Defend your pick.",d:"chaotic",time:20,loc:["outside","mall"],b:["free"],p:["solo","2"],tag:["chaotic","outdoor"]},
{n:"Sports Announcer",t:"Narrate your own life like a sports commentator for 5 minutes.",d:"chaotic",time:10,loc:["anywhere"],b:["free"],p:["solo","2"],tag:["chaotic"]},
{n:"Polyglot Cheers",t:"Learn to say 'cheers' in 5 languages and use every single one tonight.",d:"easy",time:20,loc:["anywhere"],b:["free"],p:["2","4"]},
{n:"Hourly Evidence",t:"Take a photo every hour today. Assemble them into a day collage tonight.",d:"medium",time:120,loc:["anywhere"],b:["free"],p:["solo","2"]},
{n:"Errand Trailer",t:"Give yourself a dramatic movie-trailer voiceover while running errands.",d:"chaotic",time:20,loc:["anywhere"],b:["free"],p:["solo"],tag:["chaotic"]},
{n:"Letter Hunt",t:"Find 3 things that start with the same letter as your name.",d:"easy",time:15,loc:["anywhere"],b:["free"],p:["solo","2"]},
{n:"Time Capsule",t:"Create a time capsule to open in exactly 1 year. Seal it with tape and ceremony.",d:"medium",time:30,loc:["home","anywhere"],b:["free"],p:["2","4"]},
{n:"Ten-Second Dance",t:"Learn a 10-second dance and perform it somewhere slightly silly.",d:"chaotic",time:20,loc:["anywhere"],b:["free"],p:["solo","2","4"],tag:["chaotic"]},
{n:"Scenic Route",t:"Take the scenic route home, wherever 'home' is tonight.",d:"easy",time:30,loc:["anywhere","outside"],b:["free"],p:["solo","2"],tag:["outdoor"]},
{n:"Kindness Streak",t:"Do 5 kind things for strangers today. Keep it anonymous.",d:"medium",time:120,loc:["anywhere"],b:["free"],p:["solo","2"]},
{n:"Five New Words",t:"Learn 5 words in a new language and actually use them today.",d:"easy",time:20,loc:["anywhere"],b:["free"],p:["solo","2"]},
{n:"Backwards Hour",t:"Do small things in reverse order for one hour. Walk backwards is optional (careful).",d:"chaotic",time:60,loc:["anywhere","home"],b:["free"],p:["2","4"],tag:["chaotic"]},
{n:"Yes Day Lite",t:"Say yes to every reasonable suggestion for the next hour. $20 cap.",d:"chaotic",time:60,loc:["anywhere","friends"],b:["25"],p:["2","4","5"],tag:["chaotic","friends"]},
{n:"Intersection Eats",t:"At each intersection, the group votes which way to go. Eat wherever you end up.",d:"chaotic",time:90,loc:["outside","friends"],b:["25"],p:["4","5"],tag:["chaotic","friends","outdoor"]}
];

/* ---------------- quest chains (8 multi-step mini adventures) ---------------- */
HT.QUEST_CHAINS = [
{n:"The Food Crawl",xp:750,steps:["Go somewhere you've never eaten before.","Everyone orders something new off the menu.","Take one ridiculous group photo with the food.","Walk somewhere nearby you've never explored."]},
{n:"Tourist in Your Own City",xp:750,steps:["Find the most tourist-trap spot near you and go there.","Buy the cheesiest souvenir under $5.","Take the classic tourist photo (you know the one).","Find one genuinely cool thing within 2 blocks of the trap."]},
{n:"Museum of Nonsense",xp:600,steps:["Everyone finds one object and invents its 'historical significance'.","Arrange them like a museum exhibit with tiny labels.","Give a guided tour in your most serious docent voice."]},
{n:"The $20 Adventure",xp:800,steps:["Everyone puts in $20. That's the whole budget.","Go somewhere none of you have been.","The money must cover food AND an activity.","Document everything. Leftover money buys dessert."]},
{n:"Golden Hour Mission",xp:600,steps:["30 minutes before sunset, head somewhere with a view.","Everyone takes their best golden-hour photo.","Vote on a winner. Winner picks dinner."]},
{n:"The Kindness Run",xp:700,steps:["Buy 3 coffees or snacks for strangers.","Leave an anonymous kind note somewhere public.","Do one chore for someone without being asked.","Tell the group what happened. No bragging, just vibes."]},
{n:"Thrift Legends",xp:800,steps:["Hit a thrift store with $10 each.","Find the wildest outfit possible.","Full fashion show with commentary.","Donate one thing you own on the way out."]},
{n:"Midnight Diner Club",xp:650,steps:["Find a diner or late-night spot you've never tried.","Everyone orders the most 'diner' thing on the menu.","Rate everything out of 10 with zero expertise.","Plan the next Midnight Diner Club before you leave."]}
];

/* ---------------- levels ---------------- */
HT.LEVELS = [
{xp:0,n:"Civilian"},{xp:200,n:"Side Quest Rookie"},{xp:600,n:"Adventurer"},
{xp:1200,n:"Chaos Apprentice"},{xp:2200,n:"Side Quest Veteran"},{xp:3500,n:"Main Character"},
{xp:5200,n:"Chaos Lord"},{xp:7500,n:"Legendary NPC"}
];
HT.XP_FOR = { easy: 50, medium: 150, chaotic: 300 };

/* ---------------- achievements ---------------- */
HT.ACHIEVEMENTS = [
{id:"first",icon:"🌱",name:"First Quest",desc:"Complete your first side quest.",check:function(s){return s.completed>=1;}},
{id:"grass",icon:"🌿",name:"Touch Grass",desc:"Complete 5 outdoor quests.",check:function(s){return s.byTag.outdoor>=5;}},
{id:"social",icon:"🦋",name:"Social Butterfly",desc:"Complete 10 quests with friends.",check:function(s){return s.byTag.friends>=10;}},
{id:"date",icon:"🌙",name:"Date Night DLC",desc:"Complete 5 date quests.",check:function(s){return s.byTag.date>=5;}},
{id:"chaos",icon:"🌪️",name:"Absolute Chaos",desc:"Complete 10 chaotic quests.",check:function(s){return s.byTag.chaotic>=10;}},
{id:"veteran",icon:"⭐",name:"Side Character No More",desc:"Complete 25 total quests.",check:function(s){return s.completed>=25;}},
{id:"main",icon:"🎬",name:"Main Character Energy",desc:"Complete 50 quests.",check:function(s){return s.completed>=50;}},
{id:"legend",icon:"👑",name:"Legendary NPC",desc:"Complete 100 quests.",check:function(s){return s.completed>=100;}}
];
