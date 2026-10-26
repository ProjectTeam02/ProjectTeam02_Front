/**
 * 여러 화면에서 공유하는 색상·간격·글꼴 값. 최종 UI 조정 시 공통 기준으로 사용합니다.
 */
import type { TextStyle } from 'react-native';
// 상태별 의미를 가진 공통 색상입니다. 화면마다 중복한 색상은 추후 이곳으로 정리합니다.
export const COLORS = {
    primary: '#1D3F91',
    soft: '#EAF0FF',
    ink: '#182842',
    muted: '#68778E',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    line: '#DCE5F0',
    success: '#248565',
    successBg: '#E8F6EF',
    danger: '#B84457',
    dangerBg: '#FCEEF0',
    goldBg: '#FFF5D5',
    disabled: '#E4EAF2',
  };
  
  // 화면·입력창·버튼의 공통 크기와 여백입니다.
  export const LAYOUT = {
    // 공통 간격 및 모서리
    gap: 12,
    pad: 16,
    radius: 16,
    buttonRadius: 12,
  
    // 화면 레이아웃
    screenPadding: 24,
    headerHeight: 56,
    contentMaxWidth: 390,
  
    // 입력창 및 버튼 크기
    inputHeight: 54,
    buttonHeight: 48,
  };
  
  // satisfies로 글꼴 설정을 검사하면서 fontWeight 등의 구체 타입을 유지합니다.
  export const TYPOGRAPHY = {
    title: {
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '700',
    },
    heading: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '700',
    },
    label: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '700',
    },
    body: {
      fontSize: 14,
      lineHeight: 22,
    },
    small: {
      fontSize: 12,
      lineHeight: 18,
    },
    micro: {
      fontSize: 10,
      lineHeight: 16,
      fontWeight: '500',
    },
  } satisfies Record<string, TextStyle>;
  
