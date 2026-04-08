/**
 * @module LoginPage
 * Client login page with email/password form, Google OAuth, and MFA challenge.
 * Handles OAuth callback query-params and redirects authenticated users to their dashboard.
 */
// Login page aligned with Figma design (node 415:154): client-only, minimal header, logo, frosted form.
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { MfaChallengeError } from '../services/authService';
import { toast } from 'react-toastify';
import { getBaseApiUrl, getGoogleOAuthStartUrl } from '../utils/getBaseApiUrl';
import { SimpleFooter } from '../components/layout/SimpleFooter';

/**
 * Login page component rendered at `/login`.
 * Provides email/password authentication, Google OAuth sign-in,
 * and a TOTP MFA challenge step when two-factor is enabled.
 * @returns The login page with conditional MFA form.
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const {
    user,
    isAuthenticated,
    loading,
    clientLogin,
    verifyMfa,
    loginWithTokens,
    error,
    clearError,
    getDashboardRoute,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Ref guard prevents re-processing the OAuth tokens when the effect re-fires
  // after we clear the URL params (which changes searchParams, triggering the effect again).
  const oauthHandled = useRef(false);

  useEffect(() => {
    // process.env.NODE_ENV (not import.meta) so Jest can parse this file
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      const api = getBaseApiUrl();
      if (!api.startsWith('http')) {
        console.error(
          '[Lunara] Google sign-in needs VITE_API_BASE_URL as a full URL (e.g. https://lunara.onrender.com/api). A relative /api path breaks OAuth when the site is not served from the API host.'
        );
      }
    }
  }, []);

  useEffect(() => {
    if (oauthHandled.current) return;
    const oauthStatus = searchParams.get('oauth');
    const token = searchParams.get('token');

    if (oauthStatus === 'success' && token) {
      oauthHandled.current = true;
      setSearchParams({}, { replace: true });
      // Refresh token was set as an httpOnly cookie by the OAuth redirect.
      loginWithTokens(token).catch(() => {
        toast.error('Could not complete sign-in. Check your connection and try again.');
      });
      return;
    }

    const oauthError = searchParams.get('error');
    if (oauthError === 'no_account') {
      toast.error('No account found for that email. Please contact your provider to get started.');
      setSearchParams({}, { replace: true });
    } else if (oauthError === 'verify_email_first') {
      toast.error('Verify your email with the link we sent you, then try Google sign-in again.');
      setSearchParams({}, { replace: true });
    } else if (oauthError === 'google_mismatch') {
      toast.error('This email is linked to a different Google account. Use the matching Google user or email/password.');
      setSearchParams({}, { replace: true });
    } else if (oauthError === 'oauth_failed') {
      toast.error('Sign-in failed. Please try again or use email and password.');
      setSearchParams({}, { replace: true });
    } else if (oauthError === 'oauth_not_configured') {
      toast.error(
        'Google sign-in is not enabled on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or use email and password.'
      );
      setSearchParams({}, { replace: true });
    } else if (oauthError === 'oauth_denied') {
      toast.error('Google sign-in was cancelled. Try again when you are ready.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, loginWithTokens]);

  useLayoutEffect(() => {
    if (isAuthenticated && user && !loading) {
      const dashboardRoute = getDashboardRoute(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, getDashboardRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);
    try {
      await clientLogin({ email, password });
    } catch (err) {
      if (err instanceof MfaChallengeError) {
        setMfaToken(err.mfaToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setMfaError('');
    setIsLoading(true);
    try {
      await verifyMfa(mfaToken, mfaCode);
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAF7F2] flex flex-col">
      {/* Full-screen background image — <img> so browser can discover + preload it (improves LCP) */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="/images/feet.png"
          alt=""
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 pb-32 pt-20 sm:pt-24 md:pt-28 shrink-0 min-w-0 w-full max-w-[100vw]">
        {/* Centered logo (wax-seal style) */}
        <div className="flex justify-center mb-4 drop-shadow-xl">
          <img
            src="/images/wax seal.png"
            alt="Lunara"
            className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-md"
          />
        </div>

        {/* Welcome / Private Access */}
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="font-script text-6xl sm:text-7xl md:text-[100px] lg:text-[115px] text-white leading-none tracking-wide"
            style={{ textShadow: '0px 2px 4px rgba(87,70,64,0.25)' }}
          >
            Welcome
          </h1>
          <p className="font-roman text-white text-xl md:text-[27px] tracking-wider mt-2">
            Private Access
          </p>
        </div>

        {/* Frosted oval form container */}
        <div
          className="w-full max-w-2xl bg-[#efefef]/85 backdrop-blur-md border border-[#4e1c00]/15 rounded-[60px] px-8 py-10 md:px-12 md:py-12"
          style={{ boxShadow: 'inset 0px 0px 24px 0px rgba(212,204,190,0.6)' }}
        >
          {mfaToken ? (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <div className="text-[#4e1b00] text-4xl mb-3">&#128274;</div>
                <h2 className="font-roman text-[#4e1b00] text-xl md:text-2xl tracking-wide">
                  Two-Factor Authentication
                </h2>
                <p className="font-roman text-[#574640] text-sm mt-2">
                  Enter the 6-digit code from your authenticator app, or use a backup code.
                </p>
              </div>

              <div>
                <label htmlFor="mfa-code" className="sr-only">Verification Code</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\s/g, ''))}
                  required
                  placeholder="000000"
                  maxLength={8}
                  className="w-full px-5 py-3.5 bg-white/95 border border-[#571e00]/25 rounded-2xl font-roman text-[#4e1b00] text-2xl tracking-[0.4em] text-center placeholder:text-[#4e1b00]/40 placeholder:tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 focus:border-[#4e1b00]/40"
                />
              </div>

              {mfaError && (
                <div className="text-red-700 text-sm text-center font-roman py-2" role="alert">
                  {mfaError}
                </div>
              )}

              <div className="flex justify-center pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full max-w-[200px] px-6 py-3.5 bg-white/95 border border-[#571e00]/30 rounded-2xl font-roman text-[#4e1b00] text-lg tracking-wider shadow-sm hover:bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setMfaToken(null); setMfaCode(''); setMfaError(''); }}
                  className="font-roman text-[#574640] text-sm tracking-wider underline underline-offset-2 hover:text-[#4e1b00] transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full px-5 py-3.5 bg-white/95 border border-[#571e00]/25 rounded-2xl font-roman text-[#4e1b00] text-base tracking-wider placeholder:text-[#4e1b00]/60 focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 focus:border-[#4e1b00]/40"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    autoComplete="current-password"
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
                    className="w-full max-w-[200px] px-6 py-3.5 bg-white/95 border border-[#571e00]/30 rounded-2xl font-roman text-[#4e1b00] text-lg tracking-wider shadow-sm hover:bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-[#4e1b00]/25 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Entering...' : 'Enter'}
                  </button>
                </div>
              </form>

              <div className="text-center mt-6">
                <Link
                  to="/forgot-password"
                  className="font-roman text-[#574640] text-sm md:text-base tracking-wider underline underline-offset-2 hover:text-[#4e1b00] transition-colors"
                >
                  forgot your password?
                </Link>
              </div>

              {/* OAuth divider + Google button */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-[#4e1b00]/15" />
                <span className="font-roman text-[#574640] text-sm tracking-wider">or</span>
                <div className="flex-1 h-px bg-[#4e1b00]/15" />
              </div>

              <div className="flex justify-center mt-5">
                <a
                  href={getGoogleOAuthStartUrl(
                    typeof window !== 'undefined' ? window.location.origin : ''
                  )}
                  className="flex items-center gap-3 px-6 py-3 bg-white/95 border border-[#571e00]/20 rounded-2xl font-roman text-[#4e1b00] text-base tracking-wider shadow-sm hover:bg-white hover:shadow transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </a>
              </div>
            </>
          )}
        </div>

        {/* Not a client yet? / LEARN MORE */}
        <div className="text-center mt-10">
          <p className="font-roman text-white text-lg md:text-xl tracking-wide mb-2">
            Not a client yet?
          </p>
          <Link
            to="/#offerings"
            className="font-roman text-white text-base md:text-lg tracking-[0.15em] uppercase underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            LEARN MORE
          </Link>
        </div>
      </main>

      {/* Spacer fills remaining space so footer stays at bottom of viewport */}
      <div className="flex-1 min-h-0 shrink-0" />
      <SimpleFooter fixed={false} />
    </div>
  );
};

export default LoginPage;
