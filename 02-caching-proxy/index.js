import http from "node:http"
import readline from "node:readline"
import { buffer } from "node:stream/consumers";
import { parseArgs } from "node:util"

const r1 = readline.createInterface({input:process.stdin, output:process.stdout, terminal:true});
r1.setPrompt("cache-proxy-server> ");

const {values} = parseArgs({
    options:{
        'port':{
            type:'string',
            default:'3000'
        },
        origin:{
            type:'string',
            default:'https://dummyjson.com'
        }
    },
    allowPositionals:true,
})

const server = http.createServer();
const PORT = values.port;
const ORIGIN = values.origin;
const dataCache = new Map();
const HEADERS_METADATA = [
    'content-type',
    'etag',
    'vary',
    'last-modified',
    'content-length',
    'cache-control',
]

function main(){
    welcomeMessage();
    httpserver(PORT, ORIGIN);
}


function welcomeMessage(){
    console.log("\x1b[38;5;11mWelcome to CACHE PROXY SERVER CLI \x1b[0m");
    console.log("type \\q to quit the application." );
    console.log("type --clear-cache to clear cache database");
    console.log("type --help to see all the commands");
    console.log(`start sending requests on \x1b[38;5;39m\x1b]8;;http://localhost:${PORT}\x1b\\http://localhost:${PORT}\x1b]8;;\x1b\\\x1b[0m`);
    console.log(`Sending requests to ORIGIN URL: \x1b[38;5;39m\x1b]8;;${ORIGIN}\x1b\\${ORIGIN}\x1b]8;;\x1b\\\x1b[0m`)
    console.log(" ");
}

function repl(){    
    r1.prompt();
    r1.on('line', (input)=>{
        if(input === "\\q"){
            r1.close();
             server.close(()=>{
                 process.exit(0);
             });
        }
        else{
            parser(input);
            r1.prompt();
        }
    })
    .on('SIGINT',()=>{
        server.close();
        r1.close();
        console.log("Process Interrupted...");
    })
    .on('error',(error)=>{
        error.cause && console.log(error.cause);
        console.log(error.name);
        console.log(error.message);
        server.close();
        r1.close();
    })
    .on('close', ()=>{
        console.log("std input/output is closed");
    })
}

function httpserver(port, origin){    
 server
 .on('error',(error)=>{
    console.log(error.code)
 })
 .on('request',(request, response)=>{
    let body = [], key = "";
    const {url, headers, method} = request;
    key = url; 
    //PARSE REQUEST
    request.on('data',(chunk)=>{
        body.push(chunk);
    })
    request.on('error',(error)=>{
       console.log(error.name);
       error.cause && console.log(error.cause);
       console.log(error.message);   
    })
    request.on('aborted',(msg)=>{
        msg && console.log(msg)
    })
    request.on('end',async ()=>{
       let chunks = [];
       const headerCache = {};
       body = Buffer.concat(body);
   
    //CACHE HIT
    if(dataCache.has(key)){
        const cachedResponse = getCachedResponse(key);
        response.statusCode = cachedResponse.status;
        for(const [k,v] of Object.entries(cachedResponse.headers)){
            response.setHeader(k,v);
        }
        const cachedBody = cachedResponse.body;
        response.setHeader("x-cache", "HIT");
        console.log("Cache \x1b[38;5;46mHIT\x1b[0m");
        response.end(cachedBody);
        r1.prompt();
    }
    //CACHE MISS
    else {       
    try{
        const upstreamUrl = origin +  request.url; 
        const upstreamResponse = await fetch(upstreamUrl);
       
        response.statusCode = upstreamResponse.status;
        for (const hmdata of HEADERS_METADATA){
         const value = upstreamResponse.headers.get(hmdata);
         if(value !== null){
             headerCache[hmdata] = value; 
             response.setHeader(hmdata, value);
         }
        }
                
        for await(const chunk of upstreamResponse.body){
            const bufferChunk = Buffer.from(chunk);
            chunks.push(bufferChunk);
            response.write(bufferChunk);
        }
        const upstreamBody = Buffer.concat(chunks);
        //CONSTRUCT A RESPONSE DATA OBJECT TO BE STORED IN THE CACHE
        const responseToCache = {
         status: upstreamResponse.status,
         headers: headerCache,
         body: upstreamBody
        }
        setCacheResponse(key, responseToCache);
        response.end();
        r1.prompt();
    }
    catch(err){
        console.log(err);
        response.end();
    }
    }
    })
   
})
.on('listening',()=>{
    console.log(`Server listening on PORT: ${PORT}`);
})
 .on('close', ()=>{
    console.log("Shutting down server gracefully...");
 })

 server.listen(port, ()=>{
    repl();
 })
}

function parser(input){
const options = ["show-port", "clear-cache","cache-size", "show-origin", "help"];
   const token = input.slice(2);
    switch(token){
        case "show-port":{
            console.log(`server running on port: ${PORT}`);
            break;
        }
        case "show-origin":{
            console.log(`request originating from ${ORIGIN}`);
            break;
        }
        case 'clear-cache' : {
            clearCache();
            break;
        }
        case 'cache-size' : {
            getCacheSize();
            break;
        }
        case 'help' : {
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

function setCacheResponse(key, cachedResponse){
    dataCache.set(key, cachedResponse);
    console.log(`\x1b[38;5;208mCache Miss\x1b[0m, \x1b[38;5;12m cache size : ${dataCache.size}\x1b[0m`);
    return;
}

function getCachedResponse(key){
    return dataCache.get(key);
}

function getCacheSize(){
    return console.log(`current cache size: ${dataCache.size}`);
}

function clearCache(){
    if(dataCache.size === 0){
        console.log("Cache is Empty! Nothing to clear!");
        return;
    }
    dataCache.clear();
    if(dataCache.size > 0){
        console.log("ERROR clearing cache")
    }
    else
    console.log(`CACHE CLEARED.. cache size reset to: ${dataCache.size}`);
    return;
}


main();
