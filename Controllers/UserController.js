import User from '../Models/User.js';

export default {
  users: async (req, res) => {
    try {
      const users = await User.find();
      return res.json({ users });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  },
};
