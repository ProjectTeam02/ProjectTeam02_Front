/** 학습 화면에 다시 돌아올 때 서버의 최신 잠금·진행도를 조회합니다. */
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useBackend } from './useBackend';
import type { Decoder } from '../services/backend';

export function useLearningQuery<T>(path: string | null, decode: Decoder<T>) {
  const resource = useBackend(path, decode);
  const reload = resource.reload;
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  return resource;
}
