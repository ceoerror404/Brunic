import type { Metadata } from "next";
import { CartView } from "@/components/commerce/cart-view";
import { DepartmentTiles } from "@/components/home/department-tiles";

export const metadata: Metadata = { title: "Winkelmand", robots: { index: false, follow: true } };

export default function CartPage() {
  return (
    <div className="shell pb-16">
      <ol aria-label="Bestelstappen" className="mx-auto mt-6 flex w-fit max-w-full items-center gap-0.5 rounded-full bg-mist p-1 text-[12px] sm:gap-1 sm:text-[13px]">
        <li aria-current="step" className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 font-medium shadow-[var(--shadow-label)] max-[359px]:gap-1 max-[359px]:px-1 sm:gap-2 sm:px-3">
          <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-white">1</span> Winkelmand
        </li>
        <li className="flex items-center gap-1.5 px-2 py-1.5 text-ink-60 max-[359px]:gap-1 max-[359px]:px-1 sm:gap-2 sm:px-3">
          <span className="flex size-5 items-center justify-center rounded-full border border-ink-60 text-[11px]">2</span> Levering
        </li>
        <li className="flex items-center gap-1.5 px-2 py-1.5 text-ink-60 max-[359px]:gap-1 max-[359px]:px-1 sm:gap-2 sm:px-3">
          <span className="flex size-5 items-center justify-center rounded-full border border-ink-60 text-[11px]">3</span> Betaling
        </li>
      </ol>

      <div className="mx-auto mt-8 max-w-[1000px]">
        <CartView departments={<DepartmentTiles />} />
      </div>
    </div>
  );
}
