import { convertToCamelCase, colors } from "./utils.js";

const handler = {
    commitCommentEvent,
    createEvent,
    deleteEvent,
    discussionEvent,
    forkEvent,
    gollumEvent,
    issueCommentEvent,
    issuesEvent,
    memberEvent,
    publicEvent,
    pullRequestEvent,
    pullRequestReviewEvent,
    pullRequestReviewCommentEvent,
    pushEvent,
    releaseEvent,
    watchEvent
}

export async function getUserActivity(user) {
    try {
        const res = await fetch(`https://api.github.com/users/${user}/events/public`);
        if (!res.ok) {
            throw new Error("Unable to fetch user activity");
        }
        const rawdata = await res.json();
        if (rawdata.length === 0) {
            console.log(`User: ${colors.blue}${user}${colors.reset} is ${colors.red}Inactive${colors.reset} for the past 30 days OR does not have any public events activity`);
            return;
        }
        printUserActivity(rawdata);
        return;
    }
    catch (err) {
        console.log(err.message);
        return;
    }
}

function printUserActivity(rawdata) {
    let activity = {};
    for (const event of rawdata) {
        activity[event.repo.name] ??= {};
        activity[event.repo.name][event.type] ??= [];
        activity[event.repo.name][event.type].push({
            payload:event.payload,
            created_at: new Date(event.created_at).toDateString()
        })
    }

    for (const [reponame, v] of Object.entries(activity)) {        
        for (const [eventType, payload] of Object.entries(v)) {
            const fn = handler[convertToCamelCase(eventType)];
            if (fn) {
                const result = fn(reponame, payload);
                if (result) {
                    if (Array.isArray(result)) {
                        result.forEach(element => {
                            console.log(`${colors.red}-${colors.reset} ${element}`)
                        }
                        )
                    }
                    else if (typeof (result) === 'string') {
                        console.log(`${colors.red}-${colors.reset} ${result}`);
                    }
                }
            }
            else {
                console.log("invalid Filter name: ", fn)
            }
        }
    }
    return;
}

function pushEvent(reponame, payload) {
    return `Performed ${colors.bold}${colors.green}${payload.length}${colors.reset} Push event on repo: ${reponame}`
}

function commitCommentEvent(reponame, payload) {
    return payload.map(ele => {
        const activity = ele.payload;
        return `Commented on a commit in ${colors.bold}${reponame}${colors.reset}`
    })   
}

function pullRequestEvent(reponame, payload) {
    return payload.map(event => {
        const ele = event.payload;
        switch (ele.action) {
            case "opened":
            case "closed": 
            case "reopened": 
                return `${ele.action} a Pull Request on ${reponame}`;
            
            case "merged": {
                return `Successfully merged a pull request ${reponame}`
            }
            case "assigned": {
                if (ele.assignees?.length > 1) {
                    const str = ele.assignees.map(assignee => assignee.login).join(",")
                    return `Assigned a pull request to these members ${colors.bold}${str}${colors.reset} to ${reponame}`
                }
                else return `Assigned @${colors.bold}${ele.assignee?.login}${colors.reset} to pull request on ${reponame}`
            }
            case "unassigned": {
                if (ele.assignees?.length > 1) {
                    const str = ele.assignees.map(assignee => assignee.login).join(", ")
                    return `Unassigned a pull request to these members ${colors.bold}${str}${colors.reset} to ${reponame}`
                }
                else return `Unassigned @${colors.bold}${ele.assignee?.login}${colors.reset} to pull request on ${reponame}`
            }
            case "labeled": {
                if (ele.pull_request.labels?.length > 1) {
                    const labels = ele.pull_request.labels.map(label => label.name)
                        .join(", ");
                    return `Added these labels ${colors.bold}${colors.yellow}${labels}${colors.reset} to Pull request ${ele.number}`
                }
                else return `Added a label ${colors.bold}${colors.yellow}${ele.label?.name}${colors.reset} to Pull request ${ele.number}`
            }
            case "unlabeled": {
                if (ele.pull_request.labels?.length > 1) {
                    const labels = ele.pull_request.labels.map(label => label.name)
                        .join(", ");
                    return `Removed these labels ${colors.bold}${colors.yellow}${labels}${colors.reset} to Pull request ${ele.number}`
                }
                else return `Removed label ${colors.bold}${colors.yellow}${ele.label?.name}${colors.reset} to Pull request ${ele.number}`
            }

            case "synchronize": {
                return `Updated pull request ${colors.blue}#${ele.number}${colors.reset} with new commits`
            }
            default: {
                return `Pull Request ${colors.bold}#${ele.number}${colors.reset}`
            }
        }
    })
}

function createEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload
        if (activity.ref_type === 'branch' && activity.ref === 'main') {
            return `Created a new Repository named ${colors.blue}${reponame}${colors.reset}`
        }
        else
            return `created ${activity.ref_type} ${colors.blue}${activity.ref}${colors.reset} in ${reponame}`
    })   
}

function forkEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        return `Created a Fork from ${colors.yellow}${reponame}${colors.reset} into ${colors.blue}${activity.forkee.full_name}${colors.reset}`
    })
}

function watchEvent(reponame, payload) {
    return `Starred repository named: ${colors.bold}${colors.green}${reponame}${colors.reset}`;
}

function discussionEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        return `${activity.action} a new ${activity.discussion.category.name} Discussion with title ${colors.yellow}${activity.discussion.title}${colors.reset}. Current Status: ${activity.discussion.state}. Reason: ${activity.discussion.state_reason}`
    })
}

function deleteEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        return `${colors.red}Deleted${colors.reset} ${activity.ref_type}: ${colors.red}${activity.ref}${colors.reset},  from ${reponame} by ${activity.pusher_type}`
    })
}

function gollumEvent(reponame, payload) {
    return payload.map(event => {
       return event.payload.pages.map(page=>{
            return `${colors.green}${page.action}${colors.reset} wiki page ${colors.yellow}${page.title}${colors.reset} in repo ${colors.blue}${reponame}${colors.reset}`
        })
    })
}

function issueCommentEvent(reponame, payload) {
   return payload.map(event => {
        const activity = event.payload;
        return `comment ${colors.green}${activity.action}${colors.reset} on issue no.${activity.issue.number} Title:${activity.issue.title} by ${activity.issue.user.login}`
    })
}

function issuesEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        return `${colors.green}${activity.action}${colors.reset} issue no.${activity.issue.number} Title:${activity.issue.title} by ${activity.issue.user.login}, Curent Status: ${colors.blue}${activity.issue.state}${colors.reset}`
    })
}


function memberEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        const action = activity.action;
        const member = activity.member.login;
        return `${action} collaborator ${colors.green}${member}${colors.reset} to ${reponame}`
    })
}
function publicEvent(reponame, payload) {
    return `Changed visibility status of ${colors.yellow}${reponame}${colors.reset} from private to public`
}


function pullRequestReviewEvent(reponame, payload) {
    return payload.map(event => {
        const activity = event.payload;
        switch (activity.action) {
            case "created": {
                return `${colors.blue}${activity.action}${colors.reset} a review on pull request #${activity.pull_request.number} in ${reponame}`
            }
            case "dismissed": {
                return `${colors.blue}${activity.action}${colors.reset} review on pull request #${activity.pull_request.number} in ${reponame}`
            }
            case "updated": {
                return `${colors.blue}${activity.action}${colors.reset} review on pull request #${activity.pull_request.number} in ${reponame}`
            }
            default: {
                return `${colors.blue}${activity.action}${colors.reset} review on pull request #${activity.pull_request.number} in ${reponame}`
            }
        }
    })
}

function pullRequestReviewCommentEvent(reponame, payload) {
 return payload.map(event => {
        const activity = event.payload;
        const action = activity.action;
        const body = activity.comment.body;
        const file = activity.comment.path;
        const prNumber = activity.pull_request.number;
        return `${colors.blue}${action}${colors.reset} review comment \"${colors.green}${body}${colors.reset}\" on PR #${prNumber} ${colors.yellow}(${file})${colors.reset} in ${reponame}`;
    })
}

function releaseEvent(reponame, payload) {
return payload.map(event => {
        const activity = event.payload;
        const author = activity.release.author.login;
        const action = activity.action;
        const releaseName = activity.release.name;
        const releaseTagName = activity.release.tag_name
        return `${colors.blue}${action}${colors.reset} release ${colors.yellow}${releaseName}${colors.reset} in ${reponame} by author: ${colors.green}${author}${colors.reset}`
    })
}