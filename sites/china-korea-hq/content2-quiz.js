var HQ = HQ || {};

/* ================================================================
   content2-quiz.js — Part A: 24 new culture-quiz questions
   (6 per city, appended after the 5 in data.js -> 11 per city)
   Part B: 6 new rehearsal dialogue scenarios (appended below)
   Loaded AFTER data.js and content.js. Data only — no functions.
   ================================================================ */

/* ---------- PART A: SHANGHAI (6 new) ---------- */
HQ.QUIZZES.shanghai.push(
  { q: "What's the one chopstick move you must never make at a Chinese table?",
    c: ["Resting them across your bowl", "Using the thick ends to eat", "Sticking them upright in a bowl of rice", "Holding them in your left hand"],
    a: 2,
    e: "Upright chopsticks in rice look like incense burned for the dead — the biggest table taboo in China. Rest them flat across your bowl when you pause." }
);
HQ.QUIZZES.shanghai.push(
  { q: "Before you reach the turnstiles of the Shanghai Metro, you must…",
    c: ["Put your bag through an X-ray scanner", "Show your passport", "Buy a day pass in advance", "Take off your shoes"],
    a: 0,
    e: "Every metro station in China has airport-style bag screening — bag and water bottle on the belt before the turnstiles. It feels normal by day two." }
);
HQ.QUIZZES.shanghai.push(
  { q: "You're walking the Bund in December. What's the real enemy?",
    c: ["Rain", "Closed walkways", "Huge crowds", "The river wind chill — dress windproof and warm"],
    a: 3,
    e: "December Shanghai is only 2-8C, but the Huangpu river wind cuts straight through you. Windproof outer layer, hat, gloves — the skyline photos are worth it." }
);
HQ.QUIZZES.shanghai.push(
  { q: "At a souvenir stall near Yuyuan Garden, the first price you're quoted is…",
    c: ["Fixed — just pay it", "An opening offer — bargain with a smile", "A scam — walk away immediately", "Non-negotiable for foreigners"],
    a: 1,
    e: "Market and street stalls expect friendly haggling — counter around half and meet in the middle. Malls and chain stores are fixed price, so read the room." }
);
HQ.QUIZZES.shanghai.push(
  { q: "At a Shanghai restaurant in December, the water you're handed will most likely be…",
    c: ["Ice water", "Sparkling water", "Hot or warm water", "Lukewarm tap water"],
    a: 2,
    e: "China runs on hot water — restaurants serve it warm or hot year-round, and many people find it soothing. It's one of those small culture shocks you'll end up loving." }
);
HQ.QUIZZES.shanghai.push(
  { q: "At a Chinese banquet dinner, when do you start eating?",
    c: ["When the host invites everyone to begin", "As soon as your plate arrives", "After the oldest guest finishes", "Whenever you feel like it"],
    a: 0,
    e: "Wait for the host's invitation before digging in — starting early is the classic foreigner faux pas. Bonus: the seat facing the door is the guest of honor's." }
);

/* ---------- PART A: BEIJING (6 new) ---------- */
HQ.QUIZZES.beijing.push(
  { q: "At Beijing's temples, mind your feet — you should…",
    c: ["Remove your shoes at every gate", "Walk backwards through doorways", "Step over the door thresholds, never on them", "Keep both feet together at all times"],
    a: 2,
    e: "Temple thresholds are sacred — step over them, don't stand on them. Same spirit: don't point at statues, and respect no-photo signs inside halls." }
);
HQ.QUIZZES.beijing.push(
  { q: "The Great Wall in December is magical and brutal. The #1 comfort rule is…",
    c: ["Bring a big umbrella", "Dress for wind chill — windproof layers, hat, gloves", "Only go at high noon", "Wear sandals for better grip"],
    a: 1,
    e: "Beijing winter can hit -10C and the wall's ridgelines are wind tunnels. Windproof everything, hand warmers, a thermos — you'll outlast the crowds." }
);
HQ.QUIZZES.beijing.push(
  { q: "Before climbing into a hutong rickshaw, always…",
    c: ["Tip the driver upfront", "Show your passport first", "Haggle after the ride", "Agree on the price before boarding"],
    a: 3,
    e: "Agree the fare before you board — a friendly 'duo shao qian' (how much) avoids the end-of-ride surprise. Same rule for pedicabs anywhere touristy." }
);
HQ.QUIZZES.beijing.push(
  { q: "At a proper Peking duck dinner, the shatteringly crisp skin is traditionally eaten first with…",
    c: ["A dip in sugar", "A dunk in soy sauce", "A smear of wasabi", "Nothing — plain"],
    a: 0,
    e: "The classic first bite is duck skin dipped in sugar — sweet, crisp, rich. Then come the pancakes with hoisin, scallion, and cucumber." }
);
HQ.QUIZZES.beijing.push(
  { q: "On Beijing subway escalators during rush hour, the rule is…",
    c: ["Stand on the left, walk on the right", "No standing — keep moving", "Stand on the right, walk on the left", "Escalators are staff-only"],
    a: 2,
    e: "Stand right, walk left — same as most of the world. Rush hour (7:30-9:30, 17:30-19:30) is crush-loaded, so plan big sights around it." }
);
HQ.QUIZZES.beijing.push(
  { q: "Beijing's old-school hot pot is a copper pot of bubbling broth built around…",
    c: ["Spicy beef with chili oil", "Thin-sliced mutton with sesame dipping sauce", "Seafood with black vinegar", "Vegetables only"],
    a: 1,
    e: "Old Beijing copper-pot hot pot is all about mutton, quick-swished, dipped in sesame sauce. Simple, warming, and perfect for a December night." }
);

/* ---------- PART A: CHENGDU (6 new) ---------- */
HQ.QUIZZES.chengdu.push(
  { q: "At a shared Chengdu hotpot, the polite way to handle the communal pot is…",
    c: ["Use your own chopsticks — everyone shares happily", "Ask the waiter to fetch everything", "Use your hands for speed", "Use the communal serving chopsticks for the shared pot"],
    a: 3,
    e: "Use the serving chopsticks for the communal pot and your own for your bowl. Dipping your used chopsticks back in is the faux pas to avoid." }
);
HQ.QUIZZES.chengdu.push(
  { q: "That little dish of sesame oil (youdie) at your hotpot table is for…",
    c: ["Drinking as an appetizer", "Cooling each bite and taming the chili heat", "Seasoning the broth itself", "Dipping your napkin in it"],
    a: 1,
    e: "Swirl each just-cooked bite through the oil dish — it cools the food and softens the chili burn. Garlic and cilantro add-ins are encouraged." }
);
HQ.QUIZZES.chengdu.push(
  { q: "In a Chengdu teahouse, drinking from a gaiwan (lidded bowl) works like this…",
    c: ["Remove the lid and drink with a straw", "Eat the tea leaves first", "Hold the lid ajar to strain the leaves, then sip from the bowl", "Pour it into the saucer to cool"],
    a: 2,
    e: "Hold the lid slightly ajar to hold back the leaves, and sip from the bowl. Watch the regulars for one round and copy them — they'll approve." }
);
HQ.QUIZZES.chengdu.push(
  { q: "Chengdu in December reads 8C but feels much colder because…",
    c: ["Damp air plus little indoor heating — layer up, even indoors", "Constant snowfall", "Freezing mountain winds", "Restaurants blasting the AC"],
    a: 0,
    e: "Southern China has no central heating, so the damp chill follows you indoors. Pack a warm mid-layer you can live in — and treat hotpot as a heating strategy." }
);
HQ.QUIZZES.chengdu.push(
  { q: "A Jinli Ancient Street vendor quotes 180 yuan for a souvenir you like. You…",
    c: ["Pay it — haggling is rude", "Offer a tenth of the price as a power move", "Walk away without a word", "Counter around half, smiling, and meet in the middle"],
    a: 3,
    e: "Friendly haggling is expected at street and market stalls — start around half, stay cheerful, and meet in the middle. Your feet are your best leverage." }
);
HQ.QUIZZES.chengdu.push(
  { q: "Slurping your dan dan noodles loudly in Chengdu is…",
    c: ["Rude — eat quietly", "Only okay for tourists", "Totally fine — it shows you're enjoying it", "Grounds for being asked to leave"],
    a: 2,
    e: "Slurping is normal and even complimentary — it cools the noodles and shows appreciation. Silence is for libraries, not noodle shops." }
);

/* ---------- PART A: SEOUL (6 new) ---------- */
HQ.QUIZZES.seoul.push(
  { q: "Next to the instant ramyeon shelf at a Seoul convenience store, the hot-water dispenser is there so you can…",
    c: ["Wash your hands", "Make tea for the staff", "Cook your ramyeon right there", "Fill your water bottle for free"],
    a: 2,
    e: "Cook it on the spot — grab a cup ramyeon, add the hot water, and eat at the window tables. It's a full late-night dining ritual." }
);
HQ.QUIZZES.seoul.push(
  { q: "After your 11pm convenience-store feast at the outdoor tables, you…",
    c: ["Leave everything — staff clean up", "Sort trash into the labeled bins (general, food waste, recycling)", "Take it all back to your hotel", "Stack it neatly and walk away"],
    a: 1,
    e: "Korea takes sorting seriously — use the labeled bins for general waste, food scraps, and recycling. Doing it right earns approving nods from locals." }
);
HQ.QUIZZES.seoul.push(
  { q: "The pink seats on the Seoul subway are…",
    c: ["Reserved — leave them empty even in a packed car", "First-come, first-served", "For couples only", "Just decorative"],
    a: 0,
    e: "Priority seats are for the elderly, pregnant, and disabled — etiquette says leave them empty even when the car is packed. Standing is the respectful default." }
);
HQ.QUIZZES.seoul.push(
  { q: "The single best survival buy at a Seoul convenience store in December is…",
    c: ["A paper fan", "Sunglasses", "Disposable hand warmers (hot packs)", "An iced coffee"],
    a: 2,
    e: "Hot packs — crack one open and your pockets become heaters for hours. December Seoul can swing to -10C, and locals swear by them." }
);
HQ.QUIZZES.seoul.push(
  { q: "Tipping at a Seoul restaurant is…",
    c: ["Expected at 10%", "Not customary — good service is the standard", "Only done at fancy places", "Required by law"],
    a: 1,
    e: "Like China, Korea has no tipping culture — service is part of the job, and some bills already include a service charge. A sincere 'jal meogeosseumnida' is the real tip." }
);
HQ.QUIZZES.seoul.push(
  { q: "Before stepping into a temple hall, a hanok guesthouse, or many traditional restaurants in Korea, you…",
    c: ["Remove your shoes", "Put on shoe covers", "Knock three times", "Pay a shoe fee"],
    a: 0,
    e: "Shoes off at the door — Korea's ondol heated floors are for socks and bare feet. Wear slip-ons and clean socks; you'll be taking them off constantly." }
);

/* ================================================================
   PART B: 6 new rehearsal dialogue scenarios
   (ids are new — existing: taxi, restaurant, hotel, directions,
   emergency, money, connectivity, entry, apps)
   Mandarin pinyin has NO tone marks — plain roman letters only.
   ================================================================ */
HQ.DIALOGUES.push(
  {
    id: "convenience-store",
    title: "Midnight convenience store run",
    setting: "It's 11pm in Myeongdong and you want triangle gimbap, banana milk, and something warm.",
    tip: "Cultural tip: practice this one out loud before the trip — Korean convenience stores expect you to eat at the tables and sort your own trash, and staff will happily point you to hot water for ramyeon. In China, FamilyMart and 7-Eleven are just as much late-night lifelines.",
    mandarin: { lines: [
      { say: "你好，请问有三角饭团吗？", py: "ni hao, qing wen you san jiao fan tuan ma", en: "T: Hi, do you have triangle rice balls?" },
      { say: "有，在冷柜那边。", py: "you, zai leng gui na bian", en: "D: Yes, over in the refrigerated case." },
      { say: "我要两个，还要一盒香蕉牛奶。", py: "wo yao liang ge, hai yao yi he xiang jiao niu nai", en: "T: I'll take two, plus a carton of banana milk." },
      { say: "好的，还需要别的吗？", py: "hao de, hai xu yao bie de ma", en: "D: Sure — anything else?" },
      { say: "这杯面可以用热水吗？", py: "zhe bei mian ke yi yong re shui ma", en: "T: Can I use hot water for this cup noodle?" },
      { say: "可以，热水在那边，自己拿。", py: "ke yi, re shui zai na bian, zi ji na", en: "D: Yes — the hot water is over there, help yourself." },
      { say: "一共多少钱？", py: "yi gong duo shao qian", en: "T: How much altogether?" },
      { say: "一共二十五块。", py: "yi gong er shi wu kuai", en: "D: 25 yuan total." },
      { say: "谢谢，晚安！", py: "xie xie, wan an", en: "T: Thanks, good night!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 삼각김밥 있어요?", py: "annyeonghaseyo, samgakgimbap isseoyo", en: "T: Hi, do you have triangle gimbap?" },
      { say: "네, 냉장고 쪽에 있어요.", py: "ne, naengjanggo jjoge isseoyo", en: "D: Yes, over by the refrigerators." },
      { say: "두 개 주세요, 바나나 우유도 하나요.", py: "du gae juseyo, banana uyudo hanayo", en: "T: Two please, and one banana milk." },
      { say: "네, 다른 건 필요하세요?", py: "ne, dareun geon piryohaseyo", en: "D: Sure — do you need anything else?" },
      { say: "컵라면 뜨거운 물 있어요?", py: "keopramyeon tteugeoun mul isseoyo", en: "T: Is there hot water for the cup ramyeon?" },
      { say: "네, 저쪽에 있어요. 직접 드시면 돼요.", py: "ne, jeojjoge isseoyo. jikjeop deusimyeon dwaeyo", en: "D: Yes, over there — help yourself." },
      { say: "얼마예요?", py: "eolmayeyo", en: "T: How much is it?" },
      { say: "전부 해서 7,500원이에요.", py: "jeonbu haeseo chilcheon-obaegwon-ieyo", en: "D: 7,500 won altogether." },
      { say: "감사합니다!", py: "gamsahamnida", en: "T: Thank you!" }
    ]}
  }
);

HQ.DIALOGUES.push(
  {
    id: "pharmacy",
    title: "Pharmacy: fighting a cold",
    setting: "December caught you — sore throat, sniffles — and you need cold medicine.",
    tip: "Cultural tip: rehearse describing symptoms in simple words (sore throat, fever, runny nose) — pharmacists in both countries can sell common medicines over the counter. In China, expect the universal prescription 'drink more hot water' (多喝热水) — accept it graciously.",
    mandarin: { lines: [
      { say: "你好，我感冒了，有点发烧。", py: "ni hao, wo gan mao le, you dian fa shao", en: "T: Hi, I've caught a cold and have a slight fever." },
      { say: "喉咙痛吗？咳嗽吗？", py: "hou long tong ma? ke sou ma?", en: "D: Sore throat? Cough?" },
      { say: "喉咙痛，流鼻涕。", py: "hou long tong, liu bi ti", en: "T: Sore throat and a runny nose." },
      { say: "这种感冒药一天三次，一次两粒。", py: "zhe zhong gan mao yao yi tian san ci, yi ci liang li", en: "D: Take this cold medicine three times a day, two pills each time." },
      { say: "饭前吃还是饭后吃？", py: "fan qian chi hai shi fan hou chi", en: "T: Before or after meals?" },
      { say: "饭后吃，多喝热水。", py: "fan hou chi, duo he re shui", en: "D: After meals — and drink plenty of hot water." },
      { say: "会犯困吗？", py: "hui fan kun ma", en: "T: Will it make me drowsy?" },
      { say: "有一点，开车要小心。", py: "you yi dian, kai che yao xiao xin", en: "D: A little — be careful if you're driving." },
      { say: "好的，谢谢你！", py: "hao de, xie xie ni", en: "T: Got it, thank you!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 감기에 걸렸어요.", py: "annyeonghaseyo, gamgie geollyeosseoyo", en: "T: Hi, I've caught a cold." },
      { say: "목이 아프세요? 기침도 나세요?", py: "mogi apeuseyo? gichimdo naseyo", en: "D: Sore throat? Coughing too?" },
      { say: "네, 목 아프고 콧물 나요.", py: "ne, mok apeugo konmul nayo", en: "T: Yes — sore throat and a runny nose." },
      { say: "이 감기약 하루 세 번, 두 알씩 드세요.", py: "i gamgiyak haru se beon, du alssik deuseyo", en: "D: Take this cold medicine three times a day, two pills each time." },
      { say: "식전이에요, 식후예요?", py: "sikjeon-ieyo, sikhu-yeyo", en: "T: Before or after meals?" },
      { say: "식후에 드시고, 물 많이 드세요.", py: "sikhu-e deusigo, mul mani deuseyo", en: "D: After meals — and drink lots of water." },
      { say: "졸음이 와요?", py: "joreumi wayo", en: "T: Does it cause drowsiness?" },
      { say: "조금 와요, 운전 조심하세요.", py: "jogeum wayo, unjeon josimhaseyo", en: "D: A little — be careful driving." },
      { say: "네, 감사합니다!", py: "ne, gamsahamnida", en: "T: Got it, thank you!" }
    ]}
  }
);
HQ.DIALOGUES.push(
  {
    id: "coffee",
    title: "Ordering coffee like a local",
    setting: "A cozy cafe in Seoul (or Shanghai) — you want something warm and not too sweet.",
    tip: "Cultural tip: say this one out loud a few times before you go — cafes in Seoul and Shanghai run on mobile payment, so have your app ready before you order. 'Less sugar' (少糖 / 덜 달게) is a magic phrase in both countries, where default sweetness runs high.",
    mandarin: { lines: [
      { say: "你好，一杯热拿铁，少糖。", py: "ni hao, yi bei re na tie, shao tang", en: "T: Hi, one hot latte, less sugar." },
      { say: "大杯还是小杯？", py: "da bei hai shi xiao bei", en: "D: Large or small?" },
      { say: "中杯，加一份浓缩。", py: "zhong bei, jia yi fen nong suo", en: "T: Medium, with an extra shot." },
      { say: "要打包还是堂食？", py: "yao da bao hai shi tang shi", en: "D: To go or for here?" },
      { say: "堂食，谢谢。", py: "tang shi, xie xie", en: "T: For here, thanks." },
      { say: "一共三十块，扫码付款。", py: "yi gong san shi kuai, sao ma fu kuan", en: "D: 30 yuan total — scan to pay." },
      { say: "好了，付好了。", py: "hao le, fu hao le", en: "T: Done — paid." },
      { say: "请稍等，马上就好。", py: "qing shao deng, ma shang jiu hao", en: "D: One moment, it'll be right up." },
      { say: "谢谢！", py: "xie xie", en: "T: Thanks!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 따뜻한 라떼 한 잔 덜 달게 주세요.", py: "annyeonghaseyo, ttatteutan latte han jan deol dalge juseyo", en: "T: Hi, one hot latte, less sweet please." },
      { say: "사이즈는 어떻게 하시겠어요?", py: "saijeuneun eotteoke hasigesseoyo", en: "D: What size?" },
      { say: "미디움으로, 샷 추가요.", py: "midium-euro, syat chugayo", en: "T: Medium, with an extra shot." },
      { say: "드시고 가세요, 가져가세요?", py: "deusigo gaseyo, gajyeogaseyo", en: "D: For here or to go?" },
      { say: "먹고 갈게요.", py: "meokgo galgeyo", en: "T: For here." },
      { say: "5,500원입니다.", py: "ocheon-obaegwon-imnida", en: "D: 5,500 won." },
      { say: "카드로 할게요.", py: "kadeuro halgeyo", en: "T: By card, please." },
      { say: "잠시만 기다려 주세요.", py: "jamsiman gidaryeo juseyo", en: "D: One moment please." },
      { say: "감사합니다!", py: "gamsahamnida", en: "T: Thank you!" }
    ]}
  }
);

HQ.DIALOGUES.push(
  {
    id: "local-recommendation",
    title: "Asking a local for a restaurant recommendation",
    setting: "Your hotel concierge — or a friendly local — and you want a real dinner spot, not a tourist trap.",
    tip: "Cultural tip: practice asking 'where do locals eat?' (本地人去哪吃 / 현지인 맛집) rather than 'what's famous?' — it unlocks far better answers. And in Korea, a short wait (웨이팅) at mealtimes is a good sign, not a warning.",
    mandarin: { lines: [
      { say: "你好，请问附近有什么好吃的？", py: "ni hao, qing wen fu jin you shen me hao chi de", en: "T: Hi — anything delicious nearby you'd recommend?" },
      { say: "你们想吃什么菜？", py: "ni men xiang chi shen me cai", en: "D: What kind of food are you in the mood for?" },
      { say: "想吃本地菜，不要太贵。", py: "xiang chi ben di cai, bu yao tai gui", en: "T: Local food, nothing too expensive." },
      { say: "前面那条街有家小馆子，本地人常去。", py: "qian mian na tiao jie you jia xiao guan zi, ben di ren chang qu", en: "D: There's a small place on the street ahead — locals go there all the time." },
      { say: "要排队吗？", py: "yao pai dui ma", en: "T: Is there usually a line?" },
      { say: "饭点要等一会儿，值得。", py: "fan dian yao deng yi hui er, zhi de", en: "D: A short wait at mealtimes, but worth it." },
      { say: "有什么招牌菜？", py: "you shen me zhao pai cai", en: "T: What's their signature dish?" },
      { say: "红烧肉和炒青菜，都很地道。", py: "hong shao rou he chao qing cai, dou hen di dao", en: "D: The braised pork and stir-fried greens — very authentic." },
      { say: "太好了，谢谢你！", py: "tai hao le, xie xie ni", en: "T: Perfect, thank you!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 근처에 맛있는 곳 있어요?", py: "annyeonghaseyo, geuncheoe masinneun got isseoyo", en: "T: Hi — any delicious spots nearby?" },
      { say: "어떤 음식 드시고 싶으세요?", py: "eotteon eumsik deusigo sipeuseyo", en: "D: What kind of food are you craving?" },
      { say: "현지 음식으로, 너무 비싸지 않게요.", py: "hyeonji eumsigeuro, neomu bissaji anke-yo", en: "T: Local food, nothing too pricey." },
      { say: "앞 골목에 현지인 맛집이 있어요.", py: "ap golmoge hyeonji-in matjibi isseoyo", en: "D: There's a beloved local spot in the alley ahead." },
      { say: "웨이팅 있어요?", py: "weiting isseoyo", en: "T: Is there usually a wait?" },
      { say: "식사 시간엔 조금, 그래도 가치 있어요.", py: "siksa siganen jogeum, geuraedo gachi isseoyo", en: "D: A short one at mealtimes, but worth it." },
      { say: "대표 메뉴가 뭐예요?", py: "daepyo menyuga mwoyeyo", en: "T: What's their signature dish?" },
      { say: "제육볶음하고 된장찌개가 정말 맛있어요.", py: "jeyukbokkeumhago doenjangjjigaega jeongmal masisseoyo", en: "D: The spicy pork and soybean stew are really delicious." },
      { say: "최고예요, 감사합니다!", py: "choegoyeyo, gamsahamnida", en: "T: The best — thank you!" }
    ]}
  }
);
HQ.DIALOGUES.push(
  {
    id: "subway-tickets",
    title: "Buying subway tickets and asking about transfers",
    setting: "The ticket machine is all in Chinese characters and you need help buying a fare and finding your transfer.",
    tip: "Cultural tip: rehearse '末班车几点' (what time is the last train) and '要换乘吗' (do I transfer?) before a late night out — in China, the transit QR inside Alipay usually beats the ticket machine, and in Seoul a T-money card from any convenience store makes all of this disappear.",
    mandarin: { lines: [
      { say: "你好，请问买票在哪里买？", py: "ni hao, qing wen mai piao zai na li mai", en: "T: Hi — where do I buy tickets?" },
      { say: "自动售票机在那边，有英文。", py: "zi dong shou piao ji zai na bian, you ying wen", en: "D: The ticket machines are over there — they have English." },
      { say: "我要去人民广场，多少钱？", py: "wo yao qu ren min guang chang, duo shao qian", en: "T: I'm going to People's Square — how much?" },
      { say: "四块钱，坐二号线直达。", py: "si kuai qian, zuo er hao xian zhi da", en: "D: 4 yuan — take Line 2, it goes direct." },
      { say: "要换乘吗？", py: "yao huan cheng ma", en: "T: Do I need to transfer?" },
      { say: "不用，坐五站就到。", py: "bu yong, zuo wu zhan jiu dao", en: "D: No — five stops and you're there." },
      { say: "末班车是几点？", py: "mo ban che shi ji dian", en: "T: What time is the last train?" },
      { say: "晚上十一点左右，别太晚。", py: "wan shang shi yi dian zuo you, bie tai wan", en: "D: Around 11pm — don't cut it too close." },
      { say: "明白了，谢谢！", py: "ming bai le, xie xie", en: "T: Understood, thanks!" }
    ]},
    korean: { lines: [
      { say: "실례합니다, 표는 어디서 사요?", py: "sillyehamnida, pyoneun eodiseo sayo", en: "T: Excuse me — where do I buy tickets?" },
      { say: "저기 자동발매기가 있어요.", py: "jeogi jadongbalmaegiga isseoyo", en: "D: There are ticket machines over there." },
      { say: "홍대 가려면 얼마예요?", py: "hongdae garyeomyeon eolmayeyo", en: "T: How much to get to Hongdae?" },
      { say: "1,400원이고 2호선 타세요.", py: "cheon-sabaegwon-igo i-hoseon taseyo", en: "D: 1,400 won — take Line 2." },
      { say: "갈아타야 돼요?", py: "garataya dwaeyo", en: "T: Do I need to transfer?" },
      { say: "아니요, 다섯 정거장이에요.", py: "aniyo, daseot jeonggeojang-ieyo", en: "D: No — five stops." },
      { say: "막차는 몇 시예요?", py: "makchaneun myeot siyeyo", en: "T: When's the last train?" },
      { say: "밤 12시쯤이에요, 너무 늦지 마세요.", py: "bam yeoldu-sijjeum-ieyo, neomu neutji maseyo", en: "D: Around midnight — don't leave it too late." },
      { say: "알겠어요, 감사합니다!", py: "algesseoyo, gamsahamnida", en: "T: Got it, thank you!" }
    ]}
  }
);

HQ.DIALOGUES.push(
  {
    id: "hotel-problem",
    title: "Hotel front desk: no hot water",
    setting: "Back at the hotel — the shower runs cold and you need an extra blanket for the December night.",
    tip: "Cultural tip: practice stating the problem simply and giving your room number first — that gets the fastest fix. In China, ending with '辛苦了' (thanks for your hard work) earns genuine smiles from staff; in Korea, also ask them to check the room heating if it still feels cold.",
    mandarin: { lines: [
      { say: "你好，我房间没有热水。", py: "ni hao, wo fang jian mei you re shui", en: "T: Hi — my room has no hot water." },
      { say: "请问您的房间号是多少？", py: "qing wen nin de fang jian hao shi duo shao", en: "D: May I have your room number?" },
      { say: "八零八，淋浴都是冷水。", py: "ba ling ba, lin yu dou shi leng shui", en: "T: 808 — the shower is all cold water." },
      { say: "好的，我马上叫人去看。", py: "hao de, wo ma shang jiao ren qu kan", en: "D: Of course — I'll send someone right up." },
      { say: "还能多要一条毯子吗？很冷。", py: "hai neng duo yao yi tiao tan zi ma? hen leng", en: "T: Could I also get an extra blanket? It's cold." },
      { say: "没问题，毯子和维修一起送上去。", py: "mei wen ti, tan zi he wei xiu yi qi song shang qu", en: "D: No problem — the blanket will come up with maintenance." },
      { say: "大概多久？", py: "da gai duo jiu", en: "T: About how long?" },
      { say: "十分钟左右。", py: "shi fen zhong zuo you", en: "D: About ten minutes." },
      { say: "谢谢，辛苦了！", py: "xie xie, xin ku le", en: "T: Thanks so much!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 방에 온수가 안 나와요.", py: "annyeonghaseyo, bange onsu-ga an nawayo", en: "T: Hi — there's no hot water in my room." },
      { say: "방 번호가 어떻게 되세요?", py: "bang beonhoga eotteoke doeseyo", en: "D: What's your room number?" },
      { say: "808호요, 샤워가 찬물만 나와요.", py: "pall-baek-pal-hoyo, syawoga chanmulman nawayo", en: "T: Room 808 — the shower only runs cold." },
      { say: "네, 바로 기사님 보내드릴게요.", py: "ne, baro gisanim bonaedeurilgeyo", en: "D: Of course — I'll send maintenance right up." },
      { say: "담요 하나 더 받을 수 있을까요? 추워요.", py: "damyo hana deo badeul su isseulkkayo? chuwoyo", en: "T: Could I get an extra blanket? It's cold." },
      { say: "네, 담요도 함께 보내드릴게요.", py: "ne, damyodo hamkke bonaedeurilgeyo", en: "D: Yes — I'll send the blanket up with them." },
      { say: "얼마나 걸릴까요?", py: "eolmana geollilkkayo", en: "T: How long will it take?" },
      { say: "10분 정도 걸릴 거예요.", py: "sip-bun jeongdo geollil geoyeyo", en: "D: About 10 minutes." },
      { say: "감사합니다, 수고하세요!", py: "gamsahamnida, sugohaseyo", en: "T: Thank you so much!" }
    ]}
  }
);
