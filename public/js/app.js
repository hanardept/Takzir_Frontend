// Global app configuration and utilities
// Global state
let currentUser = null;
let authToken = null;
let authCheckInProgress = false;
let lastAuthCheck = 0;
const AUTH_CACHE_DURATION = 30000; // 30 seconds

// Add session persistence functions
// Add session persistence functions
function saveUserSession(user) {
    if (user) {
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.setItem('lastAuthCheck', Date.now().toString());
            console.log('✅ Session saved for user:', user.username);
        } catch (error) {
            console.error('Error saving user session:', error);
        }
    }
}

function loadUserSession() {
    try {
        const savedUser = sessionStorage.getItem('currentUser');
        const savedTime = sessionStorage.getItem('lastAuthCheck');
        
        if (savedUser && savedTime) {
            const timeDiff = Date.now() - parseInt(savedTime);
            // Use saved user if less than 30 seconds old
            if (timeDiff < AUTH_CACHE_DURATION) {
                currentUser = JSON.parse(savedUser);
                lastAuthCheck = parseInt(savedTime);
                console.log('✅ Restored user session:', currentUser.username);
                return true;
            } else {
                console.log('⏰ Saved session expired, clearing...');
                clearUserSession();
            }
        }
    } catch (error) {
        console.error('Error loading user session:', error);
        clearUserSession();
    }
    return false;
}

function clearUserSession() {
    try {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('lastAuthCheck');
        console.log('🗑️ Session cleared');
    } catch (error) {
        console.error('Error clearing user session:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Add small delay to avoid conflicts with page-specific scripts
  setTimeout(initializeApp, 100);
});

async function initializeApp() {
    // Skip auth check only on login page
    if (window.location.pathname === '/login') {
        console.log('Skipping auth check - on login page');
        setupGlobalEventListeners();
        setupRTLSupport();
        return;
    }
    
    try {
        console.log('Running auth check on:', window.location.pathname);
        
        // Try to restore session first for immediate UI update
        const sessionRestored = loadUserSession();
        if (sessionRestored) {
            updateUserInterface();
            console.log('Session restored, validating with server...');
        }
        
        // Always validate with server, even if session was restored
        await checkAuthentication();
        setupGlobalEventListeners();
        setupRTLSupport();
    } catch (error) {
        console.error('App initialization error:', error);
    }
}

// Debounced authentication check
// Enhanced checkAuthentication function in app.js
async function checkAuthentication() {
    // Prevent multiple simultaneous calls
    if (authCheckInProgress) {
        console.log('Auth check already in progress, skipping');
        return;
    }

    // Check cache to avoid unnecessary calls
    const now = Date.now();
    if (currentUser && (now - lastAuthCheck) < AUTH_CACHE_DURATION) {
        console.log('Using cached auth data');
        return;
    }

    console.log('Starting authentication check...');
    authCheckInProgress = true;
    
    try {
        // Only show loading on login page or initial load
        if (window.location.pathname === '/login' || !currentUser) {
            showLoading('בודק הרשאות...');
        }
        
        const response = await fetch(`http://localhost:3000/api/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Auth response status:', response.status);

        if (response.ok) {
    const result = await response.json();
    console.log('Auth successful, user:', result.user);
    currentUser = result.user;
    lastAuthCheck = now;
    
    // Save session for persistence
    saveUserSession(currentUser);
    
    updateUserInterface();
}
 else if (response.status === 401) {
            console.log('Auth failed - 401 Unauthorized');
            currentUser = null;
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                console.log('Redirecting to login page');
                window.location.href = '/login';
            }
        } else if (response.status === 429) {
            console.warn('Rate limited, waiting before next auth check');
            setTimeout(() => {
                authCheckInProgress = false;
            }, 10000);
            return;
        } else {
            console.error('Auth check failed with status:', response.status);
            currentUser = null;
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        currentUser = null;
        if (window.location.pathname !== '/login') {
            console.log('Auth error - redirecting to login');
            window.location.href = '/login';
        }
    } finally {
        authCheckInProgress = false;
        // Only hide loading if we showed it
        if (window.location.pathname === '/login' || !currentUser) {
            hideLoading();
        }
    }
}

// Silent authentication check with same protections
async function checkAuthenticationSilent() {
  // Use same protection as main auth check
  if (authCheckInProgress) {
    return currentUser ? true : false;
  }

  // Check cache first
  const now = Date.now();
  if (currentUser && (now - lastAuthCheck) < AUTH_CACHE_DURATION) {
    return true;
  }

  authCheckInProgress = true;

  try {
    const response = await fetchWithRetry(`http://localhost:3000/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      currentUser = result.user;
      lastAuthCheck = now;
      updateUserInterface();
      return true;
    } else if (response.status === 401) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return false;
    } else if (response.status === 429) {
      console.warn('Rate limited in silent check');
      return currentUser ? true : false;
    }
  } catch (error) {
    console.error('Silent authentication check failed:', error);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return false;
  } finally {
    authCheckInProgress = false;
  }
}

// Enhanced login with rate limiting
async function login(username, password) {
  try {
    showLoading('התחברות למערכת...');
    
    const response = await fetchWithRetry(`http://localhost:3000/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    }, 2, 2000); // 2 retries, 2 second initial backoff

    const result = await response.json();
    
    if (result.success) {
      currentUser = result.user;
      lastAuthCheck = Date.now(); // Update cache
       saveUserSession(currentUser);
      showSuccess('התחברות בוצעה בהצלחה');
  await new Promise(resolve => setTimeout(resolve, 1000));
  window.location.replace('/dashboard');
    } else {
      showError(result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.message.includes('429')) {
      showError('יותר מדי ניסיונות התחברות. אנא המתן מספר דקות לפני שתנסה שוב.');
    } else {
      showError('שגיאה בהתחברות למערכת');
    }
  } finally {
    hideLoading();
  }
}

// Fetch with retry logic for 429 errors
async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429 && attempt < maxRetries) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
        
        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Request failed. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function logout() {
    try {
        const response = await fetch(`http://localhost:3000/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = null;
            lastAuthCheck = 0;
            clearUserSession(); // Clear saved session
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Logout error:', error);
        clearUserSession(); // Clear saved session even on error
        window.location.href = '/login';
    }
}


// [Keep all your other existing functions unchanged]


// UI utility functions
function updateUserInterface() {
  if (currentUser) {
    updateUserInfo();
    updateNavigationBasedOnRole();
    updateAdminNavigation();         // ✅ Use new consolidated function
    
    // Single delayed call as backup
    setTimeout(() => {
      updateAdminNavigation();       // ✅ Use new consolidated function
    }, 500);
  }
}



// Add this temporarily to monitor what's happening
// Only run debugging for a limited time
if (window.location.search.includes('debug=true')) {
  let debugCount = 0;
  const debugInterval = setInterval(() => {
    if (currentUser && currentUser.role === 'admin' && debugCount < 10) {
      const importLinks = document.querySelectorAll('a[href="/import"]');
      console.log('Import links found:', importLinks.length);
      if (importLinks.length === 0) {
        console.log('No import links found in DOM!');
      }
      debugCount++;
    } else {
      clearInterval(debugInterval);
    }
  }, 3000);
}



function updateUserInfo() {
  const userInfoElements = document.querySelectorAll('.user-info');
  userInfoElements.forEach(element => {
    element.innerHTML = `
      <div class="user-details">
        <strong>${currentUser.username}</strong>
        <span class="user-role role-${currentUser.role}">${getRoleDisplayName(currentUser.role)}</span>
        <span>${currentUser.command} - ${currentUser.unit}</span>
      </div>
      <button class="btn btn-danger" onclick="logout()">יציאה</button>
    `;
  });
}

function updateNavigationBasedOnRole() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === '/users' && currentUser.role !== 'admin') {
      item.style.display = 'none';
    }
  });
}

function updateAdminNavigation() {
  if (!currentUser || currentUser.role !== 'admin') {
    // Hide admin links for non-admin users
    const adminLinks = document.querySelectorAll('a[href="/import"], a[href="/users"], #import-nav');
    adminLinks.forEach(link => {
      link.style.display = 'none';
    });
    return;
  }
  
  console.log('Updating admin navigation for:', currentUser.username);
  
  // Show all admin links
  const importLinks = document.querySelectorAll('a[href="/import"], #import-nav');
  const usersLinks = document.querySelectorAll('a[href="/users"]');
  
  importLinks.forEach(link => {
    link.style.display = 'inline-block';
    link.style.visibility = 'visible';
    console.log('Import link made visible');
  });
  
  usersLinks.forEach(link => {
    link.style.display = 'inline-block';
    link.style.visibility = 'visible';
    console.log('Users link made visible');
  });
}

function getRoleDisplayName(role) {
  const roleNames = {
    'admin': 'מנהל',
    'technician': 'טכנאי',
    'viewer': 'צופה'
  };
  return roleNames[role] || role;
}

function getStatusDisplayName(status) {
  const statusNames = {
    'פתוח': 'פתוח',
    'בטיפול': 'בטיפול',
    'תוקן': 'תוקן'
  };
  return statusNames[status] || status;
}

function getPriorityDisplayName(priority) {
  const priorityNames = {
    'רגילה': 'רגילה',
    'דחופה': 'דחופה',
    'מבצעית': 'מבצעית'
  };
  return priorityNames[priority] || priority;
}

// Loading and notification functions
function showLoading(message = 'טוען...') {
  const existingLoader = document.getElementById('global-loader');
  if (existingLoader) {
    existingLoader.remove();
  }

  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'modal show';
  loader.innerHTML = `
    <div class="modal-content text-center">
      <div class="loading">
        <div class="spinner"></div>
        <p class="mt-3">${message}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.remove();
  }
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showWarning(message) {
  showNotification(message, 'warning');
}

function showInfo(message) {
  showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} fade-in`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  // Insert at the top of the container
  const container = document.querySelector('.container') || document.body;
  if (container) {
    container.insertBefore(notification, container.firstChild);
  } else {
    document.body.appendChild(notification);
  }
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Form utilities
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('error');
      isValid = false;
    } else {
      field.classList.remove('error');
    }
  });
  
  return isValid;
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    // Remove error classes
    form.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });
  }
}

// Date utilities
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// RTL Support
function setupRTLSupport() {
  document.dir = 'rtl';
  document.lang = 'he';
  
  // Add RTL class to body
  document.body.classList.add('rtl');
}

// Global event listeners
function setupGlobalEventListeners() {
  // Handle form submissions
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.classList.contains('validate-form')) {
      e.preventDefault();
      if (validateForm(form.id)) {
        // Form is valid, continue with submission
        form.classList.remove('validate-form');
        form.submit();
      }
    }
  });
  
  // Handle clicks outside modals to close them
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
  
  // Handle escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

// Modal utilities
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

// Export utilities
async function exportToExcel(endpoint, filename = 'export.xlsx') {
  try {
    showLoading('מכין קובץ Excel...');
    
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess('קובץ Excel הורד בהצלחה');
    } else {
      showError('שגיאה בהורדת הקובץ');
    }
  } catch (error) {
    console.error('Export error:', error);
    showError('שגיאה בהורדת הקובץ');
  } finally {
    hideLoading();
  }
}

// Pagination utilities
function createPagination(pagination, onPageChange) {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'הקודם';
  prevBtn.disabled = !pagination.hasPrev;
  prevBtn.onclick = () => onPageChange(pagination.page - 1);
  paginationContainer.appendChild(prevBtn);
  
  // Page numbers
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.pages, pagination.page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === pagination.page ? 'active' : '';
    pageBtn.onclick = () => onPageChange(i);
    paginationContainer.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'הבא';
  nextBtn.disabled = !pagination.hasNext;
  nextBtn.onclick = () => onPageChange(pagination.page + 1);
  paginationContainer.appendChild(nextBtn);
  
  // Page info
  const pageInfo = document.createElement('span');
  pageInfo.textContent = `עמוד ${pagination.page} מתוך ${pagination.pages} (${pagination.total} תוצאות)`;
  paginationContainer.appendChild(pageInfo);
  
  return paginationContainer;
}

// Utility functions for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${window.API_BASE_URL}${endpoint}`;
 // try {
    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
 // } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
 // }
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global JavaScript error:', e.error);
  showError('שגיאה בלתי צפויה');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showError('שגיאה בטעינת הנתונים');
  e.preventDefault();
});