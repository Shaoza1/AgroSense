// server/api/tasks.ts
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Async handler wrapper to catch errors
const asyncHandler =
  (fn: express.RequestHandler) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Input validation function
const validateTaskInput = (data: any) => {
  if (!data.userId) return "Missing userId";
  if (!data.title || data.title.trim().length === 0) return "Title is required";
  if (!data.dueDate) return "Due date is required";
  return null;
};

/**
 * GET /api/tasks?userId=...
 * Returns all tasks for a given user
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("GET /tasks error:", error);
      res.status(500).json({ error: "Database error" });
    }

    res.json(data || []);
  })
);

/**
 * POST /api/tasks
 * Body: { userId, title, description?, dueDate }
 * Creates a new task and returns it
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { userId, title, description = "", dueDate } = req.body;

    const validationError = validateTaskInput({ userId, title, dueDate });
    if (validationError) {
      res.status(400).json({ error: validationError });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description?.trim() || "",
          due_date: dueDate,
          completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("POST /tasks error:", error);
      res.status(500).json({ error: "Database error" });
    }

    res.status(201).json(data);
  })
);

/**
 * PUT /api/tasks/:id
 * Body: { title?, description?, dueDate?, completed? }
 * Updates an existing task
 */
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const updates: Record<string, any> = {};
    const { title, description, dueDate, completed } = req.body;

    // Validate and sanitize input
    if (title !== undefined) {
      if (title.trim().length === 0) {
        res.status(400).json({ error: "Title cannot be empty" });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (dueDate !== undefined) {
      updates.due_date = dueDate;
    }

    if (completed !== undefined) {
      updates.completed = completed;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`PUT /tasks/${id} error:`, error);
      res.status(500).json({ error: "Database error" });
    }

    if (!data) {
      res.status(404).json({ error: "Task not found" });
    }

    res.json(data);
  })
);

/**
 * DELETE /api/tasks/:id
 * Deletes a task
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error(`DELETE /tasks/${id} error:`, error);
      res.status(500).json({ error: "Database error" });
    }

    res.status(204).send();
  })
);

// Error handling middleware
router.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error in tasks API:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default router;
