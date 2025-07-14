import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginDialogProps {
  children?: React.ReactNode;
}

export function LoginDialog({ children }: LoginDialogProps) {
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await signIn(email, password);
    if (!result.success) setError(result.error || 'Login failed');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.success) setError(result.error || 'Google sign in failed');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>Sign In</button>
      <button type="button" onClick={handleGoogleSignIn} disabled={isLoading}>Sign In with Google</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {children}
    </form>
  );
}
