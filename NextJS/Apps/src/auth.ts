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
    async jwt({ token, account, profile, trigger }): Promise<JWT> {
      console.log('JWT Callback - trigger:', trigger, 'account:', !!account, 'token exists:', !!token, 'profile:', !!profile)
      
      if (account && profile) {
        console.log('JWT Callback - Setting initial token from account')
        console.log('Profile roles:', (profile as any).roles)

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          sub: profile.sub,
          userId: profile.user_id,
          email: profile.email,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          roles: (profile as any).roles || [],
        } as JWT
      }
    
      if (!token) {
        console.log('JWT Callback - No token available')
        return token
      }

      // Check if token is expired and refresh if needed
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        console.log('JWT Callback - Token still valid')
        return token
      }
    
      console.log('JWT Callback - Token expired, attempting refresh')
      
      // Token is expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch(`${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
              client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
              client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
            }),
          })
        
          if (response.ok) {
            const refreshedTokens = await response.json()
            console.log('JWT Callback - Token refreshed successfully')
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
              refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            } as JWT
          } else {
            console.error('JWT Callback - Failed to refresh token:', response.status)
            return token
          }
        } catch (error) {
          console.error('JWT Callback - Error refreshing token:', error)
          return token
        }
      }
    
      console.log('JWT Callback - No refresh token available')
      return token
    },
  async session({ session, token }) {
    console.log('Session Callback - token exists:', !!token)
    console.log('Token sub:', token?.sub)
    console.log('Token roles:', token?.roles)

    if (token && session.user) {
      session.user.id = token.sub as string // Use sub as the user ID
      session.accessToken = token.accessToken as string
      session.firstName = token.firstName as string
      session.lastName = token.lastName as string
      session.email = token.email as string
      session.sub = token.sub as string
      session.roles = (token.roles as string[]) || []
    }

    console.log('Final session user ID:', session.user?.id)
    console.log('Final session roles:', session.roles)
    return session
  },
  },
})