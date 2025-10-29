import { MinistryPlatformClient } from "../core/ministryPlatformClient";
import { ProcedureInfo, QueryParams } from "../Interfaces/mpProviderInterfaces";

export class ProcedureService {
    private client: MinistryPlatformClient;

    constructor(client: MinistryPlatformClient) {
        this.client = client;
    }

    /**
     * Returns the list of procedures available to the current user with basic metadata.
     */
    public async getProcedures(search?: string): Promise<ProcedureInfo[]> {
        try {
            await this.client.ensureValidToken();

            const params: QueryParams | undefined = search ? { $search: search } : undefined;
            return await this.client.getHttpClient().get<ProcedureInfo[]>('/procs', params);
        } catch (error) {
            console.error('Error getting procedures:', error);
            throw error;
        }
    }

    /**
     * Executes the requested stored procedure retrieving parameters from the query string.
     */
    public async executeProcedure(
        procedure: string, 
        params?: QueryParams
    ): Promise<unknown[][]> {
        try {
            await this.client.ensureValidToken();

            console.log('Executing procedure:', procedure);
            console.log('Query Params:', params);

            const endpoint = `/procs/${encodeURIComponent(procedure)}`;
            const data = await this.client.getHttpClient().get<unknown[][]>(endpoint, params);
            
            console.log('Procedure results:', data);
            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, error);
            throw error;
        }
    }

    /**
     * Executes the requested stored procedure with provided parameters in the request body.
     */
    public async executeProcedureWithBody(
        procedure: string, 
        parameters: Record<string, unknown>
    ): Promise<unknown[][]> {
        try {
            await this.client.ensureValidToken();

            console.log('Executing procedure with body:', procedure);
            console.log('Parameters:', parameters);

            const endpoint = `/procs/${encodeURIComponent(procedure)}`;
            const data = await this.client.getHttpClient().post<unknown[][]>(endpoint, parameters);
            
            console.log('Procedure results:', data);
            return data;
        } catch (error) {
            console.error(`Error executing procedure ${procedure}:`, error);
            throw error;
        }
    }
}