// Import page functionality
let selectedFile = null;

// Initialize import page
// Initialize import page with proper loading management
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        let authenticationComplete = false;
        
        try {
            // Check authentication with fallback
            if (typeof checkAuthenticationSilent === 'function') {
                await checkAuthenticationSilent();
            } else {
                await checkAuthentication();
            }
            
            authenticationComplete = true;
            
            // Ensure loading popup is hidden
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            
            // Check admin permission
            if (!currentUser || currentUser.role !== 'admin') {
                showError('אין לך הרשאה לגשת לעמוד זה');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
                return;
            }
            
            // Page loaded successfully
            setupImportEventListeners();
            console.log('Import page loaded successfully for admin user:', currentUser.username);
            
        } catch (error) {
            console.error('Import page initialization error:', error);
            
            // Always hide loading popup on error
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
            
            if (!authenticationComplete) {
                // Authentication failed - redirect to login
                window.location.href = '/login';
            } else {
                // Other error - show message
                showError('שגיאה בטעינת עמוד הייבוא');
            }
        }
        
        // Safety net: Force hide loading after 3 seconds
        setTimeout(() => {
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
        }, 3000);
    }, 100);
});


// Setup event listeners
function setupImportEventListeners() {
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    uploadZone.addEventListener('click', () => fileInput.click());
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndDisplayFile(file);
    }
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('upload-zone').classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('upload-zone').classList.remove('dragover');
}

// Handle file drop
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('upload-zone').classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndDisplayFile(files[0]);
    }
}

// Validate and display selected file
function validateAndDisplayFile(file) {
    // Validate file type
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.xls');
    
    if (!isValidType) {
        showError('סוג קובץ לא תקין. אנא בחר קובץ Excel (.xlsx או .xls)');
        return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('קובץ גדול מדי. גודל מקסימלי: 10MB');
        return;
    }
    
    selectedFile = file;
    displaySelectedFile(file);
}

// Display selected file info
function displaySelectedFile(file) {
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('file-info').style.display = 'block';
    document.getElementById('import-actions').style.display = 'block';
    
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);
}

// Clear selected file
function clearFile() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('upload-area').style.display = 'block';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('import-actions').style.display = 'none';
    document.getElementById('progress-card').style.display = 'none';
    document.getElementById('results-card').style.display = 'none';
}

// Start import process
// Start import process
async function startImport() {
    if (!selectedFile) {
        showError('אנא בחר קובץ לייבוא');
        return;
    }
    
    try {
        // Show progress card
        document.getElementById('progress-card').style.display = 'block';
        document.getElementById('results-card').style.display = 'none';
        
        // Disable import button
        const importBtn = document.getElementById('import-btn');
        importBtn.disabled = true;
        importBtn.textContent = 'מייבא...';
        
        // Create form data
        const formData = new FormData();
        formData.append('excelFile', selectedFile);
        
        // Start progress animation
        animateProgress();
        
        // 🎯 CHANGE THIS LINE:
        const response = await fetch(`${API_BASE_URL}/import/tickets`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayImportResults(result.data);
            showSuccess('ייבוא הושלם בהצלחה!');
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Import error:', error);
        showError('שגיאה בייבוא הנתונים: ' + error.message);
        document.getElementById('progress-card').style.display = 'none';
    } finally {
        // Re-enable import button
        const importBtn = document.getElementById('import-btn');
        importBtn.disabled = false;
        importBtn.textContent = 'התחל ייבוא';
    }
}

// Animate progress bar
function animateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
    
    // Store interval to clear later
    window.progressInterval = interval;
}

// Display import results
function displayImportResults(data) {
    // Complete progress bar
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
    }
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    progressFill.style.width = '100%';
    progressText.textContent = '100%';
    
    // Update statistics
    document.getElementById('total-rows').textContent = data.totalRows;
    document.getElementById('imported-count').textContent = data.imported;
    document.getElementById('error-count').textContent = data.errors;
    
    // Show results card
    document.getElementById('results-card').style.display = 'block';
    
    // Results summary
    const resultsSummary = document.getElementById('results-summary');
    resultsSummary.innerHTML = `
        <h4>ייבוא הושלם!</h4>
        <p><strong>אחוז הצלחה:</strong> ${data.successRate}%</p>
        <p><strong>תקלות שיובאו:</strong> ${data.imported} מתוך ${data.totalRows}</p>
        ${data.errors > 0 ? `<p><strong>שגיאות:</strong> ${data.errors}</p>` : ''}
    `;
    
    // Error details (if any)
    const errorDetails = document.getElementById('error-details');
    if (data.errors > 0 && data.errorDetails && data.errorDetails.length > 0) {
        errorDetails.style.display = 'block';
        errorDetails.innerHTML = `
            <h5>פרטי שגיאות:</h5>
            <ul>
                ${data.errorDetails.map(error => `<li>${error}</li>`).join('')}
            </ul>
            ${data.errors > 10 ? `<p><em>מוצגות 10 השגיאות הראשונות מתוך ${data.errors}</em></p>` : ''}
        `;
    } else {
        errorDetails.style.display = 'none';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
