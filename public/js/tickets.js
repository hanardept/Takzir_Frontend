// Handle create ticket form submission (MUST be outside the modal creation function)
async function handleCreateTicket(event) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const ticketData = {
      command: formData.get('command'),
      unit: formData.get('unit'),
      priority: formData.get('priority') || 'רגילה',
      description: formData.get('description'),
      subject: formData.get('subject'),
      isRecurring: formData.get('isRecurring') === 'on'
    };
    
    if (typeof showLoading === 'function') {
      showLoading('יוצר תקלה...');
    }
    
    const result = await apiCall('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
    
    if (typeof showSuccess === 'function') {
      showSuccess(result.message);
    }
    if (typeof hideModal === 'function') {
      hideModal('create-ticket-modal');
    }
    
    // Refresh tickets list or navigate
    window.location.href = '/tickets';
    
  } catch (error) {
    console.error('Create ticket error:', error);
    if (typeof showError === 'function') {
      showError(error.message || 'שגיאה ביצירת התקלה');
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// Modal show/hide functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    modal.remove(); // Clean up the modal
  }
}

// Load units based on selected command
function loadUnitsForCommand(commandName, unitSelectId) {
  const unitSelect = document.getElementById(unitSelectId);
  if (!unitSelect) return;
  
  // Clear existing units
  unitSelect.innerHTML = '<option value="">בחר יחידה</option>';
  
  // Define units per command
  const unitsByCommand = {
    'פיקוד הצפון': [
      'אוגדה 36',
      'חטיבת גולני', 
      'חטיבת צנחנים',
      'יחידת 8200',
      'בסיס רמת דוד'
    ],
    'פיקוד המרכז': [
      'חטיבת גבעתי',
      'חטיבת נחל',
      'מחנה שלום',
      'בסיס צריפין'
    ],
    'פיקוד הדרום': [
      'אוגדה 143',
      'חטיבת הנגב',
      'יחידת שחר',
      'בסיס צאלים'
    ],
    'פיקוד העורף': [
      'מחוז צפון',
      'מחוז מרכז', 
      'מחוז דרום',
      'יחידת פיקוד ובקרה'
    ],
    'זרוע היבשה': [
      'חיל השריון',
      'חיל רגלים',
      'חיל ארטילריה',
      'חיל הנדסה'
    ],
    'חיל האוויר': [
      'בסיס חצרים',
      'בסיס נבטים',
      'בסיס רמת דוד',
      'יחידת שלדג'
    ],
    'חיל הים': [
      'בסיס אשדוד',
      'בסיס חיפה',
      'בסיס אילת',
      'יחידת שייטת 13'
    ]
  };
  
  const units = unitsByCommand[commandName] || [];
  units.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit;
    unitSelect.appendChild(option);
  });
}

function createCreateTicketModal() {
  console.log('createCreateTicketModal called');
  
  // Remove existing modal if any
  const existingModal = document.getElementById('create-ticket-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'create-ticket-modal';
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-content">
  <div class="modal-header">
    <h2 class="modal-title">יצירת תקלה חדשה</h2>
    <span class="close" onclick="hideModal('create-ticket-modal')">&times;</span>
  </div>
  <div class="modal-body">
    <form id="create-ticket-form" onsubmit="handleCreateTicket(event)">
    <form id="create-ticket-form" onsubmit="handleCreateTicket(event)">
  <div class="form-group">
    <label for="ticket-subject">נושא התקלה *</label>
    <input type="text" id="ticket-subject" name="subject" class="form-control" required placeholder="נושא קצר לתקלה">
  </div>
      <div class="form-group">
        <label for="ticket-command">פיקוד *</label>
        <select id="ticket-command" name="command" class="form-control" required onchange="loadUnitsForCommand(this.value, 'ticket-unit')">
          <option value="">בחר פיקוד</option>
          <option value="פיקוד הצפון">פיקוד הצפון</option>
          <option value="פיקוד המרכז">פיקוד המרכז</option>
          <option value="פיקוד הדרום">פיקוד הדרום</option>
          <option value="פיקוד העורף">פיקוד העורף</option>
          <option value="זרוע היבשה">זרוע היבשה</option>
          <option value="חיל האוויר">חיל האוויר</option>
          <option value="חיל הים">חיל הים</option>
        </select>
      </div>
      <div class="form-group">
        <label for="ticket-unit">יחידה *</label>
        <select id="ticket-unit" name="unit" class="form-control" required>
          <option value="">בחר יחידה</option>
        </select>
      </div>
      <div class="form-group">
        <label for="ticket-priority">עדיפות *</label>
        <select id="ticket-priority" name="priority" class="form-control" required>
          <option value="רגילה">רגילה</option>
          <option value="דחופה">דחופה</option>
          <option value="מבצעית">מבצעית</option>
        </select>
      </div>
      <div class="form-group">
        <label for="ticket-description">תיאור התקלה *</label>
        <textarea id="ticket-description" name="description" class="form-control" rows="4" required placeholder="תאר את התקלה בפירוט..."></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="ticket-recurring" name="isRecurring">
          תקלה חוזרת
        </label>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">יצירת תקלה</button>
        <button type="button" class="btn btn-secondary" onclick="hideModal('create-ticket-modal')">ביטול</button>
      </div>
    </form>
  </div>
</div>`;

  document.body.appendChild(modal);
  console.log('Modal added to body');
  
  // Show modal using our custom function
  showModal('create-ticket-modal');
}

function showCreateTicketForm() {
  console.log('showCreateTicketForm called');
  const modal = document.getElementById('create-ticket-modal');
  if (!modal) {
    console.log('Creating new create ticket modal');
    createCreateTicketModal();
  } else {
    console.log('Showing existing create ticket modal');
    showModal('create-ticket-modal');
  }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('create-ticket-modal');
  if (event.target === modal) {
    hideModal('create-ticket-modal');
  }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('create-ticket-modal');
    if (modal && modal.style.display === 'flex') {
      hideModal('create-ticket-modal');
    }
  }
});
