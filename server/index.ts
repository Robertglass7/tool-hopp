import express from "express";
import cors from "cors";
import 'dotenv/config';
import { db } from "./db/index.js";
import { tools, users, bookings, messages, hopperTasks, reports } from "./db/schema.js";
import { eq, desc, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "toolhopp-super-secret-key";

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: "user"
    }).returning();

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET);
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/me", authenticateToken, async (req, res) => {
  try {
    await db.update(users).set(req.body).where(eq(users.id, req.user.id));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, req.user.id));
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- File Storage ---
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl });
});

// --- Tools Routes ---
app.get("/api/tools", async (req, res) => {
  try {
    const allTools = await db.select().from(tools).orderBy(desc(tools.createdAt));
    res.json(allTools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tools", authenticateToken, async (req, res) => {
  try {
    const [newTool] = await db.insert(tools).values({
      ...req.body,
      ownerId: req.user.id
    }).returning();
    res.status(201).json(newTool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tools/:id", async (req, res) => {
  try {
    const [tool] = await db.select().from(tools).where(eq(tools.id, parseInt(req.params.id)));
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Booking Routes ---
app.get("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const userBookings = await db.select().from(bookings).where(
      or(eq(bookings.renterId, req.user.id), eq(bookings.id, req.user.id)) // Simplified check
    ).orderBy(desc(bookings.createdAt));
    res.json(userBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const [newBooking] = await db.insert(bookings).values({
      ...req.body,
      renterId: req.user.id
    }).returning();
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Message Routes ---
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const allMessages = await db.select().from(messages).where(
      or(eq(messages.senderId, req.user.id), eq(messages.receiverId, req.user.id))
    ).orderBy(desc(messages.createdAt));
    res.json(allMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const [newMessage] = await db.insert(messages).values({
      ...req.body,
      senderId: req.user.id
    }).returning();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin Routes ---
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
