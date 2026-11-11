import { requireOwnerPage } from "@/lib/require-owner-page";
import FutureLabClient from "./future-lab-client.tsx";

export const dynamic = "force-dynamic";

export default async function FutureLabPage() {
  await requireOwnerPage("/future-lab");
  return <FutureLabClient />;
}
