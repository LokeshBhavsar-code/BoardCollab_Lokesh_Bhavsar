import AuthService from "./auth.service.js";

export class AuthController {
  static async register(req, res, next) {
    try {
      const { email, username, password } = req.body;
      const result = await AuthService.register({ email, username, password });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export default AuthController;
