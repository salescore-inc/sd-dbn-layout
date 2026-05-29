import { sampleCanvas } from "./examples/sampleGraph.js";
import { defineSdDbnCanvasElement } from "./components/SdDbnCanvas.js";

defineSdDbnCanvasElement();

const canvas = document.querySelector("#salesDbnCanvas");
const fitButton = document.querySelector("#fitButton");
const resetButton = document.querySelector("#resetButton");

canvas.canvas = sampleCanvas;
fitButton.addEventListener("click", () => canvas.fitViewport());
resetButton.addEventListener("click", () => canvas.resetViewport());
