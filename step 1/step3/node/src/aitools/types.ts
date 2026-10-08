export interface AiTool<TArgs = any> {
  name: string;
  description: string;
  /** JSON Schema for the arguments (replaces @ToolParam) */
  parameters: Record<string, unknown>;
  execute(args: TArgs): Promise<string> | string;
}

export function defineTool<TArgs>(tool: AiTool<TArgs>): AiTool<TArgs> {
  return tool;
}