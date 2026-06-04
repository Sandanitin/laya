import mitt from 'mitt';
import type { CanvasCommand, CanvasEvent } from '@/types/canvas';

// ─── CanvasCommandBus ────────────────────────────────────────────────────────
// The single bridge between React (stores/components) and the PixiJS engine.
// React dispatches Commands → Engine processes them.
// Engine emits Events → React updates stores.

type CommandEvents = { [K in CanvasCommand['type']]: Extract<CanvasCommand, { type: K }> };
type CanvasEvents  = { [K in CanvasEvent['type']]: Extract<CanvasEvent, { type: K }> };

// Command bus: React → PixiJS
const commandEmitter = mitt<CommandEvents>();

// Event bus: PixiJS → React
const eventEmitter = mitt<CanvasEvents>();

// ─── Public API ──────────────────────────────────────────────────────────────

export const CanvasCommandBus = {
  /** Dispatch a command from React to the PixiJS engine */
  dispatch<T extends CanvasCommand>(command: T): void {
    commandEmitter.emit(command.type as T['type'], command as never);
  },

  /** Subscribe the PixiJS engine to incoming commands */
  onCommand<T extends CanvasCommand['type']>(
    type: T,
    handler: (cmd: Extract<CanvasCommand, { type: T }>) => void
  ): () => void {
    commandEmitter.on(type as T, handler as never);
    return () => commandEmitter.off(type as T, handler as never);
  },

  /** Emit an event from the PixiJS engine to React */
  emit<T extends CanvasEvent>(event: T): void {
    eventEmitter.emit(event.type as T['type'], event as never);
  },

  /** Subscribe a React component/hook to canvas events */
  onEvent<T extends CanvasEvent['type']>(
    type: T,
    handler: (evt: Extract<CanvasEvent, { type: T }>) => void
  ): () => void {
    eventEmitter.on(type as T, handler as never);
    return () => eventEmitter.off(type as T, handler as never);
  },

  /** Clear all listeners (called on engine destroy) */
  clear(): void {
    commandEmitter.all.clear();
    eventEmitter.all.clear();
  },
};
