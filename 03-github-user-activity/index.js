import readline, { createInterface } from "node:readline";
import repl from "./repl.js";

const r1 = readline.createInterface({ input: process.stdin, output: process.stdout });

function main() {
    console.log("GITHUB USER ACTIVITY LOADER CLI APP!");
    repl(r1);
}
main();