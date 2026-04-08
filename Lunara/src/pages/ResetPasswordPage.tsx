/**
 * @module ResetPasswordPage
 * Password-reset completion page. Reads the reset token from the URL,
 * validates a new password, and submits the change to the backend.
 */
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SimpleFooter } from '../components/layout/SimpleFooter';
import { getBaseApiUrl } from '../utils/getBaseApiUrl';

/**
 * Reset-password page rendered at `/reset-password?token=...`.
 * Validates the token from search params and presents a new-password form.
 * @returns The new-password form, a success message, or an invalid-token error.
 */
const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = getBaseApiUrl();
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? data?.message ?? 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const invalidToken = !token;

  return (
    <div className="relative min-h-[100dvh] min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAF7F2] flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/images/feet.png')" }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 pb-32 pt-20 sm:pt-24 md:pt-28 shrink-0 min-w-0 w-full max-w-[100vw]">
        <div className="flex justify-center mb-4 drop-shadow-xl">
          <img
            src="/images/wax seal.png"
            alt="Lunara"
            className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-md"
          />
        </div>

        <div className="text-center mb-12 md:mb-16">
          <h1
            className="font-script text-5xl sm:text-6xl md:text-[80px] text-white leading-none tracking-wide"
            style={{ textShadow: '0px 2px 4px rgba(87,70,64,0.25)' }}
          >
            New Password
          </h1>
        </div>

        <div
          className="w-full max-w-2xl bg-[#efefef]/85 backdrop-blur-md border border-[#4e1c00]/15 rounded-[60px] px-8 py-10 md:px-12 md:py-12"
          style={{ boxShadow: 'inset 0px 0px 24px 0px rgba(212,204,190,0.6)' }}
        >
          {invalidToken ? (
            <div className="text-center space-y-4">
              <div className="text-red-700 text-4xl">&#10007;</div>
              <h2 className="font-roman text-[#4e1b00] text-xl md:text-2xl">Invalid Reset Link</h2>
              <p className="font-roman text-[#574640] text-base">
                This password reset link is missing or invalid. Please request a new one.
              </p>
              <div className="pt-4">
                <Link
                  to="/forgot-password"
                  className="font-roman text-[#4e1b00] text-base tracking-wider underline underline-offset-2 hover:text-[#574640] transition-colors"
                >
                  Request new reset link
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="text-[#4e1b00] text-5xl">&#10003;</div>
              <h2 className="font-roman text-[#4e1b00] text-xl md:text-2xl">Password Reset</h2>
              <p className="font-roman text-[#574640] text-base">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 bg-white/95 border border-[#571e00]/30 rounded-2xl font-roman text-[#4e1b00] text-lg tracking-wider shadow-sm hover:bg-white hover:shadow transition-all"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="font-roman text-[#574640] text-center text-base mb-6">
                Enter your new password below.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="new-password" className="sr-only">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="New Password"
                    autoComplete="new-password"
                    className="w-full px-5 py-3.5 bg-white/95 border border-[#571e00]/25 rounded-2xl font-roman text-[#4e1b00] text-base tracking-wider placeholder:text-[#4e1b00]/60 focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 focus:border-[#4e1b00]/40"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    className="w-full px-5 py-3.5 bg-white/95 border border-[#571e00]/25 rounded-2xl font-roman text-[#4e1b00] text-base tracking-wider placeholder:text-[#4e1b00]/60 focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 focus:border-[#4e1b00]/40"
                  />
                </div>

                <p className="font-roman text-[#574640]/70 text-xs text-center">
                  Must be at least 8 characters with one uppercase, one lowercase, and one number.
                </p>

                {error && (
                  <div className="text-red-700 text-sm text-center font-roman py-2" role="alert">
                    {error}
                  </div>
                )}

                <div className="flex justify-center pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full max-w-[280px] px-6 py-3.5 bg-white/95 border border-[#571e00]/30 rounded-2xl font-roman text-[#4e1b00] text-lg tracking-wider shadow-sm hover:bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="font-roman text-[#574640] text-sm md:text-base tracking-wider underline underline-offset-2 hover:text-[#4e1b00] transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="flex-1 min-h-0 shrink-0" />
      <SimpleFooter fixed={false} />
    </div>
  );
};

export default ResetPasswordPage;
