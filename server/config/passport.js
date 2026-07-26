const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const hasValidGoogleKeys =
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_SECRET &&
  !GOOGLE_CLIENT_ID.includes('your_google_client_id');

if (hasValidGoogleKeys) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL:  'http://localhost:5000/auth/google/callback',
        scope:        ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email  = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email });

            if (user) {
              user.googleId  = profile.id;
              user.avatar    = avatar || user.avatar;
              user.lastLogin = new Date();
              await user.save();
            } else {
              user = await User.create({
                googleId:  profile.id,
                name:      profile.displayName,
                email,
                avatar,
              });
            }
          } else {
            user.lastLogin = new Date();
            user.avatar    = avatar || user.avatar;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth 2.0 Passport Strategy initialized.');
} else {
  console.warn('⚠️  Google OAuth disabled (credentials placeholder or missing in server/.env). Email/Password authentication active.');
}

// Passport session serialization
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
