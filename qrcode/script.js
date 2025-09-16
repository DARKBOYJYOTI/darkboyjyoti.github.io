// DOM Elements
const qrTypeSelect = document.getElementById('qr-type');
const inputFields = document.querySelector('.input-fields');
const contentInput = document.getElementById('content');
const sizeSelect = document.getElementById('size');
const customSizeInputs = document.getElementById('custom-size-inputs');
const customWidth = document.getElementById('custom-width');
const customHeight = document.getElementById('custom-height');
const downloadFormat = document.getElementById('download-format');
const correctionLevelSelect = document.getElementById('correction-level');
const foregroundColor = document.getElementById('foreground');
const backgroundColor = document.getElementById('background');
const generateBtn = document.getElementById('generate-btn');
const qrResult = document.getElementById('qr-result');
const qrCode = document.getElementById('qr-code');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');

// QR Code instance
let qrCodeInstance = null;

// Input field templates for different QR types
const inputTemplates = {
    text: `
        <div class="input-field">
            <label for="content">Text:</label>
            <textarea id="content" placeholder="Enter your text here"></textarea>
        </div>
    `,
    url: `
        <div class="input-field url-field">
            <label for="content">URL:</label>
            <input type="url" id="content" placeholder="https://example.com" class="large-input">
            <p class="input-hint">Enter the complete URL including https:// or http://</p>
        </div>
    `,
    whatsapp: `
        <div class="input-field">
            <label for="phone">WhatsApp Number:</label>
            <input type="tel" id="phone" placeholder="+1234567890 (with country code)">
        </div>
        <div class="input-field">
            <label for="message">WhatsApp Message:</label>
            <textarea id="message" placeholder="Enter your message here"></textarea>
        </div>
    `,
    email: `
        <div class="input-field">
            <label for="email">Email Address:</label>
            <input type="email" id="email" placeholder="example@email.com">
        </div>
        <div class="input-field">
            <label for="subject">Subject (optional):</label>
            <input type="text" id="subject" placeholder="Email subject">
        </div>
        <div class="input-field">
            <label for="body">Message (optional):</label>
            <textarea id="body" placeholder="Email body"></textarea>
        </div>
    `,
    phone: `
        <div class="input-field">
            <label for="content">Phone Number:</label>
            <input type="tel" id="content" placeholder="+1234567890">
        </div>
    `,
    sms: `
        <div class="input-field">
            <label for="phone">Phone Number:</label>
            <input type="tel" id="phone" placeholder="+1234567890">
        </div>
        <div class="input-field">
            <label for="message">Message:</label>
            <textarea id="message" placeholder="Enter your message"></textarea>
        </div>
    `,
    wifi: `
        <div class="input-field">
            <label for="ssid">Network Name (SSID):</label>
            <input type="text" id="ssid" placeholder="WiFi Network Name">
        </div>
        <div class="input-field">
            <label for="password">Password:</label>
            <input type="password" id="password" placeholder="WiFi Password">
        </div>
        <div class="input-field">
            <label for="encryption">Encryption:</label>
            <select id="encryption">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No Encryption</option>
            </select>
        </div>
    `,
    vcard: `
        <div class="input-field">
            <label for="name">Full Name:</label>
            <input type="text" id="name" placeholder="John Doe">
        </div>
        <div class="input-field">
            <label for="email">Email:</label>
            <input type="email" id="email" placeholder="john@example.com">
        </div>
        <div class="input-field">
            <label for="phone">Phone:</label>
            <input type="tel" id="phone" placeholder="+1234567890">
        </div>
        <div class="input-field">
            <label for="company">Company (optional):</label>
            <input type="text" id="company" placeholder="Company Name">
        </div>
        <div class="input-field">
            <label for="address">Address (optional):</label>
            <textarea id="address" placeholder="Street, City, Country"></textarea>
        </div>
    `
};

// Update input fields based on QR type selection
qrTypeSelect.addEventListener('change', function() {
    inputFields.innerHTML = inputTemplates[this.value];
});

// Generate QR Code content based on type
function generateContent() {
    const type = qrTypeSelect.value;
    let content = '';

    switch (type) {
        case 'text':
        case 'url':
        case 'phone':
            content = document.getElementById('content').value;
            break;
        case 'whatsapp':
            const waPhone = document.getElementById('phone').value.replace(/[^0-9+]/g, '');
            const waMessage = document.getElementById('message').value;
            content = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
            break;
        case 'email':
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const body = document.getElementById('body').value;
            content = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            break;
        case 'sms':
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            content = `sms:${phone}:${encodeURIComponent(message)}`;
            break;
        case 'wifi':
            const ssid = document.getElementById('ssid').value;
            const password = document.getElementById('password').value;
            const encryption = document.getElementById('encryption').value;
            content = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
            break;
        case 'vcard':
            const name = document.getElementById('name').value;
            const vcardEmail = document.getElementById('email').value;
            const vcardPhone = document.getElementById('phone').value;
            const company = document.getElementById('company').value;
            const address = document.getElementById('address').value;
            content = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${vcardPhone}
EMAIL:${vcardEmail}
ORG:${company}
ADR:;;${address};;;
END:VCARD`;
            break;
    }

    return content;
}

// Handle size select change
sizeSelect.addEventListener('change', function() {
    customSizeInputs.style.display = this.value === 'custom' ? 'grid' : 'none';
});

// Generate QR Code
generateBtn.addEventListener('click', function() {
    const content = generateContent();
    if (!content) {
        alert('Please fill in the required fields');
        return;
    }

    // Validate custom size if selected
    let width, height;
    if (sizeSelect.value === 'custom') {
        width = parseInt(customWidth.value);
        height = parseInt(customHeight.value);
        if (!width || !height || width < 50 || height < 50 || width > 1000 || height > 1000) {
            alert('Please enter valid dimensions (50-1000px)');
            return;
        }
    } else {
        width = height = parseInt(sizeSelect.value);
    }

    // Clear previous QR code
    if (qrCodeInstance) {
        qrCodeInstance.clear();
        qrCodeInstance = null;
    }
    qrResult.innerHTML = '';

    // Create new QR code
    const qrContainer = document.createElement('div');
    qrResult.appendChild(qrContainer);

    qrCodeInstance = new QRCode(qrContainer, {
        text: content,
        width: width,
        height: height,
        colorDark: foregroundColor.value,
        colorLight: backgroundColor.value,
        correctLevel: QRCode.CorrectLevel[correctionLevelSelect.value]
    });

    // Enable download and share buttons
    downloadBtn.disabled = false;
    shareBtn.disabled = false;
});

// Download QR Code
downloadBtn.addEventListener('click', async function() {
    if (!qrCodeInstance) return;

    const img = qrResult.querySelector('img');
    const format = downloadFormat.value;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const tempImage = new Image();
    
    tempImage.onload = function() {
        canvas.width = tempImage.width;
        canvas.height = tempImage.height;
        
        // Fill background
        ctx.fillStyle = backgroundColor.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the QR code
        ctx.drawImage(tempImage, 0, 0);
        
        // Convert to desired format
        let mimeType;
        switch(format) {
            case 'jpg':
                mimeType = 'image/jpeg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                break;
            case 'svg':
                // For SVG, we need to create an SVG element
                const svgData = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                        <image href="${img.src}" width="100%" height="100%"/>
                    </svg>
                `;
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `qrcode.svg`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                return;
            default:
                mimeType = 'image/png';
        }
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qrcode.${format}`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, mimeType, 0.9);
    };
    
    tempImage.src = img.src;
});

// Share QR Code
shareBtn.addEventListener('click', async function() {
    if (!qrCodeInstance) return;

    const img = qrResult.querySelector('img');
    
    // Convert base64 to blob
    const response = await fetch(img.src);
    const blob = await response.blob();

    // Check if Web Share API is supported
    if (navigator.share) {
        try {
            await navigator.share({
                files: [new File([blob], 'qrcode.png', { type: 'image/png' })],
                title: 'QR Code',
                text: 'Check out this QR code!'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        alert('Web Share API is not supported in your browser');
    }
});

// Initialize with text type
qrTypeSelect.dispatchEvent(new Event('change'));
