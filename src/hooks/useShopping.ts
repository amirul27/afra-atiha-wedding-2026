import { useCollection } from "./useCollection";
import type { ShoppingItem } from "@/types";
export const useShopping = () => useCollection<ShoppingItem>("shopping");
