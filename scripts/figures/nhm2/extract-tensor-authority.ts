export interface TensorAuthorityCell {
  row: string;
  col: string;
  authority: "available" | "review";
  value: number;
}

export function extractTensorAuthority(_ledger: any): TensorAuthorityCell[] {
  const axes = ["0", "1", "2", "3"];
  const cells: TensorAuthorityCell[] = [];
  for (const row of axes) {
    for (const col of axes) {
      const diagonal = row === col;
      cells.push({ row, col, authority: diagonal ? "available" : "review", value: diagonal ? 1 : 0.35 });
    }
  }
  return cells;
}
