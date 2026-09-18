const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImg = document.getElementById('previewImg');
const results = document.getElementById('results');
const metadataList = document.getElementById('metadataList');
const clearBtn = document.getElementById('clearBtn');

uploadBox.addEventListener('click', () => fileInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Sirf image files allowed hain!');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
        extractMetadata(file);
    };
    reader.readAsDataURL(file);
}

function extractMetadata(file) {
    metadataList.innerHTML = '';
    
    EXIF.getData(file, function() {
        const allData = EXIF.getAllTags(this);
        
        if (Object.keys(allData).length === 0) {
            metadataList.innerHTML = '<div class="no-metadata">Is image mein koi metadata nahi mila 😕</div>';
            results.style.display = 'block';
            return;
        }

        // Important tags
        const importantTags = {
            'Make': '📷 Camera Brand',
            'Model': '📱 Camera Model',
            'DateTimeOriginal': '📅 Date Taken',
            'DateTime': '📅 Date Modified',
            'ExposureTime': '⏱️ Shutter Speed',
            'FNumber': '🔆 Aperture',
            'ISOSpeedRatings': '📊 ISO',
            'FocalLength': '🔍 Focal Length',
            'LensModel': '🔭 Lens',
            'Software': '💻 Software',
            'Orientation': '🔄 Orientation',
            'Flash': '⚡ Flash',
            'WhiteBalance': '⚪ White Balance'
        };

        let hasData = false;

        // Important tags dikhao
        for (const [key, label] of Object.entries(importantTags)) {
            if (allData[key]) {
                hasData = true;
                let value = allData[key];
                
                // Format karo
                if (key === 'ExposureTime') value = `1/${Math.round(1/value)}s`;
                if (key === 'FNumber') value = `f/${value}`;
                if (key === 'FocalLength') value = `${value}mm`;
                
                addMetadataItem(label, value);
            }
        }

        // GPS location
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lon = EXIF.getTag(this, 'GPSLongitude');
        
        if (lat && lon) {
            hasData = true;
            const latRef = EXIF.getTag(this, 'GPSLatitudeRef') || 'N';
            const lonRef = EXIF.getTag(this, 'GPSLongitudeRef') || 'E';
            
            const latDec = convertDMSToDD(lat, latRef);
            const lonDec = convertDMSToDD(lon, lonRef);
            
            const mapLink = `https://www.google.com/maps?q=${latDec},${lonDec}`;
            
            metadataList.innerHTML += `
                <div class="metadata-item gps">
                    <span class="label">📍 GPS Location</span>
                    <span class="value">
                        <a href="${mapLink}" target="_blank">${latDec.toFixed(6)}, ${lonDec.toFixed(6)} — Map dekho</a>
                    </span>
                </div>
            `;
        }

        if (!hasData) {
            metadataList.innerHTML = '<div class="no-metadata">Is image mein koi readable metadata nahi mila 😕</div>';
        }

        results.style.display = 'block';
    });
}

function addMetadataItem(label, value) {
    const div = document.createElement('div');
    div.className = 'metadata-item';
    div.innerHTML = `
        <span class="label">${label}</span>
        <span class="value">${value}</span>
    `;
    metadataList.appendChild(div);
}

function convertDMSToDD(dms, ref) {
    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];
    
    let dd = degrees + minutes / 60 + seconds / 3600;
    if (ref === 'S' || ref === 'W') dd = -dd;
    return dd;
}

clearBtn.addEventListener('click', () => {
    fileInput.value = '';
    preview.style.display = 'none';
    results.style.display = 'none';
    metadataList.innerHTML = '';
});
