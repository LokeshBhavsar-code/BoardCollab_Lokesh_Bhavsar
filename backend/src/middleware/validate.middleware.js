export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const val = req.body?.[field];

        if (rules.required && (val === undefined || val === null || val === "")) {
          errors.push({ field, message: `${field} is required` });
          continue;
        }

        if (val !== undefined && val !== null && val !== "") {
          if (rules.type && typeof val !== rules.type) {
            errors.push({ field, message: `${field} must be of type ${rules.type}` });
          }
          if (rules.minLength && typeof val === "string" && val.length < rules.minLength) {
            errors.push({
              field,
              message: `${field} must be at least ${rules.minLength} characters`
            });
          }
          if (rules.maxLength && typeof val === "string" && val.length > rules.maxLength) {
            errors.push({
              field,
              message: `${field} cannot exceed ${rules.maxLength} characters`
            });
          }
          if (rules.pattern && typeof val === "string" && !rules.pattern.test(val)) {
            errors.push({ field, message: rules.patternMessage || `${field} format is invalid` });
          }
          if (rules.enum && !rules.enum.includes(val)) {
            errors.push({
              field,
              message: `${field} must be one of: ${rules.enum.join(", ")}`
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request payload failed validation",
          details: errors
        }
      });
    }

    next();
  };
}

export default validate;
