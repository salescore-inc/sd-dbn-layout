import assert from "node:assert/strict";

import { wrapLabel } from "../src/renderer/svgRenderer.js";

const japaneseLabel = "会社名、設立、代表、本社、事業内容が公式会社情報で確認できる";
const japaneseLines = wrapLabel(japaneseLabel, 80);
assert.ok(japaneseLines.length > 1, "Japanese labels without spaces should wrap across lines");
assert.notEqual(japaneseLines[0], japaneseLabel, "The first Japanese line should not contain the full label");

const longTokenLines = wrapLabel("supercalifragilisticexpialidocious", 60);
assert.ok(longTokenLines.length > 1, "Long unbroken tokens should wrap across lines");

const limitedLines = wrapLabel(japaneseLabel, 80, { maxLines: 2 });
assert.equal(limitedLines.length, 2, "Max lines should cap visible wrapped lines");
assert.ok(limitedLines[1].endsWith("..."), "Overflowing labels should end with an ellipsis");

const emptyLines = wrapLabel("   ", 80);
assert.deepEqual(emptyLines, [], "Blank labels should not produce text lines");
