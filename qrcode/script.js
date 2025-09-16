// DOM Elements
const qrTypeSelect = document.getElementById('qr-type');
const inputFields = document.querySelector('.input-fields');
const contentInput = document.getElementById('content');
const copyBtn = document.getElementById('copy-btn');
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

// Browser capabilities detection
let browserCapabilities = {};

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

// Initialize browser capabilities
function checkBrowserCapabilities() {
    browserCapabilities = {
        clipboard: !!navigator.clipboard,
        clipboardWrite: !!(navigator.clipboard && navigator.clipboard.write),
        clipboardWriteText: !!(navigator.clipboard && navigator.clipboard.writeText),
        webShare: !!navigator.share,
        webShareFiles: !!(navigator.canShare),
        secureContext: window.isSecureContext,
        isAndroid: /Android/i.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isChrome: /Chrome/i.test(navigator.userAgent),
        isFirefox: /Firefox/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
    };
    
    console.log('Browser capabilities detected:', browserCapabilities);
    
    // Update UI based on capabilities
    updateUIForCapabilities();
    
    return browserCapabilities;
}

// Update UI based on browser capabilities
function updateUIForCapabilities() {
    if (!browserCapabilities.secureContext) {
        // Show warning for non-secure contexts
        showPersistentToast('⚠️ Some features require HTTPS. Please use a secure connection for full functionality.', 'warning');
    }
    
    // Disable share and copy buttons on mobile browsers
    if (browserCapabilities.isMobile) {
        if (shareBtn) {
            shareBtn.disabled = true;
            shareBtn.style.opacity = '0.4';
            shareBtn.title = 'Sharing disabled on mobile browsers';
            shareBtn.textContent = 'Share (Mobile Disabled)';
        }
        
        if (copyBtn) {
            copyBtn.disabled = true;
            copyBtn.style.opacity = '0.4';
            copyBtn.title = 'Copy to clipboard disabled on mobile browsers';
            copyBtn.textContent = 'Copy (Mobile Disabled)';
        }
    } else {
        // Update button tooltips for desktop browsers
        if (copyBtn && !browserCapabilities.clipboard) {
            copyBtn.title = 'Copy to clipboard not supported in this browser';
            copyBtn.style.opacity = '0.6';
        }
        
        if (shareBtn && !browserCapabilities.webShare) {
            shareBtn.title = 'Native sharing not supported - will download instead';
        }
    }
}

// Update input fields based on QR type selection
qrTypeSelect.addEventListener('change', function() {
    inputFields.innerHTML = inputTemplates[this.value];
});

// Generate QR Code content based on type
function generateContent() {
    const type = qrTypeSelect.value;
    let content = '';

    try {
        switch (type) {
            case 'text':
            case 'url':
            case 'phone':
                const element = document.getElementById('content');
                content = element ? element.value.trim() : '';
                break;
                
            case 'whatsapp':
                const waPhone = document.getElementById('phone');
                const waMessage = document.getElementById('message');
                if (waPhone && waMessage) {
                    const phoneNumber = waPhone.value.replace(/[^0-9+]/g, '');
                    const message = waMessage.value.trim();
                    content = `https://wa.me/${phoneNumber}${message ? '?text=' + encodeURIComponent(message) : ''}`;
                }
                break;
                
            case 'email':
                const email = document.getElementById('email');
                const subject = document.getElementById('subject');
                const body = document.getElementById('body');
                if (email) {
                    const emailAddr = email.value.trim();
                    const subjectText = subject ? subject.value.trim() : '';
                    const bodyText = body ? body.value.trim() : '';
                    content = `mailto:${emailAddr}`;
                    const params = [];
                    if (subjectText) params.push(`subject=${encodeURIComponent(subjectText)}`);
                    if (bodyText) params.push(`body=${encodeURIComponent(bodyText)}`);
                    if (params.length > 0) content += '?' + params.join('&');
                }
                break;
                
            case 'sms':
                const smsPhone = document.getElementById('phone');
                const smsMessage = document.getElementById('message');
                if (smsPhone) {
                    const phone = smsPhone.value.trim();
                    const message = smsMessage ? smsMessage.value.trim() : '';
                    if (browserCapabilities.isIOS) {
                        content = `sms:${phone}${message ? '&body=' + encodeURIComponent(message) : ''}`;
                    } else {
                        content = `sms:${phone}${message ? ':' + encodeURIComponent(message) : ''}`;
                    }
                }
                break;
                
            case 'wifi':
                const ssid = document.getElementById('ssid');
                const password = document.getElementById('password');
                const encryption = document.getElementById('encryption');
                if (ssid && password && encryption) {
                    const networkName = ssid.value.trim();
                    const networkPassword = password.value;
                    const encryptionType = encryption.value;
                    content = `WIFI:T:${encryptionType};S:${networkName};P:${networkPassword};;`;
                }
                break;
                
            case 'vcard':
                const name = document.getElementById('name');
                const vcardEmail = document.getElementById('email');
                const vcardPhone = document.getElementById('phone');
                const company = document.getElementById('company');
                const address = document.getElementById('address');
                
                if (name) {
                    const fullName = name.value.trim();
                    const email = vcardEmail ? vcardEmail.value.trim() : '';
                    const phone = vcardPhone ? vcardPhone.value.trim() : '';
                    const org = company ? company.value.trim() : '';
                    const addr = address ? address.value.trim() : '';
                    
                    content = `BEGIN:VCARD\nVERSION:3.0\nFN:${fullName}`;
                    if (phone) content += `\nTEL:${phone}`;
                    if (email) content += `\nEMAIL:${email}`;
                    if (org) content += `\nORG:${org}`;
                    if (addr) content += `\nADR:;;${addr};;;`;
                    content += `\nEND:VCARD`;
                }
                break;
        }
    } catch (error) {
        console.error('Error generating content:', error);
        content = '';
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
        showToast('Please fill in the required fields', 'error');
        return;
    }

    // Validate custom size if selected
    let width, height;
    if (sizeSelect.value === 'custom') {
        width = parseInt(customWidth.value);
        height = parseInt(customHeight.value);
        if (!width || !height || width < 50 || height < 50 || width > 1000 || height > 1000) {
            showToast('Please enter valid dimensions (50-1000px)', 'error');
            return;
        }
    } else {
        width = height = parseInt(sizeSelect.value);
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        // Clear previous QR code and show loading state
        if (qrCodeInstance) {
            qrCodeInstance.clear();
            qrCodeInstance = null;
        }
        qrResult.innerHTML = '<div class="qr-loading"><i class="fas fa-spinner fa-spin"></i><p>Generating QR Code...</p></div>';

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

        // Wait for QR code to be generated, then create an img element
        setTimeout(() => {
            try {
                const canvas = qrContainer.querySelector('canvas');
                if (canvas) {
                    // Create an img element with the canvas data
                    const img = document.createElement('img');
                    img.id = 'qr-code';
                    img.alt = 'Generated QR Code';
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    
                    // Convert canvas to data URL
                    img.src = canvas.toDataURL('image/png', 1.0);
                    
                    // Clear the container and add the img
                    qrResult.innerHTML = '';
                    qrResult.appendChild(img);
                    
                    // Enable action buttons
                    downloadBtn.disabled = false;
                    shareBtn.disabled = false;
                    copyBtn.disabled = false;
                    
                    showToast('QR Code generated successfully!', 'success');
                    
                } else {
                    throw new Error('Canvas not found in QR container');
                }
            } catch (error) {
                console.error('Error creating QR image:', error);
                showToast('Error generating QR code display', 'error');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate QR Code';
            }
        }, 100);
        
    } catch (error) {
        console.error('QR generation error:', error);
        showToast('Error generating QR code', 'error');
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate QR Code';
    }
});

// Create canvas from image (more reliable than direct blob conversion)
function createCanvasFromImage(img) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const tempImage = new Image();
        
        tempImage.onload = function() {
            canvas.width = tempImage.naturalWidth || tempImage.width;
            canvas.height = tempImage.naturalHeight || tempImage.height;
            
            // Fill background first
            ctx.fillStyle = backgroundColor.value || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image
            ctx.drawImage(tempImage, 0, 0);
            resolve(canvas);
        };
        
        tempImage.onerror = (error) => {
            console.error('Image load error:', error);
            reject(error);
        };
        tempImage.crossOrigin = 'anonymous';
        tempImage.src = img.src;
    });
}

// Copy Functions
copyBtn.addEventListener('click', async function() {
    if (!qrCodeInstance) {
        showToast('Please generate a QR code first', 'error');
        return;
    }

    const originalText = copyBtn.textContent;
    copyBtn.disabled = true;
    copyBtn.textContent = 'Copying...';

    try {
        const img = qrResult.querySelector('img');
        if (!img || !img.src) {
            throw new Error('QR code image not found');
        }

        if (!browserCapabilities.secureContext) {
            showToast('Copying requires HTTPS connection', 'error');
            return;
        }

        if (browserCapabilities.isAndroid) {
            await handleAndroidCopy(img);
        } else if (browserCapabilities.isMobile) {
            await handleMobileCopy(img);
        } else {
            await handleDesktopCopy(img);
        }
    } catch (error) {
        console.error('Copy error:', error);
        showToast('Failed to copy. Try downloading instead.', 'error');
    } finally {
        copyBtn.disabled = false;
        copyBtn.textContent = originalText;
    }
});

// Android-specific copy handler
async function handleAndroidCopy(img) {
    // Try to copy the actual image first (most important)
    const methods = [
        () => copyViaCanvasBlob(img),  // Try image copy first
        () => copyViaDataURL(img),     // Then data URL
        () => copyContentAsText()      // Finally text as last resort
    ];

    for (let i = 0; i < methods.length; i++) {
        try {
            await methods[i]();
            const messages = [
                'QR code image copied to clipboard!',
                'QR code data copied to clipboard!',
                'QR code content copied as text!'
            ];
            showToast(messages[i], 'success');
            return;
        } catch (error) {
            console.log(`Android copy method ${i + 1} failed:`, error);
            if (i === methods.length - 1) {
                throw error;
            }
        }
    }
}

// Copy QR content as text (most reliable for Android)
async function copyContentAsText() {
    if (!browserCapabilities.clipboardWriteText) {
        throw new Error('Text copying not supported');
    }
    
    const content = generateContent();
    if (!content) {
        throw new Error('No content to copy');
    }
    
    await navigator.clipboard.writeText(content);
}

// Copy via canvas blob
async function copyViaCanvasBlob(img) {
    if (!browserCapabilities.clipboardWrite) {
        throw new Error('Image copying not supported');
    }

    const canvas = await createCanvasFromImage(img);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            try {
                if (!blob || blob.size === 0) {
                    throw new Error('Failed to create blob');
                }
                
                // Create a new blob with explicit type to ensure compatibility
                const imageBlob = new Blob([blob], { type: 'image/png' });
                
                // Try to copy the actual image
                const clipboardItem = new ClipboardItem({
                    'image/png': imageBlob
                });
                
                await navigator.clipboard.write([clipboardItem]);
                resolve();
            } catch (error) {
                console.log('ClipboardItem failed, trying alternative approach:', error);
                
                // Alternative: try to copy the blob directly
                try {
                    const directClipboardItem = new ClipboardItem({
                        'image/png': blob
                    });
                    await navigator.clipboard.write([directClipboardItem]);
                    resolve();
                } catch (directError) {
                    reject(directError);
                }
            }
        }, 'image/png', 1.0);
    });
}

// Copy via data URL
async function copyViaDataURL(img) {
    if (!browserCapabilities.clipboardWriteText) {
        throw new Error('Text copying not supported');
    }

    const canvas = await createCanvasFromImage(img);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Failed to create data URL');
    }
    
    await navigator.clipboard.writeText(dataUrl);
}

// Mobile copy handler (for iOS and other mobile browsers)
async function handleMobileCopy(img) {
    try {
        await copyViaCanvasBlob(img);
        showToast('QR code copied to clipboard!', 'success');
    } catch (error) {
        console.log('Mobile image copy failed, trying text:', error);
        try {
            await copyContentAsText();
            showToast('QR code content copied as text!', 'success');
        } catch (textError) {
            throw new Error('All mobile copy methods failed');
        }
    }
}

// Desktop copy handler
async function handleDesktopCopy(img) {
    await copyViaCanvasBlob(img);
    showToast('QR code copied to clipboard!', 'success');
}

// Download QR Code
downloadBtn.addEventListener('click', async function() {
    if (!qrCodeInstance) {
        showToast('Please generate a QR code first', 'error');
        return;
    }

    const originalText = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';

    try {
        const img = qrResult.querySelector('img');
        if (!img || !img.src) {
            throw new Error('QR code image not found');
        }

        const format = downloadFormat.value;
        await downloadQRCode(img, format);
        showToast('Download started successfully!', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed. Please try again.', 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    }
});

// Download QR Code implementation
async function downloadQRCode(img, format) {
    const canvas = await createCanvasFromImage(img);
    
    if (format === 'svg') {
        // Create SVG
        const svgData = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                <image href="${img.src}" width="100%" height="100%"/>
            </svg>
        `;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        downloadBlob(blob, `qrcode.svg`);
        return;
    }
    
    // Convert canvas to blob and download
    let mimeType;
    switch(format) {
        case 'jpg':
            mimeType = 'image/jpeg';
            break;
        case 'webp':
            mimeType = 'image/webp';
            break;
        default:
            mimeType = 'image/png';
    }
    
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                downloadBlob(blob, `qrcode.${format}`);
                resolve();
            } else {
                reject(new Error('Failed to create download blob'));
            }
        }, mimeType, 0.9);
    });
}

// Helper function to handle downloads across different browsers and devices
function downloadBlob(blob, fileName) {
    try {
        if (window.navigator.msSaveOrOpenBlob) {
            // For IE
            window.navigator.msSaveOrOpenBlob(blob, fileName);
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Append link to body for mobile browsers
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up after a delay
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        }, 1000);
        
    } catch (error) {
        console.error('Download blob error:', error);
        throw error;
    }
}

// Share QR Code
shareBtn.addEventListener('click', async function() {
    if (!qrCodeInstance) {
        showToast('Please generate a QR code first', 'error');
        return;
    }

    const originalText = shareBtn.textContent;
    shareBtn.disabled = true;
    shareBtn.textContent = 'Sharing...';

    try {
        const img = qrResult.querySelector('img');
        if (!img || !img.src) {
            throw new Error('QR code image not found');
        }

        if (browserCapabilities.isAndroid) {
            await handleAndroidShare(img);
        } else {
            await handleGeneralShare(img);
        }
    } catch (error) {
        console.error('Share error:', error);
        showToast('Share failed. Try downloading instead.', 'error');
    } finally {
        shareBtn.disabled = false;
        shareBtn.textContent = originalText;
    }
});

// Android-specific share handler
async function handleAndroidShare(img) {
    try {
        if (browserCapabilities.webShare) {
            // Method 1: Try sharing the actual QR code image file
            try {
                const canvas = await createCanvasFromImage(img);
                const blob = await new Promise(resolve => 
                    canvas.toBlob(resolve, 'image/png', 1.0)
                );
                
                if (blob && blob.size > 0) {
                    const file = new File([blob], 'qrcode.png', { 
                        type: 'image/png',
                        lastModified: Date.now()
                    });

                    // Try to share the file directly
                    await navigator.share({
                        files: [file],
                        title: 'QR Code Image',
                        text: 'Check out this QR code!'
                    });
                    showToast('QR code image shared successfully!', 'success');
                    return;
                }
            } catch (fileShareError) {
                console.log('File sharing failed, trying URL share:', fileShareError);
            }

            // Method 2: Share the page URL (not the QR content)
            try {
                await navigator.share({
                    title: 'QR Code Generator',
                    text: 'Check out this QR code generator!',
                    url: window.location.href
                });
                showToast('QR code generator shared!', 'success');
                return;
            } catch (urlShareError) {
                console.log('URL sharing failed:', urlShareError);
            }
        }

        // Method 3: Download for manual sharing
        await downloadQRCode(img, 'png');
        showToast('QR code downloaded! Share it from your downloads folder.', 'success');
        
    } catch (error) {
        console.error('All Android share methods failed:', error);
        throw error;
    }
}

// General share handler for other browsers
async function handleGeneralShare(img) {
    if (browserCapabilities.webShare && browserCapabilities.secureContext) {
        try {
            const canvas = await createCanvasFromImage(img);
            const blob = await new Promise(resolve => 
                canvas.toBlob(resolve, 'image/png', 1.0)
            );
            
            if (blob && blob.size > 0) {
                const file = new File([blob], 'qrcode.png', { 
                    type: 'image/png',
                    lastModified: Date.now()
                });
                
                // Try to share the actual image file
                await navigator.share({
                    files: [file],
                    title: 'QR Code Image',
                    text: 'Check out this QR code!'
                });
                
                showToast('QR code image shared successfully!', 'success');
                return;
            }
        } catch (error) {
            console.log('File sharing failed, trying copy fallback:', error);
        }
        
        // Fallback: share the page URL
        try {
            await navigator.share({
                title: 'QR Code Generator',
                text: 'Check out this QR code generator!',
                url: window.location.href
            });
            showToast('QR code generator shared!', 'success');
        } catch (urlError) {
            // Final fallback to copy
            await handleDesktopCopy(img);
            showToast('Sharing not supported. QR code copied to clipboard!', 'info');
        }
    } else {
        // No sharing support, try copy or download
        if (browserCapabilities.clipboard) {
            await handleDesktopCopy(img);
            showToast('Sharing not supported. QR code copied to clipboard!', 'info');
        } else {
            await downloadQRCode(img, 'png');
            showToast('Sharing not supported. QR code downloaded!', 'info');
        }
    }
}

// Enhanced toast function with different types
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Color scheme based on type
    const colors = {
        success: { bg: 'rgba(46, 125, 50, 0.9)', color: 'white' },
        error: { bg: 'rgba(211, 47, 47, 0.9)', color: 'white' },
        warning: { bg: 'rgba(237, 108, 0, 0.9)', color: 'white' },
        info: { bg: 'rgba(2, 136, 209, 0.9)', color: 'white' }
    };
    
    const style = colors[type] || colors.info;
    
    // Better positioning for mobile
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: style.bg,
        color: style.color,
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: '10000',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        maxWidth: '90vw',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// Persistent toast for important messages
function showPersistentToast(message, type = 'warning') {
    const persistentToast = document.createElement('div');
    persistentToast.className = `persistent-toast persistent-toast-${type}`;
    persistentToast.innerHTML = `
        ${message}
        <button class="close-persistent-toast" style="margin-left: 10px; background: none; border: none; color: inherit; cursor: pointer; font-size: 16px;">&times;</button>
    `;
    
    Object.assign(persistentToast.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(237, 108, 0, 0.95)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '6px',
        zIndex: '10001',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        maxWidth: '90vw',
        wordWrap: 'break-word',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(persistentToast);
    
    // Add close button functionality
    const closeBtn = persistentToast.querySelector('.close-persistent-toast');
    closeBtn.addEventListener('click', () => {
        persistentToast.style.opacity = '0';
        persistentToast.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => {
            if (persistentToast.parentNode) {
                persistentToast.remove();
            }
        }, 300);
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (persistentToast.parentNode) {
            persistentToast.style.opacity = '0';
            persistentToast.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (persistentToast.parentNode) {
                    persistentToast.remove();
                }
            }, 300);
        }
    }, 10000);
}

// Initialize the application
function initializeApp() {
    // Check browser capabilities first
    checkBrowserCapabilities();
    
    // Set up input field change handler (now handled by setupInputTemplates)
    // The old template system is replaced with dynamic label/placeholder updates
    
    // Set up size selector change handler
    sizeSelect.addEventListener('change', function() {
        customSizeInputs.style.display = this.value === 'custom' ? 'grid' : 'none';
    });
    
    // Set up color input handlers
    setupColorInputs();
    
    // Set up dynamic input field templates
    setupInputTemplates();
    
    // Debug: Check if color elements exist
    setTimeout(() => {
        const fg = document.getElementById('foreground');
        const bg = document.getElementById('background');
        const fgPreview = document.getElementById('foreground-preview');
        const bgPreview = document.getElementById('background-preview');
        
        console.log('Color elements check:');
        console.log('Foreground input:', fg);
        console.log('Background input:', bg);
        console.log('Foreground preview:', fgPreview);
        console.log('Background preview:', bgPreview);
        
        if (fgPreview) {
            fgPreview.style.background = fg?.value || '#000000';
            console.log('Set foreground preview to:', fg?.value || '#000000');
        }
        if (bgPreview) {
            bgPreview.style.background = bg?.value || '#ffffff';
            console.log('Set background preview to:', bg?.value || '#ffffff');
        }
    }, 100);
    
    // Initialize with text type
    qrTypeSelect.dispatchEvent(new Event('change'));
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to generate QR code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!generateBtn.disabled) {
                generateBtn.click();
            }
        }
        
        // Escape to clear QR code
        if (e.key === 'Escape') {
            if (qrResult.innerHTML) {
                qrResult.innerHTML = '';
                downloadBtn.disabled = true;
                shareBtn.disabled = true;
                copyBtn.disabled = true;
                showToast('QR code cleared', 'info');
            }
        }
    });
    
    // Mobile touch gestures removed for better user experience
    
    console.log('QR Code Generator initialized successfully');
}

// Set up color input functionality
function setupColorInputs() {
    const foregroundColor = document.getElementById('foreground');
    const backgroundColor = document.getElementById('background');
    const foregroundPreview = document.getElementById('foreground-preview');
    const backgroundPreview = document.getElementById('background-preview');
    
    if (foregroundColor && foregroundPreview) {
        // Set initial preview
        foregroundPreview.style.background = foregroundColor.value;
        foregroundPreview.style.borderColor = foregroundColor.value;
        
        // Update preview on change
        foregroundColor.addEventListener('input', function() {
            const color = this.value;
            foregroundPreview.style.background = color;
            foregroundPreview.style.borderColor = color;
            console.log('Foreground color changed to:', color);
        });
        
        // Also listen for change event
        foregroundColor.addEventListener('change', function() {
            const color = this.value;
            foregroundPreview.style.background = color;
            foregroundPreview.style.borderColor = color;
            console.log('Foreground color changed to:', color);
        });
    }
    
    if (backgroundColor && backgroundPreview) {
        // Set initial preview
        backgroundPreview.style.background = backgroundColor.value;
        backgroundPreview.style.borderColor = backgroundColor.value;
        
        // Update preview on change
        backgroundColor.addEventListener('input', function() {
            const color = this.value;
            backgroundPreview.style.background = color;
            backgroundPreview.style.borderColor = color;
            console.log('Background color changed to:', color);
        });
        
        // Also listen for change event
        backgroundColor.addEventListener('change', function() {
            const color = this.value;
            backgroundPreview.style.background = color;
            backgroundPreview.style.borderColor = color;
            console.log('Background color changed to:', color);
        });
    }
    
    // Log initial setup
    console.log('Color inputs initialized');
    console.log('Foreground color:', foregroundColor?.value);
    console.log('Background color:', backgroundColor?.value);
}

// Set up dynamic input field templates
function setupInputTemplates() {
    const qrTypeSelect = document.getElementById('qr-type');
    const inputFields = document.querySelector('.main-inputs');
    
    if (qrTypeSelect && inputFields) {
        // Update input fields when type changes
        qrTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            updateInputFields(selectedType, inputFields);
        });
        
        // Initialize with text type
        updateInputFields('text', inputFields);
    }
}

// Update input fields based on selected type
function updateInputFields(type, container) {
    const typeField = container.querySelector('.input-group:first-child');
    const contentField = container.querySelector('.input-group:last-child');
    
    if (typeField && contentField) {
        // Update content field label and placeholder based on type
        const contentLabel = contentField.querySelector('label');
        const contentTextarea = contentField.querySelector('textarea');
        
        if (contentLabel && contentTextarea) {
            switch(type) {
                case 'text':
                    contentLabel.textContent = 'Text Content';
                    contentTextarea.placeholder = 'Enter your text here...';
                    break;
                case 'url':
                    contentLabel.textContent = 'Website URL';
                    contentTextarea.placeholder = 'https://example.com';
                    break;
                case 'email':
                    contentLabel.textContent = 'Email Address';
                    contentTextarea.placeholder = 'user@example.com';
                    break;
                case 'phone':
                    contentLabel.textContent = 'Phone Number';
                    contentTextarea.placeholder = '+1234567890';
                    break;
                case 'sms':
                    contentLabel.textContent = 'SMS Message';
                    contentTextarea.placeholder = 'Enter your SMS message...';
                    break;
                case 'whatsapp':
                    contentLabel.textContent = 'WhatsApp Message';
                    contentTextarea.placeholder = 'Enter your WhatsApp message...';
                    break;
                case 'wifi':
                    contentLabel.textContent = 'WiFi Details';
                    contentTextarea.placeholder = 'Network: MyWiFi\nPassword: mypassword123\nSecurity: WPA2';
                    break;
                case 'vcard':
                    contentLabel.textContent = 'Contact Information';
                    contentTextarea.placeholder = 'Name: John Doe\nPhone: +1234567890\nEmail: john@example.com';
                    break;
                default:
                    contentLabel.textContent = 'Content';
                    contentTextarea.placeholder = 'Enter your content here...';
            }
        }
    }
}

// Add CSS styles for enhanced UI
function addEnhancedStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
        }
        
        .persistent-toast {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        
        .persistent-toast .close-persistent-toast:hover {
            opacity: 0.8;
        }
        
        .persistent-toast .close-persistent-toast:active {
            opacity: 0.6;
        }
        
        /* Enhanced button states */
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        button:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        button:not(:disabled):active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        /* Loading states */
        .loading {
            position: relative;
            overflow: hidden;
        }
        
        .loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .toast {
                bottom: 10px;
                left: 10px;
                right: 10px;
                transform: none;
                max-width: none;
            }
            
            .persistent-toast {
                top: 5px;
                left: 10px;
                right: 10px;
                transform: none;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        addEnhancedStyles();
        initializeApp();
    });
} else {
    addEnhancedStyles();
    initializeApp();
}