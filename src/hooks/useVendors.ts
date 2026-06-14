import { useCollection } from "./useCollection";
import type { Vendor } from "@/types";
export const useVendors = () => useCollection<Vendor>("vendors");
