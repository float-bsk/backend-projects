import readline, { createInterface } from "node:readline";
import fs from 'node:fs';
import path from "node:path";

const r1 = readline.createInterface({input: process.stdin, output: process.stdout, terminal:true});
const filePath = path.join(process.cwd(), "data", "db.json");

let tasklist = [];

 function main(){
    console.log("Welcome to Task Tracker CLI");
    //load data to tasklist.   
    readFromFile();
    prompt();    
}

 function prompt(){
    r1.setPrompt("task-cli: ");    
    r1.prompt();
    r1.on("line",(input)=>{    
       if(input === "q"){
        WriteToAFile(tasklist);
        console.log("Bye!");
        process.exit(0);
    }
    else{
        processinput(input);        
    }    
    });
}

function readFromFile(){
    try{        
        const response = fs.readFileSync(filePath, {encoding:'utf8'});      
        tasklist = JSON.parse(response);
        if(tasklist.length === 0){
            throw new Error("Your Task List is empty. Time to add new tasks!");            
        }
        console.log("Tasks Loaded");
    }
    catch(err){
        console.log(err.message);
         fs.writeFileSync(filePath, "", {encoding:'utf8'});
    }
}

function WriteToAFile(tasklist){
    console.log("Saving Data...");
    try {
         fs.writeFileSync(filePath, JSON.stringify(tasklist), {encoding:'utf8'});
    }
    catch(err){
        console.log(err)
    }
}

function processinput(input){   
    let description=null, id=null; 
    const db = checkTaskDb();
    const values = input.replaceAll('"',"").split(" ");
    const v1 = values[0];
    const v2 = values[1];
    if(v1 === "add"){       
        description = values.slice(1).join(" ");
        createTask(description);
    }   
    if(!db && tasklist.length === 0){
        console.log("Tasklist is empty!.. Get off your ass and do some tasks");
        r1.prompt();
        return;
    }
    else if(v1 === "update"){   
        description = values.slice(2).join(" ");
        id = v2;
        updateTask(id, description);
    }    
    else if(v1 === "delete"){    
        id = v2;
        deleteTask(id);
    }           
    else if(v1 === "list" && !v2){
       listAllTasks();
    }
    else if(v1 === "list" && v2){
       FilterTaskByStatus(v2);
    } 
    else if(v1.slice(0,5) === "mark-"){
        id = v2;
        updateTaskStatus(v1.slice(5), id)
    }
      
    //Repeat REPL loop after each user input processing.
    r1.prompt();
}

function createTask(description){    
    if(!description){
        console.log("you forgot to add a task name");
        return;
    }    
    const task = {
        id: tasklist.length === 0 ? 1 : tasklist[tasklist.length-1].id + 1,
        description: description,
        status: "todo",
        createdAt: Date.now(),
        updatedAt: null,
    }
    tasklist.push(task);
    console.log(`New Task created. Task ID: ${task.id}`);
    return;
}

function updateTask(id, description){      
      const check_id = checkValidId(id);
      if(!check_id){
        console.log("Invalid Id input provided!");
        return;
      }
      if(tasklist.length === 0){
        console.log("Tasklist Empty! Why dont you get off your lazy ass and do something!");
        return;
      }
      const result = tasklist.find(task => task.id === Number(id));      
      if(!result){
          console.log("Invalid Task ID provided!");
          return;
        }        
    result.description = description;
    result.updatedAt = Date.now();
    console.log("Task Updated. Task ID: ", result.id);
}

function deleteTask(id){
     
      const check_id = checkValidId(id);
      if(!check_id){
        console.log("Invalid Id input provided!");
        return;
      }

    const result = tasklist.find(task => task.id === Number(id));
    if(!result){
        console.log("Invalid Task Id provided");
        return;
    }
    tasklist = tasklist.filter(task => task.id !== Number(id));
    console.log(`Task with ID: ${id} is deleted successfully`);
}

function listAllTasks(){    
    if(tasklist.length){
       console.table(tasklist);    
        console.log(`Total Tasks available: ${tasklist.length}`)
    }
    else{
        console.log("You have no tasks!");
        return;
    }   
}

function FilterTaskByStatus(status){
   
    const validStatus = ["todo", "in-progress", "done"];
    if(!validStatus.includes(status)){
        console.log("Invalid Status input");
        return;
    }

    const filteredTasks = tasklist.filter(ele=>ele.status === status);
    if(filteredTasks.length === 0){
        console.log("No tasks in this state: ", status);
        return;
    }
    if(filteredTasks.length > 1){
        console.table(filteredTasks);
    }
}

function updateTaskStatus(status, id){    
    const check_id = checkValidId(id);
      if(!check_id){
        console.log("Invalid Id input provided!");
        return;
      }
        
    const ALLOWED_STATUSES = ['todo', 'in-progress', 'done'];    
    const is_valid_status = ALLOWED_STATUSES.find(option => status.includes(option));
    if(!is_valid_status){
        console.log("No tasks are in this state: ", status);
        return;
    }    
    
    const task_to_update = tasklist.find(task => task.id === Number(id));
    if(!task_to_update){
        console.log("Invalid Task ID provided!");
        return;
    }
    const newStatus = status.replace("mark-", "");
    task_to_update.status = newStatus;
    task_to_update.updatedAt = Date.now();
    console.log(`Task ${id} Status updated to: `, newStatus)
}

function checkValidId(id){
    const check_format = /^\d+$/.test(id);
   return check_format;
}

function checkTaskDb(){
    if(tasklist.length === 0){
        return false;
    }
    else return true;
}

main();