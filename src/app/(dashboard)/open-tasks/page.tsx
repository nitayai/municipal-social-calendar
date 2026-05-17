import { getOpenTasks } from "@/lib/actions/open-tasks";
import { OpenTasksClient } from "./open-tasks-client";

export const dynamic = "force-dynamic";

export default async function OpenTasksPage() {
  const { data: tasks, error } = await getOpenTasks();
  return <OpenTasksClient initialTasks={tasks ?? []} error={error} />;
}
