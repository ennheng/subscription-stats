"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { accountEmailForUsername, isValidUsername, normalizeUsername } from "../lib/account-identity";
import { authClient } from "../lib/auth-client";
import { useI18n } from "./I18nProvider";
import { LanguageToggle } from "./LanguageToggle";

type AuthMode = "sign-in" | "sign-up";

export function WelcomeView() {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError(t.invalidUsername);
      return;
    }
    if (password.length < 10) {
      setError(t.invalidPassword);
      return;
    }

    setPending(true);
    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({
            email: accountEmailForUsername(normalized),
            name: normalized,
            username: normalized,
            password,
          })
        : await authClient.signIn.username({
            username: normalized,
            password,
            rememberMe: true,
          });

      if (result.error) {
        const code = result.error.code ?? "";
        if (code.includes("USERNAME_IS_ALREADY_TAKEN") || code.includes("USER_ALREADY_EXISTS")) {
          setError(t.usernameTaken);
        } else if (code.includes("INVALID_USERNAME_OR_PASSWORD") || code.includes("INVALID_EMAIL_OR_PASSWORD")) {
          setError(t.invalidCredentials);
        } else {
          setError(result.error.message || t.authFailed);
        }
        return;
      }

      window.location.assign("/");
    } catch {
      setError(t.authFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-xl font-bold text-white shadow-[0_10px_24px_rgba(234,88,12,0.25)] ring-1 ring-white/70">R</span>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-stone-900">{t.brandNameFull}</h1>
            <p className="text-xs text-stone-400">{t.tagline}</p>
          </div>
        </div>
        <LanguageToggle />
      </header>

      <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-orange-200/70 bg-orange-50/70 px-3 py-1 text-xs font-medium text-orange-700">{t.privacyPromise}</p>
          <h2 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-[-0.055em] text-stone-900 sm:text-6xl">
            {locale === "zh-CN" ? (
              <>把续费安排得<br /><span className="whitespace-nowrap">明明白白</span></>
            ) : t.chooseModeTitle}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-stone-500 sm:text-lg">{t.chooseModeBody}</p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/80 bg-white/55 p-5 shadow-[0_16px_38px_rgba(41,37,36,0.06)] backdrop-blur-xl">
              <span className="text-xl">☁</span>
              <h3 className="mt-3 font-semibold text-stone-900">{t.cloudMode}</h3>
              <p className="mt-1 text-sm leading-6 text-stone-500">{t.cloudModeHint}</p>
            </div>
            <Link href="/guest" className="group rounded-3xl border border-emerald-200/65 bg-emerald-50/55 p-5 shadow-[0_16px_38px_rgba(41,37,36,0.04)] transition hover:-translate-y-1 hover:bg-emerald-50/80">
              <span className="text-xl">⌂</span>
              <h3 className="mt-3 font-semibold text-stone-900 group-hover:text-emerald-800">{t.continueAsGuest} →</h3>
              <p className="mt-1 text-sm leading-6 text-stone-500">{t.guestModeHint}</p>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/85 bg-white/62 p-6 shadow-[0_24px_70px_rgba(41,37,36,0.10)] backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex rounded-full bg-stone-100/80 p-1 text-sm">
            <button type="button" onClick={() => { setMode("sign-in"); setError(""); }} className={`flex-1 rounded-full px-4 py-2.5 font-medium transition ${mode === "sign-in" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>{t.signIn}</button>
            <button type="button" onClick={() => { setMode("sign-up"); setError(""); }} className={`flex-1 rounded-full px-4 py-2.5 font-medium transition ${mode === "sign-up" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>{t.createAccount}</button>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.035em] text-stone-900">{mode === "sign-in" ? t.welcomeBack : t.createPrivateAccount}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{mode === "sign-in" ? t.signInHint : t.noEmailHint}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              {t.username}
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" spellCheck={false} className="mt-2 w-full rounded-2xl border border-stone-200/90 bg-white/80 px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder={t.usernamePlaceholder} />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              {t.password}
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={10} maxLength={128} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} className="mt-2 w-full rounded-2xl border border-stone-200/90 bg-white/80 px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" placeholder={t.passwordPlaceholder} />
            </label>
            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={pending} className="w-full rounded-2xl bg-stone-900 px-4 py-3.5 font-semibold text-white shadow-lg shadow-stone-900/10 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:translate-y-0 disabled:opacity-50">{pending ? t.authWorking : mode === "sign-in" ? t.signIn : t.createAccount}</button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-stone-400">{t.noRecoveryWarning}</p>
          <p className="mt-3 text-center text-xs"><Link href="/privacy" className="text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-900">{t.privacyPolicy}</Link></p>
        </div>
      </section>
    </main>
  );
}
