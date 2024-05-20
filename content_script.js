let overlay; // 將overlay聲明為全局變數 避免cancel功能找不到overlay
let api_key;

chrome.storage.local.get(['api_key'], function (result) {
    api_key = result.api_key;
    console.log('讀取到的 API key:', api_key);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {


    switch (request.type) {

        case 'get_screenshot_data': {
            console.log("接收到了",api_key);
            sendResponse("接收成功");
            const base64 = request.payload;
            if (!base64) return sendResponse("未收到");
            console.log("接收到了");
        
            document.body.style.overflow = 'hidden';
            
            const image = new Image();
            image.src = base64;

            image.onload = function() {
                

                //建立圖層容器
                const overlay = document.createElement('div');
                overlay.id = 'overlay'; 
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.zIndex = '9999'; 
                overlay.appendChild(image); 

                data = document.createElement('span');  
                data.id = 'data';

                cropBoxData = document.createElement('span');
                cropBoxData.id = 'cropBoxData';

                
                // 建立顯示裁剪結果的容器
                const result = document.createElement('div');
                result.id = 'result';
                result.style.position = 'absolute'; 
                result.style.top = '10px'; 
                result.style.right = '80px';
                result.style.zIndex = '9999'; 
                overlay.appendChild(result);

                document.body.appendChild(overlay);
                
                // 初始化cropper.js
                const cropper = new Cropper(image, {
                    viewMode: 3,
                    movable: false,
                    scalable: false,
                    zoomable: false,
                    ready: function (event) {
                        // 將圖像放大到其自然大小
                        cropper.zoomTo(1);
                    },  

                    crop: function (event) {
                        data.textContent = JSON.stringify(cropper.getData());
                        cropBoxData.textContent = JSON.stringify(cropper.getCropBoxData());
                    },

                    zoom: function (event) {
                        // 保持圖像在其原始大小
                        if (event.detail.oldRatio === 1) {
                            event.preventDefault();
                        }
                    },
   

                });
            
                // 建立取消裁剪操作按鈕
                const buttonCancel = document.createElement('button');
                buttonCancel.id = 'buttonCancel';
                buttonCancel.textContent = 'Cancel';
                buttonCancel.style.position = 'absolute'; 
                buttonCancel.style.top = '10px'; 
                buttonCancel.style.left = '10px';
                buttonCancel.style.zIndex = '9999'; 
                buttonCancel.onclick = function () {
                    cropper.destroy(); // 
                    const overlay = document.getElementById('overlay');
                    overlay.parentNode.removeChild(overlay);
                    document.body.style.overflow = 'auto';
                }
                overlay.appendChild(buttonCancel);

                // 建立裁剪按鈕
                const button = document.createElement('button');
                button.id = 'button';
                button.textContent = 'Crop';
                button.style.position = 'absolute'; 
                button.style.top = '10px'; 
                button.style.right = '10px';
                button.style.zIndex = '9999'; 
                button.onclick = function () {
                    result.innerHTML = '';
                    const  croppedCanvas = cropper.getCroppedCanvas();
                    result.appendChild(croppedCanvas);            
                    const  base64_google_api = croppedCanvas.toDataURL().replace(/^data:image\/[a-zA-Z]+;base64,/, '');
                    console.log(base64_google_api);

                    // 傳送到google api
                    
                    const url = `https://vision.googleapis.com/v1/images:annotate?key=${api_key}`;
                    
                    
                    // Request
                    const requestBody = {
                        "requests": [
                            {
                                "image": {
                                    "content": base64_google_api
                                },
                                "features": [
                                    {
                                        "type": "TEXT_DETECTION",
                                        "maxResults": 10
                                    }
                                ]
                            }
                        ]
                    };

                    // 發送請求到 Google Vision API
                    fetch(url, {
                        method: 'POST',
                        body: JSON.stringify(requestBody),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json())
                        .then(data => {
                            console.log('Success:', data);
                            // 處理響應
                            if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
                                const extractedText = data.responses[0].textAnnotations[0].description;
                                console.log(extractedText);
                                navigator.clipboard.writeText(extractedText);
                                alert("文字已自動複製到剪貼板！");
                            }
                        })
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                        
                };
                overlay.appendChild(button);

            };
            break;
        }
    }
});
