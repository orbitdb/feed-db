import { useDatabaseType } from "@orbitdb/core";

import Feed from "@/feed.js";

export const registerFeed = () => useDatabaseType(Feed);
