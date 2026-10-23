import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { Logo } from '../components/common/Logo';

interface ForgotPasswordPageProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateLogin }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.mockResetToken) {
        setResetToken(res.mockResetToken);
      }
      setStep('reset');
      toastSuccess('Reset instructions generated');
    } catch (err: any) {
      toastError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setLoading(true);
    try {
      const res = await api.resetPassword({ token: resetToken, newPassword });
      toastSuccess(res.message || 'Password successfully reset');
      onNavigateLogin();
    } catch (err: any) {
      toastError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center">
          <Logo size="lg" />
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enter your registered email address to receive password reset credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {step === 'request' ? (
            <form className="space-y-4" onSubmit={handleRequestToken}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@smartsales.io"
                    required
                    className="w-full px-3 py-2 pl-9 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Generate Reset Token'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-xs">
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reset Token Available</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  In a production environment, this token is sent securely via SMTP/SendGrid. For demonstration, it has been populated below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full px-3 py-2 pl-9 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-3 py-2 pl-9 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password & Log In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
