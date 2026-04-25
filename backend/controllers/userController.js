const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// Helper to check and update overdue books
const checkAndUpdateOverdueBooks = async (user) => {
  let isChanged = false;
  const now = new Date();
  
  if (user.issuedBooks && user.issuedBooks.length > 0) {
    user.issuedBooks.forEach(book => {
      if (book.status === 'pending' && new Date(book.returnDate) < now) {
        book.status = 'late fees required';
        isChanged = true;
      }
    });
  }

  if (isChanged) {
    await user.save();
  }
  return user;
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, userId, email, password, role, phone } = req.body;

    // Admin accounts must be created by another Admin (unless it's the very first user)
    // For this module scope, let's assume we can register admins via postman or a secret setup route.
    // We will allow registration of student and faculty publicly as per the PRD updated specs.

    if (!name || !userId || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { userId: userId.toLowerCase() }] 
    });

    if (userExists) {
      return res.status(409).json({ success: false, message: 'User with this email or ID already exists' });
    }

    const user = await User.create({
      name,
      userId: userId.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      phone
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          userId: user.userId,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { userId, password, role } = req.body;

    if (!userId || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide User ID, password and role' });
    }

    const user = await User.findOne({ userId: userId.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      if (user.role !== role) {
        return res.status(403).json({ success: false, message: 'Invalid role selection for this user' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          userId: user.userId,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (clear token client side usually, but API can respond)
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      await checkAndUpdateOverdueBooks(user);
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      // We don't allow changing email or userId freely here
      
      const updatedUser = await user.save();
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          userId: updatedUser.userId,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin issues a book to a specific user
// @route   POST /api/users/:id/issue-book
// @access  Private/Admin
const issueBookForUser = async (req, res) => {
  try {
    const { bookTitle, returnDate, status } = req.body;

    if (!bookTitle || !returnDate) {
      return res.status(400).json({ success: false, message: 'Book Title and Return Date are required' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot issue books to an admin account' });
    }

    // Count currently active books (not returned)
    const activeBooks = user.issuedBooks.filter(b => b.status !== 'returned').length;

    if (user.role === 'student' && activeBooks >= 3) {
      return res.status(403).json({ success: false, message: 'Limit Reached: This student already has 3 active books issued.' });
    }

    if (user.role === 'faculty' && activeBooks >= 5) {
      return res.status(403).json({ success: false, message: 'Limit Reached: This faculty member already has 5 active books issued.' });
    }

    user.issuedBooks.push({
      bookTitle,
      returnDate,
      status: status || 'pending'
    });

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: `Book "${bookTitle}" issued to ${user.name} successfully`,
      issuedBooks: updatedUser.issuedBooks
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN ENDPOINTS ---

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin/Faculty
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, sort = '-createdAt' } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    // Automatically check and update overdue books for the current page of users
    for (let u of users) {
      await checkAndUpdateOverdueBooks(u);
    }

    res.json({
      success: true,
      users,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin/Faculty
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      await checkAndUpdateOverdueBooks(user);
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user (Admin only for certain fields like role)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      
      if (req.user.role === 'admin') {
        user.role = req.body.role || user.role;
        if (req.body.isActive !== undefined) {
           user.isActive = req.body.isActive;
        }
      }

      const updatedUser = await user.save();
      
      res.json({ success: true, message: 'User updated successfully', user: updatedUser });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate user
// @route   PATCH /api/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isActive = false;
      await user.save();
      res.json({ success: true, message: 'User deactivated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // Check if trying to delete self
    if (req.user._id.toString() === req.params.id) {
       return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      res.json({ success: true, message: 'User removed successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=
// @access  Private/Admin/Faculty
const searchUsers = async (req, res) => {
  try {
    const queryStr = req.query.q;
    if (!queryStr) {
      return res.status(400).json({ success: false, message: 'Query string is required' });
    }

    const regex = new RegExp(queryStr, 'i');
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { userId: regex }
      ]
    }).select('-password').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a specific book's status (Admin only)
// @route   PATCH /api/users/:id/books/:bookId/status
// @access  Private/Admin
const updateIssuedBookStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'returned', 'late fees required'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const book = user.issuedBooks.id(req.params.bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    book.status = status;
    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Book status updated successfully',
      issuedBooks: updatedUser.issuedBooks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
