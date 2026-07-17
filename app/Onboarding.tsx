"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "onboarding-seen-v1";

const steps = [
  {
    title: "新增订阅",
    body: "点右上角「+ 新增订阅」。挑一个常见服务自动填名称和周期,或选「自定义」自己填。",
  },
  {
    title: "编辑 / 删除",
    body: "点任意一张卡片即可打开编辑页,改价格、周期、到期日;页面底部有「删除订阅」。",
  },
  {
    title: "标记已付",
    body: "每张卡右上角的「已付」会在你付完本期后点一下,到期日自动顺延一个周期。",
  },
];

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function readInitialStep(): number | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY) ? null : 0;
  } catch {
    return null;
  }
}

export function Onboarding() {
  const hydrated = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [step, setStep] = useState<number | null>(readInitialStep);

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setStep(null);
  }

  if (!hydrated || step === null) return null;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400">
            {step + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            跳过
          </button>
        </div>

        <h2 className="mt-3 text-lg font-semibold">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{current.body}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === step ? "bg-neutral-900" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
          >
            {isLast ? "开始使用" : "下一步"}
          </button>
        </div>
      </div>
    </div>
  );
}
