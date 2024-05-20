// middlewares/roleMiddleware.js

const ensureRole = (role) => {
    return (req, res, next) => {
        if (req.isAuthenticated() && req.user.role === role) {
            return next();
        } else {
            req.flash('error', 'You do not have permission to view this page');
            res.redirect('/user/login');
        }
    };
};

module.exports = ensureRole;


