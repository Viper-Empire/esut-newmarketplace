export const sellerListingDeleteDependencies = ["orders", "reviews", "offers", "conversations"] as const;

export type SellerListingDeleteDependency = typeof sellerListingDeleteDependencies[number];

export function assessSellerListingDeletion(status: string, dependencies: Record<SellerListingDeleteDependency, boolean>) {
  if (!['DRAFT', 'ARCHIVED'].includes(status)) {
    return { allowed: false, reason: "Only a draft or archived listing can be deleted. Pause or archive a live listing instead." } as const;
  }

  const retained = sellerListingDeleteDependencies.filter(dependency => dependencies[dependency]);
  if (retained.length) {
    return { allowed: false, reason: "This listing has protected marketplace activity and cannot be deleted. Archive it to preserve its history." } as const;
  }

  return { allowed: true } as const;
}
