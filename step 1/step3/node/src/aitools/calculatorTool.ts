import { defineTool } from "./types";

type Operation = "add" | "subtract" | "multiply" | "divide" | "mod" | "power";

export const calculatorTool = defineTool<{
  operation: Operation;
  a: number;
  b: number;
}>({
  name: "calculate",
  description:
    "Performs arithmetic calculations. Supported operations: add, subtract, multiply, divide, mod, power.",
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide", "mod", "power"],
        description: "Operation: add, subtract, multiply, divide, mod, power",
      },
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["operation", "a", "b"],
  },
  execute({ operation, a, b }) {
    console.log("Calculator tool called");

    switch (operation) {
      case "add":
        return String(a + b);
      case "subtract":
        return String(a - b);
      case "multiply":
        return String(a * b);
      case "divide":
        if (b === 0) throw new Error("Cannot divide by 0");
        return String(a / b);
      case "mod":
        if (b === 0) throw new Error("Cannot mod by 0");
        return String(a % b);
      case "power":
        return String(Math.pow(a, b));
      default:
        throw new Error("Unsupported operation");
    }
  },
});