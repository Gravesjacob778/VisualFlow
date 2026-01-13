import type { NodeTypes } from "@xyflow/react";

import { ConditionNode } from "./ConditionNode";
import { EndNode } from "./EndNode";
import { StartNode } from "./StartNode";
import { TaskNode } from "./TaskNode";

export const nodeTypes: NodeTypes = {
  start: StartNode,
  task: TaskNode,
  condition: ConditionNode,
  end: EndNode,
};

export { ConditionNode, EndNode, StartNode, TaskNode };
