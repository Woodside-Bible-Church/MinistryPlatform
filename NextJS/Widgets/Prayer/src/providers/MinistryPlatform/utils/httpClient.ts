import { QueryParams, RequestBody } from "../Interfaces/mpProviderInterfaces";

export class HttpClient {
    private baseUrl: string;
    private getToken: () => string;

    constructor(baseUrl: string, getToken: () => string) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
    }

    async get<T = unknown>(endpoint: string, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Try to get the error message from the response body
            let errorMessage = `GET ${endpoint} failed: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.text();
                console.error('MP API Error Response:', errorBody);
                errorMessage += ` - ${errorBody}`;
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            throw new Error(errorMessage);
        }

        return await response.json() as T;
    }

    async post<T = unknown>(endpoint: string, body?: RequestBody, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);
        const bodyString = body ? JSON.stringify(body) : undefined;

        console.error('[HttpClient.post] URL:', url);
        console.error('[HttpClient.post] Body string:', bodyString);
        console.error('[HttpClient.post] Body length:', bodyString?.length);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: bodyString
        });

        console.error('[HttpClient.post] Response status:', response.status);
        console.error('[HttpClient.post] Response headers:', JSON.stringify([...response.headers.entries()]));

        if (!response.ok) {
            // Try to get the error message from the response body
            let errorMessage = `POST ${endpoint} failed: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.text();
                console.error('MP API Error Response:', errorBody);
                errorMessage += ` - ${errorBody}`;
            } catch (e) {
                console.error('Could not parse error response:', e);
            }
            throw new Error(errorMessage);
        }

        return await response.json() as T;
    }

    async postFormData<T = unknown>(endpoint: string, formData: FormData, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Accept': 'application/json'
                // Don't set Content-Type for FormData
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`POST ${endpoint} failed: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    async put<T = unknown>(endpoint: string, body: RequestBody, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`PUT ${endpoint} failed: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    async putFormData<T = unknown>(endpoint: string, formData: FormData, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Accept': 'application/json'
                // Don't set Content-Type for FormData
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`PUT ${endpoint} failed: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    async delete<T = unknown>(endpoint: string, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`DELETE ${endpoint} failed: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
    }

    public buildUrl(endpoint: string, queryParams?: QueryParams): string {
        const url = `${this.baseUrl}${endpoint}`;
        if (!queryParams) return url;

        const queryString = this.buildQueryString(queryParams);
        return queryString ? `${url}?${queryString}` : url;
    }

    private buildQueryString(params: QueryParams): string {
        return Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.map(v => `${key}=${encodeURIComponent(String(v))}`).join('&');
                }
                return `${key}=${encodeURIComponent(String(value))}`;
            })
            .join('&');
    }
}