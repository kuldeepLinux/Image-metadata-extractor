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
        extractMetadata(file, e.target.result);
    };
    reader.readAsDataURL(file);
}

function extractMetadata(file, dataUrl) {
    metadataList.innerHTML = '';
    
    // File info section
    addFileInfo(file);
    
    // Reverse image search links
    addReverseSearchLinks();
    
    EXIF.getData(file, function() {
        const allData = EXIF.getAllTags(this);
        
        if (Object.keys(allData).length === 0) {
            metadataList.innerHTML += '<div class="no-metadata">Is image mein koi EXIF metadata nahi mila 😕</div>';
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
            'WhiteBalance': '⚪ White Balance',
            'Artist': '👤 Artist',
            'Copyright': '©️ Copyright',
            'ImageDescription': '📝 Description'
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
            
            // GPS coordinates
            const mapLink = `https://www.google.com/maps?q=${latDec},${lonDec}`;
            metadataList.innerHTML += `
                <div class="metadata-item gps">
                    <span class="label">📍 GPS Location</span>
                    <span class="value">
                        <a href="${mapLink}" target="_blank">${latDec.toFixed(6)}, ${lonDec.toFixed(6)}</a>
                    </span>
                </div>
            `;
            
            // Map embed
            metadataList.innerHTML += `
                <div class="map-container">
                    <h3>🗺️ Photo Location Map</h3>
                    <iframe 
                        src="https://www.openstreetmap.org/export/embed.html?bbox=${lonDec-0.01},${latDec-0.01},${lonDec+0.01},${latDec+0.01}&layer=mapnik&marker=${latDec},${lonDec}"
                        style="width:100%; height:300px; border:2px solid #00ff41; border-radius:8px; margin-top:10px;"
                        loading="lazy">
                    </iframe>
                    <a href="${mapLink}" target="_blank" class="map-link">
                        🔗 Google Maps mein kholo →
                    </a>
                </div>
            `;
        }

        if (!hasData) {
            metadataList.innerHTML += '<div class="no-metadata">Is image mein koi readable metadata nahi mila 😕</div>';
        }

        results.style.display = 'block';
    });
}

function addFileInfo(file) {
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    
    metadataList.innerHTML += `
        <div class="metadata-item">
            <span class="label">📁 File Name</span>
            <span class="value">${file.name}</span>
        </div>
        <div class="metadata-item">
            <span class="label">📦 File Size</span>
            <span class="value">${displaySize}</span>
        </div>
        <div class="metadata-item">
            <span class="label">🎨 File Type</span>
            <span class="value">${file.type}</span>
        </div>
    `;
}

function addReverseSearchLinks() {
    metadataList.innerHTML += `
        <div class="reverse-search">
            <h3>🔍 Reverse Image Search</h3>
            <p class="small-text">Yeh photo internet par kaha-kaha hai, check karo:</p>
            <div class="search-links">
                <a href="https://images.google.com/" target="_blank" class="search-btn">Google Images</a>
                <a href="https://tineye.com/" target="_blank" class="search-btn">TinEye</a>
                <a href="https://yandex.com/images/" target="_blank" class="search-btn">Yandex</a>
                <a href="https://www.bing.com/visualsearch" target="_blank" class="search-btn">Bing</a>
            </div>
        </div>
    `;
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
