export type DBElements =
  | number
  | boolean
  | string
  | { [key: string]: DBElements }
  | Array<DBElements>;
