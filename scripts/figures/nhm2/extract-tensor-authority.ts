export interface TensorAuthorityCell {
  row: string;
  col: string;
  authority: "available" | "review";
  value: number;
  rowLabel: string;
  colLabel: string;
  note: string;
}

export function extractTensorAuthority(_ledger: any): TensorAuthorityCell[] {
  const axes = ["0", "1", "2", "3"];
  const cells: TensorAuthorityCell[] = [];
  for (const row of axes) {
    for (const col of axes) {
      const diagonal = row === col;
      cells.push({
        row,
        col,
        rowLabel: `G_${row}${col}/8pi required`,
        colLabel: `T_${row}${col} tile-effective`,
        authority: diagonal ? "available" : "review",
        value: diagonal ? 1 : 0.35,
        note: diagonal ? "diagonal reduced-order counterpart available" : "full/off-diagonal authority review-gated",
      });
    }
  }
  return cells;
}
