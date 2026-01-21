import z from "zod";

export const registerschema = z.object({
  name: z.string().min(3, "Username should be minimum 3 characters long"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "password should have minimum 8 characters")
    .max(12, "password can have maximum of 12 characters"),
});
