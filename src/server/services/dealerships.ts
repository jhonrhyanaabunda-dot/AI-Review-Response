import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { listDealerships as listFromStore } from "@/lib/demo/store";

export async function listDealerships(_organizationId: string) {
  return listFromStore();
}

export async function getDealership(_organizationId: string, _id: string) {
  throw new NotFoundError("Dealership detail not available in demo mode.");
}

export async function createDealership(_args: {
  organizationId: string;
  actorId: string;
  data: unknown;
}): Promise<never> {
  throw new ConflictError("Dealership creation disabled in demo mode.");
}

export async function updateDealership(_args: {
  organizationId: string;
  actorId: string;
  id: string;
  data: unknown;
}): Promise<never> {
  throw new ConflictError("Dealership update disabled in demo mode.");
}
