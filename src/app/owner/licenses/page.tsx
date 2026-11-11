import { requireOwnerPage } from "@/lib/require-owner-page";
import OwnerLicensesClient from "./licenses-client";

export const dynamic = "force-dynamic";

export default async function OwnerLicensesPage() {
  await requireOwnerPage("/owner/licenses");
  return <OwnerLicensesClient />;
}
