// Users page functionality
let currentUsers = [];

// Initialize users page with proper authentication check
document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname === '/users') {
    try {
      let isAuthenticated = false;

      if (typeof checkAuthenticationSilent === 'function') {
        isAuthenticated = await checkAuthenticationSilent();
      } else {
        await checkAuthentication();
        isAuthenticated = !!currentUser;
      }

      if (isAuthenticated && currentUser && currentUser.role === 'admin') {
        initializeUsersPage();
      } else {
        showError('אין לך הרשאה לגשת לעמוד זה');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err) {
      console.error('Users page auth check failed:', err);
      window.location.href = '/login';
    }
  }
});

// Load commands into select dropdown
function loadCommandsIntoSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">בחר פיקוד</option>';
  
  // Add predefined commands for Israeli military structure
  const commands = [
    'פיקוד הצפון',
    'פיקוד המרכז', 
    'פיקוד הדרום',
    'פיקוד העורף',
    'זרוע היבשה',
    'חיל האוויר',
    'חיל הים'
  ];
  
  commands.forEach(command => {
    const option = document.createElement('option');
    option.value = command;
    option.textContent = command;
    select.appendChild(option);
  });
}

// Load units for selected command
function loadUnitsForCommand(command, unitSelectId) {
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
  
  const units = unitsByCommand[command] || [];
  
  units.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit;
    option.textContent = unit;
    unitSelect.appendChild(option);
  });
}

// Setup event listeners
function setupUsersEventListeners() {
  // Create user button
  const createUserBtn = document.getElementById('create-user-btn');
  if (createUserBtn) {
    createUserBtn.onclick = showCreateUserForm;
  }
}


async function initializeUsersPage() {
  try {
    await loadUsers();
    setupUsersEventListeners();
  } catch (error) {
    console.error('Users page initialization error:', error);
    showError('שגיאה בטעינת דף המשתמשים');
  }
}

// Load users from API
async function loadUsers() {
  try {
    showLoading('טוען משתמשים...');
    
    const result = await apiCall('/users');
    currentUsers = result.data;
    displayUsers(currentUsers);
    
  } catch (error) {
    console.error('Load users error:', error);
    showError('שגיאה בטעינת המשתמשים');
  } finally {
    hideLoading();
  }
}

// Display users in table
function displayUsers(users) {
  const usersTableBody = document.getElementById('users-table-body');
  if (!usersTableBody) return;
  
  if (users.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">לא נמצאו משתמשים</td>
      </tr>
    `;
    return;
  }
  
  usersTableBody.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>
        <span class="user-role role-${user.role}">
          ${getRoleDisplayName(user.role)}
        </span>
      </td>
      <td>${user.command}</td>
      <td>${user.unit}</td>
      <td>${user.lastLogin ? formatDate(user.lastLogin) : 'אף פעם'}</td>
      <td class="user-actions">
        <button class="btn btn-warning btn-sm" onclick="editUser('${user._id}')">
          עריכה
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">
          מחיקה
        </button>
      </td>
    </tr>
  `).join('');
}

// Create new user
function showCreateUserForm() {
  const modal = document.getElementById('create-user-modal');
  if (!modal) {
    createCreateUserModal();
  } else {
    showModal('create-user-modal');
  }
}

function createCreateUserModal() {
  const modal = document.createElement('div');
  modal.id = 'create-user-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">יצירת משתמש חדש</h2>
        <span class="close" onclick="hideModal('create-user-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="create-user-form" onsubmit="handleCreateUser(event)">
          <div class="form-group">
            <label for="user-username">שם משתמש *</label>
            <input type="text" id="user-username" name="username" class="form-control" 
                   required minlength="3" placeholder="הכנס שם משתמש">
          </div>
          
          <div class="form-group">
            <label for="user-password">סיסמה *</label>
            <input type="password" id="user-password" name="password" class="form-control" 
                   required minlength="6" placeholder="הכנס סיסמה">
          </div>
          
          <div class="form-group">
            <label for="user-role">תפקיד *</label>
            <select id="user-role" name="role" class="form-control" required>
              <option value="">בחר תפקיד</option>
              <option value="viewer">צופה</option>
              <option value="technician">טכנאי</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="user-command">פיקוד *</label>
            <select id="user-command" name="command" class="form-control" required 
                    onchange="loadUnitsForCommand(this.value, 'user-unit')">
              <option value="">בחר פיקוד</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="user-unit">יחידה *</label>
            <select id="user-unit" name="unit" class="form-control" required>
              <option value="">בחר יחידה</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">יצירת משתמש</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('create-user-modal')">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  loadCommandsIntoSelect('user-command');
  showModal('create-user-modal');
}

// Handle create user form submission
async function handleCreateUser(event) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const userData = {
      username: formData.get('username'),
      password: formData.get('password'),
      role: formData.get('role'),
      command: formData.get('command'),
      unit: formData.get('unit')
    };
    
    showLoading('יוצר משתמש...');
    
    const result = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    showSuccess(result.message);
    hideModal('create-user-modal');
    await loadUsers();
    
  } catch (error) {
    console.error('Create user error:', error);
    showError(error.message || 'שגיאה ביצירת המשתמש');
  } finally {
    hideLoading();
  }
}

// Edit user
async function editUser(userId) {
  try {
    showLoading('טוען נתוני משתמש...');
    
    const user = currentUsers.find(u => u._id === userId);
    if (!user) {
      showError('משתמש לא נמצא');
      return;
    }
    
    showEditUserForm(user);
    
  } catch (error) {
    console.error('Edit user error:', error);
    showError('שגיאה בטעינת נתוני המשתמש');
  } finally {
    hideLoading();
  }
}

function showEditUserForm(user) {
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    modal.remove();
  }
  
  const editModal = document.createElement('div');
  editModal.id = 'edit-user-modal';
  editModal.className = 'modal';
  editModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">עריכת משתמש: ${user.username}</h2>
        <span class="close" onclick="hideModal('edit-user-modal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="edit-user-form" onsubmit="handleEditUser(event, '${user._id}')">
          <div class="form-group">
            <label for="edit-user-role">תפקיד *</label>
            <select id="edit-user-role" name="role" class="form-control" required>
              <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>צופה</option>
              <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>טכנאי</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>מנהל</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-user-command">פיקוד *</label>
            <select id="edit-user-command" name="command" class="form-control" required 
                    onchange="loadUnitsForCommand(this.value, 'edit-user-unit')">
              <option value="">בחר פיקוד</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-user-unit">יחידה *</label>
            <select id="edit-user-unit" name="unit" class="form-control" required>
              <option value="">בחר יחידה</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-user-password">סיסמה חדשה (השאר ריק אם לא רוצה לשנות)</label>
            <input type="password" id="edit-user-password" name="password" class="form-control" 
                   minlength="6" placeholder="הכנס סיסמה חדשה">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">עדכון משתמש</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal('edit-user-modal')">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(editModal);
  
  // Load commands and set current values
  loadCommandsIntoSelect('edit-user-command');
  setTimeout(() => {
    document.getElementById('edit-user-command').value = user.command;
    loadUnitsForCommand(user.command, 'edit-user-unit');
    setTimeout(() => {
      document.getElementById('edit-user-unit').value = user.unit;
    }, 500);
  }, 500);
  
  showModal('edit-user-modal');
}

// Handle edit user form submission
async function handleEditUser(event, userId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const userData = {
      role: formData.get('role'),
      command: formData.get('command'),
      unit: formData.get('unit')
    };
    
    // Only include password if it was provided
    const password = formData.get('password');
    if (password && password.trim()) {
      userData.password = password;
    }
    
    showLoading('מעדכן משתמש...');
    
    const result = await apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    
    showSuccess(result.message);
    hideModal('edit-user-modal');
    await loadUsers();
    
  } catch (error) {
    console.error('Edit user error:', error);
    showError(error.message || 'שגיאה בעדכון המשתמש');
  } finally {
    hideLoading();
  }
}

// Delete user
async function deleteUser(userId) {
  const user = currentUsers.find(u => u._id === userId);
  if (!user) {
    showError('משתמש לא נמצא');
    return;
  }
  
  if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${user.username}"?`)) {
    return;
  }
  
  try {
    showLoading('מוחק משתמש...');
    
    const result = await apiCall(`/users/${userId}`, {
      method: 'DELETE'
    });
    
    showSuccess(result.message);
    await loadUsers();
    
  } catch (error) {
    console.error('Delete user error:', error);
    showError(error.message || 'שגיאה במחיקת המשתמש');
  } finally {
    hideLoading();
  }
}

// Setup event listeners
function setupUsersEventListeners() {
  // Create user button
  const createUserBtn = document.getElementById('create-user-btn');
  if (createUserBtn) {
    createUserBtn.onclick = showCreateUserForm;
  }
}
