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

        console.log('===== HTTP GET =====');
        console.log('Endpoint:', endpoint);
        console.log('URL:', url);
        console.log('Query Params:', queryParams);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error(`GET ${endpoint} error response:`, errorBody);
            } catch (e) {
                console.error(`GET ${endpoint} - could not read error response body`);
            }
            throw new Error(`GET ${endpoint} failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
        }

        return await response.json() as T;
    }

    async post<T = unknown>(endpoint: string, body?: RequestBody, queryParams?: QueryParams): Promise<T> {
        const url = this.buildUrl(endpoint, queryParams);

        console.log('===== HTTP POST =====');
        console.log('Endpoint:', endpoint);
        console.log('URL:', url);
        console.log('Body (before stringify):', body);
        console.log('Body (after stringify):', body ? JSON.stringify(body) : undefined);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error(`POST ${endpoint} error response:`, errorBody);
            } catch (e) {
                console.error(`POST ${endpoint} - could not read error response body`);
            }
            throw new Error(`POST ${endpoint} failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
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
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error(`POST ${endpoint} error response:`, errorBody);
            } catch (e) {
                console.error(`POST ${endpoint} - could not read error response body`);
            }
            throw new Error(`POST ${endpoint} failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
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
                    return value.map(v => {
                        // Encode but preserve periods for Ministry Platform FK traversal
                        const encoded = encodeURIComponent(String(v));
                        return `${key}=${encoded.replace(/%2E/g, '.')}`;
                    }).join('&');
                }
                // Encode but preserve periods for Ministry Platform FK traversal
                const encoded = encodeURIComponent(String(value));
                return `${key}=${encoded.replace(/%2E/g, '.')}`;
            })
            .join('&');
    }
}