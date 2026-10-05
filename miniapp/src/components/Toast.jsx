import { Check, CircleAlert } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div key={toast.id} className={`toast ${toast.tone}`}>
      {toast.tone === 'bad' ? <CircleAlert size={18} /> : <Check size={18} />}
      <span>{toast.text}</span>
    </div>
  );
}
