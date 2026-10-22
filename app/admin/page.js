import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";
import { Admin } from "@/components/admin";
export const metadata = {
  title: "Store administration",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireUser(true);
  } catch (e) {
    if (e.status === 401) redirect("/admin/login");
    if (e.status === 403) redirect("/account");
    throw e;
  }
  return (
    <div className="container page">
      <Admin />
    </div>
  );
}
