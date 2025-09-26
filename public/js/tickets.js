// Add these functions to your existing public/js/tickets.js file

// Load current user on page load
async function loadCurrentUser() {
  try {
    const response = await fetch(`${window.API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        currentUser = result.user;
        console.log('Current user loaded:', currentUser);
        
        // Update navigation based on role
        updateNavigationForRole();
        return currentUser;
      }
    }
    throw new Error('Failed to load user');
  } catch (error) {
    console.error('Error loading current user:', error);
    // Redirect to login if user not authenticated
    window.location.href = '/login.html';
    return null;
  }
}

// Update navigation based on user role
function updateNavigationForRole() {
  if (!currentUser) return;
  
  const createTicketBtn = document.getElementById('create-ticket-btn');
  const navUsers = document.getElementById('nav-users');
  const importNav = document.getElementById('import-nav');
  
  // Show/hide create ticket button for technicians and admins
  if (createTicketBtn) {
    if (currentUser.role === 'admin' || currentUser.role === 'technician') {
      createTicketBtn.style.display = 'inline-block';
    } else {
      createTicketBtn.style.display = 'none';
    }
  }
  
  // Show/hide admin-only navigation
  if (navUsers && currentUser.role !== 'admin') {
    navUsers.style.display = 'none';
  }
  
  if (importNav && currentUser.role === 'admin') {
    importNav.style.display = 'inline-block';
  }
}

// VIEW TICKET FUNCTION
async function viewTicket(ticketId) {
  try {
    console.log('Viewing ticket:', ticketId);
    
    // Show loading
    if (typeof showLoading === 'function') {
      showLoading('טוען פרטי תקלה...');
    }
    
    // Fetch ticket details
    const response = await fetch(`${window.API_BASE_URL}/tickets/${ticketId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to load ticket');
    }
    
    const ticket = result.data;
    console.log('Ticket loaded for view:', ticket);
    
    // Create and show view modal
    createViewTicketModal(ticket);
    
  } catch (error) {
    console.error('Error viewing ticket:', error);
    if (typeof showError === 'function') {
      showError('שגיאה בטעינת פרטי התקלה: ' + error.message);
    } else {
      alert('שגיאה בטעינת פרטי התקלה: ' + error.message);
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// CREATE VIEW MODAL
function createViewTicketModal(ticket) {
  // Remove existing modal if any
  const existingModal = document.getElementById('view-ticket-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'view-ticket-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">פרטי תקלה #${ticket.ticketNumber}</h2>
        <span class="close" onclick="hideModal('view-ticket-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <div class="ticket-details">
          <div class="detail-row">
            <label>מספר תקלה:</label>
            <span>${ticket.ticketNumber || ''}</span>
          </div>
          <div class="detail-row">
            <label>נושא התקלה:</label>
            <span>${ticket.subject || 'לא צוין'}</span>
          </div>
          <div class="detail-row">
            <label>פיקוד:</label>
            <span>${ticket.command || ''}</span>
          </div>
          <div class="detail-row">
            <label>יחידה:</label>
            <span>${ticket.unit || ''}</span>
          </div>
          <div class="detail-row">
            <label>עדיפות:</label>
            <span class="priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority || ''}</span>
          </div>
          <div class="detail-row">
            <label>סטטוס:</label>
            <span class="status-${(ticket.status || '').toLowerCase()}">${ticket.status || ''}</span>
          </div>
          <div class="detail-row">
            <label>תקלה חוזרת:</label>
            <span>${ticket.isRecurring ? 'כן' : 'לא'}</span>
          </div>
          <div class="detail-row">
            <label>תאריך פתיחה:</label>
            <span>${formatDate(ticket.openDate)}</span>
          </div>
          ${ticket.closeDate ? `
          <div class="detail-row">
            <label>תאריך סגירה:</label>
            <span>${formatDate(ticket.closeDate)}</span>
          </div>
          ` : ''}
          ${ticket.assignedTechnician ? `
          <div class="detail-row">
            <label>טכנאי מטפל:</label>
            <span>${ticket.assignedTechnician}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <label>נוצר על ידי:</label>
            <span>${ticket.createdBy || ''}</span>
          </div>
          ${ticket.lastModifiedBy ? `
          <div class="detail-row">
            <label>עודכן לאחרונה על ידי:</label>
            <span>${ticket.lastModifiedBy}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="ticket-description-full">
          <h3>תיאור התקלה</h3>
          <p>${ticket.description || ''}</p>
        </div>
        
        ${ticket.comments && ticket.comments.length > 0 ? `
        <div class="ticket-comments">
          <h3>הערות (${ticket.comments.length})</h3>
          <div class="comments-list">
            ${ticket.comments.map(comment => `
              <div class="comment">
                <div class="comment-header">
                  <strong>${comment.author}</strong>
                  <span class="comment-date">${formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="ticket-actions-modal">
          ${(currentUser?.role === 'admin' || currentUser?.role === 'technician') ? 
            `<button class="btn btn-warning" onclick="editTicket('${ticket._id}')">עריכת תקלה</button>` : ''}
          <button class="btn btn-secondary" onclick="hideModal('view-ticket-modal')">סגירה</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  showModal('view-ticket-modal');
}

  async function loadTickets(page = 1, filters = {}) {
        try {
            console.log('🔄 Loading tickets...', { page, filters });
            
            // Show loading spinner
            const tableBody = document.getElementById('tickets-table-body');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>טוען תקלות...</p>
                        </div>
                    </td>
                </tr>
            `;

            // Build query parameters
            const params = new URLSearchParams({
                page: page,
                limit: 20,
                ...filters
            });

            // Fetch tickets from backend
            const response = await fetch(`${window.API_BASE_URL}/tickets?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to load tickets');
            }

            console.log('✅ Tickets loaded:', result.data);

            // Update global state
            currentPage = page;
            currentFilters = filters;

            // Render tickets
            renderTickets(result.data.tickets || []);

            // Update pagination if provided
            if (result.data.pagination) {
                renderPagination(result.data.pagination);
            }

        } catch (error) {
            console.error('❌ Error loading tickets:', error);
            showTicketsError('שגיאה בטעינת התקלות: ' + error.message);
        }
    }

// EDIT TICKET FUNCTION
async function editTicket(ticketId) {
  try {
    console.log('Editing ticket:', ticketId);
    
    // Check permissions
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'technician')) {
      if (typeof showError === 'function') {
        showError('אין הרשאה לעריכת תקלות');
      } else {
        alert('אין הרשאה לעריכת תקלות');
      }
      return;
    }
    
    // Show loading
    if (typeof showLoading === 'function') {
      showLoading('טוען פרטי תקלה לעריכה...');
    }
    
    // Fetch ticket details
    const response = await fetch(`${window.API_BASE_URL}/tickets/${ticketId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to load ticket');
    }
    
    const ticket = result.data;
    console.log('Ticket loaded for edit:', ticket);
    
    // Create and show edit modal
    createEditTicketModal(ticket);
    
  } catch (error) {
    console.error('Error loading ticket for edit:', error);
    if (typeof showError === 'function') {
      showError('שגיאה בטעינת התקלה לעריכה: ' + error.message);
    } else {
      alert('שגיאה בטעינת התקלה לעריכה: ' + error.message);
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// CREATE EDIT MODAL
function createEditTicketModal(ticket) {
  // Remove existing modal if any
  const existingModal = document.getElementById('edit-ticket-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'edit-ticket-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">עריכת תקלה #${ticket.ticketNumber}</h2>
        <span class="close" onclick="hideModal('edit-ticket-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="edit-ticket-form" onsubmit="handleEditTicket(event, '${ticket._id}')">
          <div class="form-group">
            <label for="edit-ticket-subject">נושא התקלה *</label>
            <input type="text" id="edit-ticket-subject" name="subject" class="form-control" 
                   value="${ticket.subject || ''}" required placeholder="נושא קצר לתקלה">
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-command">פיקוד *</label>
            <select id="edit-ticket-command" name="command" class="form-control" required 
                    onchange="loadUnitsForCommand(this.value, 'edit-ticket-unit')">
              <option value="">בחר פיקוד</option>
              <option value="פיקוד הצפון" ${ticket.command === 'פיקוד הצפון' ? 'selected' : ''}>פיקוד הצפון</option>
              <option value="פיקוד המרכז" ${ticket.command === 'פיקוד המרכז' ? 'selected' : ''}>פיקוד המרכז</option>
              <option value="פיקוד הדרום" ${ticket.command === 'פיקוד הדרום' ? 'selected' : ''}>פיקוד הדרום</option>
              <option value="פיקוד העורף" ${ticket.command === 'פיקוד העורף' ? 'selected' : ''}>פיקוד העורף</option>
              <option value="זרוע היבשה" ${ticket.command === 'זרוע היבשה' ? 'selected' : ''}>זרוע היבשה</option>
              <option value="חיל האוויר" ${ticket.command === 'חיל האוויר' ? 'selected' : ''}>חיל האוויר</option>
              <option value="חיל הים" ${ticket.command === 'חיל הים' ? 'selected' : ''}>חיל הים</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-unit">יחידה *</label>
            <select id="edit-ticket-unit" name="unit" class="form-control" required>
              <option value="">בחר יחידה</option>
              <option value="${ticket.unit}" selected>${ticket.unit}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-priority">עדיפות *</label>
            <select id="edit-ticket-priority" name="priority" class="form-control" required>
              <option value="רגילה" ${ticket.priority === 'רגילה' ? 'selected' : ''}>רגילה</option>
              <option value="דחופה" ${ticket.priority === 'דחופה' ? 'selected' : ''}>דחופה</option>
              <option value="מבצעית" ${ticket.priority === 'מבצעית' ? 'selected' : ''}>מבצעית</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-status">סטטוס *</label>
            <select id="edit-ticket-status" name="status" class="form-control" required>
              <option value="פתוח" ${ticket.status === 'פתוח' ? 'selected' : ''}>פתוח</option>
              <option value="בטיפול" ${ticket.status === 'בטיפול' ? 'selected' : ''}>בטיפול</option>
              <option value="תוקן" ${ticket.status === 'תוקן' ? 'selected' : ''}>תוקן</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-assigned">טכנאי מטפל</label>
            <input type="text" id="edit-ticket-assigned" name="assignedTechnician" class="form-control" 
                   value="${ticket.assignedTechnician || ''}" placeholder="שם הטכנאי המטפל">
          </div>
          
          <div class="form-group">
            <label for="edit-ticket-description">תיאור התקלה *</label>
            <textarea id="edit-ticket-description" name="description" class="form-control" rows="4" required 
                      placeholder="תאר את התקלה בפירוט...">${ticket.description || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-ticket-recurring" name="isRecurring" 
                     ${ticket.isRecurring ? 'checked' : ''}>
              תקלה חוזרת
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">שמירת שינויים</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('edit-ticket-modal')">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Load units for the current command
  setTimeout(() => {
    loadUnitsForCommand(ticket.command, 'edit-ticket-unit');
    // Ensure the current unit stays selected
    setTimeout(() => {
      const unitSelect = document.getElementById('edit-ticket-unit');
      if (unitSelect) {
        unitSelect.value = ticket.unit;
      }
    }, 100);
  }, 100);
  
  showModal('edit-ticket-modal');
}

// HANDLE EDIT TICKET FORM SUBMISSION
async function handleEditTicket(event, ticketId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const ticketData = {
      subject: formData.get('subject'),
      command: formData.get('command'),
      unit: formData.get('unit'),
      priority: formData.get('priority'),
      status: formData.get('status'),
      assignedTechnician: formData.get('assignedTechnician'),
      description: formData.get('description'),
      isRecurring: formData.get('isRecurring') === 'on'
    };
    
    console.log('Updating ticket:', ticketId, ticketData);
    
    if (typeof showLoading === 'function') {
      showLoading('מעדכן תקלה...');
    }
    
    const response = await fetch(`${window.API_BASE_URL}/tickets/${ticketId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to update ticket');
    }
    
    console.log('Ticket updated successfully:', result.data);
    
    if (typeof showSuccess === 'function') {
      showSuccess(result.message || 'תקלה עודכנה בהצלחה');
    } else {
      alert('תקלה עודכנה בהצלחה');
    }
    
    hideModal('edit-ticket-modal');
    
    // Refresh the tickets list
    loadTickets(currentPage, currentFilters);
    
  } catch (error) {
    console.error('Error updating ticket:', error);
    if (typeof showError === 'function') {
      showError('שגיאה בעדכון התקלה: ' + error.message);
    } else {
      alert('שגיאה בעדכון התקלה: ' + error.message);
    }
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
    const modalId = event.target.id;
    hideModal(modalId);
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modals = ['view-ticket-modal', 'edit-ticket-modal', 'create-ticket-modal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && modal.style.display === 'flex') {
        hideModal(modalId);
      }
    });
  }
});

// Initialize user and load tickets when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing tickets page...');
  
  // Load current user first
  await loadCurrentUser();
  
  // Then load tickets
  loadTickets();
  
  // Handle URL parameters for specific actions
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const viewTicketId = urlParams.get('view');
  
  if (action === 'create' && (currentUser?.role === 'admin' || currentUser?.role === 'technician')) {
    setTimeout(() => showCreateTicketForm(), 1000);
  }
  
  if (viewTicketId) {
    setTimeout(() => viewTicket(viewTicketId), 1000);
  }
});