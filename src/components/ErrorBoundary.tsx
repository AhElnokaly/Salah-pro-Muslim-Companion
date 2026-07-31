import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // Declare props and state explicitly for ambient Component type compatibility
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled React error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] flex flex-col items-center justify-center p-6 text-center space-y-4" dir="rtl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-red-200 dark:border-red-900/50">
            ⚠️
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">حدث خطأ غير متوقع</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              نأسف لحدوث هذا الخطأ. يمكنك إعادة تحميل التطبيق لاستئناف عرض مواقيت الصلاة والأذكار.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
