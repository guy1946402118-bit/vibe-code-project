export interface Quote {
  id: number;
  text: string;
  author: string;
  category: 'motivation' | 'wisdom' | 'success' | 'growth' | 'discipline';
  tags: string[];
}

const QUOTES: Quote[] = [
  { id: 1, text: "成就伟业的唯一途径是热爱你所做的事。", author: "史蒂夫·乔布斯", category: "success", tags: ["热爱", "事业"] },
  { id: 2, text: "成功不是终点，失败也不是终结，唯有继续前行的勇气才最重要。", author: "温斯顿·丘吉尔", category: "motivation", tags: ["坚持", "勇气"] },
  { id: 3, text: "未来属于那些相信自己梦想之美的人。", author: "埃莉诺·罗斯福", category: "growth", tags: ["梦想", "未来"] },
  { id: 4, text: "重要的是不要停下来，哪怕走得慢一点也没关系。", author: "孔子", category: "discipline", tags: ["坚持", "耐心"] },
  { id: 5, text: "成功的秘诀就是开始行动。", author: "马克·吐温", category: "motivation", tags: ["行动", "开始"] },
  { id: 6, text: "实现目标后得到的，不如在追求目标过程中成为的那个人重要。", author: "齐格·齐格拉", category: "growth", tags: ["目标", "蜕变"] },
  { id: 7, text: "唯一不可能的旅程，是你从未开始的那个旅程。", author: "托尼·罗宾斯", category: "motivation", tags: ["旅程", "开始"] },
  { id: 8, text: "自律是连接目标与成就的桥梁。", author: "吉姆·罗恩", category: "discipline", tags: ["自律", "目标"] },
  { id: 9, text: "成功通常属于那些忙于工作而无暇寻找它的人。", author: "亨利·大卫·梭罗", category: "success", tags: ["专注", "努力"] },
  { id: 10, text: "不要盯着时钟看；要像时钟一样，一直向前走。", author: "萨姆·莱文森", category: "discipline", tags: ["坚持", "时间"] },
  { id: 11, text: "种一棵树最好的时间是二十年前，其次是现在。", author: "中国谚语", category: "growth", tags: ["行动", "机遇"] },
  { id: 12, text: "你的时间是有限的，不要浪费去过别人的生活。", author: "史蒂夫·乔布斯", category: "wisdom", tags: ["真实", "时间"] },
  { id: 13, text: "你注定成为的人，只能由你自己决定。", author: "拉尔夫·瓦尔多·爱默生", category: "growth", tags: ["选择", "命运"] },
  { id: 14, text: "每个冠军都曾是拒绝放弃的挑战者。", author: "洛奇·巴尔博亚", category: "motivation", tags: ["冠军", "坚持"] },
  { id: 15, text: "每天微小的改进，随着时间的推移，会带来惊人的结果。", author: "罗宾·夏尔马", category: "growth", tags: ["习惯", "复利"] },
  { id: 16, text: "你为某件事付出越多，当你实现它时感受就会越深。", author: "佚名", category: "success", tags: ["努力", "成就"] },
  { id: 17, text: "敢于梦想，敢于失败。", author: "诺曼·沃恩", category: "motivation", tags: ["梦想", "勇气"] },
  { id: 18, text: "事情在完成之前看起来总是不可能的。", author: "纳尔逊·曼德拉", category: "motivation", tags: ["不可能", "成就"] },
  { id: 19, text: "我们可能会遭遇许多失败，但绝不能被打败。", author: "玛雅·安杰卢", category: "discipline", tags: ["韧性", "挫折"] },
  { id: 20, text: "相信你能做到，你就已经成功了一半。", author: "西奥多·罗斯福", category: "success", tags: ["信念", "自信"] },
  { id: 21, text: "心态决定一切。你想成为什么样的人，就会成为什么样的人。", author: "佛陀", category: "wisdom", tags: ["心态", "思想"] },
  { id: 22, text: "追求进步，而非完美。", author: "佚名", category: "growth", tags: ["进步", "完美主义"] },
  { id: 23, text: "跌倒七次，第八次站起来。", author: "日本谚语", category: "discipline", tags: ["韧性", "坚持"] },
  { id: 24, text: "限制我们明天实现的唯一因素，是我们今天的怀疑。", author: "富兰克林·罗斯福", category: "motivation", tags: ["怀疑", "潜力"] },
  { id: 25, text: "逼迫自己，因为没有人会替你去做。", author: "佚名", category: "discipline", tags: ["自我激励", "推动力"] },
  { id: 26, text: "伟大的成就永远不会来自舒适区。", author: "佚名", category: "growth", tags: ["舒适区", "成长"] },
  { id: 27, text: "梦想更大，做更大的事，成为更伟大的人。", author: "佚名", category: "motivation", tags: ["梦想", "行动"] },
  { id: 28, text: "成功是日复一日的小努力的叠加。", author: "罗伯特·科利尔", category: "success", tags: ["一致性", "习惯"] },
  { id: 29, text: "在你感到骄傲之前，不要停下脚步。", author: "佚名", category: "motivation", tags: ["自豪", "努力"] },
  { id: 30, text: "当天赋不努力工作时，努力工作可以击败天赋。", author: "蒂姆·诺特克", category: "discipline", tags: ["努力工作", "天赋"] },
  { id: 31, text: "行动起来，好像你的行为会产生影响。它确实会产生影响。", author: "威廉·詹姆斯", category: "wisdom", tags: ["影响力", "行动"] },
];

export function getDailyQuote(): Quote {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % QUOTES.length;
  return QUOTES[index];
}

export function getRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export function getQuotesByCategory(category: Quote['category']): Quote[] {
  return QUOTES.filter(q => q.category === category);
}

export function searchQuotes(query: string): Quote[] {
  return QUOTES.filter(q =>
    q.text.includes(query) ||
    q.author.includes(query) ||
    q.tags.some(tag => tag.includes(query))
  );
}

export default QUOTES;
