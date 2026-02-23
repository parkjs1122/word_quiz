"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "word-quiz-onboarding-done";

const steps = [
  {
    title: "단어를 추가하세요",
    description: "마이페이지에서 단어를 직접 입력하거나 .txt 파일을 업로드할 수 있습니다.",
    icon: "📝",
  },
  {
    title: "폴더로 정리하세요",
    description: "단어를 폴더별로 분류하면 주제별 학습이 가능합니다.",
    icon: "📁",
  },
  {
    title: "퀴즈로 학습하세요",
    description: "기본, 역방향, 4지선다 모드로 다양하게 학습할 수 있습니다.",
    icon: "🎯",
  },
  {
    title: "대시보드에서 확인하세요",
    description: "학습 진행률, 연속 학습일, 복습 알림을 확인할 수 있습니다.",
    icon: "📊",
  },
];

interface OnboardingOverlayProps {
  userId: string;
}

export default function OnboardingOverlay({ userId }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `${STORAGE_KEY}:${userId}`;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [userId]);

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleDone();
    }
  }

  function handleDone() {
    const key = `${STORAGE_KEY}:${userId}`;
    localStorage.setItem(key, "true");
    setVisible(false);
  }

  if (!visible) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="mb-4 text-center text-5xl">{current.icon}</div>
        <h2 className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
          {current.title}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="mb-4 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDone}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {step < steps.length - 1 ? "다음" : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
