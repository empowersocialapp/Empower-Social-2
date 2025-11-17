const express = require('express');
const router = express.Router();
const { getUserByUsername } = require('../services/airtable');

/**
 * POST /api/login
 * Login with username to retrieve user profile
 */
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    const result = await getUserByUsername(username.trim());

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      userId: result.data.userId,
      username: result.data.username,
      name: result.data.name
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

module.exports = router;
