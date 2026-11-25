import { NextRequest, NextResponse } from "next/server";
import { TasksService } from "@/services/highlevel/tasks";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(2, "عنوان المهمة مطلوب"),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await TasksService.getTasks(params.id);
    return NextResponse.json({ tasks });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر جلب مهام المتابعة", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = createTaskSchema.parse(body);

    const task = await TasksService.createTask({
      contactId: params.id,
      ...validated,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صالحة", issues: error.errors }, { status: 400 });
    }
    const err = error as Error;
    return NextResponse.json(
      { error: "تعذر إنشاء مهمة المتابعة", details: err.message },
      { status: 500 }
    );
  }
}
