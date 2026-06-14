import { useCollection } from "./useCollection";
import type { Task } from "@/types";
export const useTasks = () => useCollection<Task>("tasks");
