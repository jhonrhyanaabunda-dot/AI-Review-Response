import { prisma } from "@/lib/db/prisma";
import { ActivityKind } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import type { DealershipInput } from "@/lib/validation";

export async function listDealerships(organizationId: string) {
  return prisma.dealership.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { locations: true, reviews: true } },
    },
  });
}

export async function getDealership(organizationId: string, id: string) {
  const row = await prisma.dealership.findFirst({
    where: { id, organizationId },
    include: {
      locations: { include: { sources: true } },
    },
  });
  if (!row) throw new NotFoundError();
  return row;
}

export async function createDealership(args: {
  organizationId: string;
  actorId: string;
  data: DealershipInput;
}) {
  const exists = await prisma.dealership.findFirst({
    where: { organizationId: args.organizationId, slug: args.data.slug },
    select: { id: true },
  });
  if (exists) throw new ConflictError("Slug already exists");

  const row = await prisma.dealership.create({
    data: { ...args.data, organizationId: args.organizationId },
  });
  await prisma.activityLog.create({
    data: {
      organizationId: args.organizationId,
      actorId: args.actorId,
      kind: ActivityKind.DEALERSHIP_CREATED,
      metadata: { dealershipId: row.id },
    },
  });
  return row;
}

export async function updateDealership(args: {
  organizationId: string;
  actorId: string;
  id: string;
  data: Partial<DealershipInput>;
}) {
  const existing = await prisma.dealership.findFirst({
    where: { id: args.id, organizationId: args.organizationId },
  });
  if (!existing) throw new NotFoundError();
  const row = await prisma.dealership.update({
    where: { id: args.id },
    data: args.data,
  });
  await prisma.activityLog.create({
    data: {
      organizationId: args.organizationId,
      actorId: args.actorId,
      kind: ActivityKind.DEALERSHIP_UPDATED,
      metadata: { dealershipId: row.id, changed: Object.keys(args.data) },
    },
  });
  return row;
}
