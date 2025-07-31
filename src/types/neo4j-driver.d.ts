declare module 'neo4j-driver' {
  export interface Driver {
    session(): Session;
    close(): Promise<void>;
    verifyConnectivity(): Promise<void>;
  }

  export interface Session {
    run(query: string, params?: any): Promise<any>;
    close(): Promise<void>;
  }

  export const auth: {
    basic(username: string, password: string): any;
  };

  export function driver(url: string, auth: any): Driver;

  export default {
    driver,
    auth
  };
}