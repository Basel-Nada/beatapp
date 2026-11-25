import { NextRequest, NextResponse } from "next/server";
import { TasksService } from "@/services/highlevel/tasks";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await req.json();
    const completed = typeof body.completed === "boolean" ? body.completed : true;

    const updated = await TasksService.toggleTaskCompleted(params.id, params.taskId, completed);
    return NextResponse.json({ success: true, task: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر تحديث حالة المهمة", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const success = await TasksService.deleteTask(params.id, params.taskId);
    return NextResponse.json({ success });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر حذف المهمة", details: err.message },
      { status: 500 }
    );
  }
}
