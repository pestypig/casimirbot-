const profileAdmissionTails = new Map<string, Promise<void>>();

/**
 * Serializes room-join and personal-Realtime admission for one profile inside
 * this server process. Multi-worker deployments still require a distributed
 * lease; the runtime projection advertises that boundary explicitly.
 */
export const acquireSharedRealtimeProfileAdmissionLock = async (
  profileIdInput: string,
): Promise<() => void> => {
  const profileId = profileIdInput.trim();
  const prior = profileAdmissionTails.get(profileId) ?? Promise.resolve();
  let releaseCurrent!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  const tail = prior.then(() => current);
  profileAdmissionTails.set(profileId, tail);
  await prior;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseCurrent();
    if (profileAdmissionTails.get(profileId) === tail) {
      profileAdmissionTails.delete(profileId);
    }
  };
};

export const runWithSharedRealtimeProfileAdmissionLock = async <T>(
  profileId: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const release = await acquireSharedRealtimeProfileAdmissionLock(profileId);
  try {
    return await operation();
  } finally {
    release();
  }
};

export const resetSharedRealtimeProfileAdmissionLocksForTests = (): void => {
  profileAdmissionTails.clear();
};
