import { stdin, stdout } from "node:process";
import readline, { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import http from "node:http";

const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        port: {
            type: "string",
            default: "3000"
        },
        origin: {
            type: "string",
            default: "http://dummyjson.com"
        }
    },
})

const PORT = values.port;
const ORIGIN = values.origin;
const r1 = readline.createInterface({ input: stdin, output: stdout, terminal: true });
const server = http.createServer();
const datacache = new Map();
const HEADER_VALUES = [
    'content-type',
    'etag',
    'vary',
    'last-modified',
    'content-length',
    'cache-control',
]


function main() {
    console.log("Cache Proxy Server Version 1");
    PORT === "3000" ? console.log("Using Default Port: ", PORT) : console.log("Server will run on Port: ", PORT);
    ORIGIN === "http://dummyjson.com" ? console.log("Request Origin set to default: ", ORIGIN) : console.log("Request will originate from: ", ORIGIN);
    console.log("type \\q to exit the application");
    setPrompt("cache-proxy-cli");
    httpserver(PORT, ORIGIN);
}

function httpserver(port, origin) {
    
    server
        .once('connection', () => console.log("Connection to server successful"))
        .on('error', error => console.log(error))
        .on('request', (request, res) => {
            let requestBody = [];
            const { url } = request;
            const cacheKey = url;
            const upstreamUrl = origin + cacheKey;
            request.on('data', chunk => requestBody.push(chunk))
            request.on('end',async () => {
                requestBody = Buffer.concat(requestBody);
                //cache hit
                
                if (datacache.has(cacheKey)) {
                    const cachedResponse = datacache.get(cacheKey);
                    res.statusCode = cachedResponse.status;
                    res.setHeader('x-cache', 'HIT');
                    for (const [k, v] of Object.entries(cachedResponse.headers)) {
                        res.setHeader(k, v);
                    }
                    console.log("Cache \x1b[38;5;46mHIT\x1b[0m");
                    res.end(cachedResponse.body);
                    r1.prompt();
                }
                //cache miss
                else {
                    let chunks = [];
                    const upstreamRes = await fetch(upstreamUrl);
                   
                    const headersToCache = {};
                    res.setHeader('x-cache', 'MISS');
                    res.statusCode = upstreamRes.status;
                    for(const headervalue of HEADER_VALUES){
                        const v = upstreamRes.headers.get(headervalue);
                        if(v !== null){
                            headersToCache[headervalue] = v;
                            res.setHeader(headervalue, v);
                        }
                    }
                    for await (const chunk of upstreamRes.body){
                        const bufferChunk = Buffer.from(chunk);
                        chunks.push(bufferChunk);
                        res.write(bufferChunk);
                    }
                    const body = Buffer.concat(chunks);
                    const cachedData = {
                        status: upstreamRes.status,
                        headers: headersToCache,
                        body: body
                    }
                    datacache.set(cacheKey, cachedData);
                    console.log(`\x1b[38;5;208mCache Miss\x1b[0m || cacheing data || \x1b[38;5;12cache size : ${datacache.size}\x1b[0m`);
                    res.end();
                    
                    r1.prompt();
                }
            });
        })
        .on('listening', () => {
            console.log("Server is up and listening on PORT: ", port)
        })
        .on('close', () => console.log("Shutting down server gracefully..."));

    //INITIALIZE AND BIND THE SERVER TO A PORT. 
    server.listen(port, repl);
}

function setPrompt(choosenName) {
    r1.setPrompt(`${choosenName}> `);
}

function repl() {
    r1.prompt();
    r1.on('line', (input) => {
        if (input === "\\q") {
            r1.close();
            server.close(()=>{
                process.exit(0);
            });
            
        }
        else {
            parser(input);
            r1.prompt();
        }
    })
}

function parser(input) {
    const args = input.trim().split(" ");
    try {
        handleInput(args);
        return;
    }
    catch (err) {
        console.log(err);
    }
    return;
}

function clearCache() {
    console.log("CACHE CLEARED");
    datacache.clear();
    return;
}

function getCacheSize(){
    return console.log(`current cache size: ${datacache.size}`);
}


function handleInput(args) {
    const options = ["show-port", "clear-cache", "cache-size", "show-origin", "help"];
    const token = args.join("").slice(2);
    switch (token) {
        case "show-port": {
            console.log(`server running on port: ${PORT}`);
            break;
        }
        case "show-origin": {
            console.log(`request originating from ${ORIGIN}`);
            break;
        }
        case 'clear-cache': {
            clearCache();
            break;
        }
        case 'cache-size':{
            getCacheSize();
            break;
        }
        case 'help': {
            console.log("Valid Input Commands");
            options.map(input => {
                console.log(`cache-proxy-cli> --${input}`)
            })
            console.log("type \\q to exit the application");
            break;
        }
        default: {
            console.log("unknown command!");
            break;
        }
    }
    return;
}

main();