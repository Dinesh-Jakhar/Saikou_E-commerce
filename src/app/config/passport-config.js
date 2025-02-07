const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const config = require('./config')
const { signUpWithGoogle } = require('../utils/requiredFunctions')
const crypto = require('crypto')

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const randomPassword = crypto.randomBytes(16).toString('hex')
        const firstName = profile.name.givenName
        const lastName = profile.name.familyName || ''
        const email = profile.emails[0].value
        const result = await signUpWithGoogle(
          email,
          firstName,
          lastName,
          randomPassword
        )
        if (!result || !result.token) {
          console.error('Google OAuth Error: User or Token is missing')
          return done(null, false, { message: 'Authentication failed' })
        }
        return done(null, result)
      } catch (err) {
        return done(err, null)
      }
      // Here you can save user info in the database
      // return done(null, profile);
    }
  )
)

// passport.serializeUser((data, done) => {
//     done(null, data);
// });

// passport.deserializeUser((data, done) => {
//     done(null, data);
// });
module.exports = passport
