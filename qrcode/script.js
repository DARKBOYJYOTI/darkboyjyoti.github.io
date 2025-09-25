document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const qrTypeSelect = document.getElementById('qr-type');
    const dynamicInputs = document.getElementById('dynamic-inputs');
    const sizeSelect = document.getElementById('size');
    const customSizeInputs = document.getElementById('custom-size-inputs');
    const customWidth = document.getElementById('custom-width');
    const customHeight = document.getElementById('custom-height');
    const downloadFormat = document.getElementById('download-format');
    const correctionLevelSelect = document.getElementById('correction-level');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const qrResult = document.getElementById('qr-result');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const themeToggle = document.getElementById('theme-toggle');

    let qrCodeInstance = null;

    // --- Theme Switcher ---
    function applyInitialTheme() {
        const root = document.documentElement;
        const stored = localStorage.getItem("qrcode_theme");
        const themeCheckbox = document.getElementById("theme-toggle");

        if (stored) {
            root.setAttribute("data-theme", stored);
            if (stored === "dark") {
                themeCheckbox.checked = true;
            }
            return;
        }
        // auto detect
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", prefersDark ? "dark" : "light");
        if (prefersDark) {
            themeCheckbox.checked = true;
        }
    }

    function toggleTheme() {
        const root = document.documentElement;
        const themeCheckbox = document.getElementById("theme-toggle");
        const newTheme = themeCheckbox.checked ? "dark" : "light";
        root.setAttribute("data-theme", newTheme);
        localStorage.setItem("qrcode_theme", newTheme);
    }

    themeToggle.addEventListener('change', toggleTheme);

    // --- Color Pickers ---
    const createColorPicker = (selector, defaultColor) => {
        return Pickr.create({
            el: selector,
            theme: 'classic',
            default: defaultColor,
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: true,
                    hsva: true,
                    cmyk: true,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        }).on('save', (color, instance) => {
            instance.hide();
        });
    };

    const foregroundPicker = createColorPicker('#foreground-picker', '#000000');
    const backgroundPicker = createColorPicker('#background-picker', '#ffffff');

    // --- Input Templates ---
    const inputTemplates = {
        text: `
            <div class="input-group">
                <label for="content">Text</label>
                <textarea id="content" placeholder="Enter your text here..." class="modern-textarea"></textarea>
            </div>
        `,
        url: `
            <div class="input-group">
                <label for="content">URL</label>
                <input type="url" id="content" placeholder="https://example.com" class="modern-input">
            </div>
        `,
        phone: `
            <div class="input-group">
                <label for="content">Phone Number</label>
                <input type="tel" id="content" placeholder="+1234567890" class="modern-input">
            </div>
        `,
        email: `
            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" placeholder="user@example.com" class="modern-input">
            </div>
            <div class="input-group">
                <label for="subject">Subject</label>
                <input type="text" id="subject" placeholder="Email Subject" class="modern-input">
            </div>
            <div class="input-group">
                <label for="body">Body</label>
                <textarea id="body" placeholder="Email Body" class="modern-textarea"></textarea>
            </div>
        `,
        sms: `
            <div class="input-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="+1234567890" class="modern-input">
            </div>
            <div class="input-group">
                <label for="message">Message</label>
                <textarea id="message" placeholder="SMS Message" class="modern-textarea"></textarea>
            </div>
        `,
        whatsapp: `
            <div class="input-group">
                <label for="phone">WhatsApp Number</label>
                <input type="tel" id="phone" placeholder="+1234567890" class="modern-input">
            </div>
            <div class="input-group">
                <label for="message">Message</label>
                <textarea id="message" placeholder="WhatsApp Message" class="modern-textarea"></textarea>
            </div>
        `,
        wifi: `
            <div class="input-group">
                <label for="ssid">Network Name (SSID)</label>
                <input type="text" id="ssid" placeholder="WiFi Network Name" class="modern-input">
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" placeholder="WiFi Password" class="modern-input">
            </div>
            <div class="input-group">
                <label for="encryption">Encryption</label>
                <select id="encryption" class="modern-select">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No Encryption</option>
                </select>
            </div>
        `,
        vcard: `
            <div class="input-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" placeholder="John Doe" class="modern-input">
            </div>
            <div class="input-group">
                <label for="email">Email</label>
                <input type="email" id="email" placeholder="john@example.com" class="modern-input">
            </div>
            <div class="input-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone" placeholder="+1234567890" class="modern-input">
            </div>
            <div class="input-group">
                <label for="company">Company</label>
                <input type="text" id="company" placeholder="Company Name" class="modern-input">
            </div>
            <div class="input-group">
                <label for="address">Address</label>
                <textarea id="address" placeholder="Street, City, Country" class="modern-textarea"></textarea>
            </div>
        `
    };

    // --- Core Functions ---

    const updateDynamicInputs = () => {
        const type = qrTypeSelect.value;
        dynamicInputs.innerHTML = inputTemplates[type] || '';
    };

    const clearQrCode = () => {
        qrResult.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>Your QR code will appear here</p>
            </div>
        `;
        downloadBtn.disabled = true;
        copyBtn.disabled = true;
        shareBtn.disabled = true;
    };

    const resetAll = () => {
        qrTypeSelect.value = 'text';
        updateDynamicInputs();
        clearQrCode();
        sizeSelect.value = '200';
        customSizeInputs.style.display = 'none';
        correctionLevelSelect.value = 'M';
        foregroundPicker.setColor('#000000');
        backgroundPicker.setColor('#ffffff');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const showAlert = (message) => {
        // You can replace this with a more sophisticated notification system
        alert(message);
    };

    const getContent = () => {
        const type = qrTypeSelect.value;
        try {
            switch (type) {
                case 'text':
                case 'url':
                case 'phone':
                    const content = document.getElementById('content').value.trim();
                    if (!content) {
                        showAlert('Please enter content for the QR code.');
                        return null;
                    }
                    return content;
                case 'email':
                    const email = document.getElementById('email').value.trim();
                    if (!email) {
                        showAlert('Please enter an email address.');
                        return null;
                    }
                    const subject = document.getElementById('subject').value.trim();
                    const body = document.getElementById('body').value.trim();
                    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                case 'sms':
                    const smsPhone = document.getElementById('phone').value.trim();
                    if (!smsPhone) {
                        showAlert('Please enter a phone number.');
                        return null;
                    }
                    const smsMessage = document.getElementById('message').value.trim();
                    return `smsto:${smsPhone}:${encodeURIComponent(smsMessage)}`;
                case 'whatsapp':
                    const waPhone = document.getElementById('phone').value.trim();
                    if (!waPhone) {
                        showAlert('Please enter a WhatsApp number.');
                        return null;
                    }
                    const waMessage = document.getElementById('message').value.trim();
                    return `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
                case 'wifi':
                    const ssid = document.getElementById('ssid').value.trim();
                    if (!ssid) {
                        showAlert('Please enter a network name (SSID).');
                        return null;
                    }
                    const password = document.getElementById('password').value.trim();
                    const encryption = document.getElementById('encryption').value;
                    return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
                case 'vcard':
                    const name = document.getElementById('name').value.trim();
                    if (!name) {
                        showAlert('Please enter a name for the vCard.');
                        return null;
                    }
                    const vcardEmail = document.getElementById('email').value.trim();
                    const vcardPhone = document.getElementById('phone').value.trim();
                    const company = document.getElementById('company').value.trim();
                    const address = document.getElementById('address').value.trim();
                    return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${vcardPhone}
EMAIL:${vcardEmail}
ORG:${company}
ADR:${address}
END:VCARD`;
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error getting content:', error);
            showAlert('An error occurred while getting the content. Please check your inputs.');
            return null;
        }
    };

    const generateQrCode = () => {
        const content = getContent();
        if (!content) {
            return;
        }

        let width, height;
        if (sizeSelect.value === 'custom') {
            width = parseInt(customWidth.value, 10);
            height = parseInt(customHeight.value, 10);
            if (isNaN(width) || isNaN(height) || width < 50 || height < 50 || width > 1000 || height > 1000) {
                showAlert('Please enter valid dimensions (50-1000px).');
                return;
            }
        } else {
            width = height = parseInt(sizeSelect.value, 10);
        }

        qrResult.innerHTML = '';
        try {
            qrCodeInstance = new QRCode(qrResult, {
                text: content,
                width: width,
                height: height,
                colorDark: foregroundPicker.getColor().toHEXA().toString(),
                colorLight: backgroundPicker.getColor().toHEXA().toString(),
                correctLevel: QRCode.CorrectLevel[correctionLevelSelect.value]
            });

            // Enable action buttons after a short delay
            setTimeout(() => {
                const img = qrResult.querySelector('img');
                if (img) {
                    img.style.display = 'block';
                    img.style.margin = 'auto';
                    downloadBtn.disabled = false;
                    copyBtn.disabled = false;
                    shareBtn.disabled = false;

                    // Scroll to the QR code on mobile
                    if (window.innerWidth < 768) {
                        qrResult.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }, 100);
        } catch (error) {
            console.error('Error generating QR code:', error);
            showAlert('An error occurred while generating the QR code. Please try again.');
            clearQrCode();
        }
    };

    const downloadQrCode = () => {
        const canvas = qrResult.querySelector('canvas');
        if (!canvas) {
            showAlert('No QR code to download. Please generate one first.');
            return;
        }

        const format = downloadFormat.value;
        const link = document.createElement('a');
        link.download = `qrcode.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
    };

    const copyQrCode = () => {
        const canvas = qrResult.querySelector('canvas');
        if (!canvas) {
            showAlert('No QR code to copy. Please generate one first.');
            return;
        }

        canvas.toBlob(blob => {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(() => showAlert('QR code copied to clipboard!'))
                .catch(err => {
                    console.error('Error copying QR code:', err);
                    showAlert('Failed to copy QR code. Your browser might not support this feature.');
                });
        }, 'image/png');
    };

    const shareQrCode = async () => {
        const canvas = qrResult.querySelector('canvas');
        if (!canvas) {
            showAlert('No QR code to share. Please generate one first.');
            return;
        }

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'qrcode.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'QR Code',
                    text: 'Here is your QR code'
                });
            } else {
                showAlert('Sharing not supported on this browser.');
            }
        } catch (err) {
            console.error('Error sharing QR code:', err);
            showAlert('An error occurred while trying to share the QR code.');
        }
    };


    // --- Event Listeners ---
    qrTypeSelect.addEventListener('change', () => {
        updateDynamicInputs();
        clearQrCode();
    });

    sizeSelect.addEventListener('change', () => {
        customSizeInputs.style.display = sizeSelect.value === 'custom' ? 'block' : 'none';
    });

    resetBtn.addEventListener('click', resetAll);
    generateBtn.addEventListener('click', generateQrCode);
    downloadBtn.addEventListener('click', downloadQrCode);
    copyBtn.addEventListener('click', copyQrCode);
    shareBtn.addEventListener('click', shareQrCode);

    // --- Initial Setup ---
    applyInitialTheme();
    updateDynamicInputs();
});
