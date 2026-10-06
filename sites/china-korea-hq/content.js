/* China + Korea Adventure HQ — language content pack (appended to data.js).
   Pinyin WITHOUT tone marks everywhere (plain roman letters only). */
var HQ = HQ || {};

/* ============ 1. QUICKLANG EXPANSION — Mandarin: extra rows in existing categories ============ */
HQ.QUICKLANG.mandarin["Essentials"].push(
  ["早安", "zao an", "Good morning"],
  ["晚安", "wan an", "Good night"],
  ["你叫什么名字", "ni jiao shen me ming zi", "What is your name?"],
  ["我叫", "wo jiao", "My name is..."],
  ["认识你很高兴", "ren shi ni hen gao xing", "Nice to meet you"],
  ["明天见", "ming tian jian", "See you tomorrow"],
  ["请", "qing", "Please"],
  ["你好吗", "ni hao ma", "How are you?"]
);
HQ.QUICKLANG.mandarin["Food & Drink"].push(
  ["菜单", "cai dan", "Menu"],
  ["服务员", "fu wu yuan", "Waiter / waitress"],
  ["不辣", "bu la", "Not spicy"],
  ["中辣", "zhong la", "Medium spicy"],
  ["特辣", "te la", "Extra spicy"],
  ["不要香菜", "bu yao xiang cai", "No cilantro"],
  ["多来点米饭", "duo lai dian mi fan", "More rice, please"],
  ["吃饱了", "chi bao le", "I'm full"],
  ["来两份", "lai liang fen", "Two orders, please"],
  ["有什么推荐", "you shen me tui jian", "What do you recommend?"]
);
HQ.QUICKLANG.mandarin["Directions"].push(
  ["怎么走", "zen me zou", "How do I get there?"],
  ["远不远", "yuan bu yuan", "Is it far?"],
  ["走路", "zou lu", "On foot"],
  ["坐地铁", "zuo di tie", "Take the subway"],
  ["换乘", "huan cheng", "Transfer (trains)"],
  ["几号线", "ji hao xian", "Which subway line?"],
  ["出口", "chu kou", "Exit"],
  ["入口", "ru kou", "Entrance"]
);
HQ.QUICKLANG.mandarin["Shopping"].push(
  ["看看", "kan kan", "Just looking"],
  ["有小号吗", "you xiao hao ma", "Do you have a small?"],
  ["有大号吗", "you da hao ma", "Do you have a large?"],
  ["可以试穿吗", "ke yi shi chuan ma", "Can I try it on?"],
  ["这是手工的吗", "zhe shi shou gong de ma", "Is this handmade?"],
  ["打折吗", "da zhe ma", "Any discount?"]
);
HQ.QUICKLANG.mandarin["Emergency"].push(
  ["着火了", "zhao huo le", "Fire!"],
  ["小偷", "xiao tou", "Thief!"],
  ["我需要医生", "wo xu yao yi sheng", "I need a doctor"],
  ["药店在哪里", "yao dian zai na li", "Where is the pharmacy?"],
  ["我护照丢了", "wo hu zhao diu le", "I lost my passport"],
  ["联系我的酒店", "lian xi wo de jiu dian", "Please contact my hotel"]
);
HQ.QUICKLANG.mandarin["Numbers"].push(
  ["万", "wan", "Ten thousand"],
  ["零", "ling", "Zero"],
  ["半", "ban", "Half"],
  ["第一个", "di yi ge", "The first"]
);

/* ============ Mandarin: NEW categories ============ */
HQ.QUICKLANG.mandarin["Hotel"] = [
  ["我要入住", "wo yao ru zhu", "I'd like to check in"],
  ["我要退房", "wo yao tui fang", "I'd like to check out"],
  ["我有预订", "wo you yu ding", "I have a reservation"],
  ["预订的名字是", "yu ding de ming zi shi", "The reservation is under..."],
  ["护照", "hu zhao", "Passport"],
  ["押金", "ya jin", "Deposit"],
  ["含早餐吗", "han zao can ma", "Is breakfast included?"],
  ["早餐几点", "zao can ji dian", "What time is breakfast?"],
  ["无线网密码", "wu xian wang mi ma", "Wi-Fi password"],
  ["房间号", "fang jian hao", "Room number"],
  ["电梯在哪里", "dian ti zai na li", "Where is the elevator?"],
  ["空调不工作", "kong tiao bu gong zuo", "The AC doesn't work"],
  ["没有热水", "mei you re shui", "No hot water"],
  ["毛巾", "mao jin", "Towel"],
  ["多要一个枕头", "duo yao yi ge zhen tou", "One more pillow, please"],
  ["请打扫房间", "qing da sao fang jian", "Please clean the room"],
  ["退房时间是几点", "tui fang shi jian shi ji dian", "What time is checkout?"],
  ["可以晚退房吗", "ke yi wan tui fang ma", "Late checkout possible?"]
];
HQ.QUICKLANG.mandarin["Taxi & Transit"] = [
  ["去这个地址", "qu zhe ge di zhi", "Take me to this address"],
  ["打表", "da biao", "Use the meter"],
  ["多少钱到那里", "duo shao qian dao na li", "How much to get there?"],
  ["在这里停", "zai zhe li ting", "Stop here"],
  ["前面路口停", "qian mian lu kou ting", "Stop at the next intersection"],
  ["开慢一点", "kai man yi dian", "Please drive slower"],
  ["我赶时间", "wo gan shi jian", "I'm in a hurry"],
  ["走高速", "zou gao su", "Take the highway"],
  ["不走高速", "bu zou gao su", "Avoid the highway"],
  ["靠边停", "kao bian ting", "Pull over"],
  ["等我五分钟", "deng wo wu fen zhong", "Wait five minutes"],
  ["有发票吗", "you fa piao ma", "Receipt, please"],
  ["几号出口", "ji hao chu kou", "Which exit number?"],
  ["末班车", "mo ban che", "Last train"],
  ["首班车", "shou ban che", "First train"],
  ["这趟车去那里吗", "zhe tang che qu na li ma", "Does this go there?"],
  ["刷卡上车", "shua ka shang che", "Tap card to board"],
  ["下一站", "xia yi zhan", "Next stop"]
];
HQ.QUICKLANG.mandarin["Shopping & Bargaining"] = [
  ["最低多少钱", "zui di duo shao qian", "What's your lowest price?"],
  ["再便宜一点", "zai pian yi yi dian", "A bit cheaper?"],
  ["我是学生", "wo shi xue sheng", "I'm a student"],
  ["两个一起多少钱", "liang ge yi qi duo shao qian", "How much for two?"],
  ["送我一个吧", "song wo yi ge ba", "Throw one in free?"],
  ["我再看看", "wo zai kan kan", "I'll think about it"],
  ["别家更便宜", "bie jia geng pian yi", "Other shops are cheaper"],
  ["成交", "cheng jiao", "Deal!"],
  ["可以退吗", "ke yi tui ma", "Can I return this?"],
  ["有保修吗", "you bao xiu ma", "Is there a warranty?"],
  ["这是正品吗", "zhe shi zheng pin ma", "Is this authentic?"],
  ["大码", "da ma", "Large size"],
  ["中码", "zhong ma", "Medium size"],
  ["小码", "xiao ma", "Small size"],
  ["太小了", "tai xiao le", "Too small"],
  ["太大了", "tai da le", "Too big"],
  ["颜色", "yan se", "Color"],
  ["有别的颜色吗", "you bie de yan se ma", "Other colors?"]
];
HQ.QUICKLANG.mandarin["Health & Pharmacy"] = [
  ["我感冒了", "wo gan mao le", "I have a cold"],
  ["我发烧了", "wo fa shao le", "I have a fever"],
  ["头疼", "tou teng", "Headache"],
  ["肚子疼", "du zi teng", "Stomachache"],
  ["拉肚子", "la du zi", "Diarrhea"],
  ["恶心", "e xin", "Nauseous"],
  ["过敏药", "guo min yao", "Allergy medicine"],
  ["感冒药", "gan mao yao", "Cold medicine"],
  ["退烧药", "tui shao yao", "Fever reducer"],
  ["创可贴", "chuang ke tie", "Band-aid"],
  ["胃药", "wei yao", "Stomach medicine"],
  ["止痛药", "zhi tong yao", "Painkiller"],
  ["眼药水", "yan yao shui", "Eye drops"],
  ["一天几次", "yi tian ji ci", "How many times a day?"],
  ["饭前吃还是饭后吃", "fan qian chi hai shi fan hou chi", "Before or after meals?"],
  ["我怀孕了", "wo huai yun le", "I'm pregnant"],
  ["有副作用吗", "you fu zuo yong ma", "Any side effects?"],
  ["不含抗生素", "bu han kang sheng su", "No antibiotics"]
];
HQ.QUICKLANG.mandarin["Small Talk"] = [
  ["你从哪里来", "ni cong na li lai", "Where are you from?"],
  ["我是美国人", "wo shi mei guo ren", "I'm American"],
  ["我在度假", "wo zai du jia", "I'm on vacation"],
  ["我来两周", "wo lai liang zhou", "I'm here for two weeks"],
  ["这是我第一次来", "zhe shi wo di yi ci lai", "It's my first visit"],
  ["我喜欢这里", "wo xi huan zhe li", "I like it here"],
  ["天气不错", "tian qi bu cuo", "Nice weather"],
  ["今天很冷", "jin tian hen leng", "It's cold today"],
  ["你是本地人吗", "ni shi ben di ren ma", "Are you from here?"],
  ["附近有什么好玩的", "fu jin you shen me hao wan de", "Anything fun nearby?"],
  ["你去过美国吗", "ni qu guo mei guo ma", "Have you been to America?"],
  ["你会说英语吗", "ni hui shuo ying yu ma", "Do you speak English?"],
  ["我只会一点中文", "wo zhi hui yi dian zhong wen", "I only speak a little Chinese"],
  ["你结婚了吗", "ni jie hun le ma", "Are you married?"],
  ["这是我太太", "zhe shi wo tai tai", "This is my wife"],
  ["我们一起旅行", "wo men yi qi lu xing", "We're traveling together"],
  ["一起拍照吧", "yi qi pai zhao ba", "Let's take a photo together"],
  ["保持联系", "bao chi lian xi", "Let's stay in touch"]
];
HQ.QUICKLANG.mandarin["Compliments"] = [
  ["太好吃了", "tai hao chi le", "So delicious!"],
  ["厨师很棒", "chu shi hen bang", "The chef is amazing"],
  ["味道正宗", "wei dao zheng zong", "So authentic"],
  ["这是我吃过最好的", "zhe shi wo chi guo zui hao de", "Best I've ever had"],
  ["城市很美", "cheng shi hen mei", "The city is beautiful"],
  ["夜景太美了", "ye jing tai mei le", "The night view is stunning"],
  ["你很漂亮", "ni hen piao liang", "You're beautiful"],
  ["你很帅", "ni hen shuai", "You're handsome"],
  ["孩子很可爱", "hai zi hen ke ai", "Your child is adorable"],
  ["房子很漂亮", "fang zi hen piao liang", "Lovely home"],
  ["手艺真好", "shou yi zhen hao", "Great craftsmanship"],
  ["茶真香", "cha zhen xiang", "This tea smells wonderful"],
  ["你中文说得真好", "ni zhong wen shuo de zhen hao", "Your Chinese is great"],
  ["谢谢你的帮助", "xie xie ni de bang zhu", "Thanks for your help"],
  ["你人真好", "ni ren zhen hao", "You're so kind"],
  ["玩得很开心", "wan de hen kai xin", "We're having a great time"],
  ["一定会再来", "yi ding hui zai lai", "We'll definitely come back"],
  ["五星好评", "wu xing hao ping", "Five-star review!"]
];
HQ.QUICKLANG.mandarin["Dietary Needs"] = [
  ["我吃素", "wo chi su", "I'm vegetarian"],
  ["我不吃肉", "wo bu chi rou", "I don't eat meat"],
  ["我不吃猪肉", "wo bu chi zhu rou", "I don't eat pork"],
  ["我不吃牛肉", "wo bu chi niu rou", "I don't eat beef"],
  ["我对花生过敏", "wo dui hua sheng guo min", "I'm allergic to peanuts"],
  ["我对海鲜过敏", "wo dui hai xian guo min", "I'm allergic to shellfish"],
  ["我对坚果过敏", "wo dui jian guo guo min", "I'm allergic to nuts"],
  ["我对牛奶过敏", "wo dui niu nai guo min", "I'm allergic to dairy"],
  ["我对鸡蛋过敏", "wo dui ji dan guo min", "I'm allergic to eggs"],
  ["我对麸质过敏", "wo dui fu zhi guo min", "I'm allergic to gluten"],
  ["这个里面有花生吗", "zhe ge li mian you hua sheng ma", "Does this have peanuts?"],
  ["这个里面有肉吗", "zhe ge li mian you rou ma", "Does this have meat?"],
  ["清真", "qing zhen", "Halal"],
  ["不要味精", "bu yao wei jing", "No MSG"],
  ["少油", "shao you", "Less oil"],
  ["少盐", "shao yan", "Less salt"],
  ["不放糖", "bu fang tang", "No sugar"],
  ["有素食菜单吗", "you su shi cai dan ma", "Do you have a vegetarian menu?"]
];

/* ============ 2. QUICKLANG EXPANSION — Korean: extra rows in existing categories ============ */
HQ.QUICKLANG.korean["Essentials"].push(
  ["좋은 아침이에요", "joeun achimieyo", "Good morning"],
  ["안녕히 주무세요", "annyeonghi jumuseyo", "Good night"],
  ["이름이 뭐예요?", "ireumi mwoyeyo", "What is your name?"],
  ["제 이름은...", "je ireumeun", "My name is..."],
  ["만나서 반가워요", "mannaseo bangawoyo", "Nice to meet you"],
  ["내일 봐요", "naeil bwayo", "See you tomorrow"],
  ["주세요", "juseyo", "Please (give me)"],
  ["어떻게 지내요?", "eotteoke jinaeyo", "How are you?"]
);
HQ.QUICKLANG.korean["Food & Drink"].push(
  ["메뉴 주세요", "menyu juseyo", "Menu, please"],
  ["저기요", "jeogiyo", "Excuse me (calling staff)"],
  ["안 매워요", "an maewoyo", "Not spicy"],
  ["덜 맵게 해 주세요", "deol maepge hae juseyo", "Make it less spicy"],
  ["배불러요", "baebulleoyo", "I'm full"],
  ["2인분 주세요", "i-inbun juseyo", "Two servings, please"],
  ["추천해 주세요", "chucheonhae juseyo", "What do you recommend?"],
  ["리필 돼요?", "ripil dwaeyo", "Refills?"],
  ["뜨거워요", "tteugeowoyo", "It's hot (temperature)"],
  ["차갑게 주세요", "chagapge juseyo", "Iced, please"]
);
HQ.QUICKLANG.korean["Directions"].push(
  ["어떻게 가요?", "eotteoke gayo", "How do I get there?"],
  ["멀어요?", "meoreoyo", "Is it far?"],
  ["걸어서", "georeoseo", "On foot"],
  ["갈아타야 돼요?", "garataya dwaeyo", "Do I need to transfer?"],
  ["몇 호선이에요?", "myeot hoseoniyeyo", "Which subway line?"],
  ["출구", "chulgu", "Exit"]
);
HQ.QUICKLANG.korean["Shopping"].push(
  ["그냥 보는 거예요", "geunyang boneun geoyeyo", "Just looking"],
  ["작은 사이즈 있어요?", "jageun saijeu isseoyo", "Do you have a small?"],
  ["큰 사이즈 있어요?", "keun saijeu isseoyo", "Do you have a large?"],
  ["입어 봐도 돼요?", "ibeo bwado dwaeyo", "Can I try it on?"],
  ["세일해요?", "seilhaeyo", "Is it on sale?"],
  ["환불 돼요?", "hwanbul dwaeyo", "Can I return this?"]
);
HQ.QUICKLANG.korean["Emergency"].push(
  ["불이에요", "burieyo", "Fire!"],
  ["도둑이야", "dodugiya", "Thief!"],
  ["의사 필요해요", "uisa piryohaeyo", "I need a doctor"],
  ["약국 어디예요?", "yakguk eodiyeyo", "Where is the pharmacy?"],
  ["여권을 잃어버렸어요", "yeogwoneul ireobeoryeosseoyo", "I lost my passport"],
  ["호텔에 연락해 주세요", "hotere yeonrakhae juseyo", "Please contact my hotel"]
);
HQ.QUICKLANG.korean["Numbers"].push(
  ["만", "man", "Ten thousand"],
  ["영", "yeong", "Zero"],
  ["반", "ban", "Half"],
  ["첫 번째", "cheot beonjjae", "The first"]
);

/* ============ Korean: NEW categories ============ */
HQ.QUICKLANG.korean["Hotel"] = [
  ["체크인 하고 싶어요", "chekeu-in hago sipeoyo", "I'd like to check in"],
  ["체크아웃 하고 싶어요", "chekeu-aut hago sipeoyo", "I'd like to check out"],
  ["예약했어요", "yeyakaesseoyo", "I have a reservation"],
  ["예약자 이름은...", "yeyakja ireumeun", "The reservation is under..."],
  ["여권", "yeogwon", "Passport"],
  ["조식 포함이에요?", "josik pohamieyo", "Is breakfast included?"],
  ["와이파이 비밀번호", "waipai bimilbeonho", "Wi-Fi password"],
  ["방 번호", "bang beonho", "Room number"],
  ["엘리베이터 어디예요?", "ellibeiteo eodiyeyo", "Where is the elevator?"],
  ["에어컨이 안 돼요", "eeokeoni an dwaeyo", "The AC doesn't work"],
  ["수건 주세요", "sugeon juseyo", "Towels, please"],
  ["늦은 체크아웃 돼요?", "neujeun chekeu-aut dwaeyo", "Late checkout possible?"]
];
HQ.QUICKLANG.korean["Taxi & Transit"] = [
  ["이 주소로 가 주세요", "i jusoro ga juseyo", "Take me to this address"],
  ["미터기로 가 주세요", "miteogiro ga juseyo", "Please use the meter"],
  ["여기서 세워 주세요", "yeogiseo sewo juseyo", "Stop here, please"],
  ["다음 모퉁이에서 세워 주세요", "daeum motungi-eseo sewo juseyo", "Stop at the next corner"],
  ["천천히 가 주세요", "cheoncheonhi ga juseyo", "Please drive slowly"],
  ["급해요", "geupaeyo", "I'm in a hurry"],
  ["요금이 얼마예요?", "yogeumi eolmayeyo", "What's the fare?"],
  ["영수증 주세요", "yeongsujeung juseyo", "Receipt, please"],
  ["막차", "makcha", "Last train"],
  ["몇 번 출구예요?", "myeot beon chulguyeyo", "Which exit number?"],
  ["다음 역", "daeum yeok", "Next station"],
  ["기다려 주세요", "gidaryeo juseyo", "Please wait a moment"]
];
HQ.QUICKLANG.korean["Shopping & Bargaining"] = [
  ["제일 싼 게 얼마예요?", "jeil ssan ge eolmayeyo", "What's your lowest price?"],
  ["좀 깎아 주세요", "jom kkakka juseyo", "A little cheaper, please?"],
  ["두 개 사면 얼마예요?", "du gae samyeon eolmayeyo", "How much for two?"],
  ["생각해 볼게요", "saenggakae bolgeyo", "I'll think about it"],
  ["다른 데가 더 싸요", "dareun dega deo ssayo", "Other shops are cheaper"],
  ["살게요", "salgeyo", "Okay, I'll take it"],
  ["사이즈", "saijeu", "Size"],
  ["너무 작아요", "neomu jagayo", "Too small"],
  ["너무 커요", "neomu keoyo", "Too big"],
  ["다른 색 있어요?", "dareun saek isseoyo", "Do you have other colors?"],
  ["정품이에요?", "jeongpumieyo", "Is this authentic?"],
  ["구경만 할게요", "gugyeongman halgeyo", "Just browsing"]
];
HQ.QUICKLANG.korean["Health & Pharmacy"] = [
  ["감기에 걸렸어요", "gamgie geollyeosseoyo", "I have a cold"],
  ["열이 있어요", "yeori isseoyo", "I have a fever"],
  ["두통이 있어요", "dutongi isseoyo", "I have a headache"],
  ["배가 아파요", "baega apayo", "My stomach hurts"],
  ["설사해요", "seolsahaeyo", "I have diarrhea"],
  ["감기약 주세요", "gamgiyak juseyo", "Cold medicine, please"],
  ["해열제", "haeyeolje", "Fever reducer"],
  ["밴드", "baendeu", "Band-aid"],
  ["소화제", "sohwaje", "Stomach medicine"],
  ["진통제", "jintongje", "Painkiller"],
  ["하루에 몇 번 먹어요?", "harue myeot beon meogeoyo", "How many times a day?"],
  ["식전에 먹어요?", "sikjeone meogeoyo", "Take before meals?"]
];
HQ.QUICKLANG.korean["Small Talk"] = [
  ["어디서 오셨어요?", "eodiseo osyeosseoyo", "Where are you from?"],
  ["미국 사람이에요", "miguk saramieyo", "I'm American"],
  ["여행 중이에요", "yeohaeng jungieyo", "I'm on vacation"],
  ["2주 있을 거예요", "iju isseul geoyeyo", "I'm here for two weeks"],
  ["처음 왔어요", "cheoeum wasseoyo", "It's my first visit"],
  ["여기 정말 좋아요", "yeogi jeongmal joayo", "I really like it here"],
  ["날씨 좋네요", "nalssi jonneyo", "Nice weather, huh?"],
  ["오늘 춥네요", "oneul chupneyo", "It's cold today"],
  ["영어 하세요?", "yeongeo haseyo", "Do you speak English?"],
  ["한국어 조금 해요", "hangugeo jogeum haeyo", "I speak a little Korean"],
  ["아내예요", "anaeyeyo", "This is my wife"],
  ["같이 여행해요", "gachi yeohaenghaeyo", "We're traveling together"]
];
HQ.QUICKLANG.korean["Compliments"] = [
  ["너무 맛있어요", "neomu masisseoyo", "So delicious!"],
  ["요리사 최고예요", "yorisa choegoyeyo", "The chef is the best"],
  ["정말 맛있네요", "jeongmal masinneyo", "Truly delicious"],
  ["서울이 아름다워요", "seouri areumdaweyo", "Seoul is beautiful"],
  ["야경이 멋져요", "yagyeongi meotjyeoyo", "The night view is stunning"],
  ["예쁘세요", "yeppeuseyo", "You're beautiful"],
  ["멋지세요", "meotjiseyo", "You look great"],
  ["아이가 귀여워요", "aiga gwiyeowoyo", "Your child is adorable"],
  ["솜씨가 좋으시네요", "somssiga joeusineyo", "Such great craftsmanship"],
  ["도와주셔서 감사해요", "dowajusyeoseo gamsahaeyo", "Thanks for your help"],
  ["꼭 다시 올게요", "kkok dasi olgeyo", "We'll definitely be back"],
  ["최고예요", "choegoyeyo", "It's the best!"]
];
HQ.QUICKLANG.korean["Dietary Needs"] = [
  ["채식주의자예요", "chaesikjuuijayeyo", "I'm vegetarian"],
  ["고기 안 먹어요", "gogi an meogeoyo", "I don't eat meat"],
  ["돼지고기 안 먹어요", "dwaejigogi an meogeoyo", "I don't eat pork"],
  ["소고기 안 먹어요", "sogogi an meogeoyo", "I don't eat beef"],
  ["땅콩 알레르기 있어요", "ttangkong allereugi isseoyo", "I'm allergic to peanuts"],
  ["해산물 알레르기 있어요", "haesanmul allereugi isseoyo", "I'm allergic to shellfish"],
  ["유제품 알레르기 있어요", "yujepum allereugi isseoyo", "I'm allergic to dairy"],
  ["글루텐 알레르기 있어요", "geulluten allereugi isseoyo", "I'm allergic to gluten"],
  ["땅콩 들어갔어요?", "ttangkong deureogasseoyo", "Does this contain peanuts?"],
  ["고기 들어갔어요?", "gogi deureogasseoyo", "Does this contain meat?"],
  ["할랄 음식 있어요?", "hallal eumsik isseoyo", "Do you have halal food?"],
  ["채식 메뉴 있어요?", "chaesik menyu isseoyo", "Do you have a vegetarian menu?"]
];

/* ============ 3. HQ.HANGUL — read Korean signs in 20 minutes ============ */
HQ.HANGUL = {
  intro: "Korean is the friendliest writing system you will ever meet. It was designed in 1443 to be learned in a day, and it is fully phonetic: if you can read the letters, you can say the word. Twenty minutes here and street signs start talking to you.",
  howBlocks: "Letters snap together into syllable blocks. Each block has a consonant plus a vowel (and sometimes a final consonant underneath). Read each block left-to-right, top-to-bottom, then move to the next block. So 한 (han) + 국 (guk) = 한국, hanguk, Korea.",
  consonants: [
    { h: "ㄱ", r: "g/k", tip: "like 'go' at the start of a word, a harder 'k' between vowels" },
    { h: "ㄴ", r: "n", tip: "like 'no'" },
    { h: "ㄷ", r: "d/t", tip: "like 'do' at the start, a softer 't' between vowels" },
    { h: "ㄹ", r: "r/l", tip: "a quick flap, like the 'tt' in 'butter'" },
    { h: "ㅁ", r: "m", tip: "like 'mom'" },
    { h: "ㅂ", r: "b/p", tip: "like 'boy' at the start, a softer 'p' between vowels" },
    { h: "ㅅ", r: "s", tip: "like 'sun'; sounds like 'sh' before the vowel ㅣ" },
    { h: "ㅇ", r: "silent/ng", tip: "silent at the start of a syllable; 'ng' as in 'sing' at the end" },
    { h: "ㅈ", r: "j", tip: "like 'jeep'" },
    { h: "ㅊ", r: "ch", tip: "like 'cheese', with a puff of air" },
    { h: "ㅋ", r: "k", tip: "hard 'k' like 'kite', with a puff of air" },
    { h: "ㅌ", r: "t", tip: "hard 't' like 'top', with a puff of air" },
    { h: "ㅍ", r: "p", tip: "hard 'p' like 'pop', with a puff of air" },
    { h: "ㅎ", r: "h", tip: "like 'hello'" }
  ],
  vowels: [
    { h: "ㅏ", r: "a", tip: "'ah' as in father" },
    { h: "ㅑ", r: "ya", tip: "'ya' as in yard" },
    { h: "ㅓ", r: "eo", tip: "'uh' as in 'fun'" },
    { h: "ㅕ", r: "yeo", tip: "'yuh', like 'young' without the 'ng'" },
    { h: "ㅗ", r: "o", tip: "'oh' as in 'go'" },
    { h: "ㅛ", r: "yo", tip: "'yo' as in 'yoga'" },
    { h: "ㅜ", r: "u", tip: "'oo' as in 'moon'" },
    { h: "ㅠ", r: "yu", tip: "'you'" },
    { h: "ㅡ", r: "eu", tip: "no English match: say 'oo' with flat, unrounded lips" },
    { h: "ㅣ", r: "i", tip: "'ee' as in 'see'" }
  ],
  batchim: "The consonant tucked under a block is called batchim. At the end of a syllable, several consonants simplify to a plain sound, so do not overthink it: just pronounce it softly and keep moving. Getting close is more than enough for signs.",
  practice: [
    { h: "입구", r: "ipgu", en: "entrance" },
    { h: "출구", r: "chulgu", en: "exit" },
    { h: "화장실", r: "hwajangsil", en: "bathroom" },
    { h: "지하철", r: "jihacheol", en: "subway" },
    { h: "택시", r: "taeksi", en: "taxi" },
    { h: "버스", r: "beoseu", en: "bus" },
    { h: "호텔", r: "hotel", en: "hotel" },
    { h: "식당", r: "sikdang", en: "restaurant" },
    { h: "영업중", r: "yeongeopjung", en: "open" },
    { h: "휴무", r: "hyumu", en: "closed" },
    { h: "밀어", r: "mireo", en: "push" },
    { h: "당겨", r: "danggyeo", en: "pull" },
    { h: "세일", r: "seil", en: "sale" },
    { h: "약국", r: "yakguk", en: "pharmacy" },
    { h: "병원", r: "byeongwon", en: "hospital" },
    { h: "경찰", r: "gyeongchal", en: "police" }
  ],
  tips: [
    "Sound out each block left-to-right, top-to-bottom, then blend the syllables together.",
    "Half the signs you need are Konglish: 택시 (taxi), 호텔 (hotel), 버스 (bus). If you can read the letters, you already know the word.",
    "Learn 화장실 (bathroom), 입구 (entrance), and 출구 (exit) first. They pay off immediately.",
    "Stuck? Sound it out loud. Korean is phonetic, so what you read is what it says."
  ]
};

/* ============ 4. HQ.PINYIN — pinyin primer ============ */
HQ.PINYIN = {
  intro: "Pinyin is Mandarin written in the roman alphabet: it tells you how to pronounce Chinese characters. We write it without tone marks to keep it simple, but the sounds below are worth learning properly.",
  initials: [
    { p: "b", like: "'b' as in boy" },
    { p: "p", like: "'p' as in 'pop', with a puff of air" },
    { p: "d", like: "'d' as in dog" },
    { p: "t", like: "'t' as in 'top', with a puff of air" },
    { p: "g", like: "'g' as in go" },
    { p: "k", like: "'k' as in kite, with a puff of air" },
    { p: "h", like: "throaty, like softly clearing your throat" },
    { p: "j", like: "'j' as in jeep" },
    { p: "q", like: "'chee': like j with a puff of air" },
    { p: "x", like: "'she': smile while you say it" },
    { p: "z", like: "'dz' as in 'kids'" },
    { p: "c", like: "'ts' as in 'cats', with a puff of air" },
    { p: "s", like: "'s' as in sun" },
    { p: "zh", like: "'jur': curl your tongue back" },
    { p: "ch", like: "'chur': curled tongue, with a puff of air" },
    { p: "sh", like: "'shur': curled tongue" },
    { p: "r", like: "soft, like a gentle French 'j' mixed with 'r'" },
    { p: "n", like: "'n' as in no" },
    { p: "l", like: "'l' as in love" },
    { p: "y", like: "'y' as in yes" },
    { p: "w", like: "'w' as in we" },
    { p: "ü", like: "say 'ee' with rounded lips (typed as 'v' on keyboards)" }
  ],
  finals: [
    { p: "a", like: "'ah' as in father" },
    { p: "o", like: "'oh'" },
    { p: "e", like: "'uh' as in 'the'" },
    { p: "i", like: "'ee' as in see" },
    { p: "u", like: "'oo' as in moon" },
    { p: "ai", like: "'eye'" },
    { p: "ei", like: "'ay' as in say" },
    { p: "ao", like: "'ow' as in cow" },
    { p: "ou", like: "quick 'oh'" },
    { p: "an", like: "'ahn'" }
  ],
  tones: "Mandarin has four tones plus a neutral tone, and the tone can change a word's meaning entirely. We leave the marks off here for simplicity, but listen closely and mimic what you hear. The classic example: mai can mean 'buy' or 'sell' depending on tone. Context and a smile usually save you.",
  pitfalls: [
    "x is 'she', not 'ks' — smile while you say it",
    "q is 'chee', not 'kw' — it is NOT the English q",
    "c is pronounced 'ts' as in 'cats'",
    "ü keeps its umlaut sound (rounded 'ee'); on keyboards it is typed as v",
    "r is soft and buzzy, not the hard American r"
  ],
  practice: [
    "xie xie = thank you",
    "ni hao = hello",
    "hao chi = delicious",
    "zai jian = goodbye",
    "dui bu qi = sorry / excuse me"
  ]
};

/* ============ 5. HQ.DIALOGUES — 5 scenarios x 2 languages ============ */
HQ.DIALOGUES = [
  {
    id: "taxi",
    title: "Taking a taxi",
    setting: "You flag down a cab outside the hotel and hand the driver the address on your phone.",
    tip: "Cultural tip: hop in the back seat and have the destination in local characters ready on your phone. Most drivers will not read English, and saying 'da biao' (use the meter) up front keeps things honest.",
    mandarin: { lines: [
      { say: "师傅，去这个地址。", py: "shi fu, qu zhe ge di zhi", en: "T: Driver, please take me to this address." },
      { say: "好的，请上车。", py: "hao de, qing shang che", en: "D: Sure, hop in." },
      { say: "打表，谢谢。", py: "da biao, xie xie", en: "T: Please use the meter, thanks." },
      { say: "知道了，大概二十分钟。", py: "zhi dao le, da gai er shi fen zhong", en: "D: Got it, about twenty minutes." },
      { say: "我赶时间，能快一点吗？", py: "wo gan shi jian, neng kuai yi dian ma", en: "T: I am in a hurry. A bit faster?" },
      { say: "那我走高速。", py: "na wo zou gao su", en: "D: Then I will take the highway." },
      { say: "前面路口停一下。", py: "qian mian lu kou ting yi xia", en: "T: Please stop at the next intersection." },
      { say: "到了，一共三十五块。", py: "dao le, yi gong san shi wu kuai", en: "D: We are here. Thirty-five yuan total." },
      { say: "谢谢师傅！", py: "xie xie shi fu", en: "T: Thanks, driver!" }
    ]},
    korean: { lines: [
      { say: "기사님, 이 주소로 가 주세요.", py: "gisa-nim, i jusoro ga juseyo", en: "T: Driver, please take me to this address." },
      { say: "네, 타세요.", py: "ne, taseyo", en: "D: Sure, get in." },
      { say: "미터기로 가 주세요.", py: "miteogiro ga juseyo", en: "T: Please use the meter." },
      { say: "알겠습니다, 20분쯤 걸려요.", py: "algesseumnida, isipbun-jjeum geollyeoyo", en: "D: Got it, about twenty minutes." },
      { say: "급해요, 빨리 가 주세요.", py: "geupaeyo, ppalli ga juseyo", en: "T: I am in a hurry. Please go faster." },
      { say: "그럼 고속도로로 갈게요.", py: "geureom gosokdororo galgeyo", en: "D: Then I will take the highway." },
      { say: "다음 모퉁이에서 세워 주세요.", py: "daeum motungi-eseo sewo juseyo", en: "T: Please stop at the next corner." },
      { say: "도착했어요, 만 오천 원이에요.", py: "dochakaesseoyo, man ocheon wonieyo", en: "D: We are here. Fifteen thousand won." },
      { say: "감사합니다!", py: "gamsahamnida", en: "T: Thank you!" }
    ]}
  },
  {
    id: "restaurant",
    title: "Ordering at a restaurant",
    setting: "You walk into a busy local spot at dinner rush and get seated with a menu.",
    tip: "Cultural tip: in China, flag down staff with a raised hand and a friendly 'fu wu yuan!' Waiting to be noticed is not rude, it is expected. In Korea, there is usually a call button on the table: use it.",
    mandarin: { lines: [
      { say: "几位？", py: "ji wei", en: "W: How many people?" },
      { say: "两位。", py: "liang wei", en: "T: Two." },
      { say: "请坐，这是菜单。", py: "qing zuo, zhe shi cai dan", en: "W: Please sit. Here is the menu." },
      { say: "有什么推荐？", py: "you shen me tui jian", en: "T: What do you recommend?" },
      { say: "宫保鸡丁和麻婆豆腐都不错。", py: "gong bao ji ding he ma po dou fu dou bu cuo", en: "W: The kung pao chicken and mapo tofu are both great." },
      { say: "来一份宫保鸡丁，微辣。", py: "lai yi fen gong bao ji ding, wei la", en: "T: One kung pao chicken, mild spice." },
      { say: "再来两碗米饭。", py: "zai lai liang wan mi fan", en: "T: And two bowls of rice." },
      { say: "好的，请稍等。", py: "hao de, qing shao deng", en: "W: Got it, one moment." },
      { say: "太好吃了！买单。", py: "tai hao chi le! mai dan", en: "T: So delicious! The check, please." }
    ]},
    korean: { lines: [
      { say: "몇 분이세요?", py: "myeot buniseyo", en: "W: How many people?" },
      { say: "두 명이에요.", py: "du myeongieyo", en: "T: Two." },
      { say: "이쪽으로 앉으세요, 메뉴예요.", py: "ijjogeuro anjeuseyo, menyuyeyo", en: "W: Sit over here. Here is the menu." },
      { say: "뭐가 맛있어요?", py: "mwoga masisseoyo", en: "T: What is good here?" },
      { say: "불고기와 김치찌개가 인기예요.", py: "bulgogiwa kimchijjigaega ingiyeyo", en: "W: The bulgogi and kimchi stew are popular." },
      { say: "불고기 2인분 주세요.", py: "bulgogi i-inbun juseyo", en: "T: Bulgogi for two, please." },
      { say: "공기밥도 두 개 주세요.", py: "gonggibapdo du gae juseyo", en: "T: Two bowls of rice as well." },
      { say: "네, 잠시만 기다려 주세요.", py: "ne, jamsiman gidaryeo juseyo", en: "W: Sure, just a moment please." },
      { say: "잘 먹었습니다! 계산서 주세요.", py: "jal meogeosseumnida! gyesanseo juseyo", en: "T: That was wonderful! Check, please." }
    ]}
  },
  {
    id: "hotel",
    title: "Checking in at the hotel",
    setting: "You arrive at the front desk after a long travel day, reservation confirmation in hand.",
    tip: "Cultural tip: hotels in China must register foreign guests with the police, so they will photocopy your passport at check-in. Totally normal, nothing to worry about.",
    mandarin: { lines: [
      { say: "你好，我要入住。", py: "ni hao, wo yao ru zhu", en: "T: Hi, I would like to check in." },
      { say: "请问有预订吗？", py: "qing wen you yu ding ma", en: "C: Do you have a reservation?" },
      { say: "有，名字是...", py: "you, ming zi shi...", en: "T: Yes, under the name..." },
      { say: "请出示护照。", py: "qing chu shi hu zhao", en: "C: Your passport, please." },
      { say: "给。含早餐吗？", py: "gei. han zao can ma", en: "T: Here. Is breakfast included?" },
      { say: "含的，七点到十点。", py: "han de, qi dian dao shi dian", en: "C: Yes, from seven to ten." },
      { say: "无线网密码是多少？", py: "wu xian wang mi ma shi duo shao", en: "T: What is the Wi-Fi password?" },
      { say: "在房卡上，房间三零六。", py: "zai fang ka shang, fang jian san ling liu", en: "C: It is on the key card. Room 306." },
      { say: "谢谢！", py: "xie xie", en: "T: Thanks!" }
    ]},
    korean: { lines: [
      { say: "안녕하세요, 체크인 하고 싶어요.", py: "annyeonghaseyo, chekeu-in hago sipeoyo", en: "T: Hi, I would like to check in." },
      { say: "예약하셨어요?", py: "yeyakasyeosseoyo", en: "C: Do you have a reservation?" },
      { say: "네, ... 이름으로요.", py: "ne, ... ireumeuroyo", en: "T: Yes, under..." },
      { say: "여권 보여 주세요.", py: "yeogwon boyeo juseyo", en: "C: Your passport, please." },
      { say: "여기요. 조식 포함이에요?", py: "yeogiyo. josik pohamieyo", en: "T: Here. Is breakfast included?" },
      { say: "네, 7시부터 10시까지예요.", py: "ne, ilgopsi-buteo yeolsi-kkajiyeyo", en: "C: Yes, seven to ten." },
      { say: "와이파이 비밀번호가 뭐예요?", py: "waipai bimilbeonhoga mwoyeyo", en: "T: What is the Wi-Fi password?" },
      { say: "카드키에 적혀 있어요, 306호예요.", py: "kadeukie jeokhyeo isseoyo, sambaengnyukho-yeyo", en: "C: It is written on the key card. Room 306." },
      { say: "감사합니다!", py: "gamsahamnida", en: "T: Thank you!" }
    ]}
  },
  {
    id: "directions",
    title: "Asking for directions",
    setting: "You surface from the subway in the wrong spot and ask a friendly local for help.",
    tip: "Cultural tip: in Seoul, street addresses are famously confusing, so navigate by subway station and exit number instead. In China, showing the place name in characters on your phone beats any pronunciation attempt.",
    mandarin: { lines: [
      { say: "请问，地铁站在哪里？", py: "qing wen, di tie zhan zai na li", en: "T: Excuse me, where is the subway station?" },
      { say: "直走，前面左转。", py: "zhi zou, qian mian zuo zhuan", en: "L: Go straight, then turn left ahead." },
      { say: "远不远？", py: "yuan bu yuan", en: "T: Is it far?" },
      { say: "不远，走五分钟。", py: "bu yuan, zou wu fen zhong", en: "L: Not far. Five minutes on foot." },
      { say: "几号线去...？", py: "ji hao xian qu...", en: "T: Which line goes to...?" },
      { say: "坐二号线，三站。", py: "zuo er hao xian, san zhan", en: "L: Take Line 2, three stops." },
      { say: "要换乘吗？", py: "yao huan cheng ma", en: "T: Do I need to transfer?" },
      { say: "不用，直达。", py: "bu yong, zhi da", en: "L: No, it goes direct." },
      { say: "谢谢你！", py: "xie xie ni", en: "T: Thank you!" }
    ]},
    korean: { lines: [
      { say: "실례합니다, 지하철역이 어디예요?", py: "sillyehamnida, jihacheollyeogi eodiyeyo", en: "T: Excuse me, where is the subway station?" },
      { say: "직진하시다가 왼쪽으로 가세요.", py: "jikjinhasi-daga oenjjogeuro gaseyo", en: "L: Go straight, then head left." },
      { say: "멀어요?", py: "meoreoyo", en: "T: Is it far?" },
      { say: "안 멀어요, 걸어서 5분이에요.", py: "an meoreoyo, georeoseo obun-ieyo", en: "L: Not far. Five minutes on foot." },
      { say: "...에 가려면 몇 호선이에요?", py: "...e garyeomyeon myeot hoseoniyeyo", en: "T: Which line goes to...?" },
      { say: "2호선 타세요, 세 역이에요.", py: "i-hoseon taseyo, se yeogieyo", en: "L: Take Line 2, three stops." },
      { say: "갈아타야 돼요?", py: "garataya dwaeyo", en: "T: Do I need to transfer?" },
      { say: "아니요, 바로 가요.", py: "aniyo, baro gayo", en: "L: No, it goes direct." },
      { say: "감사해요!", py: "gamsahaeyo", en: "T: Thank you!" }
    ]}
  },
  {
    id: "emergency",
    title: "Emergency: lost bag",
    setting: "Your bag is gone in a crowded market. A bystander steps in to help.",
    tip: "Cultural tip: save your hotel's name and address in local characters on your phone before you go out each day. In any emergency, showing that one screen solves half the problem.",
    mandarin: { lines: [
      { say: "救命！叫警察！", py: "jiu ming! jiao jing cha", en: "T: Help! Call the police!" },
      { say: "怎么了？", py: "zen me le", en: "B: What happened?" },
      { say: "我的包被偷了。", py: "wo de bao bei tou le", en: "T: My bag was stolen." },
      { say: "别急，我帮你报警。", py: "bie ji, wo bang ni bao jing", en: "B: Do not panic. I will help you call the police." },
      { say: "我护照在包里。", py: "wo hu zhao zai bao li", en: "T: My passport was in the bag." },
      { say: "那要去大使馆补办。", py: "na yao qu da shi guan bu ban", en: "B: Then you will need the embassy for a replacement." },
      { say: "医院在哪里？我手受伤了。", py: "yi yuan zai na li? wo shou shou shang le", en: "T: Where is the hospital? My hand is hurt." },
      { say: "前面右转就是。", py: "qian mian you zhuan jiu shi", en: "B: Turn right ahead, it is right there." }
    ]},
    korean: { lines: [
      { say: "도와주세요! 경찰을 불러 주세요!", py: "dowajuseyo! gyeongchareul bulleo juseyo", en: "T: Help! Please call the police!" },
      { say: "무슨 일이에요?", py: "museun irieyo", en: "B: What happened?" },
      { say: "가방을 도둑맞았어요.", py: "gabang-eul dodungmajasseoyo", en: "T: My bag was stolen." },
      { say: "진정하세요, 신고할게요.", py: "jinjeonghaseyo, singohalgeyo", en: "B: Calm down, I will report it." },
      { say: "여권이 가방 안에 있어요.", py: "yeogwoni gabang ane isseoyo", en: "T: My passport was in the bag." },
      { say: "대사관에 가셔야 해요.", py: "daesagwane gasyeoya haeyo", en: "B: You will need to go to the embassy." },
      { say: "병원이 어디예요? 손을 다쳤어요.", py: "byeongwoni eodiyeyo? soneul dachyeosseoyo", en: "T: Where is the hospital? I hurt my hand." },
      { say: "앞에서 우회전하면 있어요.", py: "apeseo uhoejeonhamyeon isseoyo", en: "B: Turn right up ahead, it is right there." }
    ]}
  }
];
/* China + Korea Adventure HQ — travel companion content (guides, culture, itineraries, packing, readiness, weekly prep, dishes) */
var HQ = HQ || {};

HQ.GUIDES = [
  {
    id: "money",
    icon: "💳",
    title: "Paying Like a Local",
    sub: "China runs on phones, Korea runs on cards — the step-by-step playbook.",
    verify: true,
    updated: "Sep 2026",
    sections: [
      {
        h: "China: link your card to Alipay before you fly",
        verify: true,
        body: "Alipay lets foreign visitors link an international Visa or Mastercard and pay by QR code almost anywhere in China. Do this at home over solid WiFi — it can involve SMS verification with your bank and a day or two of wrangling. The app also has a top-up style option for cards that will not link directly. This flow changes often, so treat any tutorial — including this one — as a starting point and re-check the current steps a week before departure."
      },
      {
        h: "China: WeChat Pay as your backup",
        verify: true,
        body: "WeChat Pay now accepts many foreign cards and is accepted nearly everywhere Alipay is. Set it up the same way, at home, before you leave. Having both apps working turns a declined scan at a noodle stall into a shrug instead of a crisis. Keep both apps updated — the English-language onboarding screens change frequently."
      },
      {
        h: "China: cash still works — just plan for it",
        verify: false,
        body: "Cash is legal tender and must be accepted, but plenty of small vendors genuinely prefer mobile pay and may fumble with large bills. Carry 500 to 1,000 yuan in small notes for taxis, street stalls, and temple donations. ATMs at Bank of China, ICBC, and other big banks take foreign debit cards — withdraw once or twice in large amounts to dodge per-withdrawal fees, and notify your bank of travel first."
      },
      {
        h: "Korea: your credit card just works",
        verify: false,
        body: "Korea is one of the easiest countries on earth for card users — Visa, Mastercard, and most Amex cards are accepted nearly everywhere. The main gap is street food stalls and some traditional markets, so keep 50,000 to 100,000 won in cash for Myeongdong snack runs. For transit, buy a T-money card at any convenience store or the airport, load it with cash, and tap it on every bus and subway — you also get a small fare discount versus single tickets."
      },
      {
        h: "Daily money habits",
        verify: false,
        body: "Screenshot your Alipay and WeChat Pay QR receipts for the first few days until scanning feels automatic. Agree on a rough daily budget per city before you go — food is cheap, but taxis and impulse shopping add up fast. Keep one backup card in the hotel safe, separate from your wallet, so a lost wallet does not end the trip."
      }
    ]
  },
  {
    id: "connectivity",
    icon: "📶",
    title: "Staying Connected",
    sub: "The firewall is real — how to keep your apps working on both sides.",
    verify: true,
    updated: "Sep 2026",
    sections: [
      {
        h: "China: the blocked list is real",
        verify: false,
        body: "Google, Gmail, Google Maps, Instagram, WhatsApp, Facebook, X, and YouTube are blocked in mainland China — this is not a rumor, and hotel WiFi will not fix it. Plan as if your phone loses half its apps the moment you land. Anything you need — maps, translation, messaging people back home — must have a working alternative ready before the plane doors close."
      },
      {
        h: "VPN: install and test before you arrive",
        verify: true,
        body: "A VPN installed and tested on home WiFi is the standard workaround for reaching blocked services from China. Download it, pay for it, and confirm it connects before you fly — you cannot reliably download one after arrival. Providers, reliability, and the rules around VPN use all shift over time, so verify the current situation with a recent source right before departure."
      },
      {
        h: "Travel eSIM: the easy button",
        verify: true,
        body: "A China-capable travel eSIM bought before departure gives you data from touchdown, which is worth real money in stress saved. Many eSIMs route traffic outside the firewall so blocked apps keep working — but this varies by provider and plan, so confirm that detail before you buy. Set it up at home, keep your home SIM active for bank SMS codes, and enable data roaming only on the eSIM line."
      },
      {
        h: "Hotel WiFi and local SIMs",
        verify: false,
        body: "Hotel WiFi in China is fast but still behind the firewall — it will not unblock anything by itself. Buying a local SIM requires your passport at a carrier store and takes real time; it is worth it only for long stays. For a two-week trip, a pre-bought eSIM plus hotel WiFi covers nearly everything."
      },
      {
        h: "Korea: everything just works",
        verify: false,
        body: "Korea has no firewall and absurdly fast networks. Grab a tourist eSIM before you fly or a local SIM at Incheon arrivals — either takes minutes. Your data, Instagram, and messaging will all behave exactly like home. Just remember Google Maps is weak in Korea (see the apps guide) — that is a mapping problem, not a connectivity one."
      }
    ]
  },
  {
    id: "entry",
    icon: "🛂",
    title: "Getting In",
    sub: "Entry rules change often — what to check and what to have ready regardless.",
    verify: true,
    updated: "Sep 2026",
    sections: [
      {
        h: "China: check the policy, then check it again",
        verify: true,
        body: "China's visa-free transit and visa-free entry policies for foreign passport holders have expanded and changed repeatedly in recent years, and they can shift again with little notice. Do not rely on a blog post, a forum thread, or this guide — read the current rules on the official Chinese embassy or consulate website for your country within a few weeks of departure. Screenshot the relevant page and save the policy text offline. If anything is ambiguous, a visa agency or the consulate beats guessing."
      },
      {
        h: "Korea: K-ETA and visa-free notes",
        verify: true,
        body: "Many nationalities enter Korea visa-free for short tourist stays, but the K-ETA electronic travel authorization has applied to various travelers at various times, with exemptions announced and extended more than once. Check the official K-ETA website for your nationality's current requirement about a month before you fly — apply early if it is required, since approval can take days. Re-verify this one; do not assume."
      },
      {
        h: "What to have ready no matter what",
        verify: false,
        body: "Passport valid at least six months past your return date, with two blank pages. Proof of onward or return travel — some airlines check this at check-in before China flights. Hotel bookings for at least the first few nights, saved offline and printed. A one-page trip summary (cities, dates, flight numbers) on your phone and on paper speeds up every immigration conversation."
      }
    ]
  },
  {
    id: "apps",
    icon: "📱",
    title: "Apps to Install Before You Fly",
    sub: "Download and sign up on home WiFi — airport WiFi is where plans go to die.",
    verify: false,
    updated: "Sep 2026",
    sections: [
      {
        h: "Naver Map — your Korea map",
        verify: false,
        body: "Google Maps is genuinely weak in Korea — walking directions and transit routing are unreliable there. Naver Map is what Koreans actually use, with excellent subway, bus, and walking directions in English. Install it before you fly and save your hotel as a favorite on day one."
      },
      {
        h: "KakaoTalk — Korea's messenger",
        verify: false,
        body: "KakaoTalk is Korea's default messenger — hotels, some tour operators, and any Korean friends you make will expect it. Sign up with your phone number at home so verification texts arrive cleanly. Even if you only use it to message each other on hotel WiFi, it is worth the two minutes."
      },
      {
        h: "Papago — the translator that gets Korean",
        verify: false,
        body: "Naver's Papago is noticeably better than Google Translate for Korean, and solid for Chinese too. Download the offline language packs for Chinese and Korean before departure. The camera mode that translates signs and menus live is the feature you will use forty times a day."
      },
      {
        h: "DiDi — China's ride-hail",
        verify: false,
        body: "You cannot count on hailing cabs with a raised hand in big Chinese cities anymore — DiDi is how you get cars. The English version works with Alipay linked. Install it, connect payment, and poke around the interface at home. Type destinations in Chinese characters when possible — a photo of your hotel's name card works as input."
      },
      {
        h: "Trip.com — trains, flights, and timed tickets",
        verify: false,
        body: "The English-friendly booking app for China trains, domestic flights, and attraction tickets — including the timed-entry tickets major sights now require. Book the Forbidden City and other sell-out sights here days ahead. Create the account and add passport details before the trip to avoid checkout friction later."
      },
      {
        h: "Alipay — payments plus superpowers",
        verify: false,
        body: "Alipay is not just payments — its translate tool, transit QR codes, and a DiDi mini-program all live inside it. Complete real-name verification and card linking at home; the SMS verification loops are miserable on airport WiFi. This is a ten-weeks-out task, not a night-before task."
      }
    ]
  },
  {
    id: "transit",
    icon: "🚇",
    title: "Getting Around Each City",
    sub: "Airport runs, metro systems, and how not to get stranded after midnight.",
    verify: false,
    updated: "Sep 2026",
    sections: [
      {
        h: "Shanghai: Maglev, then Line 2",
        verify: false,
        body: "From Pudong airport, the Maglev hits 431 km/h and reaches Longyang Road in about 8 minutes, where you transfer to Metro Line 2 into the city — buy the combined Maglev-plus-metro ticket at the station. The metro is vast, cheap, and fully signed in English; ride with single-ride tokens from machines or Alipay's transit QR. Last trains run around 22:30 to 23:00, and rush hour (7:30-9:30, 17:30-19:30) is crush-loaded — sightsee around it."
      },
      {
        h: "Beijing: Airport Express and the subway",
        verify: false,
        body: "The Airport Express train reaches the subway network in about 30 minutes — buy tickets from machines (English available) or tap in with an Alipay transit code. Beijing's subway is huge, cheap, and announces in English. DiDi fills the gaps late at night. For the Great Wall at Mutianyu, go early — a booked car through your hotel or the direct bus — and expect to be back by mid-afternoon."
      },
      {
        h: "Chengdu: easy metro, cheap DiDi",
        verify: false,
        body: "Chengdu's metro is newer, clean, and easy — one line serves the airport and the core lines cover the tourist center, all signed in English. For the Panda Base, take the metro plus a short DiDi and arrive at the 8am opening. DiDi is cheap here and ideal for late hotpot runs to the Yulin area after the metro winds down."
      },
      {
        h: "Seoul: AREX, then the world's best-signed subway",
        verify: false,
        body: "From Incheon, the AREX airport train comes in two flavors: the all-stop commuter (cheaper, about an hour to Seoul Station) and the Express (faster, reserved seats) — buy at the airport station machines. Then it is the T-money card on a superbly signed subway; transfers are free within the time window. Last trains run around midnight; after that, taxis are cheap and plentiful."
      },
      {
        h: "Universal transit rules",
        verify: false,
        body: "Save your hotel's name and address in Chinese characters (China) or Korean (Seoul) on your phone — show it to every driver. Rush hours are real in all four cities, so do big sights mid-morning or mid-afternoon. When in doubt, DiDi in China and Kakao T in Korea beat wandering around hoping for a cab."
      }
    ]
  }
];

HQ.CULTURE = {
  shanghai: {
    etiquette: {
      do: [
        "Greet shopkeepers with a ni hao and a smile — it genuinely opens doors.",
        "Tap two bent fingers on the table to silently thank someone pouring your tea.",
        "Slurp noodles freely — it is a compliment to the cook.",
        "Say hao chi to the cook when you love something; watch them light up.",
        "Carry small bills for street stalls and be ready for a friendly scrum at busy counters.",
        "Queue patiently on the metro — and let passengers off first, always."
      ],
      dont: [
        "Do not stick chopsticks upright in rice — it resembles funeral incense.",
        "Do not flip a whole fish over at the table; lift the bone out instead.",
        "Do not tip — it is not expected and can genuinely confuse staff.",
        "Do not raise your voice in temples or on the metro.",
        "Do not photograph strangers up close without asking (ke yi pai zhao ma).",
        "Do not open a gift immediately if someone gives you one — set it aside gracefully."
      ]
    },
    weather: "December in Shanghai averages highs around 8°C (46°F) and lows near 1°C (34°F), but the dampness makes it feel colder — a raw, bone-chilling cold off the Huangpu River, especially after dark. Expect overcast skies and occasional drizzle rather than snow.",
    packing_note: "Windproof outer layer plus a warm mid-layer; the damp cold punishes any exposed skin.",
    december: "Christmas and New Year's Eve light up the Bund and the big malls with decorations and markets. New Year's Eve on the Bund draws huge crowds — go early or watch from a rooftop bar. Longhua Temple sometimes holds a New Year bell-ringing event."
  },
  beijing: {
    etiquette: {
      do: [
        "Dress for the wind — layers beat one giant coat for temple-hopping days.",
        "Accept tea when offered; it is hospitality, not a sales pitch (usually).",
        "Stand on the right on escalators and in subway corridors.",
        "Say xie xie to every vendor — Beijingers notice manners.",
        "Bring tissues and hand sanitizer — public restrooms vary wildly.",
        "Bargain lightly at markets with a smile; tai gui le is your friend."
      ],
      dont: [
        "Do not stick chopsticks upright in your rice bowl.",
        "Do not touch anyone's head, including children's.",
        "Do not debate politics or sensitive history with strangers — listen more than you opine.",
        "Do not block subway doors; let people off first.",
        "Do not tip — same as everywhere in mainland China.",
        "Do not drink the tap water — bottled or boiled only."
      ]
    },
    weather: "Beijing in December is properly cold: highs around 2°C (36°F), lows around -8°C (18°F), bone-dry air, and a wind that finds every gap in your clothing. It feels bracing and crisp on sunny days — of which there are many — and brutal after sunset.",
    packing_note: "Your warmest coat, hat, gloves, and scarf — the full Arctic kit; the wind is the enemy.",
    december: "No major traditional festivals in December (Chinese New Year falls in Jan/Feb), but Sanlitun and the big malls go all-in on Christmas decor. When Shichahai's lakes freeze solid, skating and ice bikes appear — a beloved Beijing winter ritual."
  },
  chengdu: {
    etiquette: {
      do: [
        "Embrace the teahouse pace — lingering for hours over one gaiwan is the whole point.",
        "Order wei la (mild) first and calibrate before going full mala.",
        "Say gan bei with eye contact when toasting new friends.",
        "Try the ear-cleaning service at People's Park — a genuine Chengdu rite of passage.",
        "Carry tissues — Sichuan food makes everyone sweat and sniffle.",
        "Learn a little local flavor: locals love hearing ba shi (awesome/great)."
      ],
      dont: [
        "Do not stick chopsticks upright in rice.",
        "Do not be shy about spice sweat — everyone at the table is glistening too.",
        "Do not rush meals — Chengdu runs on slow food and slower afternoons.",
        "Do not tip.",
        "Do not point at people with a single finger; use an open hand.",
        "Do not sleep in on panda day — afternoons are nap time for pandas and you will miss the show."
      ]
    },
    weather: "Chengdu winters are damp and chilly rather than freezing: highs of 8-10°C (46-50°F), lows of 3-5°C (37-41°F), with near-permanent overcast and drizzle. The humidity makes 5°C feel like -2°C — locals joke the cold gets into your bones. Snow is rare; gloom is guaranteed.",
    packing_note: "Water-resistant shell and warm layers; you will be damp more than frozen.",
    december: "December is hotpot high season and the city leans into it; Jinli and Kuanzhai Alley dress up with lanterns for the year-end. The Panda Base is quieter in winter — a genuinely good time to go. No major festivals, which means smaller crowds everywhere."
  },
  seoul: {
    etiquette: {
      do: [
        "Receive and pour drinks with two hands, especially with elders.",
        "Turn your head away when drinking in front of someone older.",
        "Say jal meokgesseumnida before eating and jal meogeosseumnida after.",
        "Take off your shoes where you see a shoe pile — homes, temples, some restaurants.",
        "Queue neatly — Seoul takes lines seriously.",
        "Bow slightly when greeting or thanking — a small nod goes far."
      ],
      dont: [
        "Do not stick chopsticks upright in rice (yes, this one is pan-Asian).",
        "Do not pour your own drink when dining with elders — let them pour for you.",
        "Do not blow your nose loudly at the table — step away instead.",
        "Do not write anyone's name in red ink — it has funereal associations.",
        "Do not be loud on the subway — quiet cars are a real expectation.",
        "Do not tip — genuinely not done, even at nice restaurants."
      ]
    },
    weather: "Seoul in December is deep winter: highs hovering around 0°C (32°F), lows of -8 to -10°C (14-18°F), with dry air and a biting wind off the Han River. It feels like Chicago or Boston — crisp, sunny, and genuinely freezing after dark. Light snow dustings are common; big storms are not.",
    packing_note: "Full winter kit like Beijing, plus lip balm and moisturizer — the dry air cracks everything.",
    december: "Christmas is a public holiday and a huge deal — Myeongdong and Hongdae glow, couples pack the streets on Christmas Eve, and department stores run spectacular light shows. New Year's Eve bell-ringing at Bosingak draws big crowds; book dinner early that week."
  }
};

HQ.PACKING = [
  {
    cat: "Outerwear",
    items: [
      { t: "Heavy down coat", detail: "Beijing and Seoul sit well below freezing — this is your most important garment. Hip-length or longer blocks the wind.", cities: ["beijing", "seoul"] },
      { t: "Windproof shell jacket", detail: "Shanghai and Chengdu are damp-chilly, not Arctic — a windproof layer over a sweater beats a giant parka there.", cities: ["shanghai", "chengdu"] },
      { t: "Warm scarf", detail: "Covers the neck gap every coat leaves open. Doubles as a blanket on trains.", cities: ["all"] },
      { t: "Insulated gloves", detail: "Touchscreen-compatible so you can use Papago and maps without exposing fingers.", cities: ["all"] },
      { t: "Warm beanie", detail: "You lose a shocking amount of heat standing on the Great Wall or the Bund at night.", cities: ["beijing", "seoul", "shanghai"] }
    ]
  },
  {
    cat: "Layers",
    items: [
      { t: "Thermal base layers (top + bottom)", detail: "Silk or merino — thin, warm, and they make every other layer work twice as hard. Two sets minimum.", cities: ["all"] },
      { t: "Sweaters / fleece mid-layers", detail: "Two warm mid-layers you can rotate. Temples, metros, and malls are heated — you will strip down indoors.", cities: ["all"] },
      { t: "Wool hiking socks (4-5 pairs)", detail: "Cold feet ruin days. Wool stays warm even damp, which matters in Chengdu.", cities: ["all"] },
      { t: "Warm pants / jeans", detail: "One pair of lined or heavy pants for Beijing/Seoul days; regular jeans fine elsewhere with thermals underneath.", cities: ["all"] }
    ]
  },
  {
    cat: "Feet",
    items: [
      { t: "Broken-in walking shoes", detail: "20,000-step days are normal. Do not debut new shoes on this trip — blisters on day 2 haunt you for two weeks.", cities: ["all"] },
      { t: "Water-resistant boots or shoes", detail: "Shanghai drizzle and Chengdu damp will soak canvas sneakers. One water-resistant pair saves the trip.", cities: ["shanghai", "chengdu"] },
      { t: "Hotel slippers / flip-flops", detail: "Many Chinese hotels provide slippers, but having your own is comfier — and essential for jjimjilbang and bathhouses.", cities: ["all"] }
    ]
  },
  {
    cat: "Tech",
    items: [
      { t: "Universal travel adapter", detail: "China uses type A/C/I sockets, Korea uses C/F — one universal adapter covers both. Bring two if you carry lots of gear.", cities: ["all"] },
      { t: "20,000mAh power bank", detail: "Maps, translation camera, and photos drain batteries fast in the cold — cold literally shortens battery life.", cities: ["all"] },
      { t: "VPN installed and tested", detail: "Installed, paid, and connected at least once on home WiFi. You cannot reliably set this up after landing in China.", cities: ["all"] },
      { t: "Spare charging cables", detail: "One USB-C and one Lightning (or whatever your devices need) — hotel nightstands eat cables.", cities: ["all"] }
    ]
  },
  {
    cat: "Toiletries & Health",
    items: [
      { t: "Lip balm", detail: "Non-negotiable. Beijing and Seoul's dry winter air will crack your lips by day 2 without it.", cities: ["all"] },
      { t: "Heavy moisturizer", detail: "Face and hands — the dry cold is brutal. Travel-size is fine; you can buy more at any Olive Young in Seoul.", cities: ["beijing", "seoul"] },
      { t: "Disposable hand warmers", detail: "A 10-pack weighs nothing and rescues Great Wall mornings and Bund nights. Sold everywhere in Korea too.", cities: ["all"] },
      { t: "Pocket tissue packs", detail: "Public restrooms often lack toilet paper, and Sichuan food makes everyone sniffle. Carry tissues everywhere in China.", cities: ["shanghai", "beijing", "chengdu"] },
      { t: "Personal meds + prescriptions", detail: "Two weeks' supply plus a few days' buffer, in original packaging, with a copy of prescriptions. Pharmacies differ — do not assume.", cities: ["all"] }
    ]
  },
  {
    cat: "Documents & Money",
    items: [
      { t: "Passport (6+ months validity)", detail: "Check the expiry date now, not at the airport. Two blank pages minimum.", cities: ["all"] },
      { t: "Printed hotel bookings", detail: "First few nights printed on paper — immigration and taxi drivers both love paper.", cities: ["all"] },
      { t: "USD cash backup", detail: "$200-300 in clean, unmarked bills. Emergency fund and exchangeable anywhere.", cities: ["all"] },
      { t: "Backup bank card (separate)", detail: "Kept in the hotel safe, away from your wallet. A lost wallet should not end the trip.", cities: ["all"] },
      { t: "Travel insurance documents", detail: "Policy number and emergency hotline saved on your phone and on paper.", cities: ["all"] }
    ]
  },
  {
    cat: "Nice-to-have",
    items: [
      { t: "Small daypack", detail: "For daily outings — water, tissues, power bank, scarf. Leave the big bag at the hotel.", cities: ["all"] },
      { t: "Insulated thermos", detail: "Hot water is free and everywhere in China — trains, hotels, restaurants. Tea on demand all day.", cities: ["shanghai", "beijing", "chengdu"] },
      { t: "Eye mask + earplugs", detail: "Thin hotel walls, early construction, and overnight trains — sleep insurance.", cities: ["all"] },
      { t: "Small gifts from home", detail: "A couple of local snacks or souvenirs from California — lovely for guides, hosts, or new friends.", cities: ["all"] }
    ]
  }
];

HQ.READINESS = [
  {
    id: "documents", name: "Documents", icon: "🛂", weight: 20,
    items: [
      { id: "doc-passport", text: "Both passports valid 6+ months past the return date" },
      { id: "doc-china", text: "China entry requirement sorted — re-check the official policy close to departure" },
      { id: "doc-korea", text: "Korea K-ETA / visa-free status confirmed for your nationality" },
      { id: "doc-insurance", text: "Travel insurance purchased (medical + trip coverage)" },
      { id: "doc-emergency", text: "Emergency contacts and embassy info saved offline" }
    ]
  },
  {
    id: "money", name: "Money", icon: "💳", weight: 20,
    items: [
      { id: "mon-alipay", text: "Alipay set up with a foreign card linked and tested" },
      { id: "mon-wechat", text: "WeChat Pay installed as a backup" },
      { id: "mon-bank", text: "Bank and card travel notices set for China + Korea" },
      { id: "mon-cash", text: "USD cash backup plus small yuan/won for arrival day" },
      { id: "mon-budget", text: "Daily budget agreed per city" }
    ]
  },
  {
    id: "connectivity", name: "Connectivity", icon: "📶", weight: 15,
    items: [
      { id: "con-esim-cn", text: "China eSIM purchased and installed" },
      { id: "con-vpn", text: "VPN installed and tested BEFORE departure (verify current rules)" },
      { id: "con-esim-kr", text: "Korea eSIM or arrival-SIM plan chosen" },
      { id: "con-maps", text: "Offline maps downloaded (Naver Map; a backup for China)" },
      { id: "con-apps", text: "All trip apps installed and signed in (DiDi, Trip.com, Papago, KakaoTalk)" }
    ]
  },
  {
    id: "language", name: "Language", icon: "🗣️", weight: 15,
    items: [
      { id: "lan-pinyin", text: "Finish the pinyin primer" },
      { id: "lan-hangul", text: "Finish the hangul crash course" },
      { id: "lan-f25", text: "25 flashcards marked known", auto: "flash25" },
      { id: "lan-f50", text: "50 flashcards marked known", auto: "flash50" },
      { id: "lan-f100", text: "100 flashcards marked known", auto: "flash100" },
      { id: "lan-dialogues", text: "2 dialogues read and practiced", auto: "dialogues" }
    ]
  },
  {
    id: "packing", name: "Packing", icon: "🧳", weight: 15,
    items: [
      { id: "pack-pct", text: "Packing checklist progress", auto: "packingpct" },
      { id: "pack-coat", text: "Winter coat and cold-weather gear ready and tried on" }
    ]
  },
  {
    id: "knowledge", name: "Knowledge", icon: "🧠", weight: 15,
    items: [
      { id: "knw-quiz", text: "All 4 city culture quizzes completed", auto: "quiz" },
      { id: "knw-guides", text: "Money + connectivity guides read", auto: "guides" },
      { id: "knw-itin", text: "Rough itinerary drafted for all 4 cities" }
    ]
  }
];

HQ.WEEKLY_PREP = [
  { week: 10, title: "Research Alipay setup", text: "Read the money guide and start the Alipay foreign-card linking process at home. It can take a few days of bank SMS wrangling, so begin now — not the night before. Set up WeChat Pay in parallel as your backup.", xp: 20 },
  { week: 9, title: "Sort eSIM and VPN", text: "Research and buy a China-capable travel eSIM, and install plus test a VPN on home WiFi. Verify the current rules from a recent source — this landscape shifts. Pick your Korea eSIM or arrival-SIM plan too.", xp: 25 },
  { week: 8, title: "Learn 20 food phrases", text: "From the Quick Language tab: hao chi, mai dan, zhe ge, wei la, and the Korean food set. Being able to order and compliment food transforms the whole trip. Practice out loud together — it counts double.", xp: 25 },
  { week: 7, title: "Book the sell-out tickets", text: "Forbidden City timed tickets, the Sichuan opera show, and any must-do experiences — book them now on Trip.com. Check current booking rules before you buy, since timed-entry policies change.", xp: 30 },
  { week: 6, title: "Start the packing list", text: "Open the packing checklist and do a first pass: what do you own, what needs buying? Order the heavy down coat and thermal layers now so returns are possible. Try everything on.", xp: 20 },
  { week: 5, title: "50 flashcards known", text: "Hit 50 flashcards marked known in the app. Focus on food, directions, and numbers — the phrases you will actually say forty times a day.", xp: 30 },
  { week: 4, title: "Confirm all hotels", text: "Every hotel booked, booking confirmations saved offline and printed. Double-check the addresses in Chinese characters / Korean for showing taxi drivers.", xp: 25 },
  { week: 3, title: "Download offline maps + apps", text: "Naver Map with Korea offline, your China map backup, Papago language packs, DiDi, Trip.com, KakaoTalk — installed, signed in, tested. Do this on home WiFi, not airport WiFi.", xp: 25 },
  { week: 2, title: "Pack + documents check", text: "Pack the bags for real. Lay out passports, printed bookings, USD cash backup, and insurance docs. Confirm Alipay and WeChat Pay still work with a test scan if possible.", xp: 30 },
  { week: 1, title: "Final countdown", text: "Charge everything, withdraw arrival-day cash, confirm flights and first hotel. Screenshot the entry-policy pages you saved. Get good sleep — the Maglev hits 431 km/h and you want to be awake for it.", xp: 40 }
];

HQ.DISHES.push(
  // Shanghai — 9 new
  { id: "d-sh7", city: "shanghai", name: "Crab roe noodles", alt: "蟹粉拌面 · xie fen ban mian", desc: "Autumn and winter luxury: springy noodles tossed with rich orange crab roe and crab meat. December is peak season.", order: "Order xie fen ban mian; ask for black vinegar on the side — it cuts the richness beautifully.", price: "¥120-220" },
  { id: "d-sh8", city: "shanghai", name: "Red-braised pork", alt: "红烧肉 · hong shao rou", desc: "Chairman Mao's favorite: glossy cubes of pork belly caramelized in soy and sugar until they surrender.", order: "Order hong shao rou — the fatty cubes are the point; eat with plain rice.", price: "¥70-120" },
  { id: "d-sh9", city: "shanghai", name: "Drunken chicken", alt: "醉鸡 · zui ji", desc: "Poached chicken steeped overnight in Shaoxing wine — served cold, fragrant, and dangerously easy to eat.", order: "Order zui ji as a cold starter; it arrives chilled and sliced.", price: "¥60-110" },
  { id: "d-sh10", city: "shanghai", name: "Smoked fish", alt: "熏鱼 · xun yu", desc: "Not actually smoked — fried fish marinated in sweet-savory soy. A Shanghainese cold-dish staple.", order: "Order xun yu as a cold appetizer alongside the drunken chicken.", price: "¥50-90" },
  { id: "d-sh11", city: "shanghai", name: "Eight-treasure rice pudding", alt: "八宝饭 · ba bao fan", desc: "Steamed glutinous rice packed with red bean paste, dates, and nuts — the classic Shanghainese dessert.", order: "Order ba bao fan for dessert; it arrives as a molded dome — dramatic and delicious.", price: "¥40-70" },
  { id: "d-sh12", city: "shanghai", name: "Small wontons", alt: "小馄饨 · xiao hun tun", desc: "Tiny pork wontons floating in a light, clear chicken broth. Simpler and more soulful than it sounds.", order: "Order xiao hun tun — the small size is the authentic Shanghai style.", price: "¥30-60" },
  { id: "d-sh13", city: "shanghai", name: "Osmanthus rice cake", alt: "桂花糕 · gui hua gao", desc: "Delicate jelly cake perfumed with osmanthus flowers — floral, lightly sweet, very Shanghai.", order: "Grab gui hua gao from a bakery stall as a walking snack.", price: "¥20-40" },
  { id: "d-sh14", city: "shanghai", name: "Jiuniang tangyuan", alt: "酒酿圆子 · jiu niang yuan zi", desc: "Sweet fermented-rice soup with chewy glutinous rice balls — gently boozy, deeply comforting on a cold night.", order: "Order jiu niang yuan zi hot; some shops add a poached egg — say yes.", price: "¥25-45" },
  { id: "d-sh15", city: "shanghai", name: "Thick fried noodles", alt: "上海粗炒面 · shang hai cu chao mian", desc: "Chewy thick wheat noodles wok-tossed with pork slivers and bok choy — pure wok hei comfort.", order: "Order cu chao mian and ask for extra chili oil on the side.", price: "¥35-65" },
  // Beijing — 9 new
  { id: "d-bj7", city: "beijing", name: "Donkey burger", alt: "驴肉火烧 · lu rou huo shao", desc: "Locals call donkey meat 'heavenly dragon meat.' Minced, savory, stuffed into a crisp baked flatbread — a Hebei import Beijing adopted.", order: "Order lu rou huo shao — one each, with chili if offered.", price: "¥30-60" },
  { id: "d-bj8", city: "beijing", name: "Boiled dumplings", alt: "饺子 · jiao zi", desc: "Northern China's soul food: hand-pleated dumplings, pork-and-cabbage the classic, dipped in black vinegar.", order: "Order jiao zi by the jin (half kilo); pork and cabbage first, then experiment.", price: "¥40-80" },
  { id: "d-bj9", city: "beijing", name: "Quick-boiled tripe", alt: "爆肚 · bao du", desc: "Tripe flash-boiled for seconds, dipped in sesame sauce — a Beijinger's late-night obsession.", order: "Order bao du; it is sold by weight (liang) — start small and re-order.", price: "¥60-110" },
  { id: "d-bj10", city: "beijing", name: "Lvdagunr", alt: "驴打滚 · lu da gun", desc: "Chewy glutinous-rice roll filled with red bean and dusted in soybean flour — an old-Beijing snack with a funny name.", order: "Buy lu da gun from a traditional snack shop; eat the same day.", price: "¥15-30" },
  { id: "d-bj11", city: "beijing", name: "Pea cake", alt: "豌豆黄 · wan dou huang", desc: "Pale-yellow mung-bean jelly dessert from the imperial court — delicate, lightly sweet, gone in two bites.", order: "Order wan dou huang as part of a snack-shop tasting spread.", price: "¥15-30" },
  { id: "d-bj12", city: "beijing", name: "Chao gan", alt: "炒肝 · chao gan", desc: "Thick peppery soup of pork liver and intestine — the hardcore Beijing breakfast. Not for the faint of heart.", order: "Order chao gan for breakfast if brave; locals eat it with a shaobing for dunking.", price: "¥20-40" },
  { id: "d-bj13", city: "beijing", name: "Sesame shaobing", alt: "烧饼 · shao bing", desc: "Flaky, sesame-crusted baked flatbread — the vehicle for everything from jianbing fillings to dunking in chao gan.", order: "Order shao bing fresh from the oven; plain or stuffed.", price: "¥10-25" },
  { id: "d-bj14", city: "beijing", name: "Lamb spine hotpot", alt: "羊蝎子 · yang xie zi", desc: "Whole lamb vertebrae braised in spiced broth until the meat falls off — gnawing encouraged, broth noodles after.", order: "Order yang xie zi; use your hands, and add noodles to the broth at the end.", price: "¥120-220" },
  { id: "d-bj15", city: "beijing", name: "Jingjiang shredded pork", alt: "京酱肉丝 · jing jiang rou si", desc: "Shredded pork in sweet fermented-bean sauce, wrapped in thin tofu skin with scallion — Beijing's answer to Peking duck's supporting cast.", order: "Order jing jiang rou si; wrap each bite in the tofu skin like a mini duck pancake.", price: "¥60-110" },
  // Chengdu — 9 new
  { id: "d-cd7", city: "chengdu", name: "Fish-fragrant pork", alt: "鱼香肉丝 · yu xiang rou si", desc: "No fish involved — 'fish-fragrant' is the sweet-sour-spicy-garlicky flavor profile. Shredded pork in the most craveable sauce in Sichuan.", order: "Order yu xiang rou si with rice; mop up every drop of sauce.", price: "¥50-90" },
  { id: "d-cd8", city: "chengdu", name: "Twice-cooked pork", alt: "回锅肉 · hui guo rou", desc: "Pork belly boiled, sliced, then wok-fried with doubanjiang and green garlic — the benchmark of Sichuan home cooking.", order: "Order hui guo rou; if a restaurant nails this, order everything else there too.", price: "¥55-95" },
  { id: "d-cd9", city: "chengdu", name: "Boiled beef in chili", alt: "水煮牛肉 · shui zhu niu rou", desc: "Silky beef slices under a centimeter of blazing chili oil, hiding bean sprouts underneath. Looks lethal, tastes incredible.", order: "Order shui zhu niu rou; fish out the beef first, then the vegetables underneath.", price: "¥70-130" },
  { id: "d-cd10", city: "chengdu", name: "Couple's lung slices", alt: "夫妻肺片 · fu qi fei pian", desc: "Cold sliced beef (no lung these days) in chili oil with peanuts and cilantro — named for the husband-and-wife team who invented it.", order: "Order fu qi fei pian as a cold starter; it wakes up the whole table.", price: "¥45-85" },
  { id: "d-cd11", city: "chengdu", name: "Chuanchuanxiang skewers", alt: "串串香 · chuan chuan xiang", desc: "Hotpot's casual cousin: grab a basket, pick skewers of everything, boil them yourself, pay by the stick.", order: "Grab skewers freely; keep the sticks — the count at the end is your bill.", price: "¥80-160" },
  { id: "d-cd12", city: "chengdu", name: "Ice jelly", alt: "冰粉 · bing fen", desc: "The fire extinguisher: wobbly translucent jelly in brown-sugar syrup with toppings. Order it with every spicy meal.", order: "Order bing fen with brown sugar; it arrives fast — eat it between spicy rounds.", price: "¥15-30" },
  { id: "d-cd13", city: "chengdu", name: "San da pao", alt: "三大炮 · san da pao", desc: "Glutinous rice balls dramatically thrown onto a gong-like drum, then rolled in soybean flour and brown sugar. Street theater you can eat.", order: "Order san da pao from a street vendor; watch the throw, eat immediately.", price: "¥15-30" },
  { id: "d-cd14", city: "chengdu", name: "Egg-baked cake", alt: "蛋烘糕 · dan hong gao", desc: "A griddled egg pancake folded around sweet or savory fillings — Chengdu's beloved street snack, made to order.", order: "Order dan hong gao from a street cart; choose sweet (red bean) or savory.", price: "¥15-30" },
  { id: "d-cd15", city: "chengdu", name: "Sweet-skin duck", alt: "甜皮鸭 · tian pi ya", desc: "A Leshan import worth the hype: roast duck lacquered with a sweet crispy glaze. Duck lovers, this rivals Beijing's.", order: "Order tian pi ya; the lacquered skin is the star — eat it first.", price: "¥80-150" },
  // Seoul — 9 new
  { id: "d-sl7", city: "seoul", name: "Samgyetang", alt: "삼계탕 · samgyetang", desc: "A whole young chicken stuffed with glutinous rice, ginseng, and jujube in a milky broth — Korea's winter armor.", order: "Order samgyetang; salt and pepper at the table to taste, eat the rice stuffing last.", price: "₩25,000-40,000" },
  { id: "d-sl8", city: "seoul", name: "Jjajangmyeon", alt: "짜장면 · jjajangmyeon", desc: "Wheat noodles in glossy black-bean sauce — Korea's comfort-food delivery legend, best eaten at a no-frills neighborhood shop.", order: "Order jjajangmyeon; mix vigorously before eating, add danmuji (pickled radish) on the side.", price: "₩14,000-22,000" },
  { id: "d-sl9", city: "seoul", name: "Seafood pancake", alt: "해물파전 · haemul pajeon", desc: "Crispy-edged scallion pancake loaded with seafood. On a rainy day with makgeolli, this is practically law.", order: "Order haemul pajeon with makgeolli; share it — the large size feeds two.", price: "₩25,000-40,000" },
  { id: "d-sl10", city: "seoul", name: "Sundubu jjigae", alt: "순두부찌개 · sundubu jjigae", desc: "Bubbling soft-tofu stew, served violently hot — crack the raw egg in at the table and stir.", order: "Order sundubu jjigae; choose your spice level and seafood or beef.", price: "₩18,000-28,000" },
  { id: "d-sl11", city: "seoul", name: "Soy-marinated crab", alt: "간장게장 · ganjang gejang", desc: "Raw crab cured in soy sauce — the 'rice thief,' because one bite makes you steal extra rice. Rich, briny, unforgettable.", order: "Order ganjang gejang; suck the meat from the shell, mix the roe with rice.", price: "₩40,000-70,000" },
  { id: "d-sl12", city: "seoul", name: "Korean fried chicken", alt: "양념치킨 · yangnyeom chicken", desc: "Shatteringly crisp fried chicken lacquered in sweet-spicy yangnyeom sauce. Chimaek (chicken + beer) is a national ritual.", order: "Order yangnyeom chicken after 9pm with cold beer — that is the full experience.", price: "₩35,000-55,000" },
  { id: "d-sl13", city: "seoul", name: "Hotteok", alt: "호떡 · hotteok", desc: "Griddled sweet pancake filled with molten brown sugar, cinnamon, and nuts — the winter street food that warms your hands first.", order: "Buy hotteok from a street cart; wait 30 seconds or the sugar will ambush you.", price: "₩4,000-8,000" },
  { id: "d-sl14", city: "seoul", name: "Naengmyeon", alt: "냉면 · naengmyeon", desc: "Icy buckwheat noodles in chilled broth — Koreans eat it year-round, and after hot KBBQ it makes perfect sense.", order: "Order naengmyeon; ask for scissors — the noodles are famously uncuttable.", price: "₩20,000-32,000" },
  { id: "d-sl15", city: "seoul", name: "Bungeoppang", alt: "붕어빵 · bungeoppang", desc: "Fish-shaped pastries from street molds, filled with red bean or custard — the smell alone will pull you across the street.", order: "Buy bungeoppang hot off the iron; red bean is classic, custard is elite.", price: "₩3,000-6,000" }
);

HQ.DISH_UPDATES = {
  "d-xlb": { order: "Nibble a hole, sip the soup, add black vinegar, then eat — never pop it whole.", price: "¥60-120" },
  "d-shengjian": { order: "Order sheng jian bao at breakfast shops; bite the top first to vent the steam.", price: "¥30-50" },
  "d-hairy": { order: "Order da zha xie steamed; eat with ginger vinegar and hot yellow wine.", price: "¥200-400" },
  "d-noodle": { order: "Order cong you ban mian; toss well so the scallion oil coats every strand.", price: "¥40-80" },
  "d-lion": { order: "Order shi zi tou with rice; one meatball per person is plenty.", price: "¥80-150" },
  "d-egg": { order: "Order dan ta warm from old bakeries near the French Concession.", price: "¥30-60" },
  "d-duck": { order: "Book the duck dinner ahead; let the carver demo the wrap, then copy.", price: "¥300-500" },
  "d-zhajiang": { order: "Order zha jiang mian; mix the sauce through thoroughly before the first bite.", price: "¥50-90" },
  "d-jianbing": { order: "Order jian bing from a morning cart; add the crispy wonton and extra chili.", price: "¥20-40" },
  "d-lamb": { order: "Order shuan yang rou; swish the lamb slices for seconds, not minutes.", price: "¥150-250" },
  "d-douzhi": { order: "Order one small bowl of dou zhi to share — one sip each is the honest move.", price: "¥10-20" },
  "d-tanghulu": { order: "Buy tang hu lu from a street cart; eat quickly before the sugar shell weeps.", price: "¥15-30" },
  "d-mapo": { order: "Order ma po dou fu with rice; ask for extra huajiao if you are numbness-curious.", price: "¥50-90" },
  "d-hotpot": { order: "Order the half-half (yuan yang) broth; start mild, escalate deliberately.", price: "¥150-300" },
  "d-dandan": { order: "Order dan dan mian; slurp loudly — it is encouraged.", price: "¥30-60" },
  "d-kungpao": { order: "Order gong bao ji ding; compare it mentally to takeout and feel enlightened.", price: "¥60-100" },
  "d-rabbit": { order: "Order liang ban tu ding cold; the chili oil does the heavy lifting.", price: "¥70-120" },
  "d-teafood": { order: "Order gai wan cha at People's Park; peanuts and seeds come with the lingering.", price: "¥40-80" },
  "d-bibimbap": { order: "Order the dolsot version; let the rice crisp, then mix with gochujang to taste.", price: "₩18,000-30,000" },
  "d-kbbq": { order: "Order samgyeopsal; let staff grill if offered, wrap with ssamjang and garlic.", price: "₩40,000-70,000" },
  "d-tteok": { order: "Order tteokbokki from a street stall; add cheese if you want training wheels.", price: "₩12,000-20,000" },
  "d-kimchi": { order: "Order kimchi jjigae bubbling; the older the kimchi, the better the stew.", price: "₩18,000-28,000" },
  "d-bindae": { order: "Order bindaetteok at Gwangjang Market with makgeolli on the side.", price: "₩20,000-35,000" },
  "d-bingsu": { order: "Order bingsu to share; even in December, the pat (red bean) version hits.", price: "₩15,000-25,000" }
};
