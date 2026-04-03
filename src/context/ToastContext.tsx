import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

export type ToastAppearance = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  appearance: ToastAppearance;
  autoDismiss?: boolean;
}

export interface ToastEntry {
  id: string;
  content: React.ReactNode;
  appearance: ToastAppearance;
  autoDismiss: boolean;
}

type AddToastCallback = (id: string) => void;

interface ToastContextValue {
  addToast: (
    content: React.ReactNode,
    options: ToastOptions,
    callback?: AddToastCallback
  ) => void;
  removeToast: (id: string) => void;
  toasts: ToastEntry[];
}

const AUTO_DISMISS_MS = 4000;

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {},
  toasts: [],
});

let nextId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      content: React.ReactNode,
      options: ToastOptions,
      callback?: AddToastCallback
    ) => {
      const id = String(++nextId);
      const autoDismiss = options.autoDismiss !== false;

      setToasts((prev) => [
        ...prev,
        { id, content, appearance: options.appearance, autoDismiss },
      ]);

      if (autoDismiss) {
        const timer = setTimeout(() => {
          timersRef.current.delete(id);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, AUTO_DISMISS_MS);
        timersRef.current.set(id, timer);
      }

      if (callback) {
        callback(id);
      }
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToasts = () => useContext(ToastContext);
