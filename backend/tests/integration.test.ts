import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let authToken: string;
  let coupleId: string;
  let inviteCode: string;

  // Resource IDs
  let memoryId: string;
  let ventId: string;
  let todoId: string;
  let activityId: string;
  let goalId: string;
  let journalEntryId: string;
  let intimacyLogId: string;
  let fantasyId: string;

  // === Auth Setup ===
  test("Sign up test user", async () => {
    const { token } = await signUpTestUser();
    authToken = token;
    expect(authToken).toBeDefined();
  });

  // === Couples ===
  test("Create a couple with required fields", async () => {
    const res = await authenticatedApi("/api/couples/create", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anniversary_date: "2020-01-15",
        theme_color: "#FF0000",
        theme_font: "Arial",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    coupleId = data.id;
    inviteCode = data.invite_code;
    expect(data.partner1_id).toBeDefined();
    expect(data.invite_code).toBeDefined();
  });

  test("Create couple without required anniversary_date returns 400", async () => {
    const res = await authenticatedApi("/api/couples/create", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme_color: "#FF0000",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get current user's couple", async () => {
    const res = await authenticatedApi("/api/couples/me", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(coupleId);
  });

  test("Update couple theme_color", async () => {
    const res = await authenticatedApi("/api/couples/me", authToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme_color: "#00FF00",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.theme_color).toBe("#00FF00");
  });

  test("Join couple with invalid invite code returns 400 or 404", async () => {
    const res = await authenticatedApi("/api/couples/join", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invite_code: "invalid",
      }),
    });
    await expectStatus(res, 400, 404);
  });

  test("Send invite email to join couple", async () => {
    const res = await authenticatedApi("/api/couples/invite", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "partner@example.com",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Send invite with invalid email format returns 400", async () => {
    const res = await authenticatedApi("/api/couples/invite", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Send invite without email field returns 400", async () => {
    const res = await authenticatedApi("/api/couples/invite", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 400);
  });

  // === Memories ===
  test("Create a memory", async () => {
    const res = await authenticatedApi("/api/memories", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: "https://example.com/photo.jpg",
        prompt: "Our first vacation",
        caption: "Beautiful sunset",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    memoryId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.uploaded_by).toBeDefined();
  });

  test("Create memory without required image_url returns 400", async () => {
    const res = await authenticatedApi("/api/memories", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Missing image_url",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all memories", async () => {
    const res = await authenticatedApi("/api/memories", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.memories)).toBe(true);
  });

  test("Delete a memory", async () => {
    const res = await authenticatedApi(`/api/memories/${memoryId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent memory returns 404", async () => {
    const res = await authenticatedApi("/api/memories/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Vents ===
  test("Create a vent", async () => {
    const res = await authenticatedApi("/api/vents", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Had a stressful day",
        is_private: false,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    ventId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.author_id).toBeDefined();
  });

  test("Create vent without required content returns 400", async () => {
    const res = await authenticatedApi("/api/vents", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_private: false,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all vents", async () => {
    const res = await authenticatedApi("/api/vents", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.vents)).toBe(true);
  });

  test("Delete a vent", async () => {
    const res = await authenticatedApi(`/api/vents/${ventId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent vent returns 404", async () => {
    const res = await authenticatedApi("/api/vents/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Moods ===
  test("Log a mood with valid enum value", async () => {
    const res = await authenticatedApi("/api/moods", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "happy",
        note: "Great day!",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.couple_id).toBeDefined();
    expect(data.user_id).toBeDefined();
  });

  test("Log mood without required mood field returns 400", async () => {
    const res = await authenticatedApi("/api/moods", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: "Missing mood",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all moods", async () => {
    const res = await authenticatedApi("/api/moods", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.moods)).toBe(true);
  });

  // === Todos ===
  test("Create a todo", async () => {
    const res = await authenticatedApi("/api/todos", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Buy groceries",
        due_date: "2026-03-20",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    todoId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.created_by).toBeDefined();
    expect(data.is_completed).toBe(false);
  });

  test("Create todo without required title returns 400", async () => {
    const res = await authenticatedApi("/api/todos", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        due_date: "2026-03-20",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all todos", async () => {
    const res = await authenticatedApi("/api/todos", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.todos)).toBe(true);
  });

  test("Update todo to completed", async () => {
    const res = await authenticatedApi(`/api/todos/${todoId}`, authToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_completed: true,
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.is_completed).toBe(true);
  });

  test("Update non-existent todo returns 404", async () => {
    const res = await authenticatedApi("/api/todos/invalid-id", authToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_completed: true,
      }),
    });
    await expectStatus(res, 404);
  });

  test("Delete a todo", async () => {
    const res = await authenticatedApi(`/api/todos/${todoId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent todo returns 404", async () => {
    const res = await authenticatedApi("/api/todos/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Activities ===
  test("Create an activity with required fields", async () => {
    const res = await authenticatedApi("/api/activities", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Movie night",
        activity_date: "2026-03-14",
        description: "Watched a great film",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    activityId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.logged_by).toBeDefined();
  });

  test("Create activity without required activity_date returns 400", async () => {
    const res = await authenticatedApi("/api/activities", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Movie night",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all activities", async () => {
    const res = await authenticatedApi("/api/activities", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.activities)).toBe(true);
  });

  test("Delete an activity", async () => {
    const res = await authenticatedApi(`/api/activities/${activityId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent activity returns 404", async () => {
    const res = await authenticatedApi("/api/activities/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Goals ===
  test("Create a goal with required title", async () => {
    const res = await authenticatedApi("/api/goals", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Save for vacation",
        description: "Save $5000",
        target_date: "2026-12-31",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    goalId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.created_by).toBeDefined();
    expect(data.is_completed).toBe(false);
  });

  test("Create goal without required title returns 400", async () => {
    const res = await authenticatedApi("/api/goals", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Save money",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all goals", async () => {
    const res = await authenticatedApi("/api/goals", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.goals)).toBe(true);
  });

  test("Update goal to completed", async () => {
    const res = await authenticatedApi(`/api/goals/${goalId}`, authToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_completed: true,
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.is_completed).toBe(true);
  });

  test("Update non-existent goal returns 404", async () => {
    const res = await authenticatedApi("/api/goals/invalid-id", authToken, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_completed: true,
      }),
    });
    await expectStatus(res, 404);
  });

  test("Delete a goal", async () => {
    const res = await authenticatedApi(`/api/goals/${goalId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent goal returns 404", async () => {
    const res = await authenticatedApi("/api/goals/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Journal ===
  test("Create a journal entry with required fields", async () => {
    const res = await authenticatedApi("/api/journal", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Today was amazing",
        entry_type: "gratitude",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    journalEntryId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.author_id).toBeDefined();
  });

  test("Create journal entry without entry_type returns 400", async () => {
    const res = await authenticatedApi("/api/journal", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Missing entry_type",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all journal entries", async () => {
    const res = await authenticatedApi("/api/journal", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.entries)).toBe(true);
  });

  test("Delete a journal entry", async () => {
    const res = await authenticatedApi(`/api/journal/${journalEntryId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
  });

  test("Delete non-existent journal entry returns 404", async () => {
    const res = await authenticatedApi("/api/journal/invalid-id", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // === Tips ===
  test("Get relationship tips", async () => {
    const res = await authenticatedApi("/api/tips", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.tips)).toBe(true);
  });

  test("Get tips filtered by category", async () => {
    const res = await authenticatedApi("/api/tips?category=communication", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.tips)).toBe(true);
  });

  // === Intimacy Logs ===
  test("Log intimacy with satisfaction rating", async () => {
    const res = await authenticatedApi("/api/intimacy/logs", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        satisfaction_rating: 4,
        note: "Great experience",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    intimacyLogId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.logged_by).toBeDefined();
  });

  test("Log intimacy without required satisfaction_rating returns 400", async () => {
    const res = await authenticatedApi("/api/intimacy/logs", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: "Missing rating",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Log intimacy with invalid satisfaction_rating (out of range) returns 400", async () => {
    const res = await authenticatedApi("/api/intimacy/logs", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        satisfaction_rating: 10,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all intimacy logs", async () => {
    const res = await authenticatedApi("/api/intimacy/logs", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.logs)).toBe(true);
  });

  // === Intimacy Fantasies ===
  test("Share a fantasy", async () => {
    const res = await authenticatedApi("/api/intimacy/fantasies", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Would like to try something new",
        is_anonymous: false,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    fantasyId = data.id;
    expect(data.couple_id).toBeDefined();
    expect(data.shared_by).toBeDefined();
  });

  test("Share fantasy without required content returns 400", async () => {
    const res = await authenticatedApi("/api/intimacy/fantasies", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_anonymous: false,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Get all fantasies", async () => {
    const res = await authenticatedApi("/api/intimacy/fantasies", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.fantasies)).toBe(true);
  });

  // === AI Suggestions ===
  test("Get AI intimacy suggestions", async () => {
    const res = await authenticatedApi("/api/intimacy/ai-suggestions", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: "We want to spice things up",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBe(5);
  });

  test("Get AI suggestions with minimal context", async () => {
    const res = await authenticatedApi("/api/intimacy/ai-suggestions", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  // === 2FA ===
  test("Send 2FA verification code with valid phone", async () => {
    const res = await authenticatedApi("/api/2fa/send", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+12025551234",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBeDefined();
  });

  test("Send 2FA code without required phone returns 400", async () => {
    const res = await authenticatedApi("/api/2fa/send", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 400);
  });

  test("Get 2FA status", async () => {
    const res = await authenticatedApi("/api/2fa/status", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.phone_verified).toBeDefined();
  });

  test("Verify 2FA code", async () => {
    const res = await authenticatedApi("/api/2fa/verify", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+12025551234",
        code: "123456",
      }),
    });
    // Can be 200 if code is correct or 400 if code is invalid/expired
    await expectStatus(res, 200, 400);
  });

  test("Verify 2FA code without required fields returns 400", async () => {
    const res = await authenticatedApi("/api/2fa/verify", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+12025551234",
      }),
    });
    await expectStatus(res, 400);
  });
});
