import { PACKAGES, PRICES } from "@/lib/catalog";
import { creditHistory } from "@/lib/credits";
import { handle, ok, requireUser } from "@/lib/http";
import { bankInfo, userTopups } from "@/lib/topups";

export const GET = handle(async (req) => {
  const user = requireUser(req);
  return ok({
    credits: user.credits,
    history: creditHistory(user.id, 50),
    topups: userTopups(user.id),
    packages: PACKAGES,
    prices: PRICES,
    bank: bankInfo(),
  });
});
