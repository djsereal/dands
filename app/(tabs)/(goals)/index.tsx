import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authenticatedGet, authenticatedPatch, authenticatedDelete } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Plus, Check, Trash2, Target, CheckSquare } from "lucide-react-native";

interface Goal {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  completed: boolean;
  created_at: string;
}

interface Todo {
  id: string;
  title: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

function GoalCard({ goal, onToggle, onDelete }: { goal: Goal; onToggle: () => void; onDelete: () => void }) {
  const { themeColor } = useAppTheme();
  const targetDateText = goal.target_date ? formatDate(goal.target_date) : null;

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <AnimatedPressable
        onPress={onToggle}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: goal.completed ? themeColor : "transparent",
          borderWidth: 2,
          borderColor: goal.completed ? themeColor : COLORS.border,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {goal.completed && <Check size={14} color="#fff" />}
      </AnimatedPressable>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: "700",
          color: goal.completed ? COLORS.textMuted : COLORS.text,
          textDecorationLine: goal.completed ? "line-through" : "none",
        }}>
          {goal.title}
        </Text>
        {goal.description ? (
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 }}>
            {goal.description}
          </Text>
        ) : null}
        {targetDateText ? (
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
            🎯 Target: {targetDateText}
          </Text>
        ) : null}
      </View>
      <AnimatedPressable onPress={onDelete} style={{ padding: 4 }}>
        <Trash2 size={16} color={COLORS.textMuted} />
      </AnimatedPressable>
    </View>
  );
}

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) {
  const { themeColor } = useAppTheme();
  const dueDateText = todo.due_date ? formatDate(todo.due_date) : null;

  return (
    <View style={{
      backgroundColor: COLORS.surface,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    }}>
      <AnimatedPressable
        onPress={onToggle}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          backgroundColor: todo.completed ? themeColor : "transparent",
          borderWidth: 2,
          borderColor: todo.completed ? themeColor : COLORS.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {todo.completed && <Check size={12} color="#fff" />}
      </AnimatedPressable>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          fontWeight: "600",
          color: todo.completed ? COLORS.textMuted : COLORS.text,
          textDecorationLine: todo.completed ? "line-through" : "none",
        }}>
          {todo.title}
        </Text>
        {dueDateText ? (
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Due: {dueDateText}</Text>
        ) : null}
      </View>
      <AnimatedPressable onPress={onDelete} style={{ padding: 4 }}>
        <Trash2 size={14} color={COLORS.textMuted} />
      </AnimatedPressable>
    </View>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "goal" | "todo"; id: string } | null>(null);

  const maxWidth = Math.min(width, 600);

  const loadData = useCallback(async () => {
    try {
      const [goalsData, todosData] = await Promise.all([
        authenticatedGet<Goal[]>("/api/goals").catch(() => []),
        authenticatedGet<Todo[]>("/api/todos").catch(() => []),
      ]);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setTodos(Array.isArray(todosData) ? todosData : []);
    } catch (e) {
      console.error("[Goals] loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const toggleGoal = async (goal: Goal) => {
    console.log("[Goals] Toggle goal:", goal.id, "->", !goal.completed);
    const updated = { ...goal, completed: !goal.completed };
    setGoals((prev) => prev.map((g) => g.id === goal.id ? updated : g));
    try {
      await authenticatedPatch(`/api/goals/${goal.id}`, { completed: !goal.completed });
    } catch (e) {
      console.error("[Goals] Toggle goal error:", e);
      setGoals((prev) => prev.map((g) => g.id === goal.id ? goal : g));
    }
  };

  const toggleTodo = async (todo: Todo) => {
    console.log("[Goals] Toggle todo:", todo.id, "->", !todo.completed);
    const updated = { ...todo, completed: !todo.completed };
    setTodos((prev) => prev.map((t) => t.id === todo.id ? updated : t));
    try {
      await authenticatedPatch(`/api/todos/${todo.id}`, { completed: !todo.completed });
    } catch (e) {
      console.error("[Goals] Toggle todo error:", e);
      setTodos((prev) => prev.map((t) => t.id === todo.id ? todo : t));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "goal") {
        console.log("[Goals] Delete goal:", deleteTarget.id);
        await authenticatedDelete(`/api/goals/${deleteTarget.id}`);
        setGoals((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      } else {
        console.log("[Goals] Delete todo:", deleteTarget.id);
        await authenticatedDelete(`/api/todos/${deleteTarget.id}`);
        setTodos((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
    } catch (e) {
      console.error("[Goals] Delete error:", e);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: themeColor,
        paddingTop: insets.top + 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
          Goals & Todos 🎯
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
          Grow together, one step at a time
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={themeColor} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120, maxWidth, alignSelf: "center", width: "100%" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Goals Section */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Target size={20} color={themeColor} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>Shared Goals</Text>
            <View style={{
              backgroundColor: `${themeColor}20`,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: themeColor }}>{goals.length}</Text>
            </View>
          </View>

          {goals.length === 0 ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No goals yet. Set your first shared goal! 🎯</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 28 }}>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={() => toggleGoal(goal)}
                  onDelete={() => setDeleteTarget({ type: "goal", id: goal.id })}
                />
              ))}
            </View>
          )}

          {/* Todos Section */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <CheckSquare size={20} color={COLORS.accent} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>To-Do List</Text>
            <View style={{
              backgroundColor: `${COLORS.accent}20`,
              borderRadius: 10,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.accent }}>
                {todos.filter((t) => !t.completed).length} left
              </Text>
            </View>
          </View>

          {todos.length === 0 ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No todos yet. Add something to your list! ✅</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo)}
                  onDelete={() => setDeleteTarget({ type: "todo", id: todo.id })}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <AnimatedPressable
        onPress={() => {
          console.log("[Goals] FAB pressed");
          setShowFabMenu(true);
        }}
        style={{
          position: "absolute",
          bottom: insets.bottom + 90,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: themeColor,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${themeColor}60`,
        }}
      >
        <Plus size={24} color="#fff" />
      </AnimatedPressable>

      {/* FAB Menu Modal */}
      <Modal visible={showFabMenu} transparent animationType="fade">
        <AnimatedPressable
          onPress={() => setShowFabMenu(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", padding: 20 }}
        >
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 4 }}>
              What would you like to add?
            </Text>
            <AnimatedPressable
              onPress={() => {
                setShowFabMenu(false);
                console.log("[Goals] Add goal from FAB");
                router.push("/(tabs)/(goals)/add-goal");
              }}
              style={{
                backgroundColor: `${themeColor}15`,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Target size={22} color={themeColor} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>New Goal</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Set a shared goal together</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                setShowFabMenu(false);
                console.log("[Goals] Add todo from FAB");
                router.push("/(tabs)/(goals)/add-todo");
              }}
              style={{
                backgroundColor: `${COLORS.accent}15`,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CheckSquare size={22} color={COLORS.accent} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>New To-Do</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Add a task to your list</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setShowFabMenu(false)}
              style={{ alignItems: "center", paddingVertical: 10 }}
            >
              <Text style={{ color: COLORS.textSecondary, fontWeight: "600" }}>Cancel</Text>
            </AnimatedPressable>
          </View>
        </AnimatedPressable>
      </Modal>

      {/* Delete Confirmation */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              Delete {deleteTarget?.type === "goal" ? "Goal" : "To-Do"}?
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              This will be permanently deleted.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <AnimatedPressable
                onPress={() => setDeleteTarget(null)}
                style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: COLORS.text }}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleDelete}
                style={{ flex: 1, backgroundColor: COLORS.error, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Delete</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
