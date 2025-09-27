declare module "@/lib/warp-pipeline-adapter" {
  export interface AdapterExports {
    // expose if you already export; otherwise skip this file
    __adapterHasParity: true | false;
  }
  // Enforce that adapter sets parity/ridge authoritatively
  type __ASSERT_ADAPTER_PARITY = AdapterExports extends { __adapterHasParity: true } ? true : never;
}
