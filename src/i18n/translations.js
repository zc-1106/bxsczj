/**
 * 多语言翻译表 — zh / en / ja
 * 包含所有界面固定文本和 AI 系统提示词
 */

const zh = {
  // ── 标题 ──────────────────────────
  'app.title': '剩菜拯救计划',

  'welcome.0': '今天想吃啥？',
  'welcome.1': '剩菜交给我！',
  'welcome.2': '冰箱里有宝藏哦～',
  'welcome.3': '让我来拯救你的胃！',
  'welcome.4': '打开冰箱，解锁美味！',

  'cooking.0': '正在翻冰箱...',
  'cooking.1': '锅已经热好了！',
  'cooking.2': '让我想想怎么搭配...',
  'cooking.3': '闻到香味了吗？',
  'cooking.4': '大厨正在创作中...',

  // ── 主题 ──────────────────────────
  'theme.switch': '切换主题',
  'theme.select': '选择主题风格',
  'theme.normal': '正常模式',
  'theme.normalDesc': '日式喫茶 / 杂志轻复古',
  'theme.normalSub': '丰富质感，舒适阅读',
  'theme.simple': '简洁模式',
  'theme.simpleDesc': '暖阳奶油 / 轻量暖调',
  'theme.simpleSub': '轻量暖调，快速操作',

  // ── 静音 ──────────────────────────
  'mute.on': '有声',
  'mute.off': '静音',

  // ── 输入 ──────────────────────────
  'input.placeholder': '输入食材，用逗号分隔...',
  'input.voiceFail': '语音识别失败，请手动输入',

  // ── 快捷标签 ──────────────────────
  'tag.egg': '鸡蛋',
  'tag.tomato': '番茄',
  'tag.potato': '土豆',
  'tag.onion': '洋葱',
  'tag.chicken': '鸡胸肉',

  // ── 食材库 ────────────────────────
  'pantry.title': '食材库',
  'pantry.example': '例如：鸡蛋、牛奶',
  'pantry.empty': '还没有常备食材哦，添加几个吧～',
  'pantry.add': '添加',
  'pantry.count': n => `你有 ${n} 种食材可以拯救`,
  'pantry.hint': '添加常备食材，拯救更方便',

  // ── 偏好 ──────────────────────────
  'prefs.title': '偏好',
  'prefs.add': '添加口味偏好（可选）',
  'prefs.edit': '点击修改',
  'prefs.restrictions': '忌口 / 过敏',
  'prefs.tastes': '口味倾向',
  'prefs.tools': '烹饪工具限制',
  'prefs.servings': '用餐人数',
  'prefs.apply': '应用偏好',
  'prefs.placeholder': '如"不吃辣""海鲜过敏"',

  // 口味标签
  'taste.spicy': '偏辣',
  'taste.sweet': '偏甜',
  'taste.light': '清淡',
  'taste.strong': '重口味',
  'taste.sour': '酸爽',
  'taste.creamy': '奶油党',

  // 工具标签
  'tool.microwave': '只有微波炉',
  'tool.noOven': '没有烤箱',
  'tool.airFryer': '只能用空气炸锅',
  'tool.riceCooker': '有电饭煲',

  // ── 模式 ──────────────────────────
  'mode.lazy': '懒人模式',
  'mode.hardcore': '硬核模式',
  'mode.hell': '地狱模式',

  // ── 按钮 ──────────────────────────
  'save.button': '拯救剩菜',
  'save.saving': '正在拯救...',
  'save.cancel': '取消',
  'save.stop': '不要了',
  'save.idle': '选好食材，点「拯救剩菜」开始魔法！',

  // ── 错误 ──────────────────────────
  'error.empty': '请至少输入一种食材',
  'error.emptyRecipes': 'AI 返回了空食谱，试试换一批食材',
  'error.gotIt': '知道啦',
  'error.apiKey': '服务未配置，请联系管理员',

  // ── 食谱卡片 ──────────────────────
  'recipe.count': n => `${n} 个食谱新鲜出炉`,
  'recipe.label': '食谱',
  'recipe.needBuy': '需购买：',
  'recipe.needBuySimple': '需要购买：',
  'recipe.alternative': '替代：',
  'recipe.alternativeSimple': '试试：',
  'recipe.addToList': '+ 加入购物清单',
  'recipe.perfect': '完美匹配',
  'recipe.search': '搜做法视频',
  'recipe.searchPlatform': '选择搜索平台',
  'recipe.darkIndex': '黑暗指数',
  'recipe.rating': '评分',
  'recipe.rawData': '食谱已生成（原始数据）',

  // 搜索平台
  'search.bilibili': 'B站视频教程',
  'search.youtube': 'YouTube 教程',
  'search.xiachufang': '下厨房图文',
  'search.bilibiliTip': '搜索做法视频',
  'search.youtubeTip': '搜索视频教程',
  'search.xiachufangTip': '搜索图文菜谱',

  // ── 购物清单 ──────────────────────
  'shop.title': n => `购物清单（${n} 项）`,
  'shop.clear': '清空',
  'shop.bought': '已买',

  // ── 历史记录 ──────────────────────
  'history.title': '历史记录',
  'history.count': n => `${n} 条`,
  'history.empty': '还没有生成过食谱，快去拯救剩菜吧！',

  // ── 黑暗名人堂 ────────────────────
  'dark.title': '黑暗名人堂',
  'dark.empty': '还没有黑暗料理记录',
  'dark.emptyHint': '切换地狱模式，开启黑暗实验！',
  'dark.delete': '删除',
  'dark.clear': '清空',

  // ── 成就 ──────────────────────────
  'achievement.5': '剩菜新星',
  'achievement.10': '冷宫御厨',
  'achievement.50': '冰箱之神',
  'achievement.unlocked': '获得勋章',

  // ── 语音 ───────────────────────────
  'voice.holdHint': '按住录音，松手识别',
  'voice.listeningHint': '录音中，松手停止',
}

// ─── 英文 ─────────────────────────────────────────────────────
const en = {
  'app.title': 'Leftover Savior',

  'welcome.0': "What's on the menu today?",
  'welcome.1': 'Leave the leftovers to me!',
  'welcome.2': "There's treasure in your fridge~",
  'welcome.3': "Let me save your stomach!",
  'welcome.4': 'Open the fridge, unlock deliciousness!',

  'cooking.0': 'Raiding the fridge...',
  'cooking.1': 'The pan is sizzling hot!',
  'cooking.2': 'Thinking of combinations...',
  'cooking.3': 'Do you smell that?',
  'cooking.4': 'Chef is working magic...',

  'theme.switch': 'Switch Theme',
  'theme.select': 'Choose a theme',
  'theme.normal': 'Normal Mode',
  'theme.normalDesc': 'Kissaten / Magazine Retro',
  'theme.normalSub': 'Rich texture, cozy reading',
  'theme.simple': 'Simple Mode',
  'theme.simpleDesc': 'Warm Cream / Light & Airy',
  'theme.simpleSub': 'Light warmth, quick actions',

  'mute.on': 'Sound On',
  'mute.off': 'Muted',

  'input.placeholder': 'Enter ingredients, separated by commas...',
  'input.voiceFail': 'Voice recognition failed, please type manually',

  'tag.egg': 'Egg',
  'tag.tomato': 'Tomato',
  'tag.potato': 'Potato',
  'tag.onion': 'Onion',
  'tag.chicken': 'Chicken Breast',

  'pantry.title': 'Pantry',
  'pantry.example': 'e.g. eggs, milk',
  'pantry.empty': 'No staples yet, add a few~',
  'pantry.add': 'Add',
  'pantry.count': n => `You have ${n} ingredients to save`,
  'pantry.hint': 'Add staples for quicker rescue',

  'prefs.title': 'Prefs',
  'prefs.add': '+ Add Preferences (optional)',
  'prefs.edit': 'Tap to edit',
  'prefs.restrictions': 'Allergies / Restrictions',
  'prefs.tastes': 'Taste Preferences',
  'prefs.tools': 'Equipment Limits',
  'prefs.servings': 'Servings',
  'prefs.apply': 'Apply Preferences',
  'prefs.placeholder': 'e.g. "no spicy", "shellfish allergy"',

  'taste.spicy': 'Spicy',
  'taste.sweet': 'Sweet',
  'taste.light': 'Light',
  'taste.strong': 'Bold',
  'taste.sour': 'Tangy',
  'taste.creamy': 'Creamy',

  'tool.microwave': 'Microwave Only',
  'tool.noOven': 'No Oven',
  'tool.airFryer': 'Air Fryer Only',
  'tool.riceCooker': 'Has Rice Cooker',

  'mode.lazy': 'Lazy Mode',
  'mode.hardcore': 'Hardcore Mode',
  'mode.hell': 'Hell Mode',

  'save.button': 'Save the Leftovers!',
  'save.saving': 'Saving...',
  'save.cancel': 'Cancel',
  'save.stop': 'Stop',
  'save.idle': 'Pick your ingredients and start the magic!',

  'error.empty': 'Please enter at least one ingredient',
  'error.emptyRecipes': 'AI returned empty recipes, try different ingredients',
  'error.gotIt': 'Got it',
  'error.apiKey': 'Service not configured, please contact admin',

  'recipe.count': n => `${n} recipes fresh out of the kitchen!`,
  'recipe.label': 'Recipe',
  'recipe.needBuy': 'Need to buy: ',
  'recipe.needBuySimple': 'Need: ',
  'recipe.alternative': 'Sub: ',
  'recipe.alternativeSimple': 'Try: ',
  'recipe.addToList': '+ Add to List',
  'recipe.perfect': 'Perfect Match',
  'recipe.search': 'Search Video',
  'recipe.searchPlatform': 'Choose platform',
  'recipe.darkIndex': 'Dark Index',
  'recipe.rating': 'Rate',
  'recipe.rawData': 'Recipe Generated (Raw Data)',

  'search.bilibili': 'Bilibili',
  'search.youtube': 'YouTube',
  'search.xiachufang': 'XiaChuFang',
  'search.bilibiliTip': 'Search video tutorials',
  'search.youtubeTip': 'Search video recipes',
  'search.xiachufangTip': 'Search text recipes',

  'shop.title': n => `Shopping List (${n})`,
  'shop.clear': 'Clear',
  'shop.bought': 'Got it',

  'history.title': 'History',
  'history.count': n => `${n} entries`,
  'history.empty': 'No recipes generated yet — go save some leftovers!',

  'dark.title': 'Dark Hall of Fame',
  'dark.empty': 'No dark cuisine records yet',
  'dark.emptyHint': 'Switch to Hell Mode and start experimenting!',
  'dark.delete': 'Delete',
  'dark.clear': 'Clear',

  'achievement.5': 'Leftover Rookie',
  'achievement.10': 'Fridge Royal Chef',
  'achievement.50': 'God of Leftovers',
  'achievement.unlocked': 'Badge Unlocked',

  'voice.holdHint': 'Hold to record, release to recognize',
  'voice.listeningHint': 'Recording... release to stop',
}

// ─── 日文 ─────────────────────────────────────────────────────
const ja = {
  'app.title': '残り物救済計画',

  'welcome.0': '今日は何が食べたい？',
  'welcome.1': '残り物は任せて！',
  'welcome.2': '冷蔵庫には宝物があるよ〜',
  'welcome.3': 'あなたの胃袋を救ってみせる！',
  'welcome.4': '冷蔵庫を開けて、美味しさを解放しよう！',

  'cooking.0': '冷蔵庫を探検中...',
  'cooking.1': '鍋はもう熱々！',
  'cooking.2': '組み合わせを考え中...',
  'cooking.3': 'いい匂いがしてきた？',
  'cooking.4': 'シェフが魔法をかけています...',

  'theme.switch': 'テーマ切替',
  'theme.select': 'テーマを選択',
  'theme.normal': '通常モード',
  'theme.normalDesc': '喫茶店 / 雑誌レトロ',
  'theme.normalSub': '豊かな質感、心地よい読書',
  'theme.simple': 'シンプルモード',
  'theme.simpleDesc': '暖かいクリーム / 軽やか',
  'theme.simpleSub': '軽い暖かさ、素早い操作',

  'mute.on': '音あり',
  'mute.off': '消音',

  'input.placeholder': '食材をカンマ区切りで入力...',
  'input.voiceFail': '音声認識に失敗しました。手動で入力してください',

  'tag.egg': '卵',
  'tag.tomato': 'トマト',
  'tag.potato': 'じゃがいも',
  'tag.onion': '玉ねぎ',
  'tag.chicken': '鶏むね肉',

  'pantry.title': '食材庫',
  'pantry.example': '例：卵、牛乳',
  'pantry.empty': 'まだ常備食材がありません。いくつか追加しましょう〜',
  'pantry.add': '追加',
  'pantry.count': n => `${n}種類の食材を救済できます`,
  'pantry.hint': '常備食材を追加すると、より便利に',

  'prefs.title': '設定',
  'prefs.add': '+ 好みを追加（任意）',
  'prefs.edit': 'タップして編集',
  'prefs.restrictions': 'アレルギー・禁忌',
  'prefs.tastes': '味の好み',
  'prefs.tools': '調理器具の制限',
  'prefs.servings': '人数',
  'prefs.apply': '好みを適用',
  'prefs.placeholder': '例：「辛いもの禁止」「甲殻類アレルギー」',

  'taste.spicy': '辛め',
  'taste.sweet': '甘め',
  'taste.light': 'あっさり',
  'taste.strong': '濃い味',
  'taste.sour': '酸味',
  'taste.creamy': 'クリーミー',

  'tool.microwave': '電子レンジのみ',
  'tool.noOven': 'オーブンなし',
  'tool.airFryer': 'エアフライヤーのみ',
  'tool.riceCooker': '炊飯器あり',

  'mode.lazy': '怠け者モード',
  'mode.hardcore': '本格モード',
  'mode.hell': '地獄モード',

  'save.button': '残り物を救済！',
  'save.saving': '救済中...',
  'save.cancel': '取消',
  'save.stop': 'やめる',
  'save.idle': '食材を選んで「残り物を救済」で魔法スタート！',

  'error.empty': '少なくとも1つの食材を入力してください',
  'error.emptyRecipes': 'AIが空のレシピを返しました。別の食材を試してください',
  'error.gotIt': '了解',
  'error.apiKey': 'サービスが設定されていません。管理者に連絡してください',

  'recipe.count': n => `${n}件のレシピができました！`,
  'recipe.label': 'レシピ',
  'recipe.needBuy': '購入必要：',
  'recipe.needBuySimple': '必要：',
  'recipe.alternative': '代替：',
  'recipe.alternativeSimple': '代用：',
  'recipe.addToList': '+ 買い物リストに追加',
  'recipe.perfect': '完璧マッチ',
  'recipe.search': '作り方を検索',
  'recipe.searchPlatform': '検索プラットフォームを選択',
  'recipe.darkIndex': '暗黒指数',
  'recipe.rating': '評価',
  'recipe.rawData': 'レシピ生成済み（生データ）',

  'search.bilibili': 'Bilibili',
  'search.youtube': 'YouTube',
  'search.xiachufang': '下厨房',
  'search.bilibiliTip': '動画チュートリアル検索',
  'search.youtubeTip': 'レシピ動画検索',
  'search.xiachufangTip': 'テキストレシピ検索',

  'shop.title': n => `買い物リスト（${n}件）`,
  'shop.clear': 'クリア',
  'shop.bought': '購入済',

  'history.title': '履歴',
  'history.count': n => `${n}件`,
  'history.empty': 'まだレシピを生成していません。残り物を救いに行きましょう！',

  'dark.title': '暗黒料理殿堂',
  'dark.empty': 'まだ暗黒料理の記録がありません',
  'dark.emptyHint': '地獄モードに切り替えて実験開始！',
  'dark.delete': '削除',
  'dark.clear': '全消去',

  'achievement.5': '残り物ルーキー',
  'achievement.10': '冷蔵庫の達人',
  'achievement.50': '残り物の神',
  'achievement.unlocked': 'バッジ獲得',

  'voice.holdHint': '長押しで録音、離すと認識',
  'voice.listeningHint': '録音中... 離すと停止',
}

// ─── API 系统提示词 ──────────────────────────────────────────

const apiPrompts = {
  zh: {
    lazy: `你是一个懒人下厨助手。用户输入现有食材，你返回 1~3 个食谱。请用中文回复。

规则：
- 步骤 ≤ 5 步，总时间 ≤ 25 分钟
- 尽可能用现有食材，缺的调料/配菜越少越好
- 做法简单省事，适合不想动脑的懒人`,
    hardcore: `你是一个专业厨师助手。用户输入现有食材，你返回 1~3 个食谱。请用中文回复。

规则：
- 无步骤和时间限制，讲究成品的口味和品质
- 可以大胆推荐需要额外采购的调料/配菜
- 给出专业级的烹饪步骤和技巧提示`,
    hell: `你是一个黑暗料理发明家。用户输入食材（可能完全不搭），你的使命是用这些食材创作"地狱级"黑暗料理。请用中文回复。

规则：
- 故意匹配冲突、违和的食材组合（甜+辣+酸混搭，水果+肉+酱油等）
- 步骤可以荒诞但技术上"可食用"，加点戏剧化描述
- 必须在 missing 数组末尾附加一条食用安全提醒（例如 "⚠️ 请确保鸡肉完全熟透"）
- difficulty 固定为 5，time 随意
- 幽默、疯狂、但不要太恶心`,
  },
  en: {
    lazy: `You are a lazy-cooking assistant. The user provides available ingredients, and you return 1-3 recipes. Reply in English.

Rules:
- Steps ≤ 5, total time ≤ 25 minutes
- Use existing ingredients as much as possible; missing items should be minimal
- Simple and effortless methods, perfect for lazy cooks`,
    hardcore: `You are a professional chef assistant. The user provides available ingredients, and you return 1-3 recipes. Reply in English.

Rules:
- No step or time limits; focus on flavor and quality
- Feel free to recommend additional seasonings and ingredients to purchase
- Provide professional cooking steps and technique tips`,
    hell: `You are a dark-cuisine inventor. The user provides ingredients (possibly completely mismatched), and your mission is to create "hell-level" dark cuisine. Reply in English.

Rules:
- Deliberately create conflicting, dissonant ingredient combinations (sweet+spicy+sour, fruit+meat+soy sauce, etc.)
- Steps can be absurd but technically "edible," with dramatic descriptions
- Must append a food safety warning to the missing array (e.g. "⚠️ Ensure chicken is fully cooked")
- difficulty must be 5, time is arbitrary
- Humorous, crazy, but not disgusting`,
  },
  ja: {
    lazy: `あなたは怠け者向け料理アシスタントです。ユーザーが手持ちの食材を入力すると、1〜3つのレシピを返します。日本語で返信してください。

ルール：
- 手順は5ステップ以内、合計時間は25分以内
- できるだけ既存の食材を使用し、不足する調味料・副菜は最小限に
- 手間いらずで簡単な方法、考えたくない怠け者に最適`,
    hardcore: `あなたはプロのシェフアシスタントです。ユーザーが手持ちの食材を入力すると、1〜3つのレシピを返します。日本語で返信してください。

ルール：
- 手順や時間の制限なし、味と品質を重視
- 追加購入が必要な調味料や副菜を積極的に推奨
- プロ級の調理手順とテクニックのヒントを提供`,
    hell: `あなたは暗黒料理の発明家です。ユーザーが食材（まったく合わない可能性あり）を入力すると、あなたの使命は「地獄級」の暗黒料理を創作することです。日本語で返信してください。

ルール：
- 故意に相反する食材の組み合わせを作る（甘辛酸ミックス、果物+肉+醤油など）
- 手順は荒唐無稽でも技術的に「食べられる」ものにし、ドラマチックな説明を加える
- missing配列の最後に食品安全警告を必ず追加（例：「⚠️ 鶏肉は必ず完全に火を通してください」）
- difficultyは必ず5、timeは任意
- ユーモラスでクレイジー、でも気持ち悪くなりすぎない`,
  },
}

const jsonFormatInstructions = {
  zh: `\n返回纯 JSON（不要 Markdown 代码块），格式：
{
  "recipes": [
    {
      "name": "菜名",
      "time": "15分钟",
      "difficulty": 1,
      "steps": ["打鸡蛋","炒熟","出锅"],
      "missing": [
        { "ingredient": "生抽", "alternative": "老抽减量+盐" },
        { "ingredient": "蚝油", "alternative": "酱油+糖" }
      ],
      "joke": "一句轻松吐槽"
    }
  ]
重要：missing 数组中每个对象必须有 ingredient 字段；alternative 字段填写 1 个最常见的家庭替代品（如没有常见替代可留空字符串，但必须提供该字段）。替代品用简短口语化描述，通常 2-6 个字。`,
  en: `\nReturn pure JSON (no Markdown code blocks), format:
{
  "recipes": [
    {
      "name": "Dish Name",
      "time": "15 min",
      "difficulty": 1,
      "steps": ["Beat eggs","Stir-fry","Serve"],
      "missing": [
        { "ingredient": "soy sauce", "alternative": "use less dark soy + salt" },
        { "ingredient": "oyster sauce", "alternative": "soy sauce + sugar" }
      ],
      "joke": "a lighthearted quip"
    }
  ]
Important: each object in the missing array must have an ingredient field; the alternative field should contain 1 most common household substitute (leave as empty string if none, but the field must exist). Alternatives should be short, 2-6 words.`,
  ja: `\n純粋なJSON（Markdownコードブロックなし）で返してください。形式：
{
  "recipes": [
    {
      "name": "料理名",
      "time": "15分",
      "difficulty": 1,
      "steps": ["卵を溶く","炒める","盛り付ける"],
      "missing": [
        { "ingredient": "醤油", "alternative": "減塩醤油+塩" },
        { "ingredient": "オイスターソース", "alternative": "醤油+砂糖" }
      ],
      "joke": "軽い一言ツッコミ"
    }
  ]
重要：missing配列の各オブジェクトには必ずingredientフィールドが必要です；alternativeフィールドには最も一般的な家庭用代替品を1つ記入してください（代替品がない場合は空文字列でも構いませんが、フィールド自体は必須です）。代替品は短く2〜6文字程度で。`,
}

const preferenceTexts = {
  zh: {
    restrictions: (r) => `忌口/过敏：${r.join('、')}。请避开这些食材和调料。`,
    tastes: (t) => `口味倾向：${t.join('、')}。`,
    tools: (t) => `烹饪设备限制：${t.join('、')}。`,
    servingsHeader: (n) => `用餐人数：${n}人份。`,
    prefsHeader: '【用户偏好 — 请据此调整推荐】',
    missingNote: '如有缺失调料或工具不匹配的情况，请在 missing 中友好提醒。',
    userMessage: (ingredients) => `我手上有这些食材：${ingredients.join('、')}。请给我食谱。`,
  },
  en: {
    restrictions: (r) => `Allergies/Restrictions: ${r.join(', ')}. Please avoid these.`,
    tastes: (t) => `Taste preference: ${t.join(', ')}.`,
    tools: (t) => `Equipment limits: ${t.join(', ')}.`,
    servingsHeader: (n) => `Servings: ${n} people.`,
    prefsHeader: '[User Preferences — adjust recommendations accordingly]',
    missingNote: 'If ingredients or tools are mismatched, kindly note in the missing field.',
    userMessage: (ingredients) => `I have these ingredients: ${ingredients.join(', ')}. Give me recipes.`,
  },
  ja: {
    restrictions: (r) => `アレルギー・禁忌：${r.join('、')}。これらの食材・調味料を避けてください。`,
    tastes: (t) => `味の好み：${t.join('、')}。`,
    tools: (t) => `調理器具の制限：${t.join('、')}。`,
    servingsHeader: (n) => `人数：${n}人分。`,
    prefsHeader: '【ユーザー好み — これに基づいて調整してください】',
    missingNote: '不足する調味料や器具の不一致がある場合は、missing欄で親切に注意してください。',
    userMessage: (ingredients) => `手持ちの食材：${ingredients.join('、')}。レシピをください。`,
  },
}

// ─── 导出 ─────────────────────────────────────────────────────

const translations = { zh, en, ja }

/**
 * 获取翻译文本
 * @param {'zh'|'en'|'ja'} lang
 * @param {string} key
 * @returns {string|function}
 */
export function getTranslation(lang, key) {
  const table = translations[lang]
  if (table && table[key] !== undefined) return table[key]
  // 回退到中文
  if (zh[key] !== undefined) return zh[key]
  // 最后回退到 key 自身
  return key
}

/**
 * 获取 API 系统提示词
 */
export function getApiPrompt(lang, mode) {
  const prompts = apiPrompts[lang] ?? apiPrompts.zh
  return prompts[mode] ?? prompts.lazy ?? ''
}

/**
 * 获取 JSON 格式说明（对应语言）
 */
export function getJsonFormatInstruction(lang) {
  return jsonFormatInstructions[lang] ?? jsonFormatInstructions.zh
}

/**
 * 获取偏好描述文案构建器
 */
export function getPreferenceTexts(lang) {
  return preferenceTexts[lang] ?? preferenceTexts.zh
}

/**
 * 获取语言显示名称
 */
export const LANG_LABELS = {
  zh: '中',
  en: 'EN',
  ja: '日',
}

export const LANG_NAMES = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
}

export default translations
