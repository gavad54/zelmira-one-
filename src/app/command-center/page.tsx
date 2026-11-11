import { requireOwnerPage } from "@/lib/require-owner-page";
import CommandCenterClient from "./command-center-client";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  await requireOwnerPage();
  return <CommandCenterClient />;
}
