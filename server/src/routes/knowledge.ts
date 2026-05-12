import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

let _prisma: PrismaClient | null = null;
function sharedPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/categories', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const categories = await prisma.knowledgeNode.findMany({
    where: { isCategory: true },
    orderBy: { weight: 'desc' },
    include: {
      toEdges: {
        include: { fromNode: true },
        where: { relation: 'BELONGS_TO' },
      },
    },
  });

  const result = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    category: cat.category,
    weight: cat.weight,
    children: cat.toEdges.map(e => ({
      id: e.fromNode.id,
      name: e.fromNode.name,
      type: e.fromNode.type,
      icon: e.fromNode.icon,
    })),
  }));

  res.json(result);
}));

router.get('/nodes', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { type, category, limit = 50 } = req.query;

  const where: any = {};
  if (type) where.type = type as string;
  if (category) where.category = category as string;

  const nodes = await prisma.knowledgeNode.findMany({
    where,
    orderBy: { weight: 'desc' },
    take: Number(limit),
  });

  res.json(nodes);
}));

router.get('/nodes/:id', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const id = String(req.params.id);

  const node = await prisma.knowledgeNode.findUnique({
    where: { id },
    include: {
      fromEdges: {
        include: { toNode: true },
      },
      toEdges: {
        include: { fromNode: true },
      },
    },
  });

  if (!node) { res.status(404).json({ error: '节点不存在' }); return; }

  const related = [
    ...node.fromEdges.map(e => ({ ...e.toNode, relation: e.relation, description: e.description })),
    ...node.toEdges.map(e => ({ ...e.fromNode, relation: e.relation, description: e.description, direction: 'reverse' })),
  ];

  res.json({ node, related });
}));

router.get('/graph', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { category, depth = 2 } = req.query;

  const nodeWhere: any = {};
  if (category) nodeWhere.category = category as string;

  const nodes = await prisma.knowledgeNode.findMany({
    where: nodeWhere,
    orderBy: { weight: 'desc' },
    take: 100,
  });

  const nodeIds = nodes.map(n => n.id);
  const edges = await prisma.knowledgeEdge.findMany({
    where: {
      OR: [
        { fromId: { in: nodeIds } },
        { toId: { in: nodeIds } },
      ],
    },
  });

  res.json({
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      category: n.category,
      icon: n.icon,
      weight: n.weight,
      isCategory: n.isCategory,
    })),
    edges: edges.map(e => ({
      id: e.id,
      fromId: e.fromId,
      toId: e.toId,
      relation: e.relation,
      weight: e.weight,
      description: e.description,
    })),
  });
}));

router.get('/search', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { q, type, limit = 20 } = req.query;

  if (!q || !String(q).trim()) {
    res.json([]);
    return;
  }

  const where: any = {
    name: { contains: String(q) },
  };
  if (type) where.type = type as string;

  const nodes = await prisma.knowledgeNode.findMany({
    where,
    orderBy: { weight: 'desc' },
    take: Number(limit),
    include: {
      toEdges: {
        include: { fromNode: true },
        take: 5,
      },
    },
  });

  const articles = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: String(q) } },
        { content: { contains: String(q) } },
        { tags: { contains: String(q) } },
      ],
    },
    take: 5,
    orderBy: { publishedAt: 'desc' },
  });

  res.json({ nodes, articles });
}));

router.get('/tags', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const tags = await prisma.knowledgeNode.findMany({
    where: { type: 'TAG' },
    orderBy: { weight: 'desc' },
    take: 50,
  });

  const maxWeight = tags.length > 0 ? Math.max(...tags.map(t => t.weight)) : 1;
  res.json(tags.map(t => ({
    id: t.id,
    name: t.name,
    weight: t.weight,
    normalizedWeight: t.weight / maxWeight,
    category: t.category,
  })));
}));

router.get('/related/:id', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const id = String(req.params.id);

  const [fromEdges, toEdges] = await Promise.all([
    prisma.knowledgeEdge.findMany({
      where: { fromId: id },
      include: { toNode: true },
      orderBy: { weight: 'desc' },
      take: 10,
    }),
    prisma.knowledgeEdge.findMany({
      where: { toId: id },
      include: { fromNode: true },
      orderBy: { weight: 'desc' },
      take: 10,
    }),
  ]);

  const related = [
    ...fromEdges.map(e => ({ node: e.toNode, relation: e.relation, weight: e.weight })),
    ...toEdges.map(e => ({ node: e.fromNode, relation: e.relation, weight: e.weight })),
  ].sort((a, b) => b.weight - a.weight);

  res.json(related);
}));

router.post('/extract', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { postId } = req.body;

  const posts = postId
    ? await prisma.blogPost.findMany({ where: { id: postId } })
    : await prisma.blogPost.findMany({ where: { isPublished: true } });

  if (posts.length === 0) {
    res.json({ extracted: 0, message: '没有可抽取的文章' });
    return;
  }

  let extractedCount = 0;

  for (const post of posts) {
    const titleEntities = extractEntitiesFromText(post.title);
    const contentEntities = extractEntitiesFromText(post.content + ' ' + post.excerpt);
    const allEntities = [...new Set([...titleEntities, ...contentEntities])];

    const postNode = await ensureNode(prisma, post.id, post.title, 'ARTICLE', post.category, post.id, '📄');
    extractedCount++;

    for (const entity of allEntities) {
      const node = await ensureNode(prisma, entity.id, entity.name, entity.type, post.category);

      const existingEdge = await prisma.knowledgeEdge.findFirst({
        where: { fromId: postNode.id, toId: node.id },
      });
      if (!existingEdge) {
        await prisma.knowledgeEdge.create({
          data: { fromId: postNode.id, toId: node.id, relation: entity.relation as any, weight: 1 },
        });
      }

      if (entity.parentCategory) {
        const categoryNodes = await prisma.knowledgeNode.findMany({
          where: { name: entity.parentCategory, isCategory: true },
        });
        for (const cat of categoryNodes) {
          const hasBelong = await prisma.knowledgeEdge.findFirst({
            where: { fromId: node.id, toId: cat.id, relation: 'BELONGS_TO' },
          });
          if (!hasBelong) {
            await prisma.knowledgeEdge.create({
              data: { fromId: node.id, toId: cat.id, relation: 'BELONGS_TO', weight: 1 },
            });
          }
        }
      }
    }
  }

  res.json({ extracted: extractedCount, totalPosts: posts.length, message: `成功从 ${posts.length} 篇文章中抽取实体` });
}));

async function ensureNode(prisma: PrismaClient, id: string, name: string, type: string, category?: string, articleId?: string, icon?: string) {
  const existing = await prisma.knowledgeNode.findUnique({ where: { id } });
  if (existing) {
    if (existing.weight !== undefined) {
      await prisma.knowledgeNode.update({
        where: { id },
        data: { weight: { increment: 1 } },
      });
    }
    return existing;
  }

  return prisma.knowledgeNode.create({
    data: {
      id,
      name,
      type: type as any,
      category,
      articleId,
      icon,
      weight: 1,
    },
  });
}

interface ExtractedEntity {
  id: string;
  name: string;
  type: string;
  relation: string;
  parentCategory?: string;
}

function extractEntitiesFromText(text: string): ExtractedEntity[] {
  if (!text) return [];
  const entities: ExtractedEntity[] = [];
  const lower = text.toLowerCase();

  const rules: { pattern: RegExp; type: string; relation: string; nameTransform?: (m: RegExpExecArray) => string }[] = [
    { pattern: /人工智能|AI|artificial intelligence/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /机器学习|machine learning|ML/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /深度学习|deep learning/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /大模型|LLM|large language model/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /知识图谱|knowledge graph/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /自然语言处理|NLP/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /计算机视觉|computer vision|CV/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /神经网络|neural network/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /Transformer|GPT|BERT/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /OpenAI|Google|Microsoft|Meta|Apple|Amazon/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /Python|JavaScript|TypeScript|Rust|Go|Java|C\+\+/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /React|Vue|Angular|Next\.js|Nuxt/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /Node\.js|Express|Django|Flask|FastAPI/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /Docker|Kubernetes|K8s|CI\/CD/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /自动驾驶|autonomous driving|self-driving/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /新能源汽车|电动汽车|electric vehicle|EV/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /特斯拉|Tesla|比亚迪|BYD|蔚来|NIO|小鹏|Xpeng/gi, type: 'ENTITY', relation: 'HAS_TAG' },
    { pattern: /可再生能源|renewable energy/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /太阳能|光伏|solar|photovoltaic/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /储能|energy storage|battery/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /区块链|blockchain|Web3/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /云计算|cloud computing|AWS|Azure/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
    { pattern: /物联网|IoT|Internet of Things/gi, type: 'CONCEPT', relation: 'HAS_TAG' },
  ];

  const seen = new Set<string>();
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      const name = rule.nameTransform ? rule.nameTransform(match) : match[0];
      const id = `kg-${name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const parentCategory = inferCategory(name);
      entities.push({ id, name, type: rule.type, relation: rule.relation, parentCategory });
    }
  }

  const tagRegex = /#(\w+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    const name = tagMatch[1];
    const id = `kg-tag-${name.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entities.push({ id, name, type: 'TAG', relation: 'HAS_TAG' });
  }

  return entities;
}

function inferCategory(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (/AI|人工智能|机器学习|深度学习|大模型|LLM|GPT|神经网络|Transformer|NLP|计算机视觉|Python|JavaScript|React|Vue|Node\.js|Docker|Kubernetes|区块链|Web3|云计算|AWS|Azure|IoT|物联网/i.test(lower)) {
    return '科技产品';
  }
  if (/自动驾驶|新能源汽车|电动汽车|EV|特斯拉|Tesla|比亚迪|BYD|蔚来|NIO|小鹏|Xpeng|汽车/i.test(lower)) {
    return '汽车';
  }
  if (/可再生能源|太阳能|光伏|储能|能源/i.test(lower)) {
    return '能源';
  }
  return undefined;
}

router.post('/seed', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);

  const existing = await prisma.knowledgeNode.count();
  if (existing > 0) {
    res.json({ message: '知识图谱已有数据，跳过种子数据', existingCount: existing });
    return;
  }

  const categories = [
    { id: 'kg-cat-tech', name: '科技产品', description: '人工智能、编程开发、前沿技术', icon: '💻', weight: 100 },
    { id: 'kg-cat-car', name: '汽车', description: '新能源汽车、自动驾驶、出行技术', icon: '🚗', weight: 80 },
    { id: 'kg-cat-energy', name: '能源', description: '可再生能源、储能技术、碳中和', icon: '⚡', weight: 60 },
    { id: 'kg-cat-life', name: '生活', description: '效率工具、学习方法、生活方式', icon: '🌱', weight: 50 },
  ];

  for (const cat of categories) {
    await prisma.knowledgeNode.create({
      data: { id: cat.id, name: cat.name, description: cat.description, icon: cat.icon, type: 'CATEGORY', isCategory: true, weight: cat.weight },
    });
  }

  const nodes = [
    { id: 'kg-ai', name: '人工智能', type: 'CONCEPT', category: '科技产品', icon: '🤖', weight: 95 },
    { id: 'kg-ml', name: '机器学习', type: 'CONCEPT', category: '科技产品', icon: '🧠', weight: 85 },
    { id: 'kg-dl', name: '深度学习', type: 'CONCEPT', category: '科技产品', icon: '🔮', weight: 80 },
    { id: 'kg-llm', name: '大模型', type: 'CONCEPT', category: '科技产品', icon: '📚', weight: 90 },
    { id: 'kg-kg', name: '知识图谱', type: 'CONCEPT', category: '科技产品', icon: '🕸️', weight: 75 },
    { id: 'kg-nlp', name: '自然语言处理', type: 'CONCEPT', category: '科技产品', icon: '💬', weight: 70 },
    { id: 'kg-python', name: 'Python', type: 'ENTITY', category: '科技产品', icon: '🐍', weight: 88 },
    { id: 'kg-js', name: 'JavaScript', type: 'ENTITY', category: '科技产品', icon: '📜', weight: 82 },
    { id: 'kg-react', name: 'React', type: 'ENTITY', category: '科技产品', icon: '⚛️', weight: 78 },
    { id: 'kg-docker', name: 'Docker', type: 'ENTITY', category: '科技产品', icon: '🐳', weight: 72 },
    { id: 'kg-openai', name: 'OpenAI', type: 'ENTITY', category: '科技产品', icon: '🏢', weight: 85 },
    { id: 'kg-gpt', name: 'GPT-4', type: 'ENTITY', category: '科技产品', icon: '✨', weight: 92 },
    { id: 'kg-autopilot', name: '自动驾驶', type: 'CONCEPT', category: '汽车', icon: '🛣️', weight: 85 },
    { id: 'kg-ev', name: '新能源汽车', type: 'CONCEPT', category: '汽车', icon: '🔋', weight: 90 },
    { id: 'kg-tesla', name: '特斯拉', type: 'ENTITY', category: '汽车', icon: '🚘', weight: 88 },
    { id: 'kg-byd', name: '比亚迪', type: 'ENTITY', category: '汽车', icon: '🚙', weight: 80 },
    { id: 'kg-solar', name: '太阳能', type: 'CONCEPT', category: '能源', icon: '☀️', weight: 78 },
    { id: 'kg-storage', name: '储能技术', type: 'CONCEPT', category: '能源', icon: '🔌', weight: 75 },
    { id: 'kg-renewable', name: '可再生能源', type: 'CONCEPT', category: '能源', icon: '🌍', weight: 82 },
    { id: 'kg-blockchain', name: '区块链', type: 'CONCEPT', category: '科技产品', icon: '⛓️', weight: 65 },
    { id: 'kg-web3', name: 'Web3', type: 'CONCEPT', category: '科技产品', icon: '🌐', weight: 60 },
  ];

  for (const node of nodes) {
    await prisma.knowledgeNode.create({
      data: { id: node.id, name: node.name, type: node.type as any, category: node.category, icon: node.icon, weight: node.weight },
    });
  }

  const edges = [
    { from: 'kg-ai', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-ml', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-ml', to: 'kg-ai', relation: 'INSTANCE_OF' },
    { from: 'kg-dl', to: 'kg-ml', relation: 'INSTANCE_OF' },
    { from: 'kg-llm', to: 'kg-ai', relation: 'INSTANCE_OF' },
    { from: 'kg-llm', to: 'kg-dl', relation: 'DEPENDS_ON' },
    { from: 'kg-nlp', to: 'kg-ai', relation: 'INSTANCE_OF' },
    { from: 'kg-nlp', to: 'kg-llm', relation: 'DEPENDS_ON' },
    { from: 'kg-kg', to: 'kg-ai', relation: 'INSTANCE_OF' },
    { from: 'kg-gpt', to: 'kg-openai', relation: 'BELONGS_TO' },
    { from: 'kg-gpt', to: 'kg-llm', relation: 'INSTANCE_OF' },
    { from: 'kg-openai', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-python', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-js', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-react', to: 'kg-js', relation: 'DEPENDS_ON' },
    { from: 'kg-docker', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-autopilot', to: 'kg-cat-car', relation: 'BELONGS_TO' },
    { from: 'kg-autopilot', to: 'kg-ai', relation: 'DEPENDS_ON' },
    { from: 'kg-ev', to: 'kg-cat-car', relation: 'BELONGS_TO' },
    { from: 'kg-tesla', to: 'kg-cat-car', relation: 'BELONGS_TO' },
    { from: 'kg-tesla', to: 'kg-autopilot', relation: 'RELATED_TO' },
    { from: 'kg-tesla', to: 'kg-ev', relation: 'INSTANCE_OF' },
    { from: 'kg-byd', to: 'kg-cat-car', relation: 'BELONGS_TO' },
    { from: 'kg-byd', to: 'kg-ev', relation: 'INSTANCE_OF' },
    { from: 'kg-solar', to: 'kg-cat-energy', relation: 'BELONGS_TO' },
    { from: 'kg-solar', to: 'kg-renewable', relation: 'INSTANCE_OF' },
    { from: 'kg-storage', to: 'kg-cat-energy', relation: 'BELONGS_TO' },
    { from: 'kg-storage', to: 'kg-ev', relation: 'RELATED_TO' },
    { from: 'kg-renewable', to: 'kg-cat-energy', relation: 'BELONGS_TO' },
    { from: 'kg-blockchain', to: 'kg-cat-tech', relation: 'BELONGS_TO' },
    { from: 'kg-web3', to: 'kg-blockchain', relation: 'INSTANCE_OF' },
  ];

  for (const edge of edges) {
    await prisma.knowledgeEdge.create({
      data: {
        fromId: edge.from,
        toId: edge.to,
        relation: edge.relation as any,
        weight: 1.0,
      },
    });
  }

  res.json({ message: '知识图谱种子数据已初始化', categories: categories.length, nodes: nodes.length, edges: edges.length });
}));

router.post('/sync-blog', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);

  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  let synced = 0;
  for (const post of posts) {
    const existing = await prisma.knowledgeNode.findUnique({ where: { id: `post-${post.id}` } });
    if (existing) continue;

    const node = await prisma.knowledgeNode.create({
      data: {
        id: `post-${post.id}`,
        name: post.title,
        description: post.excerpt,
        type: 'ARTICLE',
        category: post.category,
        blogPostId: post.id,
        icon: '📝',
        weight: Math.max(1, Math.min(100, post.views + post.likes * 2)),
      },
    });

    if (post.category) {
      const catNodes = await prisma.knowledgeNode.findMany({
        where: {
          OR: [
            { name: post.category },
            { category: post.category, isCategory: true },
          ],
        },
      });
      for (const cat of catNodes) {
        await prisma.knowledgeEdge.create({
          data: { fromId: node.id, toId: cat.id, relation: 'BELONGS_TO', weight: 0.8 },
        });
      }
    }

    if (post.tags) {
      try {
        const parsedTags: string[] = JSON.parse(post.tags);
        for (const tag of parsedTags) {
          if (!tag.trim()) continue;
          const tagId = `tag-${tag.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')}`;
          const tagNode = await ensureNode(prisma, tagId, tag.trim(), 'TAG', post.category, undefined, '#️⃣');
          const edgeExists = await prisma.knowledgeEdge.findFirst({
            where: { fromId: node.id, toId: tagNode.id, relation: 'HAS_TAG' },
          });
          if (!edgeExists) {
            await prisma.knowledgeEdge.create({
              data: { fromId: node.id, toId: tagNode.id, relation: 'HAS_TAG', weight: 0.5 },
            });
          }
        }
      } catch {}
    }

    synced++;
  }

  res.json({ message: `已同步 ${synced} 篇文章到知识图谱` });
}));

export default router;