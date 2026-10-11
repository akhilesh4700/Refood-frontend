import { prisma } from '../../lib/prisma';

export async function getSupplierMetrics(supplierOrgId: string, period = '30d') {
  const [
    totalListings,
    activeListings,
    completedPickups,
    completedEdible,
    completedOrganic,
    expiredListings,
  ] = await Promise.all([
    // Total listings created
    prisma.listing.count({
      where: { supplierOrgId },
    }),
    // Currently active listings
    prisma.listing.count({
      where: { supplierOrgId, status: 'ACTIVE' },
    }),
    // Completed pickups
    prisma.reservation.count({
      where: {
        listing: { supplierOrgId },
        status: 'COMPLETED',
      },
    }),
    // Edible redistributed (sum of weight for completed edible listings)
    prisma.listing.findMany({
      where: {
        supplierOrgId,
        type: 'EDIBLE',
        status: 'COMPLETED',
      },
      select: { weightKg: true },
    }),
    // Organic recovered (sum of weight for completed organic listings)
    prisma.listing.findMany({
      where: {
        supplierOrgId,
        type: 'ORGANIC',
        status: 'COMPLETED',
      },
      select: { weightKg: true },
    }),
    // Unclaimed expired listings
    prisma.listing.findMany({
      where: {
        supplierOrgId,
        status: 'EXPIRED',
      },
      select: { weightKg: true },
    }),
  ]);

  const edibleRedistributedKg = completedEdible.reduce((acc, curr) => acc + Number(curr.weightKg), 0);
  const organicRecoveredKg = completedOrganic.reduce((acc, curr) => acc + Number(curr.weightKg), 0);
  const unclaimedExpiredKg = expiredListings.reduce((acc, curr) => acc + Number(curr.weightKg), 0);

  return {
    period,
    totalListings,
    activeListings,
    completedPickups,
    edibleRedistributedKg,
    organicRecoveredKg,
    unclaimedExpiredKg,
    confirmedDiscardedKg: 0,
    unknownOutcomeKg: 0,
    currency: 'INR',
  };
}

export async function getRecipientMetrics(recipientOrgId: string, period = '30d') {
  const completedReservations = await prisma.reservation.findMany({
    where: {
      recipientOrgId,
      status: 'COMPLETED',
    },
    include: {
      listing: {
        include: { supplierOrg: true },
      },
    },
    orderBy: { handoverVerifiedAt: 'desc' },
  });

  let edibleFoodReceivedKg = 0;
  let organicWasteRecoveredKg = 0;

  const collectionHistory = completedReservations.map((r) => {
    const weight = Number(r.quantityClaimedKg);
    const type = r.listing.type.toLowerCase() as 'edible' | 'organic';

    if (type === 'edible') {
      edibleFoodReceivedKg += weight;
    } else {
      organicWasteRecoveredKg += weight;
    }

    return {
      date: (r.handoverVerifiedAt || r.updatedAt).toISOString().split('T')[0],
      listingTitle: r.listing.title,
      supplierName: r.listing.supplierOrg?.name || 'Verified Donor',
      weightKg: weight,
      type,
    };
  });

  return {
    period,
    completedReservations: completedReservations.length,
    edibleFoodReceivedKg,
    organicWasteRecoveredKg,
    collectionHistory,
  };
}
