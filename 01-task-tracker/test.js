import fs from "node:fs";
import * as fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

let newcontent = [];
const filePath = path.join(process.cwd(),"data", "db.json");
const outputFilePath = filePath;

//try to read the file. if error. create an empty file with no content message.
try{
    console.log("Loading Tasks...");

    const data = JSON.parse(await fsp.readFile(filePath));
    console.log("Tasks Loaded!");
}
catch(err){
    console.log("You have no tasks. Time to add some tasks and get busy!");
    await fsp.writeFile(filePath, "");
}

try{
    const response = await fsp.readFile(filePath, {encoding:'utf8'});
    newcontent.push(Date.now());
}
catch(err){
    console.log(err);
}

try{
  console.log("Over-writing file with fs.writeFile");  
 await fsp.writeFile(filePath, JSON.stringify(newcontent) +"\n", {encoding:'utf8'});
}
catch(err){
console.log(err);
}

try{
    const content = "appending this line to datase.json using fs.writeFile promise api with flag set to string: a+";
    console.log("Appending file with object {flag: 'a+'}");
    await fsp.writeFile(filePath, JSON.stringify(content) + "\n", {flag:'a+', encoding:'utf8'});
}
catch(err){
    console.log(err);
}

try{
    const content = "appending this line to datase.json using fs.appendFile promise api";
    console.log("Appending file using fs.appendFile api");
    await fsp.appendFile(filePath, JSON.stringify(content) + "\n", {encoding:'utf8'});
}
catch(err){
    console.log(err);
}

try{
    const data = JSON.parse(await fsp.readFile(filePath, {encoding:'utf8'}));
    console.log("Reading from file after using fs.writeFile and fs.appendFile apis");   
}
catch(err){
    console.log(err)
}




