import { useStore } from '../store/StoreContext';

export default function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div key={toastMsg.key} className={`toast ${toastMsg.tone}`} role="status">
      {toastMsg.text}
    </div>
  );
}
