import { useCollection } from "./useCollection";
import type { Guest } from "@/types";
export const useGuests = () => useCollection<Guest>("guests");
