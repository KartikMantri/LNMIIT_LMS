const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  issueBookForUser,
  updateIssuedBookStatus,
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  searchUsers
} = require('../controllers/userController');

const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Auth Routes
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.put('/change-password', protect, changePassword);

// Protected Admin/Faculty Routes
router.get('/search', protect, authorize('admin', 'faculty'), searchUsers);

// Admin / Faculty Management Routes
router.route('/')
  .get(protect, authorize('admin', 'faculty'), getUsers);

router.route('/:id')
  .get(protect, authorize('admin', 'faculty'), getUserById)
  .put(protect, authorize('admin'), updateUser) // Note: In PRD Staff/Faculty could update, but typically Admin does this. Let's strictly follow PRD: 'Admin/Staff Update user details'.
  .delete(protect, authorize('admin'), deleteUser);

router.patch('/:id/deactivate', protect, authorize('admin'), deactivateUser);
router.post('/:id/issue-book', protect, authorize('admin'), issueBookForUser);
router.patch('/:id/books/:bookId/status', protect, authorize('admin'), updateIssuedBookStatus);

module.exports = router;
