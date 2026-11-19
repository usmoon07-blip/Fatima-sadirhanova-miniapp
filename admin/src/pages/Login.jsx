import { useState } from 'react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { api, auth } from '../api';
import InstallButton from '../components/InstallButton';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(password);
      auth.set(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="brand-logo big"><img src={`${import.meta.env.BASE_URL}fs-logo.png`} alt="FS" /></span>
        <h1>Fatima Sadirkhanova</h1>
        <p className="muted">Admin Panelga kirish</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" autoFocus />
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading || !password}>
          {loading ? <LoaderCircle size={18} className="spin" /> : <LogIn size={18} />} Kirish
        </button>
        <InstallButton variant="card" />
      </form>
    </div>
  );
}
