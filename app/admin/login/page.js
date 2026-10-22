import Login from "@/components/login";
export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Login admin />;
}
