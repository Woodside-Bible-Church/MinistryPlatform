import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"
import MinistryPlatform from "@/providers/MinistryPlatform/ministryPlatformAuthProvider"
import { cookies } from "next/headers"
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper"


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

        // Fetch user groups during initial sign-in
        let allRoles: string[] = (profile as any).roles || []

        try {
          const mp = new MPHelper()
          const users = await mp.getTableRecords<{ User_ID: number }>({
            table: 'dp_Users',
            select: 'User_ID',
            filter: `User_GUID='${profile.sub}'`,
            top: 1,
          })

          if (users.length > 0) {
            const userId = users[0].User_ID
            const allUserGroupLinks = await mp.getTableRecords<{ User_Group_ID: number }>({
              table: 'dp_User_User_Groups',
              select: 'User_Group_ID',
              filter: `User_ID=${userId}`,
            })

            const groupIds = allUserGroupLinks.map(g => g.User_Group_ID).filter(Boolean)

            if (groupIds.length > 0) {
              const groupIdList = groupIds.join(',')
              const userGroups = await mp.getTableRecords<{ User_Group_ID: number; User_Group_Name: string }>({
                table: 'dp_User_Groups',
                select: 'User_Group_ID, User_Group_Name',
                filter: `User_Group_ID IN (${groupIdList})`,
              })

              const allGroupNames = userGroups.map(g => g.User_Group_Name).filter(Boolean)
              allRoles = [...new Set([...allRoles, ...allGroupNames])]
              console.log('JWT Callback - Initial token created with roles:', allRoles)
            }
          }
        } catch (error) {
          console.error('JWT Callback - Error fetching user groups during sign-in:', error)
        }

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
          roles: allRoles,
        } as JWT
      }
    
      if (!token) {
        console.log('JWT Callback - No token available')
        return token
      }

      // Check if token is expired and refresh if needed
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        console.log('JWT Callback - Token still valid')
        // Token is valid, return it as-is
        // Roles were already fetched during initial sign-in
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
      session.contactId = token.userId as string

      // Fetch BOTH Security Roles and User Groups from MinistryPlatform via stored procedure
      try {
        const mp = new MPHelper()

        // Call stored procedure to get all roles (Security Roles + User Groups) in one efficient call
        const result = await mp.executeProcedureWithBody(
          'api_Custom_GetUserRolesAndGroups_JSON',
          { '@UserGUID': session.sub }
        ) as unknown as any[][]

        // Extract roles from nested array structure
        // Result format: [[{ JSON_F52E2B6118A111d1B10500805F49916B: '[{"Roles":"..."}]' }]]
        if (result && result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
          const resultObject = result[0][0]
          const jsonKey = Object.keys(resultObject)[0]
          const jsonString = resultObject[jsonKey]
          const roleObjects = JSON.parse(jsonString)
          session.roles = roleObjects.map((r: { Roles: string }) => r.Roles)
          console.log('Total roles fetched (Security Roles + User Groups):', session.roles.length)
        } else {
          session.roles = []
          console.log('No roles found for user')
        }

        // Also fetch Contact_ID if not already set
        if (!session.contactId && session.sub) {
          const users = await mp.getTableRecords<{ Contact_ID: number }>({
            table: 'dp_Users',
            select: 'Contact_ID',
            filter: `User_GUID='${session.sub}'`,
            top: 1,
          })
          if (users.length > 0) {
            session.contactId = String(users[0].Contact_ID)
          }
        }
      } catch (error) {
        console.error('Error fetching roles from stored procedure:', error)
        // On error, set empty roles array
        session.roles = []
      }

      // Check for admin simulation
      const isAdmin = session.roles?.includes('Administrators')
      if (isAdmin) {
        try {
          const cookieStore = await cookies()
          const simulationCookie = cookieStore.get('admin-simulation')

          if (simulationCookie) {
            const simulation = JSON.parse(simulationCookie.value)

            // Apply simulation overrides
            if (simulation.type === 'impersonate' && simulation.contactId) {
              // Fetch the impersonated user's actual roles and groups from MinistryPlatform
              try {
                const mp = new MPHelper()

                // Get the user's User_ID from their Contact_ID
                const users = await mp.getTableRecords<{ User_ID: number; Display_Name: string }>({
                  table: 'dp_Users',
                  select: 'User_ID, Display_Name',
                  filter: `Contact_ID=${simulation.contactId}`,
                  top: 1,
                })

                if (users.length > 0) {
                  const userId = users[0].User_ID
                  let roleNames: string[] = []

                  // Fetch User Groups
                  const userGroupLinks = await mp.getTableRecords<{ User_Group_ID: number }>({
                    table: 'dp_User_User_Groups',
                    select: 'User_Group_ID',
                    filter: `User_ID=${userId}`,
                  })

                  const groupIds = userGroupLinks.map(g => g.User_Group_ID).filter(Boolean)

                  if (groupIds.length > 0) {
                    // Use IN() clause for cleaner query
                    const groupIdList = groupIds.join(',')
                    const userGroups = await mp.getTableRecords<{ User_Group_ID: number; User_Group_Name: string }>({
                      table: 'dp_User_Groups',
                      select: 'User_Group_ID, User_Group_Name',
                      filter: `User_Group_ID IN (${groupIdList})`,
                    })

                    roleNames.push(...userGroups.map(g => g.User_Group_Name).filter(Boolean))
                  }

                  // Note: Security Roles are not fetched during impersonation
                  // They come from OAuth token during login and are sufficient
                  // We only fetch User Groups for impersonation permissions

                  session.simulation = {
                    type: 'impersonate',
                    contactId: simulation.contactId,
                    originalUserId: session.user.id,
                    originalRoles: session.roles,
                  }
                  session.roles = roleNames
                  console.log(`Impersonation applied - User: ${users[0].Display_Name}, Roles (User Groups):`, roleNames)
                } else {
                  console.log('No user found for contact ID:', simulation.contactId)
                  // User has no MP account, so no roles
                  session.simulation = {
                    type: 'impersonate',
                    contactId: simulation.contactId,
                    originalUserId: session.user.id,
                    originalRoles: session.roles,
                  }
                  session.roles = []
                }
              } catch (error) {
                console.error('Error fetching impersonated user roles:', error)
                // On error, clear roles for safety
                session.simulation = {
                  type: 'impersonate',
                  contactId: simulation.contactId,
                  originalUserId: session.user.id,
                  originalRoles: session.roles,
                }
                session.roles = []
              }
            } else if (simulation.type === 'roles' && Array.isArray(simulation.roles)) {
              // Override roles with simulated roles
              session.simulation = {
                type: 'roles',
                originalRoles: session.roles,
                originalUserId: session.user.id,
              }
              session.roles = simulation.roles
            }
          }
        } catch (error) {
          console.error('Error applying simulation:', error)
        }
      }
    }

    console.log('Final session user ID:', session.user?.id)
    console.log('Final session roles:', session.roles)
    return session
  },
  },
})