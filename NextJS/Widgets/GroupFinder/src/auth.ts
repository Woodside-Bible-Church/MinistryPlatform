import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"
import MinistryPlatform from "@/providers/MinistryPlatform/ministryPlatformAuthProvider"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MinistryPlatform({
      clientId: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
      clientSecret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, account, profile }): Promise<JWT> {
      if (account && profile) {
        const mpProfile = profile as { ext_Contact_ID?: string }
        let contactId = mpProfile.ext_Contact_ID

        if (!contactId && profile.email && account.access_token) {
          try {
            const response = await fetch(
              `${process.env.MINISTRY_PLATFORM_BASE_URL}/api/tables/Contacts?$filter=Email_Address='${encodeURIComponent(profile.email as string)}'&$select=Contact_ID`,
              {
                headers: {
                  'Authorization': `Bearer ${account.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            if (response.ok) {
              const contacts = await response.json()
              if (contacts && contacts.length > 0) {
                contactId = contacts[0].Contact_ID?.toString()
              }
            }
          } catch (error) {
            console.error('JWT Callback - Error looking up Contact_ID:', error)
          }
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          contactId: contactId,
        } as JWT
      }

      if (!token) return token

      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      if (token.refreshToken) {
        try {
          const response = await fetch(`${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
              client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
              client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
            }),
          })
          if (response.ok) {
            const refreshedTokens = await response.json()
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
              refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            } as JWT
          }
        } catch (error) {
          console.error('JWT Callback - Error refreshing token:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      const typedToken = token as { contactId?: string }
      if (token && session.user) {
        session.user.id = typedToken.contactId || token.sub as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
  },
})
