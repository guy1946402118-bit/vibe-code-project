---
name: metagpt-sop
description: MetaGPT 软件公司SOP（标准作业流程）— 从一句话需求到完整代码的标准化多Agent协作流程，含PRD→设计→任务→编码→测试的完整流水线。触发词：SOP、软件公司流程、PRD到代码、开发流水线、TeamLeader编排。
---

# MetaGPT 软件公司 SOP 流程

## 核心概念

MetaGPT 模拟一家软件公司，不同 AI Agent 扮演不同职位，按照标准作业流程（SOP）协作，从一句话需求产出可运行的代码。

## 软件公司组织架构

```
                    ┌─────────────┐
                    │  TeamLeader │  ← 协调者：接收需求，分发给各角色
                    └──────┬──────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ProductManager│ │  Architect   │ │  DataAnalyst │
   │   (Alice)    │ │    (Bob)     │ │   (David)    │
   └──────┬───────┘ └──────┬───────┘ └──────────────┘
          │                │
          ▼                ▼
   ┌──────────────┐ ┌──────────────┐
   │   Engineer   │ │  QaEngineer  │
   │    (Alex)    │ │   (Edward)   │
   └──────────────┘ └──────────────┘
```

## 标准 SOP 流水线

```
User Input: "Create a 2048 game"
         │
         ▼
[Step 1] TeamLeader.publish_team_message()
         分发需求给 ProductManager
         │
         ▼
[Step 2] ProductManager.run()
         _observe → react → publish
         Actions:
         1. PrepareDocuments  → 初始化项目文档
         2. WritePRD          → 输出 PRD (JSON)
         产出：prd.md 或结构化 PRD JSON
         │
         ▼
[Step 3] Architect.run()
         _observe → react → publish
         (watch: WritePRD)
         Action:
         1. WriteDesign → 系统设计
         产出：system_design.md + 接口定义
         │
         ▼
[Step 4] TeamLeader.run() 第二轮
         收集 PRD + Design → 分配任务
         publish_team_message → Engineer
         │
         ▼
[Step 5] Engineer.run()
         watch: WriteTasks, WriteCode, SummarizeCode...
         Actions:
         1. WriteCodePlanAndChange → 增量变更计划
         2. WriteCode → 逐文件编写代码
         3. WriteCodeReview → 代码审查（可选）
         4. SummarizeCode → 代码总结
         │
         ▼ (可选)
[Step 6] QaEngineer.run()
         watch: SummarizeCode
         Actions:
         1. WriteTest → 编写测试
         2. RunCode → 运行并验证
         │
         ▼
[Step 7] DataAnalyst.run()
         分析代码统计和指标
         产出：分析报告
```

## 消息流转示例

```
Round 1:
  TeamLeader → Environment.publish_message("Create a 2048 game")
  → ProductManager 观察到 UserRequirement
  → PM._react(): PrepareDocuments → WritePRD
  → PM.publish_message(PRD_Message)

Round 2:
  Architect 观察到 WritePRD (因为 watch={WritePRD})
  → Architect._react(): WriteDesign
  → Architect.publish_message(Design_Message)

Round 3:
  TeamLeader 收集所有产出
  → TeamLeader.publish_team_message(tasks, send_to="Alex")
  → Engineer 观察 → 开始编码

Round 4~N:
  Engineer: WriteCode → SummarizeCode → ...
  (可选) QaEngineer: WriteTest → RunCode

Round N+1:
  DataAnalyst 分析 → 输出报告
  所有角色 idle → 流程结束
```

## 核心数据结构：文档流转

### Message 的多态内容

```python
# PRD 阶段：WritePRD 产出
AIMessage(
    content="## Product Requirement Document\n...",
    instruct_content=PRD_JSON,        # 结构化 PRD
    cause_by=WritePRD,
    sent_from="Alice",
    send_to={"Bob"}                   # 发给 Archiect
)

# 设计阶段：WriteDesign 产出
AIMessage(
    content="## System Design\n...",
    instruct_content=Design_JSON,     # 结构化设计
    cause_by=WriteDesign,
    sent_from="Bob",
    send_to={"Mike"}                  # 发给 TeamLeader
)

# 编码阶段：WriteCode 产出
AIMessage(
    content="",
    instruct_content=CodingContext(
        filename="game.py",
        design_doc=design_doc,
        task_doc=task_doc,
        code_doc=code_doc
    ),
    cause_by=WriteCode,
    sent_from="Alex",
    send_to=MESSAGE_ROUTE_TO_SELF    # 发给自己的下一轮 SummarizeCode
)
```

## 资金管理（模拟商业逻辑）

```python
class Team:
    investment: float = 10.0          # 总投资金额

    def invest(self, investment):
        self.cost_manager.max_budget = investment

    def _check_balance(self):
        # LLM 每次调用都有成本
        if total_cost >= max_budget:
            raise NoMoneyException("Insufficient funds!")

    async def run(self, n_round=5):
        while n_round > 0:
            n_round -= 1
            self._check_balance()     # 每轮检查预算
            await self.env.run()
```

每个 LLM 调用都会累加成本，超过预算自动终止 —— 这模拟了真实公司必须在预算内交付。

## 增量开发模式（Inc）

MetaGPT 支持对已有项目进行增量修改：

```python
# 启动时指定已有项目路径
company.run(idea="Add dark mode", project_path="./existing-project", inc=True)

# Engineer 会生成：
#   WriteCodePlanAndChange → 分析存量代码，规划修改
#   WriteCode → 只修改受影响文件
#   SummarizeCode → 总结修改影响
```

## SOP 配置示例（经典调用）

```python
from metagpt.roles import TeamLeader, ProductManager, Architect, Engineer2, DataAnalyst
from metagpt.team import Team

company = Team()
company.hire([
    TeamLeader(),
    ProductManager(),
    Architect(),
    Engineer2(),
    DataAnalyst(),
])

company.invest(5.0)                                    # 投资 $5
company.run_project(idea="Create a REST API server")    # 开始项目
asyncio.run(company.run(n_round=10))                    # 最多10轮
```

## 对我们项目的启示

1. **SOP 驱动**：为软件开发的不同阶段定义明确的 Action 序列，而非让 Agent 自由探索
2. **结构化数据流转**：Message 的 `instruct_content` 不仅是文本，更是结构化 JSON，下游可直接解析
3. **增量优先**：`inc` 模式支持在已有代码基础上增量开发，避免每次都从头来
4. **成本意识**：模拟预算约束，迫使设计更精简的流程
5. **可恢复中断**：`serialize()`/`deserialize()` 支持流程中断后从断点恢复 —— 对长时间运行任务至关重要
6. **多角色并行**：`asyncio.gather(*futures)` 让无依赖的角色并行执行