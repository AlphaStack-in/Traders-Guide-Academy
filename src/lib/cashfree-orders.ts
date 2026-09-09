import { cashfreeRequest, CashfreeApiError } from "@/lib/cashfree";

/**
 * One-time payments for the /products catalog via Cashfree's Orders API —
 * distinct from cashfree.ts's Subscriptions API calls (recurring UPI
 * Autopay memberships only). Same plain-fetch cashfreeRequest() wrapper,
 * same sandbox/production base URL switch — just a different Cashfree
 * product (Orders, not Subscriptions).
 */

export { CashfreeApiError };

interface CreateOrderParams {
  orderId: string;
  amountInPaise: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
}

interface CashfreeCreateOrderResponse {
  order_id: string;
  cf_order_id?: string;
  payment_session_id?: string;
  order_status?: string;
}

export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeCreateOrderResponse> {
  const { orderId, amountInPaise, customerName, customerEmail, customerPhone, returnUrl } = params;

  return cashfreeRequest<CashfreeCreateOrderResponse>({
    method: "POST",
    path: "/orders",
    body: {
      order_id: orderId,
      order_amount: Math.round(amountInPaise) / 100,
      order_currency: "INR",
      customer_details: {
        // Cashfree requires a customer_id — reuse the order id since we
        // don't otherwise track a separate Cashfree customer object.
        customer_id: orderId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl,
      },
    },
  });
}
