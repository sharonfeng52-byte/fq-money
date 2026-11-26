// ===== 課程內容（取自課程計劃書及概念圖）=====
window.FQ = {
  title: '同一張鈔票 互動學習站',
  mainline: '有限資源 → 價值判斷 → 負責任選擇',
  motto: '學會理財，就是學會選擇未來。',

  methods: {
    1: { name: '想一想', q: '我真的需要嗎？不買會怎樣？' },
    2: { name: '比一比', q: '是價格便宜，還是整體較值得？' },
    3: { name: '用到盡', q: '我已有的東西真的用完價值了嗎？' },
    4: { name: '先修再換', q: '修理、重用、換新，哪個更合理？' },
    5: { name: '借換共享', q: '我一定要擁有才能使用嗎？' },
    6: { name: '省下要存', q: '省下的資源去了哪裡？' },
    7: { name: '投向未來', q: '如何讓今天的資源產生長期價值？' }
  },

  path: ['看見資源', '分辨重要', '明白代價', '作出選擇', '承擔結果', '為明天留下可能'],

  lessons: {
    1: {
      title: '100 元的秘密', domain: '認識金錢', en: 'Know Money', cls: 'l1', methods: [3, 4],
      nodes: [['金錢來源', '錢從哪裡來？不是憑空出現。'], ['交換與價值', '價格不等於價值，每樣東西都有成本。'],
              ['有限性', '資源有限，要懂得珍惜。'], ['購買力', '錢的價值會變，要學會做比較。']],
      gold: '價格是你付出的，價值是你獲取的。', ws: 'W1《我的 $100》'
    },
    2: {
      title: '一小時值多少', domain: '賺取金錢', en: 'Earn Money', cls: 'l2', methods: [7],
      nodes: [['工作與職業', '不同工作創造不同價值。'], ['時間與努力', '時間是重要資源，努力帶來回報。'],
              ['技能與學習', '提升能力，增加收入機會。'], ['創造價值', '讓自己成為有價值的人。']],
      gold: '先有汗水，才有薪水。', ws: 'W2《我的技能成長》'
    },
    3: {
      title: '今天不買，換到甚麼', domain: '儲蓄金錢', en: 'Save Money', cls: 'l3', methods: [6],
      nodes: [['SMART 目標', '設定目標，有計劃地儲蓄。'], ['延遲滿足', '現在不急著花，換取未來更大的選擇。'],
              ['緊急儲備', '預留應急資金，應對突發情況。'], ['控制消費', '減少衝動，把錢用在真正重要的地方。']],
      gold: '沒有奇蹟，只有累積。', ws: 'W3《SMART 儲蓄表》'
    },
    4: {
      title: '想要，等於需要嗎', domain: '消費金錢', en: 'Spend Wisely', cls: 'l4', methods: [1, 2, 5],
      nodes: [['需要 vs 想要', '先問自己：我真的需要嗎？'], ['比較與選擇', '貨比三家，選擇最適合的。'],
              ['朋輩與廣告', '不被影響，保持獨立思考。'], ['衝動消費', '停一停、想一想，避免後悔。']],
      gold: '需要定想要，學懂很重要。', ws: 'W4《買／不買／等等看》'
    }
  },

  // 第 1 堂用途卡
  useCards: ['午餐', '書', '遊戲點數', '送禮', '儲蓄', '文具'],
  // 第 4 堂情境卡
  scenarios: ['新款波鞋', '盲盒', '遊戲點數'],

  // 課堂投票
  polls: {
    L3_stand: { lesson: 3, q: '現在用 $20 買小物，還是保留 $20，儲到 $60 的目標？',
                options: ['現在用 $20 買小物', '保留 $20，儲到 $60 的目標'], phases: ['課頭', '課尾'] },
    L4_ad: { lesson: 4, q: '哪一句最容易令你心動？',
             options: ['最後一天半價', '全班都有', '限量版', '你值得獎勵自己'], phases: ['課堂'] }
  },

  // 留言牆
  walls: {
    L1_100: { lesson: 1, q: '如果 $100 由你決定，你會怎樣用？' },
    L2_job: { lesson: 2, q: '神秘職業：我估是甚麼職業？為甚麼？' },
    L3_hold: { lesson: 3, q: '我「忍住不買」的一個理由' },
    L4_again: { lesson: 4, q: '再看第 1 堂的便利貼：現在你還會這樣用 $100 嗎？' }
  },

  // 課程查詢 WhatsApp（號碼只寫數字，含區號 852）
  contact: { whatsapp: '85260517752', msg: '你好，我想查詢《同一張鈔票，不同世界》兒童財商課程。' },

  // 家長課後評估表：每項請家長分別評「上課前」和「上完課後」（1–5 分）
  feedback: {
    keys: ['先想需要想要', '訂目標儲錢', '珍惜已有', '明白勞動', '和家人傾談'],
    items: ['買東西前，會先想「需要還是想要」', '會為想要的東西訂目標、儲錢', '珍惜已有的東西，願意用到盡或先修理',
            '明白錢要靠工作和努力換來', '願意和家人傾談自己的金錢選擇']
  },


  // 首頁課程介紹（未登入時看到）
  intro: {
    tag: '兒童財商系列課程｜4 堂｜11–12 歲',
    title: '同一張鈔票，不同世界',
    sub: '有限資源，負責任選擇',
    whyT: '為甚麼要上這個課程？',
    why: ['拍一下八達通、按一下手機，錢就流走了，卻好像沒有感覺。限時優惠、盲盒、網紅開箱，令「全班都有」變成壓力。',
          '這個課程不教你「最省」，而是陪你在有限的錢和時間裡，學會看見價值、作出選擇，並為選擇負責。'],
    lessonsT: '四堂課，四個世界',
    howT: '每一堂怎樣上？',
    how: [['引起動機', '先玩一個小遊戲或投票，說出自己的想法。'], ['聽一聽', '認識今堂的財商知識。'], ['玩一玩', '分組動手做決定，練習技能。'], ['總結', '寫下自己的收穫，解鎖徽章。']],
    howNote: '上課時打開這個網站，就能投票、留言和填寫線上工作紙，即時看見全班的想法。',
    methodsT: '七個綠色理財法',
    methodsNote: '每堂學一至三個，四堂後集齊七徽章。',
    pathT: '四堂之後，你會走過這六步',
    designerT: '設計者的話',
    designer: '我最怕你們只學到一句「不可以花錢」。我更希望你們明白：錢是時間和努力換來的，每一個選擇都有代價，也能為明天留下可能。若四堂課後，你花錢前會多問自己一句「我真的需要嗎？」，我便覺得值得。',
    start: '開始上課 ›', parent: '我是家長', back: '📖 課程介紹'
  },
  parents: {
    intro: '孩子問「可以買嗎？」，不必馬上答應或拒絕，可以這樣做：',
    tips: [['購買前三問', '需要還是想要？會放棄甚麼？等一天會改變嗎？'],
           ['每星期 15 分鐘家庭財務會議', '輪流分享「我這星期的一個選擇」，父母也分享。'],
           ['讓孩子參與小決定', '比較家庭小額購物的兩個方案，孩子說理由，父母不評對錯。']],
    end: '當你肯等孩子說完理由，他學到的不只是理財，還有被信任。',
    books: [['《校長爸爸這樣教親子理財》（青馬文化）', '示範家長如何與孩子談錢。'],
            ['《小狗錢錢》', '以故事帶出目標與儲蓄，適合高小生自讀。'],
            ['關顯彬《少年錢滋味》', '以本地少年生活談消費與理財。']]
  }
};

// ===== English version (same structure as FQ above) =====
window.FQ_EN = {
  title: 'One Banknote, Different Worlds',
  mainline: 'Limited resources → value judgement → responsible choices',
  motto: 'Learning to manage money is learning to choose your future.',

  methods: {
    1: { name: 'Think it over', q: "Do I really need it? What happens if I don't buy it?" },
    2: { name: 'Compare', q: 'Is it just cheaper, or better value overall?' },
    3: { name: 'Use it up', q: 'Have I really used up the value of what I already have?' },
    4: { name: 'Repair before replacing', q: 'Repair, reuse or buy new — which makes more sense?' },
    5: { name: 'Borrow, swap, share', q: 'Do I have to own it to use it?' },
    6: { name: 'Save what you don’t spend', q: 'Where does the money I save go?' },
    7: { name: 'Invest in the future', q: 'How can today’s resources create long-term value?' }
  },

  path: ['See what I have', 'Know what matters', 'See the cost', 'Make a choice', 'Take responsibility', 'Leave choices for tomorrow'],

  lessons: {
    1: {
      title: 'The secret of $100', domain: 'Know money', en: '認識金錢',
      nodes: [['Where money comes from', 'Money doesn’t appear out of thin air.'], ['Exchange and value', 'Price isn’t the same as value; everything has a cost.'],
              ['Scarcity', 'Resources are limited, so take good care of them.'], ['Purchasing power', 'Money’s value changes, so learn to compare.']],
      gold: 'Price is what you pay; value is what you get.', ws: 'W1 · My $100'
    },
    2: {
      title: 'What is an hour worth?', domain: 'Earn money', en: '賺取金錢',
      nodes: [['Jobs and careers', 'Different jobs create different value.'], ['Time and effort', 'Time is a precious resource; effort brings rewards.'],
              ['Skills and learning', 'Grow your abilities to open up more ways to earn.'], ['Creating value', 'Become someone who adds value.']],
      gold: 'First the sweat, then the salary.', ws: 'W2 · My skill growth'
    },
    3: {
      title: 'Skip it today, gain what?', domain: 'Save money', en: '儲蓄金錢',
      nodes: [['SMART goals', 'Set a goal and save with a plan.'], ['Delayed gratification', 'Don’t rush to spend now; gain bigger choices later.'],
              ['Emergency fund', 'Keep money aside for the unexpected.'], ['Spending control', 'Cut impulse buys; spend on what truly matters.']],
      gold: 'No miracles, just steady saving.', ws: 'W3 · SMART savings plan'
    },
    4: {
      title: 'Is a want the same as a need?', domain: 'Spend wisely', en: '消費金錢',
      nodes: [['Needs vs wants', 'Ask yourself first: do I really need it?'], ['Compare and choose', 'Compare three shops and choose what fits best.'],
              ['Peers and ads', 'Don’t be swayed; think for yourself.'], ['Impulse buying', 'Stop, think, and avoid regret.']],
      gold: 'Tell your needs from your wants — it’s worth learning.', ws: 'W4 · Buy, don’t buy or wait'
    }
  },

  polls: {
    L3_stand: { q: 'Spend $20 on a small treat now, or keep $20 towards a $60 goal?' },
    L4_ad: { q: 'Which line tempts you most?' }
  },
  walls: {
    L1_100: { q: 'If you could decide how to use $100, what would you do?' },
    L2_job: { q: 'Mystery job: which job do you think it is, and why?' },
    L3_hold: { q: 'One reason I held back from buying' },
    L4_again: { q: 'Look at your Lesson 1 sticky note: would you still use $100 that way?' }
  },

  contact: { msg: 'Hi, I’d like to ask about the “One Banknote, Different Worlds” children’s money course.' },
  feedback: {
    items: ['Thinks “need or want?” before buying', 'Sets goals and saves for things they want', 'Takes care of their things, uses them up or repairs first',
            'Understands money comes from work and effort', 'Talks with the family about their money choices']
  },


  intro: {
    tag: 'Children’s money course · 4 lessons · Ages 11–12',
    title: 'One Banknote, Different Worlds',
    sub: 'Limited resources, responsible choices',
    whyT: 'Why take this course?',
    why: ['A tap of an Octopus card or a phone, and money is gone without you feeling it. Flash sales, blind boxes and influencer unboxings make “everyone in class has one” feel like pressure.',
          'This course won’t teach you to always spend the least. It helps you see value, make choices and take responsibility for them, with limited money and time.'],
    lessonsT: 'Four lessons, four worlds',
    howT: 'How does each lesson work?',
    how: [['Warm-up', 'Start with a small game or vote and share your ideas.'], ['Listen', 'Learn the money ideas for the lesson.'], ['Play', 'Make decisions in groups and practise the skills.'], ['Wrap-up', 'Write down what you learned and unlock badges.']],
    howNote: 'In class, open this website to vote, post notes and fill in online worksheets, and see the whole class’s ideas right away.',
    methodsT: 'Seven green money methods',
    methodsNote: 'Learn one to three in each lesson, and collect all seven badges after four lessons.',
    pathT: 'After four lessons, you’ll walk these six steps',
    designerT: 'From the course designer',
    designer: 'My biggest fear is that you only learn “don’t spend money”. I hope you understand that money comes from time and effort, every choice has a cost, and it can leave choices for tomorrow. If after four lessons you ask yourself “Do I really need it?” before spending, it will all have been worth it.',
    start: 'Start lessons ›', parent: 'I’m a parent', back: '📖 About the course'
  },
  parents: {
    intro: 'When your child asks “Can I buy it?”, you don’t have to say yes or no straight away. Try this:',
    tips: [['Three questions before buying', 'Is it a need or a want? What will I give up? Will I still want it tomorrow?'],
           ['A 15-minute weekly family money meeting', 'Take turns sharing “one choice I made this week” — parents too.'],
           ['Let your child help with small decisions', 'Compare two options for a small family purchase. Let your child explain why, without judging right or wrong.']],
    end: 'When you wait for your child to finish explaining, they learn more than money: they learn that they are trusted.',
    books: [['《校長爸爸這樣教親子理財》（青馬文化）', 'In Chinese. Shows parents how to talk with children about money.'],
            ['《小狗錢錢》', 'In Chinese. A story about goals and saving, suitable for upper-primary readers.'],
            ['關顯彬《少年錢滋味》', 'In Chinese. Spending and money values through the lives of local teenagers.']]
  }
};

// 學生的選擇一律以中文存入 Google Sheet；英文版只在畫面上翻譯
window.FQ_VAL = {
  '午餐': 'Lunch', '書': 'Books', '遊戲點數': 'Game credits', '送禮': 'Gifts', '儲蓄': 'Savings', '文具': 'Stationery',
  '新款波鞋': 'New sneakers', '盲盒': 'Blind box',
  '修': 'Repair', '換': 'Replace', '儲': 'Save', '花': 'Spend', '用緊急儲備': 'Use emergency fund',
  '需要': 'Need', '想要': 'Want', '可以等等': 'Can wait', '可以': 'Yes', '不可以': 'No',
  '買': 'Buy', '不買': 'Don’t buy', '等等看': 'Wait and see',
  '已有一個': 'I already have one', '朋友不在場': 'My friends aren’t around', '24 小時後': 'After 24 hours', '沒有改變': 'No change',
  '課頭': 'Start of lesson', '課尾': 'End of lesson', '課堂': 'In class',
  '現在用 $20 買小物': 'Spend $20 on a small treat now', '保留 $20，儲到 $60 的目標': 'Keep $20 towards my $60 goal',
  '會': 'Yes', '可能會': 'Maybe', '不會': 'No',
  '最後一天半價': 'Last day at half price!', '全班都有': 'Everyone in class has one', '限量版': 'Limited edition', '你值得獎勵自己': 'You deserve a treat'
};
