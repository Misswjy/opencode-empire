import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PROMPTS_DIR = join(import.meta.dirname, "..", "src", "prompts");
const OUTPUT = join(PROMPTS_DIR, "generated.ts");

function readPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), "utf-8").trim();
}

const TEMPLATE = `// 本文件由 scripts/generate-prompts.ts 自动生成，请勿手动编辑。
export const EUNUCH_PROMPT = ${JSON.stringify(readPrompt("eunuch"))};
export const CABINET_PROMPT = ${JSON.stringify(readPrompt("cabinet"))};
export const GRAND_SECRETARY_PROMPT = ${JSON.stringify(readPrompt("grand-secretary"))};
export const MINISTRY_PROMPT = ${JSON.stringify(readPrompt("ministry"))};
`;

writeFileSync(OUTPUT, TEMPLATE, "utf-8");
console.log("Generated src/prompts/generated.ts");
