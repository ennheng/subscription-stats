import Link from "next/link";
import { dictionaryFor } from "../../lib/i18n";
import { LanguageToggle } from "../LanguageToggle";
import { getLocale } from "../locale";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = dictionaryFor(locale);
  const zh = locale === "zh-CN";

  const sections = zh
    ? [
        ["游客模式", "订阅内容只写入当前浏览器的本地存储，不会发送到订阅统计服务器。清除网站数据或卸载浏览器可能永久删除这些记录。"],
        ["云端账号", "注册只需要用户名和密码。系统会生成不可投递的内部占位地址，不要求手机号或真实邮箱。订阅记录按账号 ID 隔离，服务端不会信任客户端提交的归属信息。"],
        ["我们处理的数据", "云端模式会处理用户名、加密后的密码凭据、登录会话、订阅内容，以及安全运行所需的有限请求信息。我们不投放广告，也不接入跨站广告追踪。"],
        ["导出与删除", "你可以随时导出 ICS 或 JSON 数据副本。订阅可逐项删除，游客记录可一键清空；删除云端账号会连同全部订阅、付款记录和会话永久清除。"],
        ["Android 离线版", "离线 APK 不包含登录功能，不申请网络权限，并关闭系统云备份和设备迁移备份。数据只存在应用沙箱内；卸载应用会删除数据。"],
        ["当前限制", "由于不收集真实邮箱，暂不支持密码找回。正式运营前还需要补充运营主体、联系渠道、保留期限以及适用地区要求。"],
      ]
    : [
        ["Guest mode", "Subscription data is written only to this browser's local storage and is never sent to Subscription Stats servers. Clearing site data or removing the browser may permanently erase it."],
        ["Cloud accounts", "Registration requires only a username and password. Subscription Stats creates a non-deliverable internal placeholder address, so no phone number or real email is required. Server-side account IDs isolate every subscription."],
        ["Data we process", "Cloud mode processes a username, hashed password credential, login session, subscription content, and limited request information needed for security. We do not run ads or cross-site advertising trackers."],
        ["Export and deletion", "You can export ICS or a JSON data copy at any time. Subscriptions can be deleted individually and guest data cleared in one action. Deleting a cloud account permanently removes its subscriptions, payment records, and sessions."],
        ["Offline Android edition", "The APK has no account system, requests no network permission, and disables Android cloud and device-transfer backups. Data remains in the app sandbox and is erased when the app is uninstalled."],
        ["Current limitations", "Password recovery is unavailable because no real email is collected. Operator identity, contact details, retention periods, and regional disclosures still need to be finalized before public operation."],
      ];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-600 font-bold text-white shadow-lg shadow-orange-600/20">订</span>
          <span className="text-xl font-semibold tracking-tight text-stone-900">{t.brandNameFull}</span>
        </Link>
        <LanguageToggle />
      </header>

      <article className="glass mt-8 rounded-[2rem] p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Privacy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-stone-900 sm:text-4xl">{zh ? "隐私说明" : "Privacy notice"}</h1>
        <p className="mt-3 text-sm leading-7 text-stone-500">{zh ? "版本日期：2026 年 7 月 17 日。这是公开发布前的产品隐私草案。" : "Version date: July 17, 2026. This is a pre-launch product privacy draft."}</p>
        <div className="mt-8 space-y-7">
          {sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
