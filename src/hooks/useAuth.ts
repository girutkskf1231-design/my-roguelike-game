/**
 * 로그인 상태 훅. AuthProvider 하위에서만 사용.
 * App·MyInfoScreen·LoginScreen 등이 동일한 user/profile을 공유하도록 Context 기반으로 제공.
 */
export { useAuth } from '@/contexts/AuthContext';
