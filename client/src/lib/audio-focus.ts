type AudioFocusHandle = {
  id: string;
  stop: () => void;
};

let activeHandle: AudioFocusHandle | null = null;

export const requestAudioFocus = (handle: AudioFocusHandle) => {
  if (activeHandle && activeHandle.id !== handle.id) {
    activeHandle.stop();
  }
  activeHandle = handle;
};

export const releaseAudioFocus = (id: string) => {
  if (activeHandle?.id === id) {
    activeHandle = null;
  }
};


let typingMuted = false;

export const setTypingMuted = (next: boolean) => {
  typingMuted = next;
};

export const isTypingMuted = () => typingMuted;
