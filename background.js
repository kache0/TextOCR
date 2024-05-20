// 發送請求到content_script
function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.insertCSS({
            target: { tabId: tabs[0].id },
            files: ['cropper.css'] 
        });
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['cropper.js'] 
        });
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            console.log(tabs[0].id);
            if (callback) callback(response); //確保callback被調用 並傳入response，如果錯誤或無響應回覆做確認
        });
    });
}

// 創建右鍵菜單項目，指定了ID
chrome.contextMenus.create({
    title: "文字識別",
    contexts: ['all'],
    id: "textOCR"  // 將 ID 設置為 "textOCR"
}, () => chrome.runtime.lastError);
// 右鍵菜單的選項
chrome.contextMenus.onClicked.addListener(function (info) {
    if (info.menuItemId === "textOCR") {  // 這裡的比對使用 ID "textOCR
        chrome.tabs.captureVisibleTab(null, { format: "png" }, function (base64) {
            //分頁掛到最上層
            sendMessageToContentScript({ type: 'get_screenshot_data', payload: base64 }, (response) => {
                console.log("response:", response);
                console.log(base64)
            });
        });
    }
});        
        
 
        