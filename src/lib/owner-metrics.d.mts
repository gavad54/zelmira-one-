import type { Prisma } from "@prisma/client";

export function currentActiveLicenseWhere(now?: Date): Prisma.LicenseWhereInput;
