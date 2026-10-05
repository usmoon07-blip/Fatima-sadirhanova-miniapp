import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, auth } from '../api';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, role } = await api.login(password);
      auth.set(token, role);
      onLogin(role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">🧁</div>
        <h1>Admin Panel</h1>
        <p className="muted">Boshqaruv paneliga kirish</p>
        <label>Parol<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></label>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !password}>
          {loading ? <LoaderCircle size={18} className="spin" /> : 'Kirish'}
        </button>
        <p className="muted small center">Parolni ko'p marta noto'g'ri kiritsangiz, kirish 15 daqiqaga bloklanadi.</p>
      </form>
    </div>
  );
}
