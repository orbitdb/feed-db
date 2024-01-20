import { type Helia } from "helia";
import { rimraf } from "rimraf";

import Feed, { FeedDatabaseType } from "@/feed.js";
import { createTestHelia } from "./config.js";
import { Identities, Identity, KeyStore, KeyStoreType } from "@orbitdb/core";
import { expect } from "aegir/chai";
import { DBElements } from "@/types.js";

const keysPath = "./testkeys";

describe("Feed Database", () => {
  let ipfs: Helia;
  let identities;
  let keystore: KeyStoreType;
  let testIdentity1: Identity;
  let db: FeedDatabaseType;

  const databaseId = "feed-AAA";

  before(async () => {
    ipfs = await createTestHelia({ directory: "./ipfs1" });

    keystore = await KeyStore({ path: keysPath });
    identities = await Identities({ keystore });
    testIdentity1 = await identities.createIdentity({ id: "userA" });
  });

  after(async () => {
    if (ipfs) {
      await ipfs.stop();
    }

    if (keystore) {
      await keystore.close();
    }

    await rimraf(keysPath);
    await rimraf("./orbitdb");
    await rimraf("./ipfs1");
  });

  describe("Creating a Feed database", () => {
    beforeEach(async () => {
      db = await Feed()({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
      });
    });

    afterEach(async () => {
      if (db) {
        await db.drop();
        await db.close();
      }
    });

    it("creates a feed store", async () => {
      expect(db.address.toString()).to.equal(databaseId);
      expect(db.type).to.equal("feed");
    });

    it("returns 0 items when it's a fresh database", async () => {
      const all = [];
      for await (const item of db.iterator()) {
        all.unshift(item);
      }

      expect(all.length).to.equal(0);
    });
  });

  describe("Feed database API", () => {
    beforeEach(async () => {
      db = await Feed()({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
      });
    });

    afterEach(async () => {
      if (db) {
        await db.drop();
        await db.close();
      }
    });

    it("add a value", async () => {
      const actual = await db.add("value1");
      expect(actual).to.be.a.not.empty("string");
    });

    it("remove a value", async () => {
      const value = "value1";

      const hash = await db.add(value);
      await db.remove(hash);

      const actual = await db.all();
      expect(actual).to.be.an.empty("array");
    });
    it("remove and then add a value", async () => {
      const value = "value1";

      const hash1 = await db.add(value);
      await db.remove(hash1);
      const hash = await db.add(value);

      const actual = await db.all();

      expect(actual).to.have.deep.members([{ value, hash }]);
    });
    it("add a value twice", async () => {
      const value = "value1";

      const hash = await db.add(value);
      const hash2 = await db.add(value);

      const actual = await db.all();
      expect(actual).to.have.deep.members([
        { value, hash },
        { value, hash: hash2 },
      ]);
    });
    it("add a value twice and remove one", async () => {
      const value = "value1";

      const hash = await db.add(value);
      const hash2 = await db.add(value);
      await db.remove(hash);

      const actual = await db.all();
      expect(actual).to.have.deep.members([{ value, hash: hash2 }]);
    });

    it("returns all values", async () => {
      const keyvalue: { value: DBElements; hash?: string }[] = [
        {
          value: "init",
        },
        {
          value: true,
        },
        {
          value: "hello",
        },
        {
          value: "friend",
        },
        {
          value: "12345",
        },
        {
          value: "empty",
        },
        {
          value: "friend33",
        },
      ];

      for (const entry of Object.values(keyvalue)) {
        entry.hash = await db.add(entry.value);
      }

      const all = [];
      for await (const pair of db.iterator()) {
        all.unshift(pair);
      }

      expect(all).to.deep.equal(keyvalue);
    });
  });

  describe("Iterator", () => {
    before(async () => {
      db = await Feed()({
        ipfs,
        identity: testIdentity1,
        address: databaseId,
      });
    });

    after(async () => {
      if (db) {
        await db.drop();
        await db.close();
      }
    });

    it("has an iterator function", async () => {
      expect(db.iterator).to.not.be.undefined();
      expect(typeof db.iterator).to.equal("function");
    });

    it("returns no values when the database is empty", async () => {
      const all = [];
      for await (const { hash, value } of db.iterator()) {
        all.unshift({ hash, value });
      }
      expect(all.length).to.equal(0);
    });

    it("returns all values when the database is not empty", async () => {
      await db.add("value1");
      await db.add("value2");
      await db.add("value3");
      await db.add("value4");
      await db.add("value5");

      // Add one more value and then delete it to count
      // for the fact that the amount returned should be
      // the amount of actual values returned and not
      // the oplog length, and deleted values don't
      // count towards the returned amount.
      const hash6 = await db.add("value6");
      await db.remove(hash6);

      const all = [];
      for await (const { hash, value } of db.iterator()) {
        all.unshift({ hash, value });
      }
      expect(all.length).to.equal(5);
    });

    it("returns only the amount of values given as a parameter", async () => {
      const amount = 3;
      const all = [];
      for await (const { hash, value } of db.iterator({ amount })) {
        all.unshift({ hash, value });
      }
      expect(all.length).to.equal(amount);
    });

    it("returns only two values if amount given as a parameter is 2", async () => {
      const amount = 2;
      const all = [];
      for await (const { hash, value } of db.iterator({ amount })) {
        all.unshift({ hash, value });
      }
      expect(all.length).to.equal(amount);
    });

    it("returns only one value if amount given as a parameter is 1", async () => {
      const amount = 1;
      const all = [];
      for await (const { hash, value } of db.iterator({ amount })) {
        all.unshift({ hash, value });
      }
      expect(all.length).to.equal(amount);
    });
  });
});
