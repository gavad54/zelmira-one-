import EmailSettings from "./settings-client";
export const dynamic = "force-dynamic";
export default async function EmailSettingsPage({ searchParams }: { searchParams: Promise<{ verify?: string }> }) {
  const params = await searchParams;
  return <EmailSettings verificationToken={params.verify ?? null} />;
}
