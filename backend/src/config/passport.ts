import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { JWTPayload } from '../types';
import logger from '../utils/logger';

/** True when Google client id/secret are present (strategy is registered). */
export const isGoogleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

/**
 * OAuth redirect URI registered with Google. Must be an absolute HTTPS URL in
 * production. Render sets RENDER_EXTERNAL_URL; we default the callback from it
 * when GOOGLE_CALLBACK_URL is unset to avoid redirect_uri_mismatch.
 */
export function resolveGoogleCallbackUrl(): string {
  const explicit = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (explicit) return explicit;
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  if (render) {
    return `${render.replace(/\/$/, '')}/api/auth/google/callback`;
  }
  return '/api/auth/google/callback';
}

// JWT Strategy - issuer/audience must match tokenUtils
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      algorithms: ['HS256'],
      issuer: 'lunara-api',
      audience: 'lunara-frontend',
    },
    async (jwt_payload: JWTPayload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
          return done(null, user);
        }
        logger.warn('JWT valid but user not found in DB', { userId: jwt_payload.id });
        return done(null, false);
      } catch (error) {
        logger.warn('JWT strategy error', { error: String(error) });
        return done(error, false);
      }
    }
  )
);

// Local Strategy (Email/Password)
// NOSONAR: 'password' is a parameter name, not a hard-coded credential
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password', // NOSONAR: Field name for form input, not a credential
    },
    async (email: string, password: string, done) => {
      // NOSONAR: Parameter name, not a credential
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        if (user.isLocked()) {
          return done(null, false, { message: 'Account temporarily locked. Please try again later.' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
if (isGoogleOAuthEnabled) {
  const clientID = process.env.GOOGLE_CLIENT_ID as string;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
  const googleCallbackUrl = resolveGoogleCallbackUrl();
  if (process.env.NODE_ENV === 'production' && googleCallbackUrl.startsWith('/')) {
    logger.warn(
      'Google OAuth: callback URL is relative in production. Set GOOGLE_CALLBACK_URL (or use Render with RENDER_EXTERNAL_URL) so it matches Google Cloud Console.'
    );
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: googleCallbackUrl,
        scope: ['profile', 'email'],
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const primaryEmail = profile.emails?.[0]?.value;
          const allEmails = (profile.emails ?? []).map(e => e?.value).filter(Boolean) as string[];
          const email = primaryEmail ?? allEmails[0];
          if (!email) {
            return done(new Error('No email associated with Google account'), false);
          }

          const normalizedEmail = email.toLowerCase().trim();

          // First, try to find by linked Google provider ID (secure path)
          let user = await User.findOne({
            'oauthProviders.provider': 'google',
            'oauthProviders.providerId': profile.id,
          });

          if (user) {
            return done(null, user);
          }

          // No linked account — check if an email-matching account exists
          const emailUser = await User.findOne({ email: normalizedEmail });
          if (emailUser) {
            const googleLink = emailUser.oauthProviders?.find((p) => p.provider === 'google');
            if (googleLink) {
              if (googleLink.providerId === profile.id) {
                return done(null, emailUser);
              }
              return done(null, false, {
                message: 'This email is linked to a different Google account.',
              });
            }

            if (!emailUser.isEmailVerified) {
              return done(null, false, {
                message: 'Please verify your email first, then sign in with Google to link your account.',
              });
            }

            emailUser.oauthProviders = [
              ...(emailUser.oauthProviders ?? []),
              {
                provider: 'google' as const,
                providerId: profile.id,
                email: normalizedEmail,
              },
            ];
            await emailUser.save();
            logger.info('Google OAuth: linked Google to existing verified user', {
              userId: String(emailUser._id),
              email: normalizedEmail,
            });
            return done(null, emailUser);
          }

          logger.warn('Google OAuth: no user found', {
            lookedUpEmail: normalizedEmail,
            profileId: profile.id,
            allEmails: allEmails.map(e => e.toLowerCase()),
          });
          return done(null, false, {
            message: 'No account found for this email. Please contact your provider to get started.',
          });
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
  logger.info('Google OAuth strategy configured', { callbackURL: googleCallbackUrl });
} else {
  logger.info('Google OAuth not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set)');
}

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { _id: string })._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; // NOSONAR: Exporting configured instance, not re-exporting a default from another module
