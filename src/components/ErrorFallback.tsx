import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** 예기치 않은 오류 시 사용자에게 친절한 메시지만 표시 (서버 오류 문구 노출 방지) */
export class ErrorFallback extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // 로그만 하고 사용자에게는 일반 메시지 표시
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 rounded-2xl p-8 border-2 border-slate-600 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">일시적인 오류가 발생했습니다</h1>
            <p className="text-gray-400 text-sm mb-6">
              페이지를 새로고침하면 대부분 해결됩니다. 계속되면 브라우저를 새로 열어 주세요.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              새로고침
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
