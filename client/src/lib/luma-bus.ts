// Luma event bus for mode changes and whispers
export const LumaEvt = {
  MODE_CHANGED: 'luma:mode_changed',
  WHISPER: 'luma:whisper',
  PIPELINE_TICK: 'luma:pipeline_tick'
} as const;

export function emit(eventType: string, data: any): void {
  const event = new CustomEvent(eventType, { detail: data });
  document.dispatchEvent(event);
}

export function subscribe(eventType: string, handler: (data: any) => void): () => void {
  const listener = (event: CustomEvent) => handler(event.detail);
  document.addEventListener(eventType, listener as EventListener);
  
  return () => document.removeEventListener(eventType, listener as EventListener);
}

// Backward compatibility
export const publish = emit;