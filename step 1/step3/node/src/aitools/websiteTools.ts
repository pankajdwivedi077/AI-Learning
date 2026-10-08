import fs from "node:fs/promises";
import path from "node:path";
import { defineTool, type AiTool } from "./types";

export async function createWebsiteTools(
  workspaceDir = "generated-sites",
): Promise<AiTool[]> {
  const workspace = path.resolve(workspaceDir);
  await fs.mkdir(workspace, { recursive: true });

  // Blocks path traversal like "../../etc/passwd"
  function safePath(relative: string): string {
    const resolved = path.resolve(workspace, relative);
    const rel = path.relative(workspace, resolved);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error("Access outside generated-sites is not allowed");
    }
    return resolved;
  }

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const createDirectory = defineTool<{ path: string }>({
    name: "createDirectory",
    description: "Creates a new directory inside the website workspace.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative directory path, for example brewlab" },
      },
      required: ["path"],
    },
    async execute({ path: p }) {
      try {
        await fs.mkdir(safePath(p), { recursive: true });
        return `Directory created successfully: ${p}`;
      } catch (e) {
        return `Failed to create directory: ${errMsg(e)}`;
      }
    },
  });

  const writeFile = defineTool<{ path: string; content: string }>({
    name: "writeFile",
    description:
      "Creates or overwrites a text file inside the website workspace. Use this to create HTML, CSS and JavaScript files.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path, for example brewlab/index.html" },
        content: { type: "string", description: "Complete content that should be written into the file" },
      },
      required: ["path", "content"],
    },
    async execute({ path: p, content }) {
      try {
        const file = safePath(p);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, content, "utf-8");
        return `File written successfully: ${p}`;
      } catch (e) {
        return `Failed to write file: ${errMsg(e)}`;
      }
    },
  });

  const readFile = defineTool<{ path: string }>({
    name: "readFile",
    description: "Reads the contents of an existing file from the website workspace.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path" },
      },
      required: ["path"],
    },
    async execute({ path: p }) {
      try {
        return await fs.readFile(safePath(p), "utf-8");
      } catch (e) {
        return `Failed to read file: ${errMsg(e)}`;
      }
    },
  });

  const listFiles = defineTool<{ path: string }>({
    name: "listFiles",
    description: "Lists all files and directories inside a website project.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative directory path, for example brewlab" },
      },
      required: ["path"],
    },
    async execute({ path: p }) {
      try {
        const directory = safePath(p);

        try {
          await fs.access(directory);
        } catch {
          return `Directory does not exist: ${p}`;
        }

        const entries = await fs.readdir(directory, { recursive: true });
        return entries
          .map((entry) => path.relative(workspace, path.join(directory, entry)))
          .sort()
          .join("\n");
      } catch (e) {
        return `Failed to list files: ${errMsg(e)}`;
      }
    },
  });

  return [createDirectory, writeFile, readFile, listFiles];
}