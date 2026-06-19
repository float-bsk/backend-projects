import { getUserActivity } from "./main.js";

export default function repl(r1) {
    r1.setPrompt("github-activity> ");
    r1.prompt();
    r1.on('line', async (input) => {
        if (input === '\\q') {
            r1.close()
            return;
        }
        else {
            try {
                await getUserActivity(input);
                r1.prompt();
            }
            catch (err) {
                console.warn("Error: " + err.message)
                r1.prompt();
            }
        }
    })
        .on('close', () => {
            console.log("Bye!, Have a nice day!");
            process.exit(0);
        })
        .on('SIGINT', () => {
            console.log("closing app!");
            process.exit(0)
        })
}
