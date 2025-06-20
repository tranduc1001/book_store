// File: /public/js/admin-categories.js

let allCategories = [];
const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Không thể tải danh sách danh mục.');
        allCategories = await response.json();
        const tableBody = document.getElementById('categoriesTableBody');
        tableBody.innerHTML = '';
        displayCategories(allCategories, tableBody, 0);
        updateParentCategorySelect();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(error.message);
    }
}

function displayCategories(categories, tableBody, level) {
    categories.forEach(category => {
        const row = tableBody.insertRow();
        const indent = ' '.repeat(level * 4) + (level > 0 ? '└─ ' : '');
        const parentName = category.parent ? category.parent.ten_danh_muc : '(Không có)';
        const productCount = category.products ? category.products.length : 0;

        row.innerHTML = `
            <td>${category.id}</td>
            <td>${indent}${category.ten_danh_muc}</td>
            <td>${parentName}</td>
            <td>${productCount}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="prepareEditForm(${category.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        if (category.children && category.children.length > 0) {
            displayCategories(category.children, tableBody, level + 1);
        }
    });
}

function updateParentCategorySelect(currentCategoryId = null) {
    const parentSelect = document.getElementById('danh_muc_cha_id');
    parentSelect.innerHTML = '<option value="">-- Là danh mục gốc --</option>';

    function populateOptions(categories, level) {
        categories.forEach(category => {
            if (category.id !== currentCategoryId) {
                const indent = '-'.repeat(level);
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${indent} ${category.ten_danh_muc}`;
                parentSelect.appendChild(option);
                if (category.children && category.children.length > 0) {
                    populateOptions(category.children, level + 1);
                }
            }
        });
    }
    populateOptions(allCategories, 0);
}

function prepareCreateForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalLabel').textContent = 'Thêm Danh mục mới';
    updateParentCategorySelect();
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

async function prepareEditForm(id) {
    try {
        const response = await fetch(`/api/categories/${id}`);
        if (!response.ok) throw new Error('Không thể lấy thông tin danh mục.');
        const category = await response.json();
        document.getElementById('categoryId').value = category.id;
        document.getElementById('ten_danh_muc').value = category.ten_danh_muc;
        document.getElementById('mo_ta').value = category.mo_ta || '';
        document.getElementById('img').value = category.img || '';
        document.getElementById('danh_muc_cha_id').value = category.danh_muc_cha_id || '';
        document.getElementById('categoryModalLabel').textContent = 'Chỉnh sửa Danh mục';
        updateParentCategorySelect(id);
        new bootstrap.Modal(document.getElementById('categoryModal')).show();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(error.message);
    }
}

async function handleFormSubmit() {
    const id = document.getElementById('categoryId').value;
    const data = {
        ten_danh_muc: document.getElementById('ten_danh_muc').value,
        danh_muc_cha_id: document.getElementById('danh_muc_cha_id').value || null,
        mo_ta: document.getElementById('mo_ta').value,
        img: document.getElementById('img').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/categories/${id}` : '/api/categories';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Có lỗi xảy ra.');
        }
        alert(id ? 'Cập nhật thành công!' : 'Thêm thành công!');
        bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        loadCategories();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(error.message);
    }
}

async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể xóa danh mục.');
        }
        alert('Xóa danh mục thành công!');
        loadCategories();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(error.message);
    }
}