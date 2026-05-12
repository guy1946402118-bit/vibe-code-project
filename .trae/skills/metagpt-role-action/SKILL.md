---
name: metagpt-role-action
description: MetaGPT 角色(Role)和动作(Action)系统设计 — Role基类的observe→think→act循环，Action的可组合性与上下文注入，Prompt自动生成机制。触发词：Role设计、Action系统、Agent设计模式、prompt工程、role context。
---

# MetaGPT 角色与动作系统设计

## Role 系统

### Role 基类核心属性

```python
class Role(BaseRole, SerializationMixin, ContextMixin, BaseModel):
    name: str = ""              # 角色名
    profile: str = ""           # 角色简介
    goal: str = ""              # 目标
    constraints: str = ""       # 约束条件
    desc: str = ""              # 自定义描述（覆盖默认 prompt prefix）
    is_human: bool = False      # 是否为人类角色
    enable_memory: bool = True  # 是否启用记忆（无状态角色可关闭省内存）
    role_id: str = ""           # 唯一ID
    actions: list[Action]       # 可执行动作列表
    rc: RoleContext             # 运行时上下文
    planner: Planner            # 规划器
```

### 角色上下文（RoleContext）

```python
class RoleContext(BaseModel):
    env: Environment            # 所属环境
    msg_buffer: MessageQueue    # 异步消息缓冲
    memory: Memory              # 持久记忆
    working_memory: Memory      # 工作记忆
    state: int = -1             # 当前状态（-1=初始/终止）
    todo: Action                # 当前待处理动作
    watch: set[str]             # 订阅的动作类型
    react_mode: RoleReactMode   # 反应模式
    max_react_loop: int = 1     # 最大反应循环数
```

### Prompt 自动生成

Role 的 system prompt 由以下公式自动生成：

```python
def _get_prefix(self):
    # 1. 核心描述
    # "You are a {profile}, named {name}, your goal is {goal}. "
    prefix = PREFIX_TEMPLATE.format(profile, name, goal)

    # 2. 约束条件
    # "the constraint is {constraints}. "
    if self.constraints:
        prefix += CONSTRAINT_TEMPLATE.format(constraints)

    # 3. 环境上下文
    # "You are in {env_desc} with roles({other_roles})."
    if self.env and self.env.desc:
        other_roles = [r for r in self.env.role_names() if r != self.name]
        prefix += f"You are in {self.env.desc} with roles({other_roles})."
    return prefix
```

### 角色生命周期方法

| 方法 | 作用 | 是否可覆写 |
|------|------|-----------|
| `_observe()` | 从 msg_buffer 拉取新消息，按 watch 过滤 | ✅ |
| `_think()` | 决定下一步执行哪个 Action | ✅ |
| `_act()` | 执行当前 todo Action | ✅ |
| `react()` | 组合 think+act 的完整循环 | ✅ |
| `run()` | 入口：observe → react → publish | ❌ 不建议 |

### 已有角色（20+）

| 角色 | 职责 | 输入 | 产出 |
|------|------|------|------|
| **TeamLeader** | 团队管理、任务分发 | 用户需求 | 分配给各角色的子任务 |
| **ProductManager** | 产品需求分析 | 用户需求 | PRD |
| **Architect** | 系统架构设计 | PRD | System Design |
| **Engineer** | 代码开发 | 设计文档+任务 | 代码文件 |
| **QaEngineer** | 质量保证 | 代码 | 测试用例 |
| **DataAnalyst** | 数据分析 | 代码+数据 | 分析报告 |
| **Researcher** | 技术研究 | 查询 | 研究报告 |
| **Searcher** | 信息搜索 | 关键词 | 搜索结果 |
| **Sales** | 销售代表 | 产品信息 | 销售文案 |
| **Teacher** | 教学 | 主题 | 教学材料 |
| **CustomerService** | 客户服务 | 用户问题 | 回答 |
| **Assistant** | 通用助手 | 任意任务 | 任务结果 |

## Action 系统

### Action 基类

```python
class Action(SerializationMixin, ContextMixin, BaseModel):
    name: str = ""                          # Action 名称（默认用类名）
    i_context: Union[CodingContext, ...]    # 输入上下文
    prefix: str = ""                        # system prompt 前缀
    desc: str = ""                          # 描述（给 Skill Manager）
    node: ActionNode                        # 可选：结构化输出模板
    llm_name_or_type: Optional[str]         # 独立 LLM 配置
```

### Action 创建方式

**方式一：简单继承**
```python
class WritePRD(Action):
    PROMPT_TEMPLATE: str = """
    Write a PRD based on: {requirement}
    Output format: JSON with keys [title, features, ...]
    """

    async def run(self, context: str):
        prompt = self.PROMPT_TEMPLATE.format(requirement=context)
        return await self._aask(prompt)
```

**方式二：ActionNode 驱动（结构化输出）**
```python
# 通过 instruction + ActionNode 实现结构化输出
action = Action(
    name="WriteCode",
    instruction="""
    Write code based on the design.
    Output:
    ```json
    {
        "filename": "string",
        "code": "string",
        "language": "string"
    }
    ```
    """
)
```

### Action 与 Role 的绑定流程

```
1. Role.set_actions([Action1, Action2, ...])
2. 每个 Action: action.set_context(role.context)
               action.set_llm(role.llm)
               action.set_prefix(role._get_prefix())
3. 生成 states 列表供 _think() 选择
```

### 关键 Actions（40+）

**产品阶段：**
- `UserRequirement` — 接收用户需求
- `WritePRD` — 输出产品需求文档
- `PrepareDocuments` — 准备项目文档环境

**设计阶段：**
- `WriteDesign` — 系统设计
- `WriteTasks` — 任务分解

**开发阶段：**
- `WriteCode` — 编写代码
- `WriteCodeReview` — 代码审查
- `WriteCodePlanAndChange` — 增量变更计划
- `SummarizeCode` — 代码总结

**质量阶段：**
- `WriteTest` — 编写测试
- `RunCode` — 运行代码
- `FixBug` — 修复Bug

## Inheritance 层次

```
Role             ← 基础角色（observe→think→act）
  └── RoleZero   ← 灵活角色（动态思考+工具调用）
       ├── TeamLeader    ← 团队领导（任务分发）
       ├── ProductManager← 产品经理
       ├── Architect     ← 架构师
       ├── Engineer2     ← 新工程师
       ├── DataAnalyst   ← 数据分析
       ├── DataInterpreter← 数据解释
       └── SWEAgent      ← 软件工程Agent
  └── Engineer    ← 传统工程师（独立类）
  └── QaEngineer  ← QA工程师
  └── ...          ← 其他简化角色
```

## 设计精髓

1. **Action 是纯函数**：不持有状态，只接收上下文→返回结果。可复用、可组合
2. **Role 是状态机**：内部状态驱动动作选择，暴露清晰的生命周期方法
3. **自动 Prompt 注入**：`_get_prefix()` 自动将角色描述翻译为 LLM system prompt
4. **Context 透传**：`ContextMixin` 确保 Action 可以访问配置、成本管理等全局服务
5. **LLM 分离**：每个 Action 可独立配置 LLM 模型，支持不同任务用不同模型
6. **ActionNode**：通过声明式 instruction 自动构建结构化 JSON 输出解析