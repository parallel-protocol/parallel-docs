// wawoff2 ships no types. Only `decompress` is used (WOFF2 → TTF/OTF bytes).
declare module "wawoff2" {
  const wawoff2: {
    decompress(input: Uint8Array): Promise<Uint8Array>;
  };
  export default wawoff2;
}
