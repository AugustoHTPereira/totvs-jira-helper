const copySucceededNotification = document.getElementById("copy-succeeded-notification");
const issueId = document.getElementById("issue-id");
const issueBranch = document.getElementById("issue-branch");
const issueCheckinNote = document.getElementById("issue-checkin-note");
const issueCustomerDescription = document.getElementById("issue-customer-description");
const issuePullRequest = document.getElementById("issue-pull-request");

let modificationType = '[FEAT]';
let currentIssueInfo = {};

const pullRequestTemplate = () => {
    const { taskId, subTaskId, taskName } = currentIssueInfo;

    return `
    - CodigoIssue:[${subTaskId}\\${taskId}]
    - DescricaoCliente:[${taskName}]

    ${modificationType} ${taskName}
    `;
};

const showCopySucceededNotification = () => { 
    copySucceededNotification.classList.remove("hidden");
    setTimeout(() => {
        copySucceededNotification.classList.add("hidden");
    }, 3*1000);
}

const copyElementInnerTextToClipboard = (element) => {
    const textToCopy = element.querySelector("p").innerText.trim();
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showCopySucceededNotification();
        })
        .catch(err => {
            console.error('Error copying text: ', err);
        });
}

const handleSetIssueId = () => {
    const { taskId, subTaskId } = currentIssueInfo;
    issueId.innerText = `${subTaskId}\\${taskId}`;
}

const handleSetIssueBranch = () => {
    const { subTaskId } = currentIssueInfo;
    issueBranch.innerText = subTaskId;
}

const handleSetIssueCheckinNote = () => {
    const { taskName } = currentIssueInfo;
    issueCheckinNote.innerText = `${modificationType} ${taskName}`;
}

const handleSetIssueCustomerDescription = () => {
    const { taskName } = currentIssueInfo;
    issueCustomerDescription.innerText = taskName;
}

const handleSetIssuePullRequest = () => {
    issuePullRequest.innerText = pullRequestTemplate();
}

const handleSetIssueScreenValues = () => {
    handleSetIssueBranch();
    handleSetIssueCheckinNote();
    handleSetIssueCustomerDescription();
    handleSetIssueId();
    handleSetIssuePullRequest();
}

const onModificationTypeChange = (type) => {
    modificationType = type;
    handleSetIssueScreenValues();
}

window.onload = () => {    
    if (!chrome.tabs)
        return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: () => {
                    const taskElement = document.getElementById("parent_issue_summary");
                    const subTaskElement = document.getElementById("key-val");
                    
                    return {
                        taskId: taskElement?.getAttribute("data-issue-key") ?? "unknown",
                        subTaskId: subTaskElement?.getAttribute("data-issue-key") ?? "unknown",
                        taskName: taskElement?.innerText ?? "unknown",
                    }
                },
            },
            (results) => {
                const { result } = results[0] ?? {};
                currentIssueInfo = result;
                handleSetIssueScreenValues();
            }
        );
    });
}

document.querySelectorAll("#options>li").forEach(element => {
    element.addEventListener("click", () => {
        copyElementInnerTextToClipboard(element);
    })
})

document.querySelectorAll("input[name='type']").forEach(element => {
    element.addEventListener("change", (event) => {
        onModificationTypeChange(event.target.value);
    })
})