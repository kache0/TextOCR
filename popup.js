function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            console.log(tabs[0].id);
            if (callback) callback(response); //確保callback被調用 並傳入response，如果錯誤或無響應回覆做確認
        });

    });
}

document.addEventListener('DOMContentLoaded', function () {
    // 獲取輸入框和按鈕
    const inputText = document.getElementById('inputText');
    const submitButton = document.getElementById('submitButton');

    // 當按鈕被點擊時
    submitButton.addEventListener('click', function () {
        const text = inputText.value;
        
        chrome.storage.local.set({ api_key: text }, function () {
            alert('API key 保存成功:', text);
        });        

        // 關閉彈出窗口
        window.close();
    });
});