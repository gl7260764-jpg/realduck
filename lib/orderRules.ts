/**
 * Server-side order validation rules.
 * Used by both the fast-order (Telegram) and detailed-checkout endpoints
 * so a customer can't bypass the rules by switching paths.
 */

export const DISPOSABLES_MIN_QUANTITY = 25;

interface MinimalOrderItem {
  category: string;
  quantity: number;
}

export interface OrderRuleViolation {
  ok: false;
  error: string;
}

export interface OrderRuleOk {
  ok: true;
}

/**
 * Enforces business rules on the items in a single order.
 * Currently: any order containing one or more DISPOSABLES products must
 * have at least 25 disposables in total (summed across all disposable
 * line items in the order).
 */
export function validateOrderItems(
  items: MinimalOrderItem[],
): OrderRuleViolation | OrderRuleOk {
  const disposablesQty = items
    .filter((it) => it.category === "DISPOSABLES")
    .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  if (disposablesQty > 0 && disposablesQty < DISPOSABLES_MIN_QUANTITY) {
    return {
      ok: false,
      error: `Minimum order for disposables is ${DISPOSABLES_MIN_QUANTITY} units. Your cart has ${disposablesQty}.`,
    };
  }

  return { ok: true };
}
