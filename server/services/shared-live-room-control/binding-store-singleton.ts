import { SharedLiveRoomBindingStore } from "./binding-store";

let sharedBindingStore: SharedLiveRoomBindingStore | null = null;

export const getSharedLiveRoomBindingStore = (): SharedLiveRoomBindingStore => {
  sharedBindingStore ??= new SharedLiveRoomBindingStore();
  return sharedBindingStore;
};
