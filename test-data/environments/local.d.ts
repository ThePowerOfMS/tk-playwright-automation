// test-data/environments/local.d.ts
declare function getLocalEnv(): Promise<Record<string, any>>;
export default getLocalEnv;
