-- Prisma sends createdAt explicitly during Product upsert/create.
-- Grant only that additional column; do not broaden the platform role to table-wide INSERT.
GRANT INSERT ("createdAt") ON public."Product" TO vayro_platform;
