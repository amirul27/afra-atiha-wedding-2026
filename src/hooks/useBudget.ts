import { useCollection } from "./useCollection";
import type { BudgetItem } from "@/types";
export const useBudget = () => useCollection<BudgetItem>("budget");
