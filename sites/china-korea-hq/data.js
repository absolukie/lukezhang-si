/* China + Korea Adventure HQ — all content baked in (offline-first) */
var HQ = HQ || {};

HQ.CITIES = [
  {
    id: "shanghai", name: "Shanghai", cn: "上海", country: "China", lang: "mandarin",
    tagline: "Elegant & electric — where old lanes meet the future skyline.",
    desc: "China's most cosmopolitan city. You'll land here: art-deco Bund, neon Lujiazui towers, and soup dumplings worth the flight alone. The perfect soft landing into China.",
    neighborhoods: [
      { name: "The Bund (Waitan)", blurb: "The colonial-era riverfront promenade facing Pudong's neon towers across the Huangpu. By day it's grand old banks and trading houses; by night the skyline ignites and the whole city seems to come out for the view.", why: "Go for: the single most iconic walk in China — do it after dinner when the lights are on." },
      { name: "French Concession", blurb: "Leafy plane-tree avenues lined with 1920s lane houses, now hiding wine bars, boutiques, and old villas behind unmarked doors. This is Shanghai at its most romantic — slow down and wander without a map.", why: "Go for: getting pleasantly lost among art-deco lanes and stumbling into a perfect café." },
      { name: "Tianzifang", blurb: "A warren of narrow Shikumen lanes turned into craft shops, tea houses, and tiny galleries. Touristy, yes — but the kind of touristy that's still genuinely fun to poke around.", why: "Go for: souvenirs that aren't junk, plus people-watching over jasmine tea." },
      { name: "Lujiazui, Pudong", blurb: "The futuristic side of the river — the Oriental Pearl Tower, Shanghai Tower, and Jin Mao clustered like a sci-fi skyline. Come up from the metro and the scale of it hits you all at once.", why: "Go for: feeling very small under very tall buildings, then the observation deck." },
      { name: "Xintiandi", blurb: "Restored Shikumen stone-gate houses converted into upscale restaurants and bars around a pedestrian plaza. Polished and pricey, but the architecture is the real deal.", why: "Go for: a splurge dinner in a beautiful historic setting." },
      { name: "Old Town (Nanshi)", blurb: "What remains of Ming-dynasty Shanghai — tight alleys, the City God Temple, and snack streets where locals actually eat. It feels like a different century two blocks from the financial district.", why: "Go for: street snacks and old-Shanghai atmosphere without leaving downtown." },
      { name: "Jing'an", blurb: "An ancient golden temple dropped improbably between malls and office towers, surrounded by one of the city's best all-around neighborhoods for first-timers. Great base: central, calm-ish, well-connected.", why: "Go for: a home base with the temple, good metro links, and real local life." },
      { name: "M50 / Moganshan Lu", blurb: "Old textile mills turned into Shanghai's grittiest art district — galleries, studios, and street art along Suzhou Creek. Less polished than 798 in Beijing, more alive.", why: "Go for: contemporary Chinese art and a creek-side walk that feels undiscovered." }
    ],
    sights: [
      { name: "The Bund at night", blurb: "The postcard view, and it earns it. Walk the promenade after 7pm when both sides are lit — the colonial facades glow gold on one side, Pudong pulses neon on the other.", why: "Go for: the walk you'll describe to everyone back home." },
      { name: "Yu Garden & City God Temple", blurb: "A 400-year-old classical garden of pavilions, rockeries, and zigzag bridges, wrapped by snack streets and the temple complex. Go on a weekday morning to beat the worst crowds.", why: "Go for: old China in miniature, plus soup dumplings steps away." },
      { name: "Shanghai Tower observation deck", blurb: "China's tallest building at 632 meters, with the world's fastest elevators. The 118th-floor deck turns the whole city into a model railway.", why: "Go for: vertigo and the best skyline photo you'll ever take." },
      { name: "Shanghai Museum", blurb: "One of China's best museums, free, on People's Square — bronzes, ceramics, and calligraphy that span 5,000 years. Two focused hours here beats a full tired day anywhere else.", why: "Go for: a crash course in Chinese art history, done beautifully." },
      { name: "Propaganda Poster Art Centre", blurb: "Hidden in the basement of an apartment building in the French Concession — thousands of original posters from the 1950s-70s. Weird, fascinating, unforgettable.", why: "Go for: the strangest and most memorable hour in Shanghai." },
      { name: "Jade Buddha Temple", blurb: "A working Buddhist temple with two exquisite jade Buddhas brought from Burma. Incense, chanting, and a calm that feels miles from the city.", why: "Go for: a quiet morning reset." },
      { name: "Zhujiajiao Water Town", blurb: "A 1,700-year-old canal town an hour out — stone bridges, narrow lanes, and boats. Touristy but gorgeous; go early or late for the golden light.", why: "Go for: the easy half-day escape that feels like old Jiangnan." },
      { name: "ERA acrobatics show", blurb: "Shanghai's famous acrobatics spectacular — motorbikes in a steel globe, plate-spinning, the works. Cheesy in the best way, and the skill level is unreal.", why: "Go for: a genuinely thrilling evening, no Chinese required." },
      { name: "Fuxing Park in the morning", blurb: "French Concession park where retirees do tai chi, fly kites, play mahjong, and ballroom dance. Bring coffee, sit on a bench, and just watch.", why: "Go for: the sweetest slice of local life you'll find." },
      { name: "Nanjing Road", blurb: "China's most famous shopping street — a pedestrian river of neon, department stores, and people. It's loud and commercial and kind of wonderful at night.", why: "Go for: people-watching and the full sensory overload." },
      { name: "Oriental Pearl Tower", blurb: "The pink-and-teal double-sphere tower that's been Shanghai's symbol since the 90s. Dated? A little. Iconic? Completely. The glass-floor walkway is not for the faint-hearted.", why: "Go for: retro-futurist kitsch and river views." },
      { name: "Maglev train from the airport", blurb: "431 km/h — the fastest commercial train ride on earth, Pudong Airport to Longyang Road in 8 minutes. Your trip starts at takeoff speed.", why: "Go for: the only commute you'll ever brag about." }
    ],
    missions: [
      { id: "sh-maglev", text: "Ride the Maglev from Pudong airport 🚄" },
      { id: "sh-bund", text: "Walk the Bund after dark and take the photo 📸" },
      { id: "sh-xlb", text: "Eat xiaolongbao at least twice (it's research) 🥟" }
    ],
    unlockHint: "Unlocks 30 days before departure"
  },
  {
    id: "beijing", name: "Beijing", cn: "北京", country: "China", lang: "mandarin",
    tagline: "Imperial & historic — 3,000 years of emperors, walls, and duck.",
    desc: "The capital. Forbidden City, hutongs, the Great Wall. This is the history-heavyweight leg — bring walking shoes and an appetite for Peking duck.",
    neighborhoods: [
      { name: "Hutongs (Nanluoguxiang area)", blurb: "The old alley neighborhoods — grey-brick lanes, courtyard homes, snack stalls, and hip cafés tucked into former residences. Beijing's soul lives here, not in the skyscrapers.", why: "Go for: getting happily lost in 700-year-old lanes." },
      { name: "Gulou (Drum & Bell Towers)", blurb: "The historic heart north of the Forbidden City — hutongs that turn into bar streets at night, with the old towers looming over it all. Equal parts history and nightlife.", why: "Go for: hutong bars with a 600-year-old backdrop." },
      { name: "Shichahai", blurb: "Three connected lakes ringed by old mansions, bars, and willow trees. By day it's paddle boats and retirees; by night Houhai's bar street glows.", why: "Go for: an evening lakeside stroll that ends in a bar." },
      { name: "Qianmen", blurb: "The historic commercial street south of Tiananmen — century-old brands (the duck restaurants, the silk shops), restored facades, and old Beijing theater.", why: "Go for: old-brand shopping and a Peking duck dinner." },
      { name: "Sanlitun", blurb: "Beijing's nightlife and modern dining district — Taikoo Li's open-air mall by day, bars and clubs by night. Where the city's young and international crowd lands.", why: "Go for: dinner and drinks when you want the modern city." },
      { name: "Wudaokou", blurb: "The university district — cheap eats, Korean restaurants (huge Korean student population), and unpretentious bars. The best value food in the city.", why: "Go for: Korean food in Beijing and student-budget feasts." },
      { name: "798 Art District", blurb: "A Bauhaus-era factory complex turned into galleries, studios, and street art. Beijing's contemporary art scene at its most concentrated — and the industrial architecture is half the show.", why: "Go for: world-class contemporary art in a surreal factory setting." },
      { name: "Guomao / CBD", blurb: "The forest of supertalls around China World — Beijing's business face, all glass and ambition. Come for the skyline views from a rooftop bar, not the history.", why: "Go for: the modern Beijing most tourists never see." }
    ],
    sights: [
      { name: "The Great Wall (Mutianyu)", blurb: "The one you came for. Mutianyu is fully restored but far less crowded than Badaling — forested ridgelines, watchtowers stretching to the horizon, and a toboggan ride down. Book a driver, go on a weekday, arrive at opening.", why: "Go for: the wonder of the world, done right." },
      { name: "Forbidden City", blurb: "980 buildings, 8,886 rooms, 24 emperors — the largest palace complex on earth. Tickets sell out days ahead; book online the moment you have dates. Enter from the south, exit north into Jingshan Park.", why: "Go for: standing where emperors stood, at impossible scale." },
      { name: "Temple of Heaven", blurb: "Where Ming and Qing emperors prayed for good harvests — the triple-gabled Hall of Prayer is Beijing's most beautiful building. Arrive at dawn when the park fills with tai chi, kites, and musicians.", why: "Go for: sunrise with ten thousand Beijing retirees." },
      { name: "Summer Palace", blurb: "The emperors' lakeside escape — Kunming Lake, the Long Corridor's 14,000 paintings, and marble boats. A half-day that feels like a vacation from the vacation.", why: "Go for: the prettiest half-day in Beijing." },
      { name: "Lama Temple (Yonghegong)", blurb: "Beijing's great Tibetan Buddhist temple — incense thick in the air, an 18-meter sandalwood Buddha, and genuine devotional energy. The most atmospheric temple in the capital.", why: "Go for: incense, chanting, and the giant Buddha." },
      { name: "Beihai Park", blurb: "A thousand-year-old imperial garden around a lake, with the white dagoba on Jade Flower Island. Locals dance, sing opera, and play cards here — join the edges of it.", why: "Go for: imperial gardens with zero crowds compared to the palace." },
      { name: "Jingshan Park", blurb: "The artificial hill directly north of the Forbidden City. Climb to the pavilion at the top for the classic panorama — golden roofs stretching to the horizon.", why: "Go for: the best photo in Beijing, especially at sunset." },
      { name: "Tiananmen Square", blurb: "The vast political heart of modern China — best paired with the Forbidden City since they're adjacent. Go early morning for the flag-raising if you're up.", why: "Go for: scale and history in one overwhelming plaza." },
      { name: "Panjiayuan Antique Market", blurb: "Beijing's legendary 'dirt market' — acres of antiques, curios, calligraphy, and convincing fakes. Weekends are the full chaos; haggle hard and assume nothing is real.", why: "Go for: treasure hunting and the art of the haggle." },
      { name: "Bird's Nest at night", blurb: "The Olympic stadium lit up after dark, with the Water Cube glowing blue beside it. The area is quiet now — it's all about the architecture against the night sky.", why: "Go for: futuristic Beijing, beautifully lit." },
      { name: "Prince Gong's Mansion", blurb: "The best-preserved Qing princely mansion — courtyards, rockeries, and the famous 'fu' (fortune) stele. A quieter, more intimate slice of imperial life.", why: "Go for: imperial luxury without the Forbidden City crowds." },
      { name: "Ghost Street (Gui Jie)", blurb: "A 24-hour food street famous for late-night crayfish and hotpot, all under a canopy of red lanterns. Beijing's after-midnight institution.", why: "Go for: the 2am crayfish feast you'll never forget." }
    ],
    missions: [
      { id: "bj-wall", text: "Set foot on the Great Wall 🧱" },
      { id: "bj-duck", text: "Full Peking duck ceremony dinner 🦆" },
      { id: "bj-hutong", text: "Get lost in the hutongs on purpose 🌀" }
    ],
    unlockHint: "Unlocks when Shanghai's missions are done, or when Beijing days begin"
  },
  {
    id: "chengdu", name: "Chengdu", cn: "成都", country: "China", lang: "mandarin",
    tagline: "Warm, playful & spicy — pandas, teahouses, and the best food city in China.",
    desc: "The chill leg. Giant pandas, mahjong in teahouses, and Sichuan food that will recalibrate your spice tolerance. Slow down here on purpose.",
    neighborhoods: [
      { name: "Jinli Ancient Street", blurb: "The reconstructed old street everyone visits — lanterns, snack stalls, craft shops, and Shu-era architecture. Yes it's touristy; yes it's still fun after dark when the lanterns come on.", why: "Go for: lantern-lit evening wandering and snack grazing." },
      { name: "Kuanzhai Alley (Wide & Narrow)", blurb: "Qing-dynasty alleys reborn as teahouses, bars, and boutiques — the Wide Alley buzzes, the Narrow Alley charms, and the Well Alley hides the best courtyards. Chengdu's most photogenic streets.", why: "Go for: teahouse-hopping through 300-year-old lanes." },
      { name: "Yulin", blurb: "The real Chengdu — residential lanes, the famous hotpot street, mahjong parlors, and neighborhood life untouched by tourism. This is where Zhao Lei's song comes from.", why: "Go for: the Chengdu locals actually live in." },
      { name: "Chunxi Road", blurb: "Downtown's pedestrian shopping chaos — malls, street performers, and the IFS with its giant panda climbing the wall. Come in the evening when it's all lit up.", why: "Go for: the giant panda sculpture and evening energy." },
      { name: "Taikoo Li", blurb: "An upscale open-air retail district built around a 1,400-year-old Buddhist temple — Daci Temple sits in the middle of the luxury stores like a quiet rebuke. Only in Chengdu.", why: "Go for: ancient temple meets modern mall, done beautifully." },
      { name: "Wuhou / South Gate", blurb: "Quieter, leafier, more local — the area around Wuhou Shrine with great food streets and a slower pulse. A good base if you want calm.", why: "Go for: a peaceful base near the historic sites." },
      { name: "Wangjianglou Riverside", blurb: "Bamboo groves and old pavilions along the Jinjiang River — the park dedicated to the Tang poet Xue Tao. Locals play mahjong under the bamboo.", why: "Go for: bamboo-shaded calm and riverside teahouses." },
      { name: "Caotang / West Chengdu", blurb: "The west side around Du Fu's cottage — old teahouses, the Sichuan Museum, and a neighborhood that still moves at Chengdu speed (slow).", why: "Go for: poetry, museums, and unhurried afternoons." }
    ],
    sights: [
      { name: "Giant Panda Breeding Base", blurb: "Home to 200+ pandas in bamboo-forest enclosures. They are morning animals — arrive at the 7:30am opening to see them eating, playing, and tumbling before the afternoon nap coma.", why: "Go for: baby pandas. That's it. That's the reason." },
      { name: "People's Park teahouse (Heming)", blurb: "The century-old teahouse on the lake in People's Park — ear cleaning, mahjong, jasmine tea in lidded bowls. This is peak Chengdu: doing nothing, beautifully.", why: "Go for: the two-hour sit that recalibrates your whole trip." },
      { name: "Sanxingdui Museum", blurb: "An hour outside the city: 3,000-year-old bronze masks with bulging eyes from a lost civilization that rewrites Chinese history. Genuinely mind-bending — the single best museum on this trip.", why: "Go for: ancient aliens energy (but real archaeology)." },
      { name: "Wuhou Shrine", blurb: "The memorial to Zhuge Liang and the Shu Han kingdom, set in bamboo-shaded gardens. Three Kingdoms fans will lose their minds; everyone else gets a beautiful park.", why: "Go for: history in the shade, plus Jinli next door." },
      { name: "Du Fu Thatched Cottage", blurb: "The Tang dynasty poet's garden retreat — thatched halls, bamboo groves, and quiet ponds. Chengdu's most contemplative corner.", why: "Go for: 1,200 years of poetry in one calm garden." },
      { name: "Qingcheng Mountain", blurb: "The birthplace of Taoism — misty forested peaks, ancient temples, and a cable car for the tired. Pair it with Dujiangyan for the classic day trip.", why: "Go for: sacred mountain air and Taoist temples." },
      { name: "Dujiangyan Irrigation System", blurb: "A 2,300-year-old engineering marvel that still waters the Chengdu plain — no dam, just brilliant hydrology. The reason Chengdu has been prosperous for millennia.", why: "Go for: ancient genius that still works." },
      { name: "Sichuan Opera face-changing show", blurb: "Book an evening show (Shufeng Yayun in a real teahouse is the classic) — the bian lian mask-change happens inches from your face and you'll never figure it out.", why: "Go for: the mask trick that defies explanation." },
      { name: "Wangjianglou Park", blurb: "Bamboo park on the river honoring Xue Tao, the Tang courtesan-poet. Quiet, green, and full of locals playing cards under the stalks.", why: "Go for: the bamboo forest you didn't expect." },
      { name: "Anshun Bridge at night", blurb: "The covered bridge glowing over the Jinjiang River — Chengdu's most romantic night view, with bar-lined riverbanks below.", why: "Go for: the night photo that looks like a painting." },
      { name: "Sichuan Museum", blurb: "Free, excellent, and overlooked — Shu bronzes, Han dynasty tiles, and Tibetan Buddhist art. A perfect rainy-day or low-energy morning.", why: "Go for: world-class artifacts with no crowds." },
      { name: "Hotpot street (Yulin / Shuangnan)", blurb: "Pick the busiest-looking hotpot joint, order the yuanyang half-half broth if you're cautious, and commit. The numb-spicy tide will carry you.", why: "Go for: the meal that defines the city." }
    ],
    missions: [
      { id: "cd-panda", text: "See a panda eat bamboo (they all do, constantly) 🐼" },
      { id: "cd-hotpot", text: "Survive a real Sichuan hotpot 🌶️" },
      { id: "cd-tea", text: "Linger 2 hours in a teahouse doing nothing 🍵" }
    ],
    unlockHint: "Unlocks when Beijing's missions are done, or when Chengdu days begin"
  },
  {
    id: "seoul", name: "Seoul", cn: "서울", country: "South Korea", lang: "korean",
    tagline: "Modern & magnetic — café culture by day, neon nightlife by night.",
    desc: "The finale. Palaces and hanoks next to the most wired city on earth. KBBQ, cafés on every corner, and nightlife that doesn't quit.",
    neighborhoods: [
      { name: "Hongdae", blurb: "The youthful, artsy engine of Seoul — street performers, indie boutiques, clubs, and food alleys around Hongik University. It never really sleeps; it just changes tempo.", why: "Go for: buskers, late-night food, and young Seoul energy." },
      { name: "Bukchon Hanok Village", blurb: "Hundreds of preserved hanok (traditional houses) on a hillside between two palaces. Go at 8am before the crowds for the quiet lanes and palace views.", why: "Go for: old Seoul, best in the morning light." },
      { name: "Ikseon-dong", blurb: "Bukchon's cooler younger sibling — hanok alleys reborn as tiny cafés, wine bars, and craft shops. Every doorway hides something worth finding.", why: "Go for: café-hopping through traditional houses." },
      { name: "Insadong", blurb: "The traditional culture street — tea houses, calligraphy shops, galleries, and street snacks. Slower and more grown-up than Myeongdong.", why: "Go for: tea, crafts, and old-Korea souvenirs." },
      { name: "Myeongdong", blurb: "Shopping ground zero and street-food heaven after dark — cosmetics shops stacked ten deep, and food carts doing tteokbokki, hotteok, and egg bread on every corner.", why: "Go for: the night street-food crawl." },
      { name: "Gangnam", blurb: "Sleek, wealthy, relentlessly modern — COEX mall, K-pop agency spotting, and the famous boulevards. Come see how the other half lives, then eat very well.", why: "Go for: modern Seoul at full polish." },
      { name: "Seongsu", blurb: "The old factory district turned 'Brooklyn of Seoul' — roasteries, pop-up stores, and converted warehouses along the river. Where Seoul's creative class actually hangs out.", why: "Go for: the coolest cafés in the city." },
      { name: "Itaewon", blurb: "Seoul's international quarter — halal restaurants, foreign bars, and food from everywhere. The late-night fallback when everywhere else is closed.", why: "Go for: global food and late-night options." },
      { name: "Yeouido", blurb: "The financial island with the Han River park — where Seoul comes to picnic, bike, and eat convenience-store ramyeon on the grass at sunset.", why: "Go for: the riverside picnic at golden hour." }
    ],
    sights: [
      { name: "Gyeongbokgung Palace", blurb: "The grandest Joseon palace — throne halls, lotus ponds, and the changing of the guard. Rent a hanbok nearby: admission is free in costume and the photos are unbeatable.", why: "Go for: hanbok photos in a 600-year-old palace." },
      { name: "Changdeokgung & the Secret Garden", blurb: "The 'palace of illustrious virtue' with its hidden rear garden of pavilions and ponds — the garden tour (limited slots, book ahead) is the most beautiful hour in Seoul.", why: "Go for: the Secret Garden tour, full stop." },
      { name: "Bukchon Hanok Village", blurb: "Morning is quietest for photos on the famous stepped lanes. Remember people live here — keep voices down and stick to the marked photo spots.", why: "Go for: the iconic hanok-rooftop view lanes." },
      { name: "N Seoul Tower", blurb: "Ride the cable car up Namsan for sunset over the whole basin of the city. The love-lock fences are cheesy; the view is not.", why: "Go for: sunset over ten million lights." },
      { name: "Gwangjang Market", blurb: "The 120-year-old market — bindaetteok sizzling on giant griddles, mayak gimbap, and old ladies who will adopt you. Eat your way down the food alley.", why: "Go for: the greatest market meal of your life." },
      { name: "Myeongdong street food", blurb: "After dark the main drag becomes a gauntlet of carts: tteokbokki, tornado potatoes, hotteok, egg bread. Bring cash, bring appetite, wear stretchy pants.", why: "Go for: grazing until you can't walk." },
      { name: "Han River park (Yeouido/Banpo)", blurb: "Buy ramyeon and kimbap at the convenience store, sit on the grass, watch the sun drop behind the bridges. Banpo's rainbow fountain runs light shows at night.", why: "Go for: the cheapest perfect evening in Seoul." },
      { name: "Dongdaemun Design Plaza", blurb: "Zaha Hadid's alien silver spaceship in the middle of the fashion district — exhibitions inside, and the LED rose garden outside at night.", why: "Go for: future-architecture against the old city walls." },
      { name: "War Memorial of Korea", blurb: "Free, enormous, and genuinely moving — the Korean War story told with real aircraft, tanks, and ships outside. Allow three hours; you'll use them.", why: "Go for: understanding the country you're standing in." },
      { name: "Lotte World Tower observatory", blurb: "The 123-story tower's Seoul Sky deck — glass floors, the whole city spread out, and on clear winter days you can see for miles.", why: "Go for: the highest view in Korea." },
      { name: "Jogyesa Temple", blurb: "Downtown Seoul's great Buddhist temple — giant lanterns, chanting, and calm two blocks from Insadong's bustle. Lovely at dusk.", why: "Go for: lantern-lit calm in the middle of everything." },
      { name: "DMZ tour", blurb: "The half-day trip to the Demilitarized Zone — the Joint Security Area, the Third Tunnel, Dora Observatory. Book through an authorized operator well ahead; verify current availability before you go.", why: "Go for: the most surreal half-day in Asia." }
    ],
    missions: [
      { id: "sl-hanbok", text: "Wear a hanbok at the palace 👘" },
      { id: "sl-kbbq", text: "KBBQ where the waiter judges your grilling 🥩" },
      { id: "sl-cafe", text: "Café-hop until you've lost count ☕" }
    ],
    unlockHint: "Unlocks when Chengdu's missions are done, or when Seoul days begin"
  }
];

HQ.DISHES = [
  // Shanghai
  { id: "d-xlb", city: "shanghai", name: "Xiaolongbao (soup dumplings)", alt: "小笼包 · xiao long bao", desc: "Delicate dumplings with hot soup inside. Nibble, sip, then eat." },
  { id: "d-shengjian", city: "shanghai", name: "Shengjianbao", alt: "生煎包 · sheng jian bao", desc: "Pan-fried pork buns — crispy bottom, juicy center. Breakfast of champions." },
  { id: "d-hairy", city: "shanghai", name: "Hairy crab", alt: "大闸蟹 · da zha xie", desc: "Autumn/winter delicacy. December is still in season — don't miss it." },
  { id: "d-noodle", city: "shanghai", name: "Congee + scallion oil noodles", alt: "葱油拌面 · cong you ban mian", desc: "Simple, perfect Shanghainese comfort noodles." },
  { id: "d-lion", city: "shanghai", name: "Lion's head meatballs", alt: "狮子头 · shi zi tou", desc: "Giant tender pork meatballs braised with cabbage." },
  { id: "d-egg", city: "shanghai", name: "Egg tarts & bakeries", alt: "蛋挞 · dan ta", desc: "Shanghai's bakery game is elite — old colonial + new wave." },
  // Beijing
  { id: "d-duck", city: "beijing", name: "Peking duck", alt: "北京烤鸭 · bei jing kao ya", desc: "Crispy skin, pancakes, scallion, hoisin. The ceremony matters." },
  { id: "d-zhajiang", city: "beijing", name: "Zhajiangmian", alt: "炸酱面 · zha jiang mian", desc: "Thick wheat noodles with black bean pork sauce. Beijing's soul noodle." },
  { id: "d-jianbing", city: "beijing", name: "Jianbing", alt: "煎饼 · jian bing", desc: "The original breakfast crepe — egg, crunch, hoisin, chili." },
  { id: "d-lamb", city: "beijing", name: "Copper hotpot (shuan yangrou)", alt: "涮羊肉 · shuan yang rou", desc: "Mongolian-style lamb hotpot — perfect in December cold." },
  { id: "d-douzhi", city: "beijing", name: "Douzhi + jiaoquan (if brave)", alt: "豆汁 · dou zhi", desc: "Fermented mung-bean drink locals love and visitors fear. Try one sip." },
  { id: "d-tanghulu", city: "beijing", name: "Tanghulu", alt: "糖葫芦 · tang hu lu", desc: "Candied hawthorn skewers from street carts. Winter classic." },
  // Chengdu
  { id: "d-mapo", city: "chengdu", name: "Mapo tofu", alt: "麻婆豆腐 · ma po dou fu", desc: "Numbing, spicy, silky. The benchmark Sichuan dish." },
  { id: "d-hotpot", city: "chengdu", name: "Sichuan hotpot", alt: "火锅 · huo guo", desc: "Chili-and-numbing-pepper broth. Order the half-half if you're cautious." },
  { id: "d-dandan", city: "chengdu", name: "Dandan noodles", alt: "担担面 · dan dan mian", desc: "Spicy sesame-peanut noodles. Slurp loudly, it's fine." },
  { id: "d-kungpao", city: "chengdu", name: "Kung pao chicken", alt: "宫保鸡丁 · gong bao ji ding", desc: "The real version is nothing like takeout — try it here." },
  { id: "d-rabbit", city: "chengdu", name: "Cold rabbit in chili oil", alt: "凉拌兔丁 · liang ban tu ding", desc: "Chengdu specialty. Adventurous but delicious." },
  { id: "d-teafood", city: "chengdu", name: "Teahouse snacks", alt: "盖碗茶 · gai wan cha", desc: "Peanuts, sunflower seeds, jasmine tea — the Chengdu afternoon." },
  // Seoul
  { id: "d-bibimbap", city: "seoul", name: "Bibimbap", alt: "비빔밥 · bibimbap", desc: "Mixed rice bowl — order the hot stone dolsot version." },
  { id: "d-kbbq", city: "seoul", name: "Korean BBQ", alt: "고기구이 · gogi gui", desc: "Samgyeopsal + lettuce wraps + soju. Let the staff grill if offered." },
  { id: "d-tteok", city: "seoul", name: "Tteokbokki", alt: "떡볶이 · tteokbokki", desc: "Spicy chewy rice cakes from street stalls. Add cheese if timid." },
  { id: "d-kimchi", city: "seoul", name: "Kimchi jjigae", alt: "김치찌개 · kimchi jjigae", desc: "Aged-kimchi stew — sour, porky, perfect winter food." },
  { id: "d-bindae", city: "seoul", name: "Bindaetteok", alt: "빈대떡 · bindaetteok", desc: "Mung bean pancake from Gwangjang Market, best with makgeolli." },
  { id: "d-bingsu", city: "seoul", name: "Bingsu", alt: "빙수 · bingsu", desc: "Shaved-milk dessert. Yes, even in December." }
];

/* Pinyin WITHOUT tone marks (Luke's preference) */
HQ.PHRASES_MANDARIN = [
  { p: "你好", py: "ni hao", en: "Hello", use: "The universal opener — works everywhere." },
  { p: "谢谢", py: "xie xie", en: "Thank you", use: "Say it constantly. People light up." },
  { p: "多少钱", py: "duo shao qian", en: "How much?", use: "Markets, taxis, street food." },
  { p: "太贵了", py: "tai gui le", en: "Too expensive!", use: "The magic haggling phrase. Smile when you say it." },
  { p: "好吃", py: "hao chi", en: "Delicious", use: "Say to any cook and watch them beam." },
  { p: "厕所在哪里", py: "ce suo zai na li", en: "Where is the bathroom?", use: "Essential. Memorize this one." },
  { p: "我不要辣", py: "wo bu yao la", en: "I don't want spicy", use: "Your lifeline in Chengdu. (Or don't say it — your call.)" },
  { p: "微辣", py: "wei la", en: "Mild spicy", use: "The Chengdu compromise order." },
  { p: "买单", py: "mai dan", en: "The check, please", use: "Restaurants. Often you pay up front at casual spots." },
  { p: "再见", py: "zai jian", en: "Goodbye", use: "Leaving shops, hotels, new friends." },
  { p: "对不起", py: "dui bu qi", en: "Sorry / excuse me", use: "Bumping through crowds, getting attention politely." },
  { p: "没关系", py: "mei guan xi", en: "No problem / you're welcome", use: "The gracious reply to everything." },
  { p: "我爱你", py: "wo ai ni", en: "I love you", use: "For Gabrielle. Obviously." },
  { p: "很好吃", py: "hen hao chi", en: "Really delicious", use: "Level up from 好吃 when it's exceptional." },
  { p: "救命", py: "jiu ming", en: "Help!", use: "Emergency only. Hope you never need it." },
  { p: "我迷路了", py: "wo mi lu le", en: "I'm lost", use: "Show a local your hotel name on your phone too." },
  { p: "这个", py: "zhe ge", en: "This one", use: "Point at the menu + say this. Works 100% of the time." },
  { p: "不要", py: "bu yao", en: "Don't want / no", use: "Declining street hawkers politely but firmly." },
  { p: "可以拍照吗", py: "ke yi pai zhao ma", en: "Can I take a photo?", use: "Polite before photographing people or shops." },
  { p: "熊猫在哪里", py: "xiong mao zai na li", en: "Where are the pandas?", use: "Chengdu priority phrase. 🐼" },
  { p: "一杯咖啡", py: "yi bei ka fei", en: "One coffee", use: "Cafés everywhere in Shanghai & Seoul-adjacent life." },
  { p: "加油", py: "jia you", en: "Go! / You got this!", use: "Cheer each other on. Literally 'add oil'." },
  { p: "干杯", py: "gan bei", en: "Cheers!", use: "Bottoms up — say it with hotpot." },
  { p: "明天见", py: "ming tian jian", en: "See you tomorrow", use: "For guides, drivers, new friends." }
];

HQ.PHRASES_KOREAN = [
  { p: "안녕하세요", py: "annyeonghaseyo", en: "Hello", use: "Polite default for everyone." },
  { p: "감사합니다", py: "gamsahamnida", en: "Thank you", use: "Formal and safe everywhere." },
  { p: "얼마예요?", py: "eolmayeyo", en: "How much is it?", use: "Markets and shops." },
  { p: "맛있어요", py: "masisseoyo", en: "It's delicious", use: "Say it mid-bite at KBBQ." },
  { p: "화장실 어디예요?", py: "hwajangsil eodiyeyo", en: "Where is the bathroom?", use: "Memorize this one." },
  { p: "계산서 주세요", py: "gyesanseo juseyo", en: "Check, please", use: "Restaurants — or pay at the counter." },
  { p: "사랑해", py: "saranghae", en: "I love you", use: "For Gabrielle. Obviously." },
  { p: "건배", py: "geonbae", en: "Cheers!", use: "Pour with two hands for elders." },
  { p: "도와주세요", py: "dowajuseyo", en: "Please help me", use: "Emergency phrase." },
  { p: "이거 주세요", py: "igeo juseyo", en: "Please give me this", use: "Point at the menu + this = dinner solved." },
  { p: "매워요", py: "maewoyo", en: "It's spicy", use: "Warning or compliment, depending on tone." },
  { p: "안 매운 거 있어요?", py: "an maeun geo isseoyo", en: "Is there something not spicy?", use: "The gentle opt-out." },
  { p: "잘 먹겠습니다", py: "jal meokgesseumnida", en: "I will eat well (thanks for the food)", use: "Say before eating — Koreans love hearing this." },
  { p: "잘 먹었습니다", py: "jal meogeosseumnida", en: "I ate well (that was great)", use: "Say after eating." },
  { p: "또 오겠습니다", py: "tto ogesseumnida", en: "I'll come again", use: "Highest compliment to a restaurant." },
  { p: "사진 찍어도 돼요?", py: "sajin jjigeodo dwaeyo", en: "May I take a photo?", use: "Polite before snapping people." }
];

HQ.QUIZZES = {
  shanghai: [
    { q: "You're handed a xiaolongbao. What's the correct first move?", c: ["Pop the whole thing in your mouth", "Nibble a hole, sip the soup, then eat", "Cut it open with a knife", "Dip it in vinegar for 5 minutes"], a: 1, e: "Nibble a small hole, sip the hot soup (careful!), add a drop of black vinegar, then eat. Popping it whole is a rookie burn." },
    { q: "The Maglev train from Pudong airport tops out at…", c: ["200 km/h", "300 km/h", "431 km/h", "600 km/h"], a: 2, e: "431 km/h (268 mph). It's the fastest commercial train service in the world." },
    { q: "In China, when someone pours you tea, you can silently say thanks by…", c: ["Bowing your head", "Tapping two fingers on the table", "Clapping once", "Saying nothing at all"], a: 1, e: "Tapping two bent fingers on the table is the traditional silent 'thank you' for tea. Legend says it stands in for a kowtow." },
    { q: "The Bund's famous buildings are mostly in which style?", c: ["Traditional Chinese", "European art-deco / neoclassical", "Soviet brutalist", "Futuristic glass"], a: 1, e: "The Bund is a row of early-1900s European banks and trading houses — art deco, neoclassical, beaux-arts." },
    { q: "Tipping in mainland China restaurants is…", c: ["Expected, 15-20%", "Appreciated but optional", "Generally not done", "Only for tour guides"], a: 2, e: "Tipping isn't customary in mainland China — good service is considered part of the job. Don't stress about it." }
  ],
  beijing: [
    { q: "The Great Wall's most-visited restored section near Beijing is…", c: ["Mutianyu", "Badaling", "Jiankou", "Simatai"], a: 1, e: "Badaling is the famous crowded one; Mutianyu is the move — restored, gorgeous, and has a toboggan down." },
    { q: "You're served Peking duck. What do you do with the pancakes?", c: ["Eat them plain first", "Wrap duck + scallion + sauce inside", "Dip them in tea", "They're just decoration"], a: 1, e: "Smear hoisin on the pancake, add duck, scallion, maybe cucumber, roll it up. The waiter may demo — watch and copy." },
    { q: "The Forbidden City was home to…", c: ["24 emperors of Ming and Qing dynasties", "Only the last emperor", "Marco Polo", "Beijing's mayors"], a: 0, e: "24 emperors across the Ming and Qing dynasties lived there — 980 buildings, 8,886 rooms." },
    { q: "Beijingers traditionally eat jianbing…", c: ["Only at dinner", "For breakfast", "At weddings", "Never — it's tourist food"], a: 1, e: "Jianbing is THE Beijing breakfast — savory crepe with egg, crispy wonton, sauces, made on a griddle cart." },
    { q: "When visiting the Temple of Heaven, the best time to see local life is…", c: ["Midnight", "Early morning", "Rush hour", "During lunch"], a: 1, e: "At dawn the park fills with retirees doing tai chi, flying kites, playing instruments. Go early." }
  ],
  chengdu: [
    { q: "Sichuan food's signature 'numbing' sensation comes from…", c: ["Extra chili peppers", "Sichuan peppercorns", "MSG", "Black pepper"], a: 1, e: "Sichuan peppercorns (huajiao) create the tingly 'ma' numbness. Combined with chili heat 'la' = mala." },
    { q: "The best time to visit the panda base is…", c: ["Right at 8am opening", "Midday", "Late afternoon", "Pandas don't care"], a: 0, e: "Pandas are most active in the morning. By afternoon they're napping blobs. Go at opening." },
    { q: "In a Chengdu teahouse, lingering for hours over one cup is…", c: ["Rude — order more", "Totally normal and expected", "Only for tourists", "Charged by the hour"], a: 1, e: "Teahouses are Chengdu's living rooms. One tea, all afternoon, mahjong optional. This is the lifestyle." },
    { q: "Mapo tofu is traditionally made with…", c: ["Chicken", "Silken tofu + minced beef/pork", "Fish", "Just tofu, no meat"], a: 1, e: "Silky tofu in a fiery sauce with minced meat, doubanjiang, and lots of Sichuan pepper." },
    { q: "'Chaoshan' isn't Chengdu, but ordering 'wei la' (mild spicy) in Chengdu means…", c: ["No spice at all", "Mild by Chengdu standards — still spicy", "Extra spicy", "Sweet flavor"], a: 1, e: "Chengdu 'mild' would be 'hot' anywhere else. Calibrate accordingly. 🌶️" }
  ],
  seoul: [
    { q: "Before eating in Korea, it's polite to say…", c: ["Nothing, just dig in", "Jal meokgesseumnida (I will eat well)", "Gamsahamnida to the chef", "Saranghae"], a: 1, e: "'Jal meokgesseumnida' before the meal, 'jal meogeosseumnida' after. Koreans genuinely appreciate hearing it." },
    { q: "At KBBQ, pouring a drink for an elder you should…", c: ["Pour with one hand, it's fine", "Use two hands or support your arm", "Let them pour for you", "Only pour your own"], a: 1, e: "Two hands (or right hand with left supporting) for elders — and receive with two hands too." },
    { q: "Bukchon Hanok Village is best known for…", c: ["Skyscrapers", "Traditional Korean houses", "Nightclubs", "The stock exchange"], a: 1, e: "Hundreds of preserved hanok (traditional houses) on hillside lanes with palace views." },
    { q: "Tteokbokki is…", c: ["A rice wine", "Spicy chewy rice cakes", "A palace", "A subway line"], a: 1, e: "Chewy rice cakes in sweet-spicy gochujang sauce — the iconic street food." },
    { q: "Wearing a hanbok (traditional dress) to Gyeongbokgung Palace gets you…", c: ["Stares", "Free admission", "A fine", "Nothing special"], a: 1, e: "Free entry! Rental shops cluster near the palace — go early for the best outfits." }
  ]
};

HQ.PREP_MISSIONS = [
  { id: "pm-dishes", text: "Bookmark 5 must-try dishes on the Taste Bucket List 🍜", xp: 10 },
  { id: "pm-passport", text: "Check passports are valid 6+ months past December 2026 🛂", xp: 20 },
  { id: "pm-visa", text: "Sort China visa / entry requirements ✈️", xp: 30 },
  { id: "pm-esim", text: "Get eSIMs or data plan for China + Korea 📱", xp: 20 },
  { id: "pm-apps", text: "Install: translation app, maps, DiDi, Papago/Naver Map 📲", xp: 15 },
  { id: "pm-money", text: "Set up Alipay/WeChat Pay + notify bank of travel 💳", xp: 20 },
  { id: "pm-phrases", text: "Learn 10 phrases from Quick Language 🗣️", xp: 25 },
  { id: "pm-pack", text: "Pack for winter: layers, comfy shoes, lip balm 🧥", xp: 15 },
  { id: "pm-insurance", text: "Get travel insurance 🛡️", xp: 15 }
];

/* Daily pre-trip missions — one small prep action per day.
   (In-trip and post-trip features were removed; this app is pre-trip only.) */
HQ.DAILY_PREP = [
  "Learn 3 new characters and teach them to Gabrielle ✍️",
  "Watch a 10-min video about one of the four cities 🎬",
  "Practice ordering food in Mandarin out loud 🥟",
  "Find one restaurant in each city you'd love to try 🍜",
  "Learn to say 'cheers' in Mandarin and Korean 🥂",
  "Pack-or-plan: pick your travel day bag 🎒",
  "Quiz each other: 5 questions from the Culture Quiz 🧠",
  "Learn the numbers 1-10 in Mandarin 🔢",
  "Read one Practical Guide you haven't opened yet 📖",
  "Bookmark 3 more dishes on the Taste Bucket List 🍜",
  "Do a 12-card flashcard session 🃏",
  "Rehearse one dialogue out loud, both languages 🎭"
];



HQ.QUICKLANG = {
  mandarin: {
    "Essentials": [
      ["你好", "ni hao", "Hello"], ["谢谢", "xie xie", "Thank you"], ["对不起", "dui bu qi", "Sorry / excuse me"],
      ["没关系", "mei guan xi", "No problem"], ["再见", "zai jian", "Goodbye"], ["是 / 不是", "shi / bu shi", "Yes / no"],
      ["我不懂", "wo bu dong", "I don't understand"], ["慢一点", "man yi dian", "Slower, please"], ["厕所在哪里", "ce suo zai na li", "Where is the bathroom?"]
    ],
    "Food & Drink": [
      ["好吃", "hao chi", "Delicious"], ["买单", "mai dan", "Check, please"], ["这个", "zhe ge", "This one (point!)"],
      ["微辣", "wei la", "Mild spicy"], ["我不要辣", "wo bu yao la", "No spicy"], ["一杯水", "yi bei shui", "A glass of water"],
      ["打包", "da bao", "To take away"], ["干杯", "gan bei", "Cheers!"]
    ],
    "Directions": [
      ["在哪里", "zai na li", "Where is…?"], ["左 / 右", "zuo / you", "Left / right"], ["直走", "zhi zou", "Go straight"],
      ["地铁站", "di tie zhan", "Subway station"], ["出租车", "chu zu che", "Taxi"], ["我迷路了", "wo mi lu le", "I'm lost"],
      ["酒店", "jiu dian", "Hotel"], ["机场", "ji chang", "Airport"]
    ],
    "Shopping": [
      ["多少钱", "duo shao qian", "How much?"], ["太贵了", "tai gui le", "Too expensive!"], ["便宜一点", "pian yi yi dian", "Cheaper, please"],
      ["不要", "bu yao", "No thanks"], ["可以刷卡吗", "ke yi shua ka ma", "Can I pay by card?"]
    ],
    "Emergency": [
      ["救命", "jiu ming", "Help!"], ["叫警察", "jiao jing cha", "Call the police"], ["叫救护车", "jiao jiu hu che", "Call an ambulance"],
      ["医院在哪里", "yi yuan zai na li", "Where is the hospital?"], ["我过敏", "wo guo min", "I have an allergy"],
      ["美国大使馆", "mei guo da shi guan", "US Embassy"]
    ],
    "Numbers": [
      ["一二三四五", "yi er san si wu", "1 2 3 4 5"], ["六七八九十", "liu qi ba jiu shi", "6 7 8 9 10"],
      ["百", "bai", "hundred"], ["千", "qian", "thousand"]
    ]
  },
  korean: {
    "Essentials": [
      ["안녕하세요", "annyeonghaseyo", "Hello"], ["감사합니다", "gamsahamnida", "Thank you"], ["죄송합니다", "joesonghamnida", "Sorry"],
      ["괜찮아요", "gwaenchanayo", "It's okay"], ["안녕히 계세요", "annyeonghi gyeseyo", "Goodbye"], ["네 / 아니요", "ne / aniyo", "Yes / no"],
      ["몰라요", "mollayo", "I don't know"], ["천천히", "cheoncheonhi", "Slowly"], ["화장실 어디예요?", "hwajangsil eodiyeyo", "Where is the bathroom?"]
    ],
    "Food & Drink": [
      ["맛있어요", "masisseoyo", "Delicious"], ["계산서 주세요", "gyesanseo juseyo", "Check, please"], ["이거 주세요", "igeo juseyo", "This please (point!)"],
      ["물 주세요", "mul juseyo", "Water, please"], ["포장해 주세요", "pojanghae juseyo", "To take away"], ["건배", "geonbae", "Cheers!"],
      ["잘 먹겠습니다", "jal meokgesseumnida", "Thanks — I'll eat well (before)"], ["잘 먹었습니다", "jal meogeosseumnida", "That was great (after)"]
    ],
    "Directions": [
      ["어디예요?", "eodiyeyo", "Where is…?"], ["왼쪽 / 오른쪽", "oenjjok / oreunjjok", "Left / right"], ["직진", "jikjin", "Straight"],
      ["지하철역", "jihacheollyeok", "Subway station"], ["택시", "taeksi", "Taxi"], ["길을 잃었어요", "gireul ireosseoyo", "I'm lost"],
      ["호텔", "hotel", "Hotel"], ["공항", "gonghang", "Airport"]
    ],
    "Shopping": [
      ["얼마예요?", "eolmayeyo", "How much?"], ["너무 비싸요", "neomu bissayo", "Too expensive!"], ["깎아 주세요", "kkakka juseyo", "Discount, please"],
      ["됐어요", "dwaesseoyo", "No thanks"], ["카드 돼요?", "kadeu dwaeyo", "Card okay?"]
    ],
    "Emergency": [
      ["도와주세요", "dowajuseyo", "Help me!"], ["경찰을 불러 주세요", "gyeongchareul bulleo juseyo", "Call the police"],
      ["구급차를 불러 주세요", "gugeupchareul bulleo juseyo", "Call an ambulance"], ["병원 어디예요?", "byeongwon eodiyeyo", "Where is the hospital?"],
      ["알레르기 있어요", "allereugi isseoyo", "I have an allergy"], ["미국 대사관", "miguk daesagwan", "US Embassy"]
    ],
    "Numbers": [
      ["일 이 삼 사 오", "il i sam sa o", "1 2 3 4 5"], ["육 칠 팔 구 십", "yuk chil pal gu sip", "6 7 8 9 10"],
      ["백", "baek", "hundred"], ["천", "cheon", "thousand"]
    ]
  }
};

HQ.XP = { mission: 15, quiz: 10, card: 2, pack: 3, readiness: 5, weekly: 25, course: 30, dialogue: 5, dish: 5 };
