const User = require("@/models/User");
const AppError = require("@/utils/AppError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("@/utils/catchAsync");
const sendEmail = require("@/utils/sendMail");

// helper functions
const getToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const setJWTCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_VALIDITY_DURATION * 24 * 60 * 60 * 1e3
    ),
    httpOnly: true,
    secure: true,
  };

  res.cookie("accessToken", token, cookieOptions);
};

exports.signUp = catchAsync(async (req, res) => {
  const newUser = await User.create({
    email: req.body.email,
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = getToken(newUser.id);
  setJWTCookie(res, token);

  res.status(202).json({
    status: "success",
    data: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      token,
    },
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { password, email } = req.body;

  // password or email is not provided
  if (!password || !email) {
    return next(
      new AppError("Please, provide correct email and password.", 400)
    );
  }

  const currentUser = await User.findOne({ email }).select("+password");

  // in case if the user is not found
  if (
    !currentUser ||
    !(await currentUser.checkPassword(password, currentUser.password))
  ) {
    return next(new AppError("Invalid email or password"), 400);
  }

  const token = getToken(currentUser._id);
  setJWTCookie(res, token);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.authenticateUser = catchAsync(async (req, res, next) => {
  const { authorization } = req.headers;

  let passedToken;
  if (authorization && authorization.startsWith("Bearer")) {
    [, passedToken] = authorization.split(" ");
  }

  // checking if the token has been passed in the Authorization header
  const payload = await promisify(jwt.verify)(
    passedToken,
    process.env.JWT_SECRET
  );

  const currentUser = await User.findById(payload.id).select({
    passwordChangedAt: 1,
    role: 1,
    _id: 1,
    name: 1,
    email: 1,
    active: 1,
  });

  if (!currentUser || !currentUser.active)
    return next(new AppError("Such user does not exist", 404));

  if (currentUser.hasChangedPasswordAfter(payload.iat))
    return next(new AppError("Invalid token is provided", 403));

  req.user = {
    id: currentUser.id,
    token: passedToken,
    email: currentUser.email,
    name: currentUser.name,
    role: currentUser.role,
  };

  return next();
});

exports.roleGuard = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have enough rights for the given resource", 403)
      );

    return next();
  });
};

exports.updateUser = catchAsync(async (req, res, next) => {
  const {
    name: newName,
    password: newPassword,
    passwordConfirm: newPasswordConfirm,
    currentPassword,
  } = req.body;

  if (!newName && !currentPassword)
    return next(new AppError("Incorrect payload is provided."));

  const currentUser = await User.findById(req.user.id).select("+password");

  const updatedUserData = {};

  // checking password validity in the first place
  if (currentPassword) {
    if (
      !(await currentUser.checkPassword(currentPassword, currentUser.password))
    ) {
      return next(new AppError("Incorrect password data is passed", 400));
    }

    updatedUserData.password = newPassword;
    updatedUserData.passwordConfirm = newPasswordConfirm;
  }

  if (newName) updatedUserData.name = newName;

  Object.entries(updatedUserData).forEach(([key, value]) => {
    currentUser[key] = value;
  });

  await currentUser.save();

  res.status(203).json({
    status: "success",
    data: {
      token: getToken(req.user.id),
    },
  });
});

exports.disableUser = catchAsync(async (req, res, next) => {
  const currentUser = await User.findByIdAndUpdate(req.user.id, {
    isActive: false,
  });

  res.status(203).json({
    status: "success",
    data: {
      email: req.user.email,
      name: req.user.name,
      deleted: true,
    },
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const currentUser = await User.findOne({ email });

  if (!currentUser) return next(new AppError("No user found", 404));

  const resetToken = currentUser.setPasswordResetToken();

  // sending email
  const subject = "Reset token for password reset";
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/password/reset/${resetToken}`;
  const message = `You sent a reset password request. You can complete your password reset procedure by following the given link: ${resetUrl}. If you haven't submitted any request, check your credentials security to make sure that your private data has not been leaked.`;

  try {
    await sendEmail({
      email,
      subject,
      message,
    });

    res.status(203).json({
      status: "success",
      message: "The rese token has been seen to your email. Please, check it",
    });
  } catch (err) {
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetTokenExpirationDate = undefined;

    res.status(500).json({
      status: "fail",
      message: "Please, try again. Reset token has not been sent.",
    });
  } finally {
    currentUser.save({
      validateBeforeSave: false,
    });
  }
});
