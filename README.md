# 订阅统计 · Subscription Stats

[中文](#中文) · [English](#english)

> A private, bilingual subscription statistics tool for Web, iPhone/PWA, guest browsers, and a separate fully offline Android APK.

## 中文

订阅统计用于记录订阅、合租份额、续费日期和年度开销；中文显示名为“订阅统计”，英文显示名为“Subscription Stats”。正式推广前仍应完成商标、应用商店名称和域名检索。

### 使用模式

| 模式 | 登录 | 数据位置 | 联网 | 适合场景 |
|---|---:|---|---:|---|
| Web / iPhone PWA 云端模式 | 用户名 + 密码 | Cloudflare D1，按用户 ID 隔离 | 是 | 多设备同步 |
| Web 游客模式 | 不需要 | 当前浏览器 `localStorage` | 页面加载后可离线 | 临时记录、无需注册 |
| Android 离线 APK | 无登录功能 | Android 应用沙箱 | 否；APK 不申请 `INTERNET` 权限 | 完全离线、单设备使用 |

游客数据不会自动转入云端。清除浏览器数据或卸载离线 APK 会删除本机记录。

### 功能

- 完整中英双语界面、元数据、表单、隐私说明和离线页面
- 当前订阅直接计算月均、年度总额、条状图与饼状图；不需要先点“标记已付”
- 月付、季付、年付，到期/逾期提醒与一键顺延
- 常见服务预设与自定义服务图标
- ICS 导出（每项订阅未来 8 期）
- 云端 JSON 数据副本导出、逐项删除与账号整体删除
- 无真实邮箱注册：系统仅生成不可投递的内部占位地址
- PWA 可安装到 iPhone 主屏幕；Android 另有纯离线原生壳

### 隐私与账号隔离

- 服务端从已验证会话取得 `userId`，不接受客户端指定数据归属。
- 列表、详情、修改、删除、付款、JSON 和 ICS 查询都强制按 `userId` 过滤。
- 跨账号访问统一表现为不存在，端到端测试覆盖 A/B 两账号越权场景。
- 变更请求要求同源 `Origin`；每个账号最多保存 200 项订阅。
- 密码由 Better Auth 的凭据流程进行哈希处理，数据库不保存明文密码。
- PWA 只缓存游客页面；登录后包含私有数据的 HTML 不进入离线缓存。
- 当前不收集真实邮箱，因此暂不支持找回密码。账号菜单可凭当前密码永久删除账号及其数据。

应用内隐私草案见 `/privacy`。正式运营前仍需补充运营主体、联系渠道、数据保留期限和适用地区条款。

### 中国大陆可用性

“能偶尔打开”和“可稳定公开运营”是两件事：

- 当前普通 Cloudflare Workers 全球网络在中国大陆不能保证稳定低延迟；Cloudflare 官方也说明跨境流量会遇到延迟和可靠性问题。
- 若面向大陆稳定运营，通常需要自有域名、境内主体/接入商、ICP 备案（经营性服务可能涉及许可）以及境内部署或合规的中国网络加速方案。
- Cloudflare China Network 属于单独的 Enterprise/JD Cloud 方案；Workers 可用，但官方中国网络产品表未列出 D1。因此现有 Workers + D1 架构不能直接视为“境内版”。
- Cloudflare Pages 的 `pages.dev` 和 Turnstile 官方均标注不适用于中国大陆场景。
- 在大陆应用商店公开分发、且提供互联网信息服务的 App 还涉及 APP 备案；本项目的 Android 版刻意做成无网络权限的离线工具，但上架时仍应按目标商店和运营主体复核要求。

参考：[Cloudflare China Network](https://developers.cloudflare.com/china-network/)、[可用产品](https://developers.cloudflare.com/china-network/reference/available-products/)、[China FAQ](https://developers.cloudflare.com/china-network/faq/)、[工信部 ICP 办事指南](https://hunca.miit.gov.cn/bsfw/bszn/art/2024/art_7ef0d8bd3b0d433ba4b9b277f883f74d.html)、[工信部 APP 备案通知](https://www.miit.gov.cn/zwgk/zcwj/wjfb/tz/art/2023/art_920db564162e4312916a01bed6540ad8.html%EF%BC%9B)。

建议采用“双部署”路线：先用全球版验证产品；确认运营主体和域名后，再为大陆用户设计境内静态前端与境内数据库/API，不要把 D1 跨境访问包装成大陆稳定方案。

### 本地开发

要求 Node.js 22.13+。

```bash
npm install
cp .dev.vars.example .dev.vars
# 把 BETTER_AUTH_SECRET 换成至少 32 位随机值
npm run db:migrate:local
npm run dev
```

Windows PowerShell 可用：

```powershell
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

默认预览地址由 vinext 输出（通常为 `http://localhost:3000` 或指定端口）。

### 验证

```bash
npm run lint
npm run build
npm test
```

`npm test` 会启动本地 Miniflare/D1，创建两个临时账号，验证未登录拒绝、完整订阅生命周期、跨账号隔离、ICS/JSON 导出、账号删除、PWA 与离线页面，并在结束后清理测试账号。

### Android 离线 APK

Android Studio / JDK 17 / Android SDK 36 就绪后：

```powershell
cd android-offline
.\gradlew.bat assembleDebug lintDebug
```

调试 APK 位于 `android-offline/app/build/outputs/apk/debug/app-debug.apk`。公开发布前应创建并安全备份发布签名密钥，再构建签名 release APK；不要把 keystore 或密码提交到 Git。

### 生产部署清单

1. 确定域名、运营主体、隐私联系渠道与部署地区。
2. 为生产环境生成独立的 `BETTER_AUTH_SECRET`，通过平台 Secret 注入，禁止提交到仓库。
3. 备份 D1，并运行 `npm run db:migrate:remote`。
4. 为旧版未归属数据执行一次经过核对的账号归属迁移；迁移脚本不得猜测所有者。
5. 再次运行 lint、build 和完整测试。
6. 部署 Worker/PWA，验证注册、退出、账号删除、跨账号隔离和 ICS。
7. 创建用户自持的 Android 发布签名，发布 APK/应用商店包。

旧版线上数据库目前不会被本分支自动修改或删除。

### 技术栈

- vinext / Next.js 16 App Router / React 19 / Tailwind CSS 4
- Better Auth（用户名/密码）
- Drizzle ORM / Cloudflare D1 / Cloudflare Workers
- 原生 Android WebView 壳 + 完全内嵌 HTML/CSS/JS（无远程 URL）

## English

Subscription Stats tracks subscriptions, shared-plan costs, renewal dates, and annualized spending. Its Chinese display name is “订阅统计”. Complete trademark, app-store, and domain clearance before a broad launch.

### Product modes

| Mode | Sign-in | Storage | Network | Best for |
|---|---:|---|---:|---|
| Web / iPhone PWA cloud mode | Username + password | Cloudflare D1, isolated by user ID | Yes | Cross-device sync |
| Web guest mode | None | Current browser `localStorage` | Can work offline after load | Quick, no-account tracking |
| Android offline APK | No auth code | Android app sandbox | No; APK requests no `INTERNET` permission | Fully offline, single-device use |

Guest data is never uploaded or automatically merged into a cloud account. Clearing browser data or uninstalling the APK removes local records.

### Highlights

- Complete Chinese/English UI, forms, metadata, privacy notice, and offline surface
- Monthly, annual, bar, and pie statistics are calculated from current subscriptions immediately — payment history is not required
- Monthly, quarterly, and annual cycles with due/overdue states and one-tap date advancement
- Common-service presets plus custom services
- ICS export with the next eight occurrences per subscription
- Cloud JSON data export, item deletion, and complete account deletion
- Username/password registration without collecting a real email address
- Installable iPhone PWA and a separate network-free Android package

### Privacy and tenant isolation

- The server derives `userId` from the verified session and never trusts client-supplied ownership.
- Lists, details, updates, deletion, payment, JSON, and ICS queries are scoped by `userId`.
- End-to-end tests use two real accounts and verify that one cannot access the other's data.
- Mutations require a same-origin `Origin`; accounts are limited to 200 subscriptions.
- Better Auth hashes credentials; plaintext passwords are never stored.
- The service worker caches only guest pages, never authenticated HTML containing private data.
- No real email means no password recovery yet. Users can permanently delete the account and all associated data with their current password.

The in-app draft is available at `/privacy`. Operator identity, a privacy contact, retention periods, and region-specific terms must be finalized before general operation.

### Mainland China availability

The current global Cloudflare Workers deployment may sometimes load from Mainland China, but it cannot be presented as a reliably available Mainland service. Cloudflare documents cross-border latency/reliability constraints. Stable Mainland operation normally requires an owned domain, an eligible local operator/access provider, ICP filing or licensing as applicable, and Mainland infrastructure or an approved acceleration path.

Cloudflare China Network is a separate Enterprise/JD Cloud offering. Workers are listed as available, while D1 is not listed among China Network developer services, so the existing Workers + D1 design is not a turnkey Mainland architecture. Cloudflare also states that Pages (`pages.dev`) and Turnstile are unavailable for this scenario. Public app-store distribution of networked apps can trigger additional APP filing requirements. The offline Android build intentionally requests no network permission, but store/operator requirements must still be reviewed before distribution.

Sources: [Cloudflare China Network](https://developers.cloudflare.com/china-network/), [available products](https://developers.cloudflare.com/china-network/reference/available-products/), [China FAQ](https://developers.cloudflare.com/china-network/faq/), [MIIT ICP guidance](https://hunca.miit.gov.cn/bsfw/bszn/art/2024/art_7ef0d8bd3b0d433ba4b9b277f883f74d.html), and [MIIT APP filing notice](https://www.miit.gov.cn/zwgk/zcwj/wjfb/tz/art/2023/art_920db564162e4312916a01bed6540ad8.html%EF%BC%9B).

### Development and tests

```bash
npm install
cp .dev.vars.example .dev.vars
# Replace BETTER_AUTH_SECRET with a random value of at least 32 characters.
npm run db:migrate:local
npm run dev

npm run lint
npm run build
npm test
```

`npm test` runs against local Miniflare/D1 and covers unauthenticated denial, subscription lifecycle, two-account isolation, ICS/JSON export, account deletion, PWA assets, and offline behavior.

Build the offline Android debug package with JDK 17 and Android SDK 36:

```bash
cd android-offline
./gradlew assembleDebug lintDebug
```

The debug APK is generated at `android-offline/app/build/outputs/apk/debug/app-debug.apk`. A public release needs a user-owned release signing key stored outside Git.

### Deployment

Before deploying: finalize the domain/operator/region, inject a production-only `BETTER_AUTH_SECRET`, back up D1, apply remote migrations, explicitly assign any legacy unowned rows, run the full verification suite, and create a release-signing plan for Android. This branch never modifies or deletes the legacy remote database automatically.

### License

No open-source license has been selected yet. Public repository visibility does not grant reuse rights; choose a license before inviting external contributions.
