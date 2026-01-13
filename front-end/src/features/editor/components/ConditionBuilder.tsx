"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CONDITION_OPERATORS,
  type Condition,
  type ConditionGroup,
  type ConditionOperator,
} from "@/types/condition";

interface ConditionBuilderProps {
  conditionGroups: ConditionGroup[];
  onChange: (groups: ConditionGroup[]) => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ConditionBuilder({
  conditionGroups,
  onChange,
}: ConditionBuilderProps) {
  const addConditionGroup = useCallback(() => {
    const newGroup: ConditionGroup = {
      id: generateId(),
      label: `Condition ${conditionGroups.length + 1}`,
      logic: "AND",
      conditions: [
        {
          id: generateId(),
          field: "",
          operator: "==",
          value: "",
        },
      ],
    };
    onChange([...conditionGroups, newGroup]);
  }, [conditionGroups, onChange]);

  const removeConditionGroup = useCallback(
    (groupId: string) => {
      onChange(conditionGroups.filter((g) => g.id !== groupId));
    },
    [conditionGroups, onChange]
  );

  const updateConditionGroup = useCallback(
    (groupId: string, updates: Partial<ConditionGroup>) => {
      onChange(
        conditionGroups.map((g) =>
          g.id === groupId ? { ...g, ...updates } : g
        )
      );
    },
    [conditionGroups, onChange]
  );

  const addCondition = useCallback(
    (groupId: string) => {
      const newCondition: Condition = {
        id: generateId(),
        field: "",
        operator: "==",
        value: "",
      };
      onChange(
        conditionGroups.map((g) =>
          g.id === groupId
            ? { ...g, conditions: [...g.conditions, newCondition] }
            : g
        )
      );
    },
    [conditionGroups, onChange]
  );

  const removeCondition = useCallback(
    (groupId: string, conditionId: string) => {
      onChange(
        conditionGroups.map((g) =>
          g.id === groupId
            ? {
              ...g,
              conditions: g.conditions.filter((c) => c.id !== conditionId),
            }
            : g
        )
      );
    },
    [conditionGroups, onChange]
  );

  const updateCondition = useCallback(
    (groupId: string, conditionId: string, updates: Partial<Condition>) => {
      onChange(
        conditionGroups.map((g) =>
          g.id === groupId
            ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
            : g
        )
      );
    },
    [conditionGroups, onChange]
  );

  return (
    <div className="space-y-4">
      {conditionGroups.map((group, groupIndex) => (
        <Card key={group.id} className="border-amber-200">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Branch {groupIndex + 1}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeConditionGroup(group.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Label:</Label>
              <Input
                className="h-7 text-xs"
                value={group.label}
                onChange={(e) =>
                  updateConditionGroup(group.id, { label: e.target.value })
                }
                placeholder="Branch name..."
              />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="mb-2 flex items-center gap-2">
              <Label className="text-xs">Match:</Label>
              <Select
                value={group.logic}
                onValueChange={(value: "AND" | "OR") =>
                  updateConditionGroup(group.id, { logic: value })
                }
              >
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">All (AND)</SelectItem>
                  <SelectItem value="OR">Any (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-2" />

            <div className="space-y-2">
              {group.conditions.map((condition, conditionIndex) => (
                <div key={condition.id} className="flex items-center gap-2">
                  <Input
                    className="h-8 flex-1 text-xs"
                    value={condition.field}
                    onChange={(e) =>
                      updateCondition(group.id, condition.id, {
                        field: e.target.value,
                      })
                    }
                    placeholder="Field name"
                  />
                  <Select
                    value={condition.operator}
                    onValueChange={(value: ConditionOperator) =>
                      updateCondition(group.id, condition.id, {
                        operator: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!["isEmpty", "isNotEmpty"].includes(condition.operator) && (
                    <Input
                      className="h-8 flex-1 text-xs"
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(group.id, condition.id, {
                          value: e.target.value,
                        })
                      }
                      placeholder="Value"
                    />
                  )}
                  {group.conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeCondition(group.id, condition.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full text-xs"
              onClick={() => addCondition(group.id)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Condition
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={addConditionGroup}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Condition Branch
      </Button>

      <p className="text-xs text-muted-foreground">
        If no conditions match, the &quot;Else&quot; path will be taken.
      </p>
    </div>
  );
}
