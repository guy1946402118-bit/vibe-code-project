---
name: metagpt-architecture
description: MetaGPT 多角色协作架构 — 基于 Role/Environment/Team 三层模型的多Agent系统设计，含消息总线、角色订阅、三种反应模式。触发词：多角色协作、Agent架构、Message Bus、Team编排、multi-agent collaboration architecture。
---

# MetaGPT 多角色协作架构

## 核心哲学

```
Code = SOP(Team)  →  软件工程的分工协作流程可以用多Agent系统模拟
```

一句话需求 → 组建虚拟软件公司 → 各角色按SOP协作 → 产出完整代码。

## 架构三层模型

```
┌─────────────────────────────────────────┐
│                  Team                    │  ← 组织层：投资、雇佣、运行
│  ┌─────────────────────────────────────┐│
│  │           Environment               ││  ← 通信层：消息发布/订阅/路由
│  │  ┌──────┐ ┌──────┐ ┌──────┐        ││
│  │  │ Role │ │ Role │ │ Role │  ...   ││  ← 执行层：观察→思考→行动循环
│  │  │  ⚙️   │ │  ⚙️   │ │  ⚙️   │        ││
│  │  └──────┘ └──────┘ └──────┘        ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 1. Role — 角色（Agent）

每个Role是独立的Agent，核心属性：

| 属性 | 含义 | 示例 |
|------|------|------|
| `name` | 角色名 | "Alice" |
| `profile` | 角色描述 | "Product Manager" |
| `goal` | 目标 | "Create a PRD..." |
| `constraints` | 约束 | "use same language as user" |
| `actions` | 可执行动作列表 | `[WritePRD, PrepareDocuments]` |
| `rc.watch` | 订阅的消息类型 | `{UserRequirement}` |
| `rc.react_mode` | 反应模式 | REACT / BY_ORDER / PLAN_AND_ACT |

**核心循环：observe → react(think→act) → publish**

```python
async def run(self):
    if not await self._observe():    # 1. 观察新消息
        return                        #    无新消息则挂起
    rsp = await self.react()         # 2. 思考+行动
    self.publish_message(rsp)        # 3. 发布结果
    return rsp
```

### 2. Environment — 环境（消息总线）

```python
class Environment:
    roles: dict[str, Role]           # 所有角色
    member_addrs: Dict[Role, Set]    # 角色→地址映射
    history: Memory                   # 全局消息历史

    def publish_message(self, message: Message):
        # 根据 send_to 和 cause_by 路由消息到目标角色
        for role, addrs in self.member_addrs.items():
            if is_send_to(message, addrs):
                role.put_message(message)

    async def run(self):
        # 并发执行所有非空闲角色
        futures = [role.run() for role in self.roles.values()
                   if not role.is_idle]
        await asyncio.gather(*futures)
```

消息路由依赖两个字段：
- `send_to`: 目标角色名（或 `"<all>"` 广播）
- `cause_by`: 消息来源动作类型 → 配合 `rc.watch` 订阅

### 3. Team — 团队编排

```python
class Team:
    env: Environment
    investment: float = 10.0
    idea: str = ""

    def hire(self, roles: list[Role]):
        self.env.add_roles(roles)

    def invest(self, investment: float):
        self.cost_manager.max_budget = investment

    def run_project(self, idea):
        self.env.publish_message(Message(content=idea))

    async def run(self, n_round=5):
        while n_round > 0 and not self.env.is_idle:
            n_round -= 1
            await self.env.run()
        self.env.archive()
```

## 三种反应模式（React Mode）

### REACT（标准模式）
LLM 动态选择下一步动作，循环直到终止：
```
think → act → think → act → ... → return -1（终止）
```

### BY_ORDER（固定顺序模式）
按 actions 数组顺序依次执行，适合固定SOP流程：
```
act(WritePRD) → act(WriteDesign) → act(WriteCode) → ...
```

### PLAN_AND_ACT（规划执行模式）
先制定计划，再按计划逐步执行：
```
plan(生成任务列表) → act(Task1) → act(Task2) → ...
```

## 消息系统设计

```python
class Message(BaseModel):
    content: str              # 消息文本内容
    instruct_content: BaseModel  # 结构化数据（如 PRD、Design JSON）
    role: str                 # 发送者角色
    cause_by: str             # 触发消息的Action类型 → 用于订阅过滤
    sent_from: str            # 发送者地址
    send_to: set[str]         # 接收者地址集合
    id: str                   # 唯一消息ID
```

**订阅机制**：Role 通过 `rc.watch` 订阅特定 Action 类型产生的消息：
```python
# PM 关注 UserRequirement 和 PrepareDocuments
self._watch({UserRequirement, PrepareDocuments})

# 在 _observe 中过滤：
self.rc.news = [n for n in news if n.cause_by in self.rc.watch]
```

## 关键设计模式

| 模式 | 实现 | 用途 |
|------|------|------|
| **观察者模式** | `rc.watch` + `_observe()` | 角色按需订阅消息 |
| **发布订阅** | `Environment.publish_message` | 解耦角色间通信 |
| **状态机** | `rc.state` + `_think()` | 管理动作执行序列 |
| **策略模式** | `react_mode` (REACT/BY_ORDER/PLAN_AND_ACT) | 切换行为策略 |
| **序列化** | `serialize()/deserialize()` | 状态持久化和恢复 |

## 对我们项目的启示

1. **三层解耦**：将组织(Team)、通信(Environment)、执行(Role)彻底分离，各自独立演化
2. **订阅而非轮询**：Role 通过 watch 订阅感兴趣的消息类型，避免处理无关消息
3. **结构化消息**：Message 同时包含文本和结构化数据(`instruct_content`)，方便下游解析
4. **多模式切换**：不同场景用不同 react_mode，SOP 流程用 BY_ORDER，探索性任务用 REACT
5. **状态可恢复**：完整的序列化机制支持中断后从断点恢复