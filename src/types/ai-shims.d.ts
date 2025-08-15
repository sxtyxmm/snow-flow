// Minimal shims so TypeScript compiles before installing AI SDK deps.

declare module 'ai' {
  export const streamText: any;
  export type Tool = any;
  export const experimental_createMCPClient: any;
}

declare module '@ai-sdk/openai' {
  export const openai: any;
}

declare module '@ai-sdk/google' {
  export const google: any;
}

declare module '@openrouter/ai-sdk-provider' {
  export const createOpenRouter: any;
  export const openrouter: any;
}

declare module 'conf' {
  const Conf: any;
  export default Conf;
}
