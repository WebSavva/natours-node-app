const express = require('express');
const {
  signUp,
  logIn,
  authenticateUser,
  updateUser,
  roleGuard,
  disableUser,
  forgetPassword,
} = require('@/controllers/authentication');

const usersRouter = express.Router();

usersRouter.post('/signup', signUp);

usersRouter.post('/login', logIn);

usersRouter
  .route('/')
  .patch(authenticateUser, updateUser)
  .delete(authenticateUser, disableUser)
  .get(authenticateUser, roleGuard('admin'), (req, res) => {
    res.status(200).json({
      status: 'success',
    });
  });

usersRouter.patch('/password/forget', forgetPassword);

module.exports = usersRouter;
