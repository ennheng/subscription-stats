# 合租订阅

追踪合租订阅的到期日与开销。你是乘客(付给车主钱),这里帮你记住每个车
什么时候到期、该给谁转多少、以及总共花了多少。

## 功能

- 订阅管理:名称、车主联系方式、总价/我的份额、月付/季付/年付、下次到期日、备注
- 仪表盘:按到期日排序,7 天内到期橙色提醒、逾期红色标注
- 标记已付:一键结清本期,到期日自动顺延一个周期(逾期会补齐到未来)
- 统计:月均 / 年付总开销
- 日历导出:下载 `.ics`,导入手机日历收续费提醒(每个订阅未来 8 期)

## 界面

干净极简风,白底圆角卡片,中文界面。响应式布局,电脑 / 安卓 / iPhone 都可用。

## 技术栈

vinext(Cloudflare)+ Next.js 16 App Router + React 19 + Tailwind v4 +
Drizzle ORM + Cloudflare D1。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000(dev server 用 Miniflare 模拟 D1)
```

首次需要建表(本地 D1):

```bash
npm run db:generate                                            # 改 schema 后生成迁移
npx wrangler d1 execute site-creator-d1 --local --file=drizzle/0000_*.sql
```

## 测试

```bash
npm test           # build + 起 dev server 跑端到端(增/改/标记已付/ics/校验)
npm run lint
npm run build
```

注意:测试通过 `vinext dev`(Miniflare)跑,因为它提供真实本地 D1。
`vinext start` 是纯 Node 服务器,没有 D1 绑定,仅用于纯静态预览。

## 部署(多端访问的关键)

要在手机(安卓/iPhone)和电脑上都能访问,部署到 Cloudflare Workers,
它会绑定真实 D1:

```bash
npx vinext deploy
```

部署后把生成的 `.ics` 链接导入各设备的日历 App,即可跨端收到期提醒。

## 数据模型

- `subscriptions`:名称、车主联系、总价/份额(分)、周期、下次到期日、备注
- `payments`:每期付款记录(金额、对应到期日、状态、支付时间)

金额一律存「分」,输入输出层转元。日期存 `YYYY-MM-DD`,按 UTC 比较避免时区漂移。

## 目录

- `app/page.tsx` — 仪表盘(统计 + 订阅卡片列表)
- `app/subscriptions/` — 新增/编辑表单
- `app/api/subscriptions/` — REST 路由(增/改/标记已付)
- `app/calendar.ics/` — 日历导出
- `lib/subscriptions.ts` — 日期/周期/统计纯函数
- `db/schema.ts` — Drizzle 表定义
