import { useCollection } from "./useCollection";
import type { WeddingDocument } from "@/types";
export const useDocuments = () => useCollection<WeddingDocument>("documents");
