/** 서버에서 받은 학습 카탈로그와 로딩·오류 상태를 여러 화면에서 공유합니다. 콘텐츠 원본은 백엔드에만 둡니다. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LearningCatalogLoader } from '../services/learning';
import type { LearningCatalog, LearningLesson, LearningQuestion, LearningRegion } from '../types/learning';

interface ContentState { status: 'unconfigured' | 'loading' | 'ready' | 'error'; catalog: LearningCatalog | null; error: string | null }
interface ContentResult extends ContentState { loader: LearningCatalogLoader; requestVersion: number }
interface LearningContentValue extends ContentState {
  reload: () => void; regions: LearningRegion[]; questions: LearningQuestion[];
  battleRules: LearningCatalog['battleRules'] | null; rewards: LearningCatalog['rewards'] | null;
  getRegion: (id: number) => LearningRegion | undefined;
  getRegionForStep: (stepId: string) => LearningRegion | undefined;
  getLesson: (stepId: string) => { region: LearningRegion; lesson: LearningLesson } | undefined;
  getQuestion: (id: string) => LearningQuestion | undefined;
  getBattleQuestions: (stepId: string, boss: boolean) => LearningQuestion[];
}
const ContentContext = createContext<LearningContentValue | null>(null);
export function LearningContentProvider({ children, loader }: { children: ReactNode; loader?: LearningCatalogLoader }) {
  const [result, setResult] = useState<ContentResult | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  // 요청을 교체하거나 화면을 닫으면 이전 요청을 취소해 늦은 응답이 새 결과를 덮어쓰지 못하게 합니다.
  useEffect(() => {
    // API 공급 함수를 연결하기 전에는 요청이나 더미 카탈로그를 만들지 않습니다.
    if (!loader) return;
    const controller = new AbortController();
    Promise.resolve().then(() => loader(controller.signal)).then(catalog => {
      if (!controller.signal.aborted) setResult({ status: 'ready', catalog, error: null, loader, requestVersion });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ status: 'error', catalog: null, error: error instanceof Error ? error.message : '학습 정보를 불러오지 못했어요.', loader, requestVersion });
    });
    return () => controller.abort();
  }, [loader, requestVersion]);
  const reload = useCallback(() => {
    setRequestVersion(version => version + 1);
  }, []);
  // 로딩/미연결은 현재 공급 함수와 요청 번호에서 계산해 지난 데이터가 새 요청에 노출되지 않게 합니다.
  const state: ContentState = !loader ? { status: 'unconfigured', catalog: null, error: null }
    : result?.loader === loader && result.requestVersion === requestVersion ? result
    : { status: 'loading', catalog: null, error: null };
  const regions = state.catalog?.regions || []; const questions = state.catalog?.questions || [];
  const getRegion = (id: number) => regions.find(region => region.id === id);
  const getRegionForStep = (stepId: string) => regions.find(region => region.boss.id === stepId || region.lessons.some(lesson => lesson.id === stepId));
  const getLesson = (stepId: string) => {
    const region = getRegionForStep(stepId); const lesson = region?.lessons.find(item => item.id === stepId);
    return region && lesson ? { region, lesson } : undefined;
  };
  const getQuestion = (id: string) => questions.find(question => question.id === id);
  const getBattleQuestions = (stepId: string, boss: boolean) => {
    const region = getRegionForStep(stepId);
    const ids = boss ? region?.boss.id === stepId ? region.boss.questionIds : undefined : getLesson(stepId)?.lesson.questionIds;
    return (ids || []).map(getQuestion).filter((question): question is LearningQuestion => !!question);
  };
  return <ContentContext.Provider value={{ ...state, reload, regions, questions, battleRules: state.catalog?.battleRules || null, rewards: state.catalog?.rewards || null, getRegion, getRegionForStep, getLesson, getQuestion, getBattleQuestions }}>{children}</ContentContext.Provider>;
}
export function useLearningContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('LearningContentProvider 안에서 학습 화면을 열어 주세요.');
  return context;
}
