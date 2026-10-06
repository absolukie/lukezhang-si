"use strict";
var HT = window.HT || (window.HT = {});

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
