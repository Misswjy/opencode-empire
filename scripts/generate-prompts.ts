import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROMPTS_DIR = join(import.meta.dirname, "..", "src", "prompts");
const OUTPUT = join(PROMPTS_DIR, "generated.ts");

const PROMPT_FILES = [
  "eunuch",
  "cabinet",
  "grand-secretary",
  "ministry-personnel",
  "ministry-revenue",
  "ministry-rites",
  "ministry-war",
  "ministry-justice",
  "ministry-works",
] as const;

function readPrompt(name: string): string {
  const filePath = join(PROMPTS_DIR, `${name}.md`);
  if (!existsSync(filePath)) {
    console.error(`错误：缺少提示词文件 ${filePath}`);
    process.exit(1);
  }
  const content = readFileSync(filePath, "utf-8").trim();
  if (!content) {
    console.error(`错误：提示词文件为空 ${filePath}`);
    process.exit(1);
  }
  return content;
}

const exports = PROMPT_FILES
  .map(
    (name) =>
      `export const ${name.toUpperCase().replace(/-/g, "_")}_PROMPT = ${JSON.stringify(readPrompt(name))};`,
  )
  .join("\n");

const TEMPLATE = `// 本文件由 scripts/generate-prompts.ts 自动生成，请勿手动编辑。
${exports}
`;

writeFileSync(OUTPUT, TEMPLATE, "utf-8");
console.log(`Generated ${OUTPUT} (${PROMPT_FILES.length} prompts)`);
