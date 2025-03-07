// Keep only the deviceData for IMEI info
let deviceData = null;
let currentInvoiceNo = null;

document.addEventListener('DOMContentLoaded', () => {
    const imeiInput = document.getElementById('imeiInput');
    const checkImeiBtn = document.getElementById('checkImei');
    const resultDiv = document.getElementById('result');
    const deviceInfoDiv = document.getElementById('deviceInfo');
    
    // IMEI check handler
    checkImeiBtn.addEventListener('click', async () => {
        const imei = imeiInput.value.trim();
        if (!isValidIMEI(imei)) {
            alert('Please enter a valid 15-digit IMEI number');
            return;
        }

        try {
            const response = await fetch(`https://mis.carlcare.com/CarlcareClient/electronic-card/get-active-detail?imei=${imei}`);
            deviceData = await response.json();
            displayDeviceInfo(deviceData);
        } catch (error) {
            alert('Failed to fetch IMEI data');
            console.error('Error:', error);
        }
    });

    function isValidIMEI(imei) {
        return /^\d{15}$/.test(imei);
    }

    function displayDeviceInfo(data) {
        resultDiv.classList.remove('hidden');
        
        if (data.error) {
            deviceInfoDiv.innerHTML = `
                <p class="error"><strong>Error:</strong> ${data.error}</p>
            `;
            return;
        }
        
        // Format timestamp to readable date
        const date = new Date(data.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Store invoice number globally
        currentInvoiceNo = '0' + Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        const deviceInfo = data.data || {};
        
        // Get the submitted IMEI from input
        const submittedImei = document.getElementById('imeiInput').value.trim();

        deviceInfoDiv.innerHTML = `
            <div class="device-info-card">
                <div class="card-header">
                    <div class="header-main">
                        <h3>Device Information</h3>
                        <div class="invoice-badge">INV: ${currentInvoiceNo}</div>
                    </div>
                    <div class="header-sub">${formattedDate}</div>
                </div>

                <div class="info-container">
                    <div class="info-row">
                        <div class="info-col">
                            <div class="info-label">Brand</div>
                            <div class="info-value">${deviceInfo.brand || 'N/A'}</div>
                        </div>
                        <div class="info-col">
                            <div class="info-label">Market Name</div>
                            <div class="info-value">${deviceInfo.marketName || 'N/A'}</div>
                        </div>
                    </div>

                    <div class="info-row">
                        <div class="info-col">
                            <div class="info-label">Country</div>
                            <div class="info-value">${deviceInfo.country || 'N/A'}</div>
                        </div>
                        <div class="info-col">
                            <div class="info-label">IMEI</div>
                            <div class="info-value imei-value">${submittedImei}</div>
                        </div>
                    </div>

                    <div class="raw-data">
                        <details>
                            <summary>Raw Response Data</summary>
                            <pre>${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>

                    <div class="action-buttons">
                        <button id="generateImage" class="generate-btn">
                            Generate Image
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click handler for Generate Image button after displaying info
        const generateBtn = document.getElementById('generateImage');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateImage);
        }
    }

    // Add new function to handle image generation
    async function handleGenerateImage() {
        if (!deviceData || !deviceData.data) {
            alert('No device data available');
            return;
        }

        try {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Load template image with correct path
            const img = new Image();
            img.src = '/template.png';
            
            // Wait for image to load
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Set canvas size to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0);

                    // Get text to overlay
                    const submittedImei = document.getElementById('imeiInput').value.trim();
                    const marketModel = deviceData.data.marketName || 'N/A';

                    // Configure text style with larger font size
                    ctx.font = ' 26px Arial';  // Changed to 12px and added bold
                    ctx.fillStyle = '#000000';

                    // Draw text at specified positions
                    ctx.fillText(marketModel, 470, 894);  // Market Model position
                    ctx.fillText(submittedImei, 390, 997); // IMEI position
                    ctx.fillText(currentInvoiceNo, 1160, 560); // Invoice position

                    // Show preview
                    showPreview(canvas.toDataURL('image/png'));
                    resolve();
                };
                
                img.onerror = (e) => {
                    console.error('Error loading image:', e);
                    reject(new Error('Failed to load template image. Please check if the image exists at: ' + img.src));
                };
            });

        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image: ' + error.message);
        }
    }

    // Function to show preview and download button
    function showPreview(dataUrl) {
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.innerHTML = `
            <div class="preview-image">
                <img src="${dataUrl}" alt="Generated Invoice" />
            </div>
            <div class="download-button">
                <button onclick="downloadImage('${dataUrl}')" class="download-btn">
                    Download Invoice
                </button>
            </div>
        `;

        // Find the template preview section and replace its content
        const templatePreview = document.querySelector('.template-preview');
        if (templatePreview) {
            templatePreview.innerHTML = '';
            templatePreview.appendChild(previewContainer);
        }
    }
});

// Add global download function
window.downloadImage = function(dataUrl) {
    const link = document.createElement('a');
    link.download = `invoice-${currentInvoiceNo}.png`;
    link.href = dataUrl;
    link.click();
}; 