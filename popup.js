window.onload = () => {    
    const issue = document.getElementById("issue-id-value");
    const customerDescription = document.getElementById("issue-customer-description");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: () => {
                    const taskElement = document.getElementById("parent_issue_summary");
                    const subTaskElement = document.getElementById("key-val");
                    
                    return {
                        taskId: taskElement?.getAttribute("data-issue-key") ?? "error while getting task id",
                        subTaskId: subTaskElement?.getAttribute("data-issue-key") ?? "error while getting subtask id",
                        taskName: taskElement?.innerText ?? "error while getting task name",
                    }
                },
            },
            (results) => {
                const { result } = results[0] ?? {};
                issue.innerText = `${result.subTaskId}\\${result.taskId}`;
                customerDescription.innerText = `[FEAT] ${result.taskName}`;
            }
        );
    });
}

document.querySelectorAll("ul>li").forEach(element => {
    element.addEventListener("click", () => {
        console.log(element.innerText)
    })
})