/* China + Korea Adventure HQ — content2: 156 new flashcards (12 new categories)
   Loaded after data.js and content.js. Data only: no functions, no fetch, no DOM.
   Mandarin pronunciation = pinyin with NO tone marks (plain roman letters only).
   Korean pronunciation = romanization. */
var HQ = HQ || {};

/* ============ Airport & Flights ============ */
HQ.QUICKLANG.mandarin["Airport & Flights"] = [
  ["登机口", "deng ji kou", "Boarding gate"],
  ["行李转盘", "xing li zhuan pan", "Baggage carousel"],
  ["我的航班晚点了", "wo de hang ban wan dian le", "My flight is delayed"],
  ["请问登机时间是几点", "qing wen deng ji shi jian shi ji dian", "What time is boarding?"],
  ["我要去国内出发厅", "wo yao qu guo nei chu fa ting", "I'm going to the domestic terminal"],
  ["托运行李", "tuo yun xing li", "Checked luggage"],
  ["这是我的护照", "zhe shi wo de hu zhao", "Here is my passport"]
];
HQ.QUICKLANG.korean["Airport & Flights"] = [
  ["탑승구", "tapseunggu", "Boarding gate"],
  ["수하물 찾는 곳", "suhamul channeun got", "Baggage claim"],
  ["비행기가 연착되었어요", "bihaenggiga yeonchakdwaeeosseoyo", "My flight is delayed"],
  ["탑승 시간은 몇 시예요", "tapseung siganeun myeot siyeyo", "What time is boarding?"],
  ["국내선 터미널에 가고 싶어요", "guknaeseon teomineore gago sipeoyo", "I want to go to the domestic terminal"],
  ["위탁 수하물", "witak suhamul", "Checked luggage"]
];

/* ============ Hotel & Check-in ============ */
HQ.QUICKLANG.mandarin["Hotel & Check-in"] = [
  ["我预订了一个房间", "wo yu ding le yi ge fang jian", "I have a reservation"],
  ["我们要住三天", "wo men yao zhu san tian", "We're staying three nights"],
  ["房间里有暖气吗", "fang jian li you nuan qi ma", "Is there heating in the room?"],
  ["请多给一条毯子", "qing duo gei yi tiao tan zi", "Could I have an extra blanket?"],
  ["早餐是几点", "zao can shi ji dian", "What time is breakfast?"],
  ["可以晚一点退房吗", "ke yi wan yi dian tui fang ma", "Can we check out late?"],
  ["电梯在哪里", "dian ti zai na li", "Where is the elevator?"]
];
HQ.QUICKLANG.korean["Hotel & Check-in"] = [
  ["예약을 했어요", "yeyageul haesseoyo", "I have a reservation"],
  ["삼 박 묵을 거예요", "sam bak mugeul geoyeyo", "We're staying three nights"],
  ["방에 난방이 되나요", "bange nanbangi doeynayo", "Is there heating in the room?"],
  ["담요 하나 더 주세요", "damyo hana deo juseyo", "One more blanket, please"],
  ["조식은 몇 시예요", "josigeun myeot siyeyo", "What time is breakfast?"],
  ["늦게 체크아웃할 수 있나요", "neujge chekeuaut hal su innayo", "Can we check out late?"]
];

/* ============ At the Restaurant ============ */
HQ.QUICKLANG.mandarin["At the Restaurant"] = [
  ["请给我菜单", "qing gei wo cai dan", "The menu, please"],
  ["我要这个", "wo yao zhe ge", "I'll have this one"],
  ["有热水吗", "you re shui ma", "Do you have hot water?"],
  ["太辣了", "tai la le", "Too spicy!"],
  ["请打包", "qing da bao", "Pack it up, please"],
  ["买单", "mai dan", "The check, please"],
  ["味道很好", "wei dao hen hao", "It tastes great"]
];
HQ.QUICKLANG.korean["At the Restaurant"] = [
  ["메뉴판 주세요", "menyupan juseyo", "The menu, please"],
  ["이걸로 주세요", "igeollo juseyo", "I'll have this one"],
  ["뜨거운 물 있나요", "tteugeoun mul innayo", "Do you have hot water?"],
  ["너무 매워요", "neomu maewoyo", "Too spicy!"],
  ["포장해 주세요", "pojanghae juseyo", "To go, please"],
  ["계산서 주세요", "gyesanseo juseyo", "The check, please"]
];

/* ============ Street Food & Night Markets ============ */
HQ.QUICKLANG.mandarin["Street Food & Night Markets"] = [
  ["这个多少钱", "zhe ge duo shao qian", "How much is this?"],
  ["好吃", "hao chi", "Delicious"],
  ["来一份", "lai yi fen", "One serving, please"],
  ["加辣", "jia la", "Add spice"],
  ["不加辣", "bu jia la", "No spice, please"],
  ["现做的", "xian zuo de", "Made fresh"],
  ["再来一份", "zai lai yi fen", "Another one, please"]
];
HQ.QUICKLANG.korean["Street Food & Night Markets"] = [
  ["이거 얼마예요", "igeo eolmayeyo", "How much is this?"],
  ["맛있어요", "masisseoyo", "Delicious"],
  ["하나 주세요", "hana juseyo", "One, please"],
  ["매콤하게 해 주세요", "maekomhage hae juseyo", "Make it spicy"],
  ["안 맵게 해 주세요", "an maepge hae juseyo", "Not spicy, please"],
  ["갓 만든 거예요", "gat mandeun geoyeyo", "Made fresh"]
];

/* ============ Subway & Buses ============ */
HQ.QUICKLANG.mandarin["Subway & Buses"] = [
  ["地铁站在哪里", "di tie zhan zai na li", "Where is the subway station?"],
  ["坐几号线", "zuo ji hao xian", "Which line do I take?"],
  ["到天安门怎么走", "dao tian an men zen me zou", "How do I get to Tiananmen?"],
  ["这是哪一站", "zhe shi na yi zhan", "Which stop is this?"],
  ["我坐过站了", "wo zuo guo zhan le", "I missed my stop"],
  ["末班车是几点", "mo ban che shi ji dian", "When is the last train?"],
  ["换乘", "huan cheng", "Transfer (change trains)"]
];
HQ.QUICKLANG.korean["Subway & Buses"] = [
  ["지하철역이 어디예요", "jihacheoryeogi eodiyeyo", "Where is the subway station?"],
  ["몇 호선을 타야 돼요", "myeot hoseoneul taya dwaeyo", "Which line do I take?"],
  ["명동에 어떻게 가요", "myeongdonge eotteoke gayo", "How do I get to Myeongdong?"],
  ["여기가 어디예요", "yeogiga eodiyeyo", "Where are we right now?"],
  ["정류장을 지나쳤어요", "jeongnyujangeul jinachyeosseoyo", "I missed my stop"],
  ["막차는 몇 시예요", "makchaneun myeot siyeyo", "When is the last train?"]
];

/* ============ Taxis & Rides ============ */
HQ.QUICKLANG.mandarin["Taxis & Rides"] = [
  ["去机场", "qu ji chang", "To the airport, please"],
  ["打表", "da biao", "Use the meter, please"],
  ["在这里停", "zai zhe li ting", "Stop here, please"],
  ["请开慢一点", "qing kai man yi dian", "Please drive slower"],
  ["车里有暖气吗", "che li you nuan qi ma", "Is the heat on?"],
  ["要多久", "yao duo jiu", "How long will it take?"],
  ["大概多少钱", "da gai duo shao qian", "About how much?"]
];
HQ.QUICKLANG.korean["Taxis & Rides"] = [
  ["공항으로 가 주세요", "gonghangeuro ga juseyo", "To the airport, please"],
  ["미터기로 가 주세요", "miteogiro ga juseyo", "Use the meter, please"],
  ["여기에서 세워 주세요", "yeogieseo sewo juseyo", "Stop here, please"],
  ["천천히 가 주세요", "cheoncheonhi ga juseyo", "Please drive slower"],
  ["히터 좀 틀어 주세요", "hiteo jom teureo juseyo", "Turn up the heat, please"],
  ["얼마나 걸려요", "eolmana geollyeoyo", "How long will it take?"]
];

/* ============ Markets & Souvenirs ============ */
HQ.QUICKLANG.mandarin["Markets & Souvenirs"] = [
  ["便宜一点", "pian yi yi dian", "Cheaper, please"],
  ["有折扣吗", "you zhe kou ma", "Any discount?"],
  ["太贵了", "tai gui le", "Too expensive"],
  ["这是手工做的吗", "zhe shi shou gong zuo de ma", "Is this handmade?"],
  ["我买两个", "wo mai liang ge", "I'll take two"],
  ["可以刷卡吗", "ke yi shua ka ma", "Can I pay by card?"],
  ["有小一点的吗", "you xiao yi dian de ma", "Do you have a smaller one?"]
];
HQ.QUICKLANG.korean["Markets & Souvenirs"] = [
  ["좀 깎아 주세요", "jom kkakka juseyo", "A discount, please"],
  ["할인 되나요", "harin doeynayo", "Any discount?"],
  ["너무 비싸요", "neomu bissayo", "Too expensive"],
  ["수제품인가요", "sujepumingayo", "Is this handmade?"],
  ["두 개 살게요", "du gae salgeyo", "I'll take two"],
  ["카드 돼요", "kadeu dwaeyo", "Can I pay by card?"]
];

/* ============ Winter Weather ============ */
HQ.QUICKLANG.mandarin["Winter Weather"] = [
  ["今天很冷", "jin tian hen leng", "It's very cold today"],
  ["下雪了", "xia xue le", "It's snowing"],
  ["我很冷", "wo hen leng", "I'm cold"],
  ["哪里可以买手套", "na li ke yi mai shou tao", "Where can I buy gloves?"],
  ["外面风很大", "wai mian feng hen da", "It's very windy outside"],
  ["路面结冰了", "lu mian jie bing le", "The road is icy"],
  ["穿暖和一点", "chuan nuan huo yi dian", "Dress warmly"]
];
HQ.QUICKLANG.korean["Winter Weather"] = [
  ["오늘 정말 추워요", "oneul jeongmal chuwoyo", "It's very cold today"],
  ["눈이 와요", "nuni wayo", "It's snowing"],
  ["추워요", "chuwoyo", "I'm cold"],
  ["장갑 어디서 사요", "janggam eodiseo sayo", "Where can I buy gloves?"],
  ["밖에 바람이 많이 불어요", "bakke barami manhi bureoyo", "It's very windy outside"],
  ["길이 얼었어요", "giri eoreosseoyo", "The road is icy"]
];

/* ============ Phone, Internet & Apps ============ */
HQ.QUICKLANG.mandarin["Phone, Internet & Apps"] = [
  ["有免费WiFi吗", "you mian fei WiFi ma", "Is there free WiFi?"],
  ["密码是多少", "mi ma shi duo shao", "What's the password?"],
  ["手机没电了", "shou ji mei dian le", "My phone is dead"],
  ["哪里可以充电", "na li ke yi chong dian", "Where can I charge my phone?"],
  ["信号不好", "xin hao bu hao", "The signal is bad"],
  ["帮我拍张照片", "bang wo pai zhang zhao pian", "Take a photo for me, please"],
  ["我的手机丢了", "wo de shou ji diu le", "I lost my phone"]
];
HQ.QUICKLANG.korean["Phone, Internet & Apps"] = [
  ["무료 와이파이 있어요", "muryo waipai isseoyo", "Is there free WiFi?"],
  ["비밀번호가 뭐예요", "bimilbeonhoga mwoyeyo", "What's the password?"],
  ["핸드폰 배터리가 나갔어요", "haendeupon baeteoriga nagasseoyo", "My phone is dead"],
  ["어디서 충전할 수 있어요", "eodiseo chungjeonhal su isseoyo", "Where can I charge my phone?"],
  ["신호가 안 좋아요", "sinhoga an joayo", "The signal is bad"],
  ["사진 좀 찍어 주세요", "sajin jom jjigeo juseyo", "Take a photo for me, please"]
];

/* ============ Time, Dates & Plans ============ */
HQ.QUICKLANG.mandarin["Time, Dates & Plans"] = [
  ["现在几点", "xian zai ji dian", "What time is it now?"],
  ["明天见", "ming tian jian", "See you tomorrow"],
  ["我们几点出发", "wo men ji dian chu fa", "What time do we leave?"],
  ["等一下", "deng yi xia", "Wait a moment"],
  ["我迟到了", "wo chi dao le", "I'm late"],
  ["今天开门吗", "jin tian kai men ma", "Is it open today?"],
  ["预约了几点", "yu yue le ji dian", "What time is the reservation?"]
];
HQ.QUICKLANG.korean["Time, Dates & Plans"] = [
  ["지금 몇 시예요", "jigeum myeot siyeyo", "What time is it now?"],
  ["내일 봐요", "naeil bwayo", "See you tomorrow"],
  ["몇 시에 출발해요", "myeot sie chulbalhaeyo", "What time do we leave?"],
  ["잠시만요", "jamsimanyo", "Wait a moment"],
  ["늦었어요", "neujeosseoyo", "I'm late"],
  ["오늘 열어요", "oneul yeoreoyo", "Is it open today?"]
];

/* ============ Making Friends ============ */
HQ.QUICKLANG.mandarin["Making Friends"] = [
  ["你叫什么名字", "ni jiao shen me ming zi", "What's your name?"],
  ["我叫卢克", "wo jiao lu ke", "My name is Luke"],
  ["很高兴认识你", "hen gao xing ren shi ni", "Nice to meet you"],
  ["你是哪里人", "ni shi na li ren", "Where are you from?"],
  ["我们是来旅游的", "wo men shi lai lyu you de", "We're traveling here"],
  ["一起拍照好吗", "yi qi pai zhao hao ma", "Can we take a photo together?"],
  ["加个微信", "jia ge wei xin", "Let's add each other on WeChat"]
];
HQ.QUICKLANG.korean["Making Friends"] = [
  ["이름이 뭐예요", "ireumi mwoyeyo", "What's your name?"],
  ["제 이름은 루크예요", "je ireumeun rukeuyeyo", "My name is Luke"],
  ["만나서 반가워요", "mannaseo bangawoyo", "Nice to meet you"],
  ["어디서 오셨어요", "eodiseo osyeosseoyo", "Where are you from?"],
  ["여행 왔어요", "yeohaeng wasseoyo", "We're traveling here"],
  ["같이 사진 찍을까요", "gachi sajin jjigeulkkayo", "Shall we take a photo together?"]
];

/* ============ Polite Small Talk ============ */
HQ.QUICKLANG.mandarin["Polite Small Talk"] = [
  ["今天天气不错", "jin tian tian qi bu cuo", "Nice weather today"],
  ["你们这里很漂亮", "ni men zhe li hen piao liang", "Your city is beautiful"],
  ["我是第一次来", "wo shi di yi ci lai", "It's my first time here"],
  ["中国菜很好吃", "zhong guo cai hen hao chi", "Chinese food is delicious"],
  ["谢谢你的帮助", "xie xie ni de bang zhu", "Thanks for your help"],
  ["祝你有美好的一天", "zhu ni you mei hao de yi tian", "Have a great day"],
  ["再见", "zai jian", "Goodbye"]
];
HQ.QUICKLANG.korean["Polite Small Talk"] = [
  ["오늘 날씨 좋네요", "oneul nalssi jonneyeo", "Nice weather today"],
  ["서울이 정말 예뻐요", "seouri jeongmal yeppeoyo", "Seoul is beautiful"],
  ["처음 왔어요", "cheoeum wasseoyo", "It's my first time here"],
  ["한국 음식이 맛있어요", "hanguk eumsigi masisseoyo", "Korean food is delicious"],
  ["도와주셔서 감사해요", "dowajusyeoseo gamsahaeyo", "Thanks for your help"],
  ["좋은 하루 보내세요", "joeun haru bonaeseyo", "Have a great day"]
];
