"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PlaceOrderButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login?redirectTo=/signals");
      return;
    }
    router.push("/account/broker");
  }

  return (
    <Button
      size="sm"
      className="thc-btn-gradient thc-btn-3d ml-1 font-semibold transition-transform duration-150"
      onClick={handleClick}
    >
      Place Order
    </Button>
  );
}
