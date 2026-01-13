/**
 * Condition operator types for workflow conditions
 */
export type ConditionOperator =
  | "=="
  | "!="
  | ">"
  | "<"
  | ">="
  | "<="
  | "contains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

/**
 * Single condition definition
 */
export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

/**
 * Condition group with AND/OR logic
 */
export interface ConditionGroup {
  id: string;
  conditions: Condition[];
  logic: "AND" | "OR";
  label: string;
}

/**
 * Available operators with display labels
 */
export const CONDITION_OPERATORS: {
  value: ConditionOperator;
  label: string;
}[] = [
    { value: "==", label: "equals (==)" },
    { value: "!=", label: "not equals (!=)" },
    { value: ">", label: "greater than (>)" },
    { value: "<", label: "less than (<)" },
    { value: ">=", label: "greater or equal (>=)" },
    { value: "<=", label: "less or equal (<=)" },
    { value: "contains", label: "contains" },
    { value: "startsWith", label: "starts with" },
    { value: "endsWith", label: "ends with" },
    { value: "isEmpty", label: "is empty" },
    { value: "isNotEmpty", label: "is not empty" },
  ];
