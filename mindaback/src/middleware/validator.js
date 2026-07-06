import { logger } from "../utils/logger.js";

export const Validater = (schema) => {
  return async (req, res, next) => {
    try {
      const data = req.body;
      await schema.validateSync(data, { abortEarly: false });
      next();
    } catch (err) {
      if (err.inner) {
        const errors = err.inner.map((e) => ({
          path: e.path,
          message: e.message,
        }));
        return res.status(400).json({ errors });
      } else {
        logger.error('Unexpected error:', err);
      }
    }
  };
};
