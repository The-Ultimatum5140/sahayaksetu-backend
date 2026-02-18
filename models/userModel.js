import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: {
    type: String,
    default:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjciIHZpZXdCb3g9IjAgMCAyNCAyNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0Ljc1IDIzLjYxOUwxNy4yMjUgMjZMMjMgMjAuNDQ0NE0xIDI2QzEgMjAuNjMwNiA1LjMwOTI2IDE2LjI3NzggMTAuNjI1IDE2LjI3NzhDMTIuNjY5OSAxNi4yNzc4IDE0LjU2NiAxNi45MjE5IDE2LjEyNSAxOC4wMjA0TTE2LjEyNSA2LjU1NTU2QzE2LjEyNSA5LjYyMzgxIDEzLjY2MjUgMTIuMTExMSAxMC42MjUgMTIuMTExMUM3LjU4NzQzIDEyLjExMTEgNS4xMjUgOS42MjM4MSA1LjEyNSA2LjU1NTU2QzUuMTI1IDMuNDg3MzEgNy41ODc0MyAxIDEwLjYyNSAxQzEzLjY2MjUgMSAxNi4xMjUgMy40ODczMSAxNi4xMjUgNi41NTU1NloiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==",
  },
  address: {
    type: Object,
    default: {
      line1: "",
      line2: "",
    },
  },
  gender: { type: String, default: "Not Selected" },
  dob: { type: String, default: "Not Selected" },
  phone: { type: String, default: "0000000000" },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
