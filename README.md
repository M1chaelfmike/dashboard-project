# Supply Chain Management System

**Project Status:** Phase 1 — Initial Framework Completed

## 1. 项目简介

本项目是一个基于前后端分离架构开发的供应链管理系统（Supply Chain Management System）。

项目采用 Next.js 构建前端应用，NestJS 提供后端 API 服务，使用 PostgreSQL 作为关系型数据库，并通过 Prisma ORM 管理数据库模型与数据访问。

当前阶段主要完成项目基础架构、用户认证系统、全局认证状态管理以及 Dashboard 基础界面，为后续供应链业务模块的开发提供基础。

由于具体业务需求尚待确认，Company、Order、User 等模块目前仅建立基础页面和导航入口，尚未实现实际业务逻辑。

## 2. 技术栈

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 | React 全栈前端框架 |
| React 19 | UI 组件与状态管理 |
| TypeScript | 静态类型检查 |
| Material UI 9 | UI 组件库与页面布局 |
| Emotion | CSS-in-JS 样式方案 |

### Backend

| Technology | Purpose |
|---|---|
| NestJS | 后端应用框架 |
| TypeScript | 后端开发语言 |
| Prisma ORM 7 | 数据库访问与模型管理 |
| PostgreSQL | 关系型数据库 |
| Argon2id | 用户密码哈希 |
| JWT | 用户身份认证 |
| Cookie | 认证凭证传输 |

### Development Environment

- Git / GitHub：版本控制与代码托管
- Docker Desktop：数据库容器运行环境
- Navicat：数据库管理与查询
- VS Code / IntelliJ IDEA：开发工具

## 3. 项目目录结构

```text
dashboard-project/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── company/
│   │   │   │   ├── order/
│   │   │   │   ├── user/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   └── providers.tsx
│   │   │
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       ├── dashboard-shell.tsx
│   │   │       ├── sidebar.tsx
│   │   │       └── header.tsx
│   │   │
│   │   ├── features/
│   │   │   └── auth/
│   │   │       ├── auth-provider.tsx
│   │   │       └── use-auth.ts
│   │   │
│   │   └── lib/
│   │       └── api/
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

## 4. 已完成功能

### 4.1 项目基础架构

- 完成 Next.js 前端项目初始化。
- 完成 NestJS 后端项目初始化。
- 建立前后端分离架构。
- 配置 PostgreSQL 数据库。
- 使用 Docker 管理数据库运行环境。
- 集成 Prisma ORM。
- 建立数据库迁移机制。
- 配置 Git 版本控制及 GitHub 代码仓库。

### 4.2 用户认证系统

已完成基于 Email 的用户注册与登录功能。

**Backend API**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Email 注册 |
| POST | `/api/auth/login` | Email 登录 |
| GET | `/api/auth/me` | 获取当前登录用户 |
| POST | `/api/auth/logout` | 用户退出登录 |

**Authentication Implementation**

- 使用 Argon2id 对用户密码进行哈希处理。
- 使用 JWT 实现用户身份认证。
- 通过 HttpOnly Cookie 保存 Access Token。
- 使用 NestJS Guard 验证请求身份。
- 实现当前用户信息获取。
- 实现 Logout 和 Cookie 清除。
- 使用 DTO 和 ValidationPipe 进行请求数据校验。
- 使用 CORS 配置处理前后端跨域请求。

### 4.3 前端认证状态管理

使用 React Context 建立全局认证状态管理机制。

主要组件：

- `AuthProvider`：管理全局用户认证状态。
- `useAuth`：提供统一的认证状态访问接口。
- `login()`：执行登录并更新全局用户状态。
- `logout()`：退出登录并清除用户状态。
- `refreshUser()`：重新获取当前登录用户。
- `isAuthenticated`：判断当前认证状态。

应用启动时通过 `/api/auth/me` 恢复用户登录状态。

### 4.4 Dashboard 界面

使用 Material UI 建立基础管理系统界面。

目前包含：

| Page | Status | Description |
|---|---|---|
| Login | Completed | 用户登录 |
| Signup | Completed | 用户注册 |
| Dashboard | Basic | 当前用户信息展示 |
| Company | Placeholder | 公司管理入口 |
| Order | Placeholder | 订单管理入口 |
| User | Placeholder | 用户管理入口 |

**Navigation Components**

- Sidebar：左侧导航栏。
- Header：顶部导航栏。
- DashboardShell：统一页面布局。
- Responsive Drawer：支持移动端导航。
- User Menu：用户信息与退出登录入口。

所有 Dashboard 路由统一通过 Dashboard Layout 进行客户端认证状态检查。

## 5. 数据库

当前使用 PostgreSQL 作为主要数据库，数据库运行于 Docker 环境。

| Configuration | Value |
|---|---|
| Database | `dashboard_app_db` |
| Database User | `dashboard_app` |
| Host | `127.0.0.1` |
| Port | `5432` |
| Schema | `public` |

目前已建立 User 数据模型及其初始数据库迁移。

业务相关的数据模型将在具体需求明确后设计。

## 6. 本地开发环境

### Prerequisites

- Node.js
- npm
- Docker Desktop
- PostgreSQL（通过现有 Docker 环境运行）

### Backend

```powershell
cd backend

npm install

npm run start:dev
```

Backend 默认监听端口：

```text
http://localhost:3001
```

API 全局前缀：

```text
/api
```

### Frontend

```powershell
cd frontend

npm install

npm run dev
```

Frontend 默认访问地址：

```text
http://localhost:3000
```

Frontend API 配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Backend 数据库连接和 JWT 配置应根据实际环境填写在 `backend/.env` 中。

注意：实际密钥、数据库密码和其他敏感配置不得提交到 GitHub。

## 7. 当前开发范围与限制

当前版本属于基础框架阶段，尚未完成具体供应链业务功能。

以下内容等待业务需求确认：

- Company：公司类型、供应商及客户关系、公司信息管理。
- Order：订单类型、订单信息、订单状态及流转流程。
- User：用户管理、角色划分及权限控制。
- Dashboard：业务统计、订单概览及数据可视化。
- Business Workflow：业务审批、状态转换及相关操作流程。

目前尚未实现完整的 RBAC 权限管理机制，也未建立上述业务模块对应的数据库模型和 CRUD API。

## 8. 后续开发计划

### Phase 2 — Business Requirements & Data Modeling

- 确认供应链业务需求。
- 明确 Company、Order、User 之间的业务关系。
- 设计数据库 ER Diagram。
- 建立业务数据模型。
- 确定 API 接口及数据流转规则。

### Phase 3 — Backend Business Development

- 实现 Company 管理 API。
- 实现 Order 管理 API。
- 完善 User 管理功能。
- 实现业务状态流转。
- 根据需求增加角色和权限管理。

### Phase 4 — Frontend Business Development

- 完善 Company 管理页面。
- 完善 Order 管理页面。
- 完善 User 管理页面。
- 建立 Dashboard 数据统计与可视化。
- 完成前后端业务联调。

### Phase 5 — Testing & Deployment

- 完善单元测试与集成测试。
- 进行业务流程测试。
- 完善异常处理和日志管理。
- 配置生产环境。
- 完成项目部署。

---

## 9. Current Milestone

**Phase 1 — Initial Framework Completed**

当前已完成项目基础环境、前后端架构、数据库连接、用户认证系统、全局认证状态管理以及 Dashboard 基础界面。

项目已经具备继续开展业务开发的基础条件。

下一阶段将根据实际业务需求完善数据库设计、后端业务 API 和前端管理功能。