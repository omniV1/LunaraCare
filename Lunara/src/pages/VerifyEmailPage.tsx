import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SimpleFooter } from '../components/layout/SimpleFooter';
import { getBaseApiUrl } from '../utils/getBaseApiUrl';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check the link in your email.');
      return;
    }

    // AbortController cancels the in-flight fetch if the component unmounts
    // (e.g. user navigates away), preventing state updates on an unmounted component.
    const controller = new AbortController();

    const verify = async () => {
      try {
        const baseUrl = getBaseApiUrl();
        const response = await fetch(`${baseUrl}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message ?? data.error ?? 'Verification failed. The link may have expired.');
        }
      } catch (err) {
        // AbortError is expected on unmount — silently ignore it
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStatus('error');
        setMessage('Unable to reach the server. Please try again later.');
      }
    };

    verify();
    return () => controller.abort();
  }, [token]);

  return (
    <div className="min-h-[100dvh] min-h-screen bg-[#FAF7F2] flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      <div className="flex-1 flex items-center justify-center px-4 py-12 min-w-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/images/wax seal.png" alt="Lunara" className="w-16 h-16 mx-auto mb-4 object-contain" />
            </Link>
            <h1 className="font-serif text-2xl text-[#4E1B00] tracking-wide">Email Verification</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-[#E8E0D4] p-8 text-center">
            {status === 'verifying' && (
              <>
                <div className="w-12 h-12 border-4 border-[#D4956B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#6B4D37] font-roman">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-[#4E1B00] mb-2">Verified!</h2>
                <p className="text-sm text-[#6B4D37]/70 mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-[#6B4D37] text-white rounded-xl text-sm font-medium hover:bg-[#5a3f2d] transition-colors"
                >
                  Continue to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-[#4E1B00] mb-2">Verification Failed</h2>
                <p className="text-sm text-[#6B4D37]/70 mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-[#6B4D37] text-white rounded-xl text-sm font-medium hover:bg-[#5a3f2d] transition-colors"
                >
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <SimpleFooter />
    </div>
  );
};

export default VerifyEmailPage;
