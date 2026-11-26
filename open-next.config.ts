// Cloudflare preview adapter configuration.
// This file is only consumed by the isolated Cloudflare prototype workflow.
// @ts-expect-error -- this optional adapter is installed only in the isolated Cloudflare workflow.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
