/**
 * jsdom には DataTransfer が無いので、テストから渡せる最小の代替を作る。
 * @/lib/dnd が使うメソッドとプロパティだけを備える。
 */
export type TestDataTransfer = {
  effectAllowed: DataTransfer["effectAllowed"];
  dropEffect: DataTransfer["dropEffect"];
  readonly types: string[];
  setData(format: string, data: string): void;
  getData(format: string): string;
};

export function createDataTransfer(): TestDataTransfer {
  const store = new Map<string, string>();

  return {
    effectAllowed: "none",
    dropEffect: "none",
    get types(): string[] {
      return Array.from(store.keys());
    },
    setData(format: string, data: string): void {
      store.set(format, data);
    },
    getData(format: string): string {
      return store.get(format) ?? "";
    },
  };
}
