export interface LearningMethod {
  id: string;
  name: string;
  nameCn: string;
  icon: string;
  color: string;
  description: string;
  steps: { title: string; content: string }[];
 适用场景: string;
  核心原理: string;
}

export const LEARNING_METHODS: LearningMethod[] = [
  {
    id: 'simmons',
    name: 'Simmons Learning Method',
    nameCn: '西蒙学习法',
    icon: '🎯',
    color: '#667eea',
    description: '西蒙学习法由诺贝尔经济学奖得主赫伯特·西蒙提出，核心是「集中时间、高强度学习」，适合快速掌握一门技能。',
    适用场景: '快速掌握新技能、备考突击、短期学习目标',
    核心原理: '一个人1分钟内能够记忆的内容大约是7位数字，所以学习中不存在量子隧穿效应。学习的关键是集中时间，高强度突破。',
    steps: [
      { title: '确定目标', content: '明确要学习的技能或知识领域' },
      { title: '拆分技能', content: '将大技能拆分成可执行的小技能' },
      { title: '集中突破', content: '每天6小时，2周掌握核心知识' },
      { title: '即时反馈', content: '立即练习，获得反馈，修正错误' },
      { title: '持续迭代', content: '循环练习，直到熟练掌握' }
    ]
  },
  {
    id: 'feynman',
    name: 'Feynman Technique',
    nameCn: '费曼学习法',
    icon: '🧠',
    color: '#4ECDC4',
    description: '诺贝尔物理学奖得主理查德·费曼创立，强调用简单语言讲解复杂概念，是检验真正理解的最佳方法。',
    适用场景: '深入理解概念、准备考试、教学相长',
    核心原理: '如果你不能用简单的话解释一件事，说明你还没有真正理解。用输出倒逼输入，是最高效的学习方式。',
    steps: [
      { title: '选择一个概念', content: '选择一个你想要深入理解的概念' },
      { title: '讲授给他人', content: '想象向一个完全不懂的人解释这个概念' },
      { title: '发现缺口', content: '在讲解过程中发现自己的知识盲区' },
      { title: '查漏补缺', content: '针对不懂的地方重新学习' },
      { title: '简化语言', content: '用最通俗的语言和例子重新解释' }
    ]
  },
  {
    id: 'cornell',
    name: 'Cornell Note-Taking',
    nameCn: '康奈尔笔记法',
    icon: '📝',
    color: '#FF6B6B',
    description: '由康奈尔大学教授Walter Pauk发明，是全球最流行的笔记系统，帮助高效记录和复习。',
    适用场景: '课堂学习、读书笔记、会议记录',
    核心原理: '好记性不如烂笔头，但笔记需要结构化。分区域记录+及时复习，让知识真正转化为长期记忆。',
    steps: [
      { title: '记录区', content: '右侧大区域记录课程/阅读的主要内容' },
      { title: '提示栏', content: '左侧小区域写下关键词、问题、提示' },
      { title: '总结区', content: '底部区域用自己的话总结要点' },
      { title: '复习', content: '先看提示栏，回忆内容，再看记录区' },
      { title: '深化', content: '每周复习，持续补充新理解' }
    ]
  },
  {
    id: 'zettelkasten',
    name: 'Zettelkasten Method',
    nameCn: '卡片盒笔记法',
    icon: '🗃️',
    color: '#FFEAA7',
    description: '由德国社会学家Niklas Luhmann发明，通过原子化的卡片和链接，构建个人知识网络。',
    适用场景: '学术研究、写作创作、长期知识积累',
    核心原理: '知识不是孤立的点，而是相互连接的网络。每条笔记都是独立的思考单元，通过链接形成知识体系。',
    steps: [
      { title: '灵感笔记', content: '随时记录闪念、想法' },
      { title: '文献笔记', content: '记录阅读内容，用自己的话重述' },
      { title: '永久笔记', content: '提取核心观点，写成独立的原子笔记' },
      { title: '建立链接', content: '为新笔记建立与旧笔记的链接' },
      { title: '构建索引', content: '创建索引、标签方便检索' }
    ]
  },
  {
    id: 'pq4r',
    name: 'PQ4R Method',
    nameCn: 'PQ4R阅读法',
    icon: '📖',
    color: '#96CEB4',
    description: '由Thomas和Robinson发明的深度阅读方法，帮助从被动阅读转变为主动理解和记忆。',
    适用场景: '教材阅读、论文学习、深度理解',
    核心原理: '阅读不是被动接收信息，而是主动加工的过程。预览、提问、阅读、复述、复习，五步让知识扎根大脑。',
    steps: [
      { title: 'Preview 预览', content: '快速浏览章节标题、概念、图表，建立整体印象' },
      { title: 'Question 提问', content: '针对内容提出自己的问题' },
      { title: 'Read 阅读', content: '仔细阅读，边读边思考问题' },
      { title: 'Reflect 复述', content: '读完后用自己的话复述要点' },
      { title: 'Recite 背诵', content: '背诵关键概念，确认理解' },
      { title: 'Review 复习', content: '间隔复习，强化长期记忆' }
    ]
  },
  {
    id: 'spaced',
    name: 'Spaced Repetition',
    nameCn: '间隔重复法',
    icon: '🔄',
    color: '#AA96DA',
    description: '基于艾宾浩斯遗忘曲线的记忆方法，通过科学的时间间隔复习，实现高效长时记忆。',
    适用场景: '语言学习、记忆大量知识、备考',
    核心原理: '遗忘是正常的，关键是在遗忘前复习。第一次复习后，间隔时间逐渐拉长，每次复习都在强化记忆。',
    steps: [
      { title: '初次学习', content: '第一次学习新知识' },
      { title: '短期复习', content: '10分钟后第一次复习' },
      { title: '中期复习', content: '1天后第二次复习' },
      { title: '长期复习', content: '3天后第三次复习' },
      { title: '巩固复习', content: '7天后第四次复习' },
      { title: '定期复盘', content: '每月回顾，形成长期记忆' }
    ]
  }
];