import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    login: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "cashier"] },
  },
  { timestamps: true },
);

userSchema.index(
  { login: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

/** The shape sent to the client — never the hash. */
userSchema.methods.toPublic = function toPublic() {
  return {
    login: this.login,
    role: this.role,
    createdAt: this.createdAt.toISOString().slice(0, 10),
  };
};

export const User = model("User", userSchema);
