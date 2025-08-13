// Global app configuration and utilities
const API_BASE_URL = 'http://localhost:3000/api';

// Global state
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  try {
    await checkAuthentication();
    setupGlobalEventListeners();
    setupRTLSupport();
  } catch (error) {
    console.error('App initialization error:', error);
  }
}

// Authentication functions
// Authentication functions
async function checkAuthentication() {
  try {
    // Only show loading on login page or initial load
    if (window.location.pathname === '/login' || !currentUser) {
      showLoading('בודק הרשאות...');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      currentUser = result.user;
      updateUserInterface();
    } else {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  } finally {
    // Only hide loading if we showed it
    if (window.location.pathname === '/login' || !currentUser) {
      hideLoading();
    }
  }
}


// Silent authentication check (no loading popup)
async function checkAuthenticationSilent() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      currentUser = result.user;
      updateUserInterface();
      return true;
    } else {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return false;
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return false;
  }
}


async function login(username, password) {
  try {
    showLoading('התחברות למערכת...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    
    if (result.success) {
      currentUser = result.user;
      showSuccess('התחברות בוצעה בהצלחה');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      showError(result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('שגיאה בהתחברות למערכת');
  } finally {
     hideLoading();
  }
}

async function logout() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      currentUser = null;
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login';
  }
}

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
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
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
