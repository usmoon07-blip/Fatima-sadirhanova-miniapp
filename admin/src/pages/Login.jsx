import { useState } from 'react';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { api, auth } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(username, password);
      auth.set(token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-icon"><LockKeyhole size={26} /></div>
        <h1>Admin Panel</h1>
        <p className="muted">Davom etish uchun tizimga kiring</p>
        <label>Login<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></label>
        <label>Parol<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <LoaderCircle size={18} className="spin" /> : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
