// Utility functions for the frontend application

// Date formatting utilities
function formatHebrewDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const hebrewMonths = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = hebrewMonths[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Hebrew number formatting
function formatHebrewNumber(number) {
  if (typeof number !== 'number') return number;
  return number.toLocaleString('he-IL');
}

// Text direction utilities
function isRTLText(text) {
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/;
  return rtlRegex.test(text);
}

function setTextDirection(element, text) {
  if (isRTLText(text)) {
    element.dir = 'rtl';
    element.style.textAlign = 'right';
  } else {
    element.dir = 'ltr';
    element.style.textAlign = 'left';
  }
}

// String utilities
function hebrewTrim(str) {
  // Trim Hebrew text and normalize whitespace
  return str.replace(/^[\s\u200E\u200F\u202A-\u202E]+|[\s\u200E\u200F\u202A-\u202E]+$/g, '');
}

function normalizeHebrewText(text) {
  if (!text) return '';
  
  // Remove control characters and normalize
  return text
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove direction marks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Validation utilities
function validateHebrewText(text, minLength = 0, maxLength = Infinity) {
  const normalized = normalizeHebrewText(text);
  return normalized.length >= minLength && normalized.length <= maxLength;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateHebrewName(name) {
  const hebrewNameRegex = /^[\u0590-\u05FF\s'".-]+$/;
  return hebrewNameRegex.test(name);
}

// Form utilities
function createFormField(config) {
  const {
    type = 'text',
    name,
    id = name,
    label,
    required = false,
    placeholder = '',
    value = '',
    options = [],
    className = 'form-control'
  } = config;
  
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    if (required) {
      labelEl.innerHTML += ' <span class="required">*</span>';
    }
    formGroup.appendChild(labelEl);
  }
  
  let inputEl;
  
  if (type === 'select') {
    inputEl = document.createElement('select');
    inputEl.innerHTML = '<option value="">בחר...</option>';
    options.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value || option;
      optionEl.textContent = option.label || option;
      if (option.value === value || option === value) {
        optionEl.selected = true;
      }
      inputEl.appendChild(optionEl);
    });
  } else if (type === 'textarea') {
    inputEl = document.createElement('textarea');
    inputEl.value = value;
    inputEl.rows = config.rows || 3;
  } else if (type === 'checkbox') {
    const wrapper = document.createElement('label');
    wrapper.className = 'checkbox-wrapper';
    inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    inputEl.checked = value;
    wrapper.appendChild(inputEl);
    wrapper.appendChild(document.createTextNode(' ' + (label || '')));
    formGroup.appendChild(wrapper);
    formGroup.classList.add('checkbox-group');
  } else {
    inputEl = document.createElement('input');
    inputEl.type = type;
    inputEl.value = value;
    inputEl.placeholder = placeholder;
  }
  
  if (type !== 'checkbox') {
    inputEl.id = id;
    inputEl.name = name;
    inputEl.className = className;
    inputEl.required = required;
    
    if (type === 'text' || type === 'textarea') {
      inputEl.addEventListener('input', (e) => {
        setTextDirection(e.target, e.target.value);
      });
    }
    
    formGroup.appendChild(inputEl);
  } else {
    inputEl.id = id;
    inputEl.name = name;
    inputEl.required = required;
  }
  
  return formGroup;
}

// Table utilities
function createDataTable(config) {
  const {
    columns,
    data,
    className = 'table',
    sortable = true,
    pagination = null
  } = config;
  
  const container = document.createElement('div');
  container.className = 'table-container';
  
  const table = document.createElement('table');
  table.className = className;
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.label || column.key;
    th.style.textAlign = 'right';
    
    if (sortable && column.sortable !== false) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        sortTableByColumn(table, column.key);
      });
    }
    
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  data.forEach(row => {
    const tr = document.createElement('tr');
    
    columns.forEach(column => {
      const td = document.createElement('td');
      const value = row[column.key];
      
      if (column.render) {
        td.innerHTML = column.render(value, row);
      } else {
        td.textContent = value || '';
        setTextDirection(td, td.textContent);
      }
      
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add pagination if provided
  if (pagination) {
    const paginationEl = createPagination(pagination, config.onPageChange);
    container.appendChild(paginationEl);
  }
  
  return container;
}

function sortTableByColumn(table, columnKey) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  const columnIndex = Array.from(table.querySelectorAll('th')).findIndex(th => 
    th.dataset.key === columnKey
  );
  
  if (columnIndex === -1) return;
  
  const isAscending = !table.dataset.sortAsc || table.dataset.sortAsc === 'false';
  table.dataset.sortAsc = isAscending.toString();
  
  rows.sort((a, b) => {
    const aValue = a.children[columnIndex].textContent.trim();
    const bValue = b.children[columnIndex].textContent.trim();
    
    // Try to compare as numbers first
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return isAscending ? aNum - bNum : bNum - aNum;
    }
    
    // Compare as strings
    return isAscending 
      ? aValue.localeCompare(bValue, 'he')
      : bValue.localeCompare(aValue, 'he');
  });
  
  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
}

// Storage utilities
function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('LocalStorage set error:', error);
    return false;
  }
}

function getLocalStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('LocalStorage get error:', error);
    return defaultValue;
  }
}

function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('LocalStorage remove error:', error);
    return false;
  }
}

// URL utilities
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.replaceState({}, '', url);
}

function removeQueryParam(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.replaceState({}, '', url);
}

// Print utilities
function printElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <title>הדפסה</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f2f2f2; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Animation utilities
function fadeIn(element, duration = 300) {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  const start = performance.now();
  
  function animate(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    
    element.style.opacity = progress.toString();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
  const start = performance.now();
  const startOpacity = parseFloat(element.style.opacity) || 1;
  
  function animate(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    
    element.style.opacity = (startOpacity * (1 - progress)).toString();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
    }
  }
  
  requestAnimationFrame(animate);
}

// Accessibility utilities
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });
  
  firstFocusable.focus();
}

// Export utilities
window.formatHebrewDate = formatHebrewDate;
window.formatHebrewNumber = formatHebrewNumber;
window.normalizeHebrewText = normalizeHebrewText;
window.validateHebrewText = validateHebrewText;
window.createFormField = createFormField;
window.createDataTable = createDataTable;
window.setLocalStorage = setLocalStorage;
window.getLocalStorage = getLocalStorage;
window.printElement = printElement;
window.announceToScreenReader = announceToScreenReader;
