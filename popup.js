const copySucceededNotification = document.getElementById("copy-succeeded-notification");
const issueId = document.getElementById("issue-id");
const issueBranch = document.getElementById("issue-branch");
const issueCheckinNote = document.getElementById("issue-checkin-note");
const issueCustomerDescription = document.getElementById("issue-customer-description");
const issuePullRequest = document.getElementById("issue-pull-request");

let modificationType = '[FEAT]';
let currentIssueInfo = {};

const pullRequestTemplate = () => {
    const { taskId, subTaskId } = currentIssueInfo;

    return `
    - CodigoIssue:[${subTaskId}\\${taskId}]
    - DescricaoCliente:[${formatCustomerDescription()}]

    ${formatIssueName()}
    `;
};

const showCopySucceededNotification = () => { 
    copySucceededNotification.classList.remove("hidden");
    setTimeout(() => {
        copySucceededNotification.classList.add("hidden");
    }, 5*1000);
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

const formatIssueName = () => {
    const { taskName, taskSummary, commitIntent } = currentIssueInfo;
    let formattedName = `${modificationType} ${taskName}`;

    if (taskSummary && taskSummary !== taskName && commitIntent === "[FIX]") {
        const cleanSummary = taskSummary.includes('-') && taskSummary.startsWith('EV') 
            ? taskSummary.split('-').slice(1).join('-').trim() 
            : taskSummary;

        formattedName += ` - ${cleanSummary}`;
    }

    return formattedName;
}

const handleSetIssueCheckinNote = () => {
    issueCheckinNote.innerText = formatIssueName();
}

const formatCustomerDescription = () => {
    const { taskName } = currentIssueInfo;
    return taskName;
}

const handleSetIssueCustomerDescription = () => {
    issueCustomerDescription.innerText = formatCustomerDescription();
}

const handleSetIssuePullRequest = () => {
    issuePullRequest.innerText = pullRequestTemplate();
}

const handleSetIssueType = () => {
    const { commitIntent } = currentIssueInfo;
    document.querySelector(`input[name="type"][value="${commitIntent}"]`)?.setAttribute("checked", "checked");
    modificationType = commitIntent;
}

const handleSetIssueScreenValues = () => {
    console.log(currentIssueInfo);
    handleSetIssueType();
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
                    const getTypeFromImageId = (imageId) => {
                        const issueTypeOptions = {
                            '10306': '[FEAT]',
                            '20435': '[FIX]',
                            '20426': '[MERGE]',
                        }

                        if (!imageId)
                            return '[FEAT]';

                        return issueTypeOptions[imageId] || '[FEAT]';
                    };

                    const url = new URL(document.querySelector("#type-val img")?.src);
                    const avatarId = url.searchParams.get("avatarId");
                    
                    return {
                        taskId: document.getElementById("parent_issue_summary")?.dataset.issueKey?.trim() ?? "unknown",
                        subTaskId: document.getElementById("key-val")?.dataset.issueKey?.trim() ?? "unknown",
                        taskName: document.getElementById("parent_issue_summary")?.innerText?.trim() ?? "unknown",
                        taskSummary: document.querySelector("#summary-val")?.innerText?.trim() ?? "unknown",
                        commitIntent: getTypeFromImageId(avatarId) ?? "[FEAT]",
                    }
                },
            },
            (results) => {
                const { result } = results[0] ?? {};
                
                if (!result)
                    return;
                
                currentIssueInfo = result || {};
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