import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Truck, PackageCheck, ChevronRight, AlertTriangle } from "lucide-react";
import InspectionTool from "./InspectionTool";

const typeConfig = {
  delivery: { label: "Delivery", icon: Truck, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  pickup: { label: "Pickup", icon: PackageCheck, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};
const statusConfig = {
  pending: "bg-yellow-500/20 text-yellow-300",
  in_progress: "bg-orange-500/20 text-orange-300",
  completed: "bg-green-500/20 text-green-300",
  cancelled: "bg-gray-500/20 text-gray-400",
};

export default function TasksList({ tasks, escrows, isLoading, userEmail }) {
  const queryClient = useQueryClient();
  const [inspectingTask, setInspectingTask] = useState(null);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HopperTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hopperTasks"] }),
  });

  const updateEscrowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EscrowAccount.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["escrows"] }),
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
  });

  const handleConfirmDelivery = (task) => {
    if (!task.inspection_complete) {
      alert("Please complete the 4-photo inspection before confirming delivery.");
      return;
    }
    // Activate insurance & mark booking active
    updateTaskMutation.mutate({ id: task.id, data: { status: "completed" } });
    updateBookingMutation.mutate({ id: task.booking_id, data: { status: "active" } });
    const escrow = escrows.find(e => e.booking_id === task.booking_id);
    if (escrow) updateEscrowMutation.mutate({ id: escrow.id, data: { insurance_status: "active" } });
  };

  const handleConfirmReturn = (task, damaged) => {
    if (damaged) {
      // Freeze payout, flag for admin review
      updateTaskMutation.mutate({ id: task.id, data: { status: "completed", damage_reported: true } });
      updateBookingMutation.mutate({ id: task.booking_id, data: { status: "completed" } });
      const escrow = escrows.find(e => e.booking_id === task.booking_id);
      if (escrow) updateEscrowMutation.mutate({ id: escrow.id, data: { status: "frozen", insurance_status: "claim_review", frozen_reason: "Hopper reported damage during return inspection." } });
    } else {
      updateTaskMutation.mutate({ id: task.id, data: { status: "completed" } });
      updateBookingMutation.mutate({ id: task.booking_id, data: { status: "completed" } });
      const escrow = escrows.find(e => e.booking_id === task.booking_id);
      if (escrow) updateEscrowMutation.mutate({ id: escrow.id, data: { status: "released", insurance_status: "completed", released_at: new Date().toISOString() } });
    }
  };

  const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-orange-400" />
        Tasks
        {activeTasks.length > 0 && (
          <Badge className="bg-orange-500 text-white ml-1">{activeTasks.length}</Badge>
        )}
      </h2>

      {isLoading ? (
        Array(2).fill(0).map((_, i) => (
          <Card key={i} className="bg-green-950/50 border-green-700">
            <CardContent className="p-4"><Skeleton className="h-20 w-full bg-green-800" /></CardContent>
          </Card>
        ))
      ) : tasks.length === 0 ? (
        <Card className="bg-green-950/30 border-green-700 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-300">No tasks assigned yet.</p>
        </Card>
      ) : (
        <>
          {activeTasks.map(task => {
            const TypeIcon = typeConfig[task.task_type]?.icon || Truck;
            return (
              <Card key={task.id} className="bg-green-950/50 border-green-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="font-semibold text-white">{task.tool_title}</p>
                        <p className="text-xs text-green-400">{task.renter_email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={typeConfig[task.task_type]?.color}>{typeConfig[task.task_type]?.label}</Badge>
                      <Badge className={statusConfig[task.status]}>{task.status.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  {task.delivery_address && (
                    <p className="text-sm text-green-300">📍 {task.delivery_address}</p>
                  )}

                  {task.damage_reported && (
                    <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 rounded-lg p-2 text-sm text-red-300">
                      <AlertTriangle className="w-4 h-4" />
                      Damage reported — payout frozen, admin review pending
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-200 hover:bg-green-800 gap-1"
                      onClick={() => setInspectingTask(task)}
                    >
                      <ChevronRight className="w-4 h-4" />
                      {task.inspection_complete ? "View Inspection" : "Run Inspection"}
                    </Button>

                    {task.task_type === "delivery" && task.status !== "completed" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                        onClick={() => handleConfirmDelivery(task)}
                        disabled={updateTaskMutation.isPending}
                      >
                        Confirm Delivery
                      </Button>
                    )}

                    {task.task_type === "pickup" && task.status !== "completed" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleConfirmReturn(task, false)}
                          disabled={updateTaskMutation.isPending || !task.inspection_complete}
                        >
                          ✓ Return OK
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleConfirmReturn(task, true)}
                          disabled={updateTaskMutation.isPending || !task.inspection_complete}
                        >
                          ⚠ Report Damage
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {completedTasks.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-green-400 text-sm select-none">
                {completedTasks.length} completed task{completedTasks.length > 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-2 opacity-60">
                {completedTasks.map(task => (
                  <Card key={task.id} className="bg-green-950/30 border-green-800">
                    <CardContent className="p-3 flex items-center justify-between">
                      <p className="text-green-300 text-sm">{task.tool_title} — {task.task_type}</p>
                      {task.damage_reported && <Badge className="bg-red-800 text-red-200 text-xs">Damage</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {inspectingTask && (
        <InspectionTool
          task={inspectingTask}
          onClose={() => setInspectingTask(null)}
          onComplete={(photos, checklist) => {
            updateTaskMutation.mutate({
              id: inspectingTask.id,
              data: { inspection_photos: photos, inspection_checklist: checklist, inspection_complete: true },
            });
            setInspectingTask(null);
          }}
        />
      )}
    </div>
  );
}