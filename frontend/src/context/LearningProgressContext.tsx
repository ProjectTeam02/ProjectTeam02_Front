/** 화면 간 진행·개인 설정을 메모리에서 공유합니다. test의 예시 초기값은 선택적으로 주입하며 영구 저장 API는 미연결입니다. */
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { useLearningContent } from './LearningContentContext';
import { useAuth } from './AuthContext';
export type JobId = 'warrior' | 'mage' | 'archer';
export interface LearningProfile { nickname: string; email: string; job: JobId; coins: number; xp: number; economyXp: number; level: number; economyLevel: number }
export interface QuizInput { stepId: string; boss: boolean; correct: number; total: number; wrongQuestionIds: string[] }
export interface QuizResult extends QuizInput { rewardCoins: number; rewardXp: number; rewardEconomyXp?: number; firstClear: boolean; passed: boolean }
export interface Schedule { id: string; date: string; title: string; time: string }
interface LearningProgressState {
  profile: LearningProfile; setNickname: (value: string) => void; setJob: (value: JobId) => void;
  completedSteps: string[]; lastResult: QuizResult | null; wrongQuestionIds: string[]; flaggedQuestionIds: string[];
  toggleFlag: (id: string) => void; finishQuiz: (result: QuizInput) => void; markReviewed: (id: string) => void;
  ownedCostumes: string[]; equippedCostume: string; buyCostume: (id: string, price: number) => boolean; equipCostume: (id: string) => void;
  notifications: boolean; setNotifications: (enabled: boolean) => void; notificationTime: string; setNotificationTime: (time: string) => void;
  schedules: Schedule[]; upsertSchedule: (schedule: Schedule) => void; deleteSchedule: (id: string) => void;
}
const LearningProgressContext = createContext<LearningProgressState | null>(null);
const INITIAL_PROFILE: LearningProfile = { nickname: '', email: '', job: 'mage', coins: 0, xp: 0, economyXp: 0, level: 1, economyLevel: 1 };

export interface LearningProgressSeed { profile?: Partial<LearningProfile>; schedules?: Schedule[] }
export function LearningProgressProvider({ children, initialState }: { children: ReactNode; initialState?: LearningProgressSeed }) {
  const { battleRules, rewards, getRegionForStep } = useLearningContent();
  const { session } = useAuth();
  // 인증 상태가 바뀌면 상위 key가 이 Provider를 새로 만듭니다. 사용자별 서버 진행도 조회는 아직 연결하지 않았습니다.
  const [profile, setProfile] = useState<LearningProfile>(() => ({ ...INITIAL_PROFILE, ...initialState?.profile,
    nickname: session?.user.nickname ?? INITIAL_PROFILE.nickname,
    email: session?.user.email ?? INITIAL_PROFILE.email,
    level: initialState?.profile?.level ?? session?.user.level ?? 1,
    xp: initialState?.profile?.xp ?? session?.user.totalExp ?? 0,
    economyLevel: initialState?.profile?.economyLevel ?? session?.user.economyLevel ?? 1,
    economyXp: initialState?.profile?.economyXp ?? session?.user.economyExp ?? 0,
  }));
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [wrongQuestionIds, setWrong] = useState<string[]>([]);
  const [flaggedQuestionIds, setFlagged] = useState<string[]>([]);
  const [ownedCostumes, setOwned] = useState(['basic']);
  const [equippedCostume, setEquipped] = useState('basic');
  const [notifications, setNotifications] = useState(true);
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [schedules, setSchedules] = useState<Schedule[]>(() => initialState?.schedules?.map(item => ({ ...item })) ?? []);
  // 연속 탭에도 같은 단계 보상과 코스튬 구매가 두 번 처리되지 않도록 현재값을 함께 관리합니다.
  const stateRef = useRef({ profile, completedSteps, ownedCostumes });
  const finishQuiz = (input: QuizInput) => {
    // 채점·보상 저장은 아직 로컬 예시이며, 기준 값과 콘텐츠 식별자는 서버 응답을 사용합니다.
    if (!battleRules || !rewards || !getRegionForStep(input.stepId)) return;
    const passed = input.correct >= (input.boss ? battleRules.boss.hp : battleRules.normal.hp);
    const firstClear = passed && !stateRef.current.completedSteps.includes(input.stepId);
    const rewardCoins = firstClear ? rewards.coins : 0;
    const rewardXp = firstClear ? rewards.xp : 0;
    const rewardEconomyXp = firstClear ? rewards.economyXp : 0;
    setLastResult({ ...input, passed, firstClear, rewardCoins, rewardXp, rewardEconomyXp });
    setWrong(old => [...new Set([...old, ...input.wrongQuestionIds])]);
    if (firstClear) {
      const next = [...stateRef.current.completedSteps, input.stepId];
      const current = stateRef.current.profile;
      const nextProfile = { ...current, coins: current.coins + rewardCoins, xp: current.xp + rewardXp, economyXp: current.economyXp + rewardEconomyXp };
      stateRef.current = { ...stateRef.current, completedSteps: next, profile: nextProfile };
      setCompletedSteps(next); setProfile(nextProfile);
    }
  };
  const buyCostume = (id: string, price: number) => {
    const current = stateRef.current;
    if (current.ownedCostumes.includes(id) || price < 0 || !Number.isFinite(price) || current.profile.coins < price) return false;
    const nextProfile = { ...current.profile, coins: current.profile.coins - price };
    const nextOwned = [...current.ownedCostumes, id];
    stateRef.current = { ...current, profile: nextProfile, ownedCostumes: nextOwned };
    setProfile(nextProfile); setOwned(nextOwned); return true;
  };
  return <LearningProgressContext.Provider value={{
    profile,
    setNickname: value => {
      const next = { ...stateRef.current.profile, nickname: value.trim() || stateRef.current.profile.nickname };
      stateRef.current.profile = next; setProfile(next);
    },
    setJob: value => {
      const next = { ...stateRef.current.profile, job: value };
      stateRef.current.profile = next; setProfile(next); setEquipped('basic');
    },
    completedSteps, lastResult, wrongQuestionIds, flaggedQuestionIds, finishQuiz,
    toggleFlag: id => setFlagged(old => old.includes(id) ? old.filter(item => item !== id) : [...old, id]),
    markReviewed: id => setWrong(old => old.filter(item => item !== id)),
    ownedCostumes, equippedCostume, buyCostume,
    equipCostume: id => { if (stateRef.current.ownedCostumes.includes(id)) setEquipped(id); },
    notifications, setNotifications, notificationTime, setNotificationTime, schedules,
    upsertSchedule: schedule => setSchedules(old => [...old.filter(item => item.id !== schedule.id), schedule]),
    deleteSchedule: id => setSchedules(old => old.filter(item => item.id !== id)),
  }}>{children}</LearningProgressContext.Provider>;
}
export function useLearningProgress() {
  const context = useContext(LearningProgressContext);
  if (!context) throw new Error('LearningProgressProvider 안에서 화면을 열어 주세요.');
  return context;
}
