import {
  Skeleton,
  StatGridSkeleton,
  PanelSkeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <StatGridSkeleton count={4} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    </div>
  );
}
