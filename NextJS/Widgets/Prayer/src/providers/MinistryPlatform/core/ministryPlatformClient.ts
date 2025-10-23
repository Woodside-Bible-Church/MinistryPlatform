import { getClientCredentialsToken } from "../clientCredentials";
import { HttpClient } from "../utils/httpClient";
import { QueryParams } from "../Interfaces/mpProviderInterfaces";

// Token refresh interval - refresh 5 minutes before actual expiration for safety
const TOKEN_LIFE = 5 * 60 * 1000; // 5 minutes

/**
 * MinistryPlatformClient - Core HTTP client with automatic authentication management
 *
 * Manages OAuth2 client credentials authentication and provides a configured HttpClient
 * instance for all Ministry Platform API operations. Handles token lifecycle including
 * automatic refresh before expiration.
 */
export class MinistryPlatformClient {
    private token: string = ""; // Current access token
    private expiresAt: Date = new Date(0); // Token expiration time (initialized to epoch to force refresh)
    private baseUrl: string; // Ministry Platform instance base URL
    private httpClient: HttpClient; // HTTP client instance with token injection
    private useProvidedToken: boolean = false; // Flag to indicate if using a pre-existing token

    /**
     * Creates a new MinistryPlatformClient instance
     * Initializes the HTTP client and sets up token management
     *
     * @param providedToken - Optional pre-existing access token (e.g., from MP Widget auth)
     *                        If provided, client will use this token instead of OAuth client credentials
     */
    constructor(providedToken?: string) {
        // Get base URL from environment variable
        this.baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL!;

        // If a token is provided, use it and skip OAuth flow
        if (providedToken) {
            this.token = providedToken;
            this.useProvidedToken = true;
            // Set expiration far in the future since we don't manage the provided token's lifecycle
            this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }

        // Create HTTP client with token getter function for automatic authentication
        this.httpClient = new HttpClient(this.baseUrl, () => this.token);
    }

    /**
     * Ensures the authentication token is valid and refreshes if necessary
     * This method should be called before making any API requests to guarantee authentication
     * @throws Error if token refresh fails
     */
    public async ensureValidToken(): Promise<void> {
        // If using a provided token (e.g., MP Widget token), skip token refresh
        if (this.useProvidedToken) {
            return;
        }

        console.log("Checking token validity...");
        console.log("Expires at: ", this.expiresAt);
        console.log("Current time: ", new Date());

        // Check if token is expired or about to expire
        if (this.expiresAt < new Date()) {
            console.log("Token expired, refreshing...");

            try {
                // Get new access token using client credentials flow
                const creds = await getClientCredentialsToken();
                this.token = creds.access_token;

                // Set expiration time with safety buffer (TOKEN_LIFE before actual expiration)
                this.expiresAt = new Date(Date.now() + TOKEN_LIFE);

                console.log("Token refreshed. Expires at: ", this.expiresAt);
            } catch (error) {
                console.error("Failed to refresh token:", error);
                throw error;
            }
        }
    }

    /**
     * Returns the configured HTTP client instance for making authenticated requests
     * @returns HttpClient instance with automatic token injection
     */
    public getHttpClient(): HttpClient {
        return this.httpClient;
    }

    /**
     * GET request to MinistryPlatform API tables
     * @param tableName - Name of the table (e.g., 'Feedback_Entries')
     * @param queryParams - OData query parameters ($filter, $select, etc.)
     */
    public async get<T = unknown>(tableName: string, queryParams?: QueryParams): Promise<T> {
        await this.ensureValidToken();
        return this.httpClient.get<T>(`/tables/${tableName}`, queryParams);
    }

    /**
     * POST request to MinistryPlatform API tables
     * @param tableName - Name of the table
     * @param body - Data to post (usually an array of objects)
     * @param queryParams - Optional query parameters
     */
    public async post<T = unknown>(tableName: string, body: unknown, queryParams?: QueryParams): Promise<T> {
        await this.ensureValidToken();
        return this.httpClient.post<T>(`/tables/${tableName}`, body, queryParams);
    }

    /**
     * Call a MinistryPlatform stored procedure
     * @param procedureName - Name of the stored procedure (e.g., 'api_Custom_User_Response_Stats_JSON')
     * @param parameters - Parameters to pass to the stored procedure
     */
    public async callStoredProcedure<T = unknown>(procedureName: string, parameters?: QueryParams): Promise<T> {
        await this.ensureValidToken();
        return this.httpClient.post<T>(`/procs/${procedureName}`, parameters);
    }
}