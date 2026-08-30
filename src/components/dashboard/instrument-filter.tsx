"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTRUMENTS, INSTRUMENT_LABEL } from "@/lib/instruments";

export function InstrumentFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("instrument") ?? "ALL";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("instrument");
    } else {
      params.set("instrument", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Instruments</SelectItem>
        {INSTRUMENTS.map((i) => (
          <SelectItem key={i} value={i}>
            {INSTRUMENT_LABEL[i]}
          </SelectItem>
        ))}
        <SelectItem value="STOCK">Stock</SelectItem>
      </SelectContent>
    </Select>
  );
}
