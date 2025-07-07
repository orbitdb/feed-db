import { Database } from "@orbitdb/core";
import type {
  AccessController,
  Identity,
  Storage,
  DagCborEncodable,
  MetaData,
  Log,
  LogEntry,
  InternalDatabase,
} from "@orbitdb/core";
import type { HeliaLibp2p } from "helia";
import type { Libp2p } from "libp2p";
import type { ServiceMap } from "@libp2p/interface";

const type = "feed" as const;

export type FeedDatabaseType = Awaited<ReturnType<ReturnType<typeof Feed>>>;

const Feed =
  () =>
  async <T extends ServiceMap = ServiceMap>({
    ipfs,
    identity,
    address,
    name,
    access,
    directory,
    meta,
    headsStorage,
    entryStorage,
    indexStorage,
    referencesCount,
    syncAutomatically,
    onUpdate,
  }: {
    ipfs: HeliaLibp2p<Libp2p<T>>;
    identity?: Identity;
    address: string;
    name?: string;
    access?: AccessController;
    directory?: string;
    meta?: MetaData;
    headsStorage?: Storage;
    entryStorage?: Storage;
    indexStorage?: Storage;
    referencesCount?: number;
    syncAutomatically?: boolean;
    onUpdate?: (log: Log, entry: LogEntry) => void;
  }) => {
    const database = await Database({
      ipfs,
      identity,
      address,
      name,
      access,
      directory,
      meta,
      headsStorage,
      entryStorage,
      indexStorage,
      referencesCount,
      syncAutomatically,
      onUpdate,
    });

    const { add, remove, iterator, all } = FeedApi({ database });

    return {
      ...database,
      type,
      add,
      remove,
      iterator,
      all,
    };
  };

Feed.type = type;

export const FeedApi = ({ database }: { database: InternalDatabase }) => {
  const { addOperation, log } = database;

  const add = async (value: DagCborEncodable): Promise<string> => {
    return addOperation({ op: "ADD", key: null, value });
  };

  const remove = async (hash: string): Promise<string> => {
    return addOperation({ op: "DEL", key: null, value: hash });
  };

  const iterator = async function* ({
    amount,
  }: { amount?: number } = {}): AsyncGenerator<
    {
      value: unknown;
      hash: string;
    },
    void,
    unknown
  > {
    const vals: { [val: string]: boolean } = {};
    let count = 0;
    for await (const entry of log.traverse()) {
      const { op, value } = entry.payload;
      const { hash } = entry;

      if (op === "ADD" && !vals[hash]) {
        count++;
        const hash = entry.hash;
        vals[hash] = true;
        yield { value, hash };
      } else if (op === "DEL" && !vals[value as string]) {
        vals[value as string] = true;
      }
      if (amount !== undefined && count >= amount) {
        break;
      }
    }
  };

  const all = async (): Promise<
    {
      value: unknown;
      hash: string;
    }[]
  > => {
    const values = [];
    for await (const entry of iterator()) {
      values.unshift(entry);
    }
    return values;
  };
  return {
    add,
    remove,
    iterator,
    all,
  };
};

export default Feed;
