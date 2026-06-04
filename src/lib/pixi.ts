/* eslint-disable @typescript-eslint/no-explicit-any */
// PixiJS helper/factory for client-side rendering container.
// Prevents Server-Side Rendering (SSR) issues by ensuring client-only imports.

export const PIXI_DEFAULT_OPTIONS = {
  backgroundColor: 0x0d1117,
  antialias: true,
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  autoDensity: true,
};

/**
 * Dynamically imports PixiJS and instantiates a new Application.
 */
export async function createPixiApplication(options: any = {}): Promise<any> {
  const pixiModule = await import('pixi.js');
  const app = new pixiModule.Application();
  
  await app.init({
    ...PIXI_DEFAULT_OPTIONS,
    ...options,
  });

  return {
    app,
    pixiModule,
  };
}
