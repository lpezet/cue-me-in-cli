declare module "google-auto-auth" {
  declare function autoAuth(config: {}): AutoAuth;
  declare class AutoAuth {
    constructor(config: {});
    getToken(callback: (err: Error, token: string) => void): void;
  }
  export = autoAuth;
  // interface ConfigstoreOptions {
  //  globalConfigPath?: boolean;
  //  configPath?: string;
  // }
}
