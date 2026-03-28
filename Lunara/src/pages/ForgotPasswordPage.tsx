import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleFooter } from '../components/layout/SimpleFooter';
import { getBaseApiUrl } from '../utils/getBaseApiUrl';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const baseUrl = getBaseApiUrl();
      const response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to send reset email');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Reset Password
          </h1>
        </div>

        <div
          className="w-full max-w-2xl bg-[#efefef]/85 backdrop-blur-md border border-[#4e1c00]/15 rounded-[60px] px-8 py-10 md:px-12 md:py-12"
          style={{ boxShadow: 'inset 0px 0px 24px 0px rgba(212,204,190,0.6)' }}
        >
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="text-[#4e1b00] text-5xl">&#10003;</div>
              <h2 className="font-roman text-[#4e1b00] text-xl md:text-2xl">Check your email</h2>
              <p className="font-roman text-[#574640] text-base">
                If an account with that email exists, we&apos;ve sent a password reset link.
                Please check your inbox and spam folder.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="font-roman text-[#4e1b00] text-base tracking-wider underline underline-offset-2 hover:text-[#574640] transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="font-roman text-[#574640] text-center text-base mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="sr-only">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full px-5 py-3.5 bg-white/95 border border-[#571e00]/25 rounded-2xl font-roman text-[#4e1b00] text-base tracking-wider placeholder:text-[#4e1b00]/60 focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 focus:border-[#4e1b00]/40"
                  />
                </div>

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
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
