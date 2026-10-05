import { Minus, Plus } from 'lucide-react';

export default function QtyStepper({ value, onChange, min = 0, small = false }) {
  return (
    <div className={`stepper ${small ? 'small' : ''}`}>
      <button type="button" aria-label="Kamaytirish" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={small ? 14 : 16} />
      </button>
      <span>{value}</span>
      <button type="button" aria-label="Ko'paytirish" onClick={() => onChange(Math.min(50, value + 1))}>
        <Plus size={small ? 14 : 16} />
      </button>
    </div>
  );
}
