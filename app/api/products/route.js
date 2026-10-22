import { route } from "@/lib/http";
import { catalog } from "@/lib/catalog";
export const GET = route((req) =>
  catalog(Object.fromEntries(new URL(req.url).searchParams)),
);
