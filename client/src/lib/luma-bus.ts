// Simple event bus for Luma whispers
export function publish(eventType: string, data: any): void {
  const event = new CustomEvent(eventType, { detail: data });
  document.dispatchEvent(event);
}

export function subscribe(eventType: string, handler: (data: any) => void): () => void {
  const listener = (event: CustomEvent) => handler(event.detail);
  document.addEventListener(eventType, listener as EventListener);
  
  return () => document.removeEventListener(eventType, listener as EventListener);
}