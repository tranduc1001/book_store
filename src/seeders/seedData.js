// File: /src/seeders/seedData.js
const { Role, User, Category } = require('../models');

const seedData = async () => {
    try {
        // --- Gieo Roles ---
        await Role.bulkCreate([
            { id: 1, ten_quyen: 'admin' },
            { id: 2, ten_quyen: 'user' }
        ], { ignoreDuplicates: true }); // ignoreDuplicates để không báo lỗi nếu đã tồn tại
        console.log('Roles seeded.');

        // --- Gieo Admin User ---
        // Dùng findOrCreate để không tạo admin trùng lặp
        await User.findOrCreate({
            where: { email: 'admin@bookstore.com' },
            defaults: {
                ten_dang_nhap: 'admin',
                mat_khau: '123456', // Mật khẩu sẽ được hash tự động bởi hook
                ho_ten: 'Admin Master',
                email: 'admin@bookstore.com',
                role_id: 1 // ID của role 'admin'
            }
        });
        console.log('Admin user seeded.');
        
        // --- Gieo Categories ---
        await Category.bulkCreate([
            { id: 1, ten_danh_muc: 'Tiểu thuyết' },
            { id: 2, ten_danh_muc: 'Kinh tế' },
            { id: 3, ten_danh_muc: 'Phát triển bản thân' },
            { id: 4, ten_danh_muc: 'Văn học Việt Nam', danh_muc_cha_id: 1 },
            { id: 5, ten_danh_muc: 'Văn học Nước ngoài', danh_muc_cha_id: 1 },
        ], { ignoreDuplicates: true });
        console.log('Categories seeded.');

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

module.exports = seedData;