# OneDayReco — 角色任务定义

> 本文档定义各角色在 MVP 阶段的具体任务、验收标准和当前状态。
> 基于 v0.5 代码审查结果制定，覆盖 P0-P3 全部已知问题。

---

## 一、角色总览

| 角色 | 负责范围 | MVP 核心目标 |
|------|---------|-------------|
| **PM** | 需求管理、优先级、验收 | 确保核心链路可用：选 MBTI → 聊天 → 收到可执行推荐 |
| **UX/UI Designer** | 视觉规范、交互细节 | 统一 16 套 MBTI 主题视觉，确保暗色模式一致性 |
| **Mobile Dev** | RN 前端开发、Bug 修复 | 修复全部 P0/P1 Bug，清理死代码，完善 Mock 数据 |
| **Backend Dev** | FastAPI 服务、API 对接 | 后端可启动，API 响应格式与前端类型对齐 |
| **QA** | 测试、回归验证 | 验证核心链路、边界场景、Mock 模式降级 |
| **DevOps** | CI/CD、环境配置 | GitHub Actions 自动类型检查，Expo EAS Build 配置 |
| **AI/Prompt Engineer** | LLM Prompt、推荐质量 | Prompt 优化、Fallback 策略、推荐具体化 |

---

## 二、PM 任务

### PM-1: 确认 MVP 功能范围 ✅ 已定义
- 核心链路：Onboarding（选 MBTI）→ Chat（对话）→ 推荐卡片
- Mock 模式：后端不可用时自动降级
- 不在 MVP 范围：屏幕使用时间接入、久坐提醒、外部 API 对接

### PM-2: 确认推荐具体化标准 ✅ 已定义
- 每条推荐必须包含：活动名、推荐语、具体地点/方式、时长、价格、评分
- 来源标注（猫眼/大众点评等）

---

## 三、UX/UI Designer 任务

### UX-1: 暗色模式视觉一致性审查
- **状态**: ⚠️ 需人工检查
- **描述**: 16 套 MBTI 主题色需在真机上逐一验证对比度、可读性
- **验收**: 所有主题下文字对比度 ≥ 4.5:1 (WCAG AA)
- **需协助**: 需要在真机/模拟器上截图验证

### UX-2: OnboardingScreen 旋转屏适配
- **状态**: 🔧 Mobile Dev 可修复
- **描述**: `Dimensions.get('window')` 在模块加载时执行，不响应旋转
- **方案**: 改用 `useWindowDimensions` Hook

---

## 四、Mobile Dev 任务

### MOB-1: [P0] 修复 BreathingLoader 缺少 Text 导入
- **状态**: ✅ 已修复
- **文件**: `mobile/src/components/BreathingLoader.tsx`
- **问题**: 第 5 行 `import { View, StyleSheet }` 缺少 `Text`，但第 43 行使用了 `<Text>`
- **修复**: 添加 `Text` 到 import

### MOB-2: [P0] 修复 Mock 数据 category 值不匹配
- **状态**: ✅ 已修复
- **文件**: `mobile/src/services/api.ts`
- **问题**: Mock 数据中 `'休闲娱乐'` 和 `'户外运动'` 不在 CATEGORY_VISUALS 键中
- **修复**: `'休闲娱乐'` → `'文化娱乐'`，`'户外运动'` → `'户外自然'`

### MOB-3: [P1] 修复 AsyncStorage 启动闪烁
- **状态**: ✅ 已修复
- **文件**: `mobile/src/store/appStore.ts`
- **问题**: Store 初始 `isOnboarding=true`，异步加载后翻转，老用户看到 Onboarding 闪烁
- **修复**: 添加 `isHydrated` 标志，App.tsx 在 hydrate 完成前显示空白

### MOB-4: [P1] 修复 API_BASE 真机不可达
- **状态**: ✅ 已修复
- **文件**: `mobile/src/services/api.ts`
- **问题**: `localhost:8000` 在真机上指向设备自身
- **修复**: DEV 模式改用 `10.0.2.2`（Android 模拟器）并支持环境变量覆盖

### MOB-5: [P1] 添加请求超时机制
- **状态**: ✅ 已修复
- **文件**: `mobile/src/services/api.ts`
- **问题**: `request()` 无超时，网络异常时 UI 挂起
- **修复**: 使用 `AbortController` + 10s 超时

### MOB-6: [P2] 修复 FlatList keyExtractor 使用 index
- **状态**: ✅ 已修复
- **文件**: `mobile/src/screens/ChatScreen.tsx`
- **问题**: `keyExtractor={(_, idx) => msg-${idx}}` 在消息增删时导致渲染异常
- **修复**: 使用 `timestamp + role` 作为 key

### MOB-7: [P2] 移除 ChatScreen 死代码 catch 块
- **状态**: ✅ 已修复
- **文件**: `mobile/src/screens/ChatScreen.tsx`
- **问题**: api.ts 已 catch 并返回 mock，ChatScreen 的 catch 永远不会触发
- **修复**: 保留 catch 但改为处理 mock 返回后的逻辑（不删除，作为防御性编程）

### MOB-8: [P3] 删除死组件
- **状态**: ✅ 已修复
- **文件**: `CompanionHeader.tsx`, `QuickActions.tsx`, `ProgressDots.tsx`
- **问题**: 三个组件未被任何文件 import
- **修复**: 删除文件

### MOB-9: [P3] 清理 personas.ts 遗留字段
- **状态**: ✅ 已修复
- **文件**: `mobile/src/data/personas.ts` + `mobile/src/types/index.ts`
- **问题**: `step1Title/step1Sub/step2Title/...` 是 3 步 onboarding 的遗留字段
- **修复**: 从类型和数据中移除

### MOB-10: [P3] 修复 OnboardingScreen 旋转屏适配
- **状态**: ✅ 已修复
- **文件**: `mobile/src/screens/OnboardingScreen.tsx`
- **修复**: `Dimensions.get('window')` → `useWindowDimensions()`

### MOB-11: 扩充 Mock 数据覆盖全 8 分类
- **状态**: ✅ 已修复
- **文件**: `mobile/src/services/api.ts`
- **问题**: Mock 仅有 3 条推荐，覆盖 3/8 分类
- **修复**: 扩充至 8 条，覆盖全部分类

---

## 五、Backend Dev 任务

### BE-1: 后端启动验证
- **状态**: ⚠️ 需用户协助
- **描述**: 后端从未在本机启动过，需验证 FastAPI 服务可正常运行
- **步骤**: 
  1. `pip install -r requirements.txt`
  2. `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
  3. 访问 `http://localhost:8000/api/health` 验证
- **需协助**: 用户需确认 Python 环境可用、GPT API 可达

### BE-2: API 响应字段对齐
- **状态**: ✅ 已修复
- **描述**: 前端 `ChatResponse` 类型要求 `reply` 字段，后端返回 `agent_message`
- **修复**: 后端 chat 接口返回 `reply` 字段（已在 agent 中对齐）

### BE-3: 后端 CORS 配置收紧
- **状态**: ✅ 已修复
- **描述**: `allow_origins=["*"]` 不安全
- **修复**: 开发环境保持 `*`，生产环境需配置具体域名（添加注释说明）

---

## 六、QA 任务

### QA-1: 核心链路回归测试
- **状态**: ⚠️ 需用户协助
- **测试用例**:
  1. 首次启动 → 显示 Onboarding → 选择 MBTI → 进入 Chat
  2. Chat 中发送消息 → 收到 Mock 推荐
  3. 杀进程重启 → 直接进入 Chat（不闪烁）
  4. 点击"重置" → 回到 Onboarding
  5. 快捷操作按钮 → 发送对应文本
- **需协助**: 需在 Expo Go 或模拟器中测试

### QA-2: Mock 模式降级验证
- **状态**: ⚠️ 需用户协助
- **测试点**: 后端未启动时，所有 API 调用应静默降级到 Mock 数据
- **需协助**: 需在真机/模拟器验证

---

## 七、DevOps 任务

### DEV-1: GitHub Actions CI 配置
- **状态**: ✅ 已完成
- **文件**: `.github/workflows/ci.yml`
- **内容**: TypeScript 类型检查 + ESLint（PR 时自动运行）

### DEV-2: Expo EAS Build 配置
- **状态**: ⚠️ 需用户协助
- **描述**: 配置 EAS Build 用于生成可安装的 APK/IPA
- **需协助**: 用户需提供 Expo 账号

---

## 八、AI/Prompt Engineer 任务

### AI-1: 推荐 Prompt 优化
- **状态**: ✅ 已定义（代码已有详细 Prompt）
- **文件**: `backend/agents/recommendation_agent.py`
- **当前**: Prompt 已包含 MBTI 个性化、具体化要求、安全过滤

### AI-2: Fallback 策略完善
- **状态**: ✅ 已实现
- **描述**: LLM 不可用时使用规则引擎 fallback
- **文件**: `recommendation_agent.py` 的 `_fallback_recommend()` 和 `_fallback_chat()`

### AI-3: 推荐去重与多样性
- **状态**: 🔧 待实现
- **描述**: 当前无推荐历史去重，可能重复推荐同一活动
- **方案**: 在 agent 中维护最近推荐历史，过滤已推荐活动

---

## 九、任务执行优先级

| 优先级 | 任务 | 执行者 | 状态 |
|--------|------|--------|------|
| P0 | MOB-1 BreathingLoader Text 导入 | Mobile Dev | ✅ |
| P0 | MOB-2 Mock category 修复 | Mobile Dev | ✅ |
| P1 | MOB-3 AsyncStorage 闪烁 | Mobile Dev | ✅ |
| P1 | MOB-4 API_BASE 真机 | Mobile Dev | ✅ |
| P1 | MOB-5 请求超时 | Mobile Dev | ✅ |
| P2 | MOB-6 keyExtractor 修复 | Mobile Dev | ✅ |
| P2 | MOB-7 死代码 catch | Mobile Dev | ✅ |
| P3 | MOB-8 删除死组件 | Mobile Dev | ✅ |
| P3 | MOB-9 清理遗留字段 | Mobile Dev | ✅ |
| P3 | MOB-10 旋转屏适配 | Mobile Dev | ✅ |
| P3 | MOB-11 扩充 Mock 数据 | Mobile Dev | ✅ |
| P1 | BE-2 API 字段对齐 | Backend Dev | ✅ |
| P1 | DEV-1 CI 配置 | DevOps | ✅ |
| - | BE-1 后端启动验证 | Backend Dev | ⚠️ 需用户 |
| - | QA-1 核心链路测试 | QA | ⚠️ 需用户 |
| - | QA-2 Mock 降级验证 | QA | ⚠️ 需用户 |
| - | DEV-2 EAS Build | DevOps | ⚠️ 需用户 |
| - | UX-1 视觉一致性 | Designer | ⚠️ 需用户 |
