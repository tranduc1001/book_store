document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // ======================= KHAI BÁO BIẾN DOM ========================
    // ====================================================================
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
    }

    // Các phần tử chính trên trang
    const tableBody = document.getElementById('users-table-body');
    const paginationContainer = document.getElementById('pagination-container');
    const userModalEl = document.getElementById('userModal');
    const userModal = new bootstrap.Modal(userModalEl);
    const userForm = document.getElementById('user-form');
    const modalTitle = document.getElementById('userModalLabel');
    const passwordField = document.getElementById('password-field');
    const userIdInput = document.getElementById('user-id');

    // Biến trạng thái
    let currentPage = 1;
    const limit = 10;
    let allRoles = []; // Cache để lưu danh sách vai trò

    // ====================================================================
    // ====================== CÁC HÀM RENDER (VIEW) =======================
    // ====================================================================

    const renderTable = (users) => {
        tableBody.innerHTML = '';
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không có người dùng nào.</td></tr>';
            return;
        }
        users.forEach(user => {
            const role = user.role ? user.role.ten_quyen : 'N/A';
            const status = user.trang_thai ? `<span class="badge text-bg-success">Hoạt động</span>` : `<span class="badge text-bg-danger">Bị khóa</span>`;
            tableBody.innerHTML += `
                <tr id="user-row-${user.id}">
                    <td>${user.id}</td>
                    <td>${user.ho_ten}</td>
                    <td>${user.email}</td>
                    <td>${role}</td>
                    <td>${status}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-edit" data-id="${user.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${user.id}" title="Xóa"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    };

    const renderPagination = (totalPages, currentPage) => {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;
        paginationContainer.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Trước</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        paginationContainer.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Sau</a></li>`;
    };

    // ====================================================================
    // ==================== CÁC HÀM TẢI DỮ LIỆU (API) ====================
    // ====================================================================

    const loadUsers = async (page = 1) => {
        currentPage = page;
        try {
            const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải danh sách người dùng.');
            const data = await response.json();
            renderTable(data.users);
            renderPagination(data.totalPages, data.currentPage);
        } catch (error) {
            console.error('Lỗi khi tải người dùng:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`;
        }
    };

    const loadRolesIntoSelect = async () => {
        const roleSelect = document.getElementById('role_id');
        if (!roleSelect) return;

        roleSelect.innerHTML = '<option value="">Đang tải vai trò...</option>';
        roleSelect.disabled = true;

        if (allRoles.length === 0) {
            try {
                const response = await fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Không thể tải vai trò.');
                allRoles = await response.json();
            } catch (error) {
                console.error(error);
                roleSelect.innerHTML = `<option value="">Lỗi: ${error.message}</option>`;
                return;
            }
        }
        
        if (allRoles.length === 0) {
            roleSelect.innerHTML = '<option value="">Không có vai trò nào.</option>';
        } else {
            roleSelect.innerHTML = '<option value="">-- Chọn vai trò --</option>';
            allRoles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.ten_quyen;
                roleSelect.appendChild(option);
            });
        }
        roleSelect.disabled = false;
    };

    // ====================================================================
    // =================== CÁC HÀM XỬ LÝ MODAL & FORM ===================
    // ====================================================================

    const resetForm = () => {
        userForm.reset();
        userIdInput.value = '';
        if (passwordField) {
            passwordField.style.display = 'block';
            document.getElementById('mat_khau').required = true;
        }
    };

    const openCreateModal = async () => {
        resetForm();
        modalTitle.textContent = 'Thêm người dùng mới';
        await loadRolesIntoSelect();
        userModal.show();
    };

    const openEditModal = async (userId) => {
        resetForm();
        modalTitle.textContent = 'Cập nhật người dùng';
        await loadRolesIntoSelect();
        try {
            const res = await fetch(`/api/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không thể lấy thông tin người dùng.');
            const user = await res.json();

             const setFieldValue = (id, value) => {
                const field = document.getElementById(id);
                if (field) { // Chỉ gán nếu tìm thấy phần tử
                    field.value = value;
                } else {
                    console.warn(`Không tìm thấy phần tử với ID: ${id}`);
                }
            };
            
            // Dùng hàm tiện ích để điền form
            setFieldValue('user-id', user.id);
            setFieldValue('ho_ten', user.ho_ten);
            setFieldValue('ten_dang_nhap', user.ten_dang_nhap);
            setFieldValue('email', user.email);
            setFieldValue('role_id', user.role_id);
            
            // Xử lý riêng cho checkbox
            const statusCheckbox = document.getElementById('trang_thai');
            if (statusCheckbox) {
                statusCheckbox.checked = user.trang_thai;
            }

            if (passwordField) {
                passwordField.style.display = 'none';
                document.getElementById('mat_khau').required = false;
            }
            userModal.show();
        } catch (error) {
            Swal.fire('Lỗi!', error.message, 'error');
        }
    };

    // ====================================================================
    // ==================== GẮN CÁC EVENT LISTENER ======================
    // ====================================================================

    document.querySelector('[data-bs-target="#userModal"]').addEventListener('click', openCreateModal);

    tableBody.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.btn-edit');
        if (editButton) {
            openEditModal(editButton.dataset.id);
            return;
        }

        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
            const userId = deleteButton.dataset.id;
            const result = await Swal.fire({
                title: 'Bạn có chắc chắn?',
                text: "Bạn sẽ không thể hoàn tác!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Vâng, xóa nó!'
            });

            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    const resultData = await res.json();
                    if (!res.ok) throw new Error(resultData.message);
                    Swal.fire('Đã xóa!', 'Người dùng đã được xóa.', 'success');
                    loadUsers(currentPage);
                } catch (error) {
                    Swal.fire('Lỗi!', 'Lỗi: ' + error.message, 'error');
                }
            }
        }
    });

    paginationContainer.addEventListener('click', e => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (target && !target.closest('.page-item').classList.contains('disabled')) {
            const page = parseInt(target.dataset.page);
            if (page !== currentPage) {
                loadUsers(page);
            }
        }
    });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        const isEditMode = !!id;

        const data = {
            ho_ten: document.getElementById('ho_ten').value,
            email: document.getElementById('email').value,
            role_id: document.getElementById('role_id').value,
            trang_thai: document.getElementById('trang_thai').checked,
        };
        
        const newPassword = document.getElementById('mat_khau').value;
        if (!isEditMode) {
            data.ten_dang_nhap = document.getElementById('ten_dang_nhap').value; 
            data.mat_khau = newPassword;
        }  else { // Khi SỬA
        // Nếu người dùng nhập mật khẩu mới thì mới gửi đi
        const newPassword = document.getElementById('mat_khau').value;
        if (newPassword) {
            data.mat_khau = newPassword;
        }
        // Tên đăng nhập và email thường không cho sửa, nhưng nếu bạn cho phép
        // thì cần thêm logic lấy giá trị của chúng ở đây.
    }

        const url = isEditMode ? `/api/users/${id}` : '/api/users';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            Swal.fire({
                icon: 'success',
                title: isEditMode ? 'Cập nhật thành công!' : 'Tạo mới thành công!',
                showConfirmButton: false,
                timer: 1500
            });
            userModal.hide();
            loadUsers(isEditMode ? currentPage : 1);
        } catch (error) {
            Swal.fire('Lỗi!', error.message, 'error');
        }
    });

    // ====================================================================
    // ============================ KHỞI CHẠY ============================
    // ====================================================================
    loadUsers();
});