import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";
import { registerschema } from "../config/zod.js";

export const registerUser = tryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);
  const validation = registerschema.safeParse(sanitizedBody);

  if (!validation) {
    const zodError = validation.error;

    const validationErrors =
      zodError?.issues && Array.isArray(zodError.issues)
        ? zodError.issues.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message || "Validation error",
            code: issue.code,
          }))
        : [];

    const firstValidationMessage =
      validationErrors[0]?.message || "validation error";

    return res.status(400).json({
      message: firstValidationMessage,
      errors: validationErrors,
    });
  }

  const { name, email, password } = validation.data;

  return res.status(200).json({
    name,
    email,
    password,
  });
});
