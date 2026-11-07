import EmailSettings from "./settings-client";
export const dynamic = "force-dynamic";
export default function EmailSettingsPage() {
  return <EmailSettings verificationToken={null} />;
}
