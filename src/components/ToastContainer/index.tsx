import Toast from '@app/components/Toast';
import { useToasts } from '@app/context/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToasts();

  return (
    <div
      id="toast-container"
      className="fixed right-0 top-4 box-border max-h-full max-w-full overflow-hidden px-4"
      style={{
        pointerEvents: toasts.length > 0 ? 'all' : 'none',
        zIndex: 10000,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          appearance={toast.appearance}
          onDismiss={() => removeToast(toast.id)}
          show={true}
        >
          {toast.content}
        </Toast>
      ))}
    </div>
  );
};

export default ToastContainer;
