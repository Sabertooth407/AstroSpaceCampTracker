const multer = require('multer');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');


const upload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB per file
  }
});



const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const app = express();
app.use(cors());
const supabase = createClient(
  'https://oclwbllfeslheerxhzbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbHdibGxmZXNsaGVlcnhoemJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODMyNCwiZXhwIjoyMDkxNjM0MzI0fQ.RuJ1NnNbmbFrRQksj2dnRnQe7p_IUCMlWMrbe97zgtw' // keep this secret
);

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://baec01b90a1b2fe64b2667b48849f2a6.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "1e0160e2c1687febf9c48d9bf5093404",
    secretAccessKey: "79cd2095ee427f0cf1ad23caf3c718e9dd4243dbbc718f770284a8b097221768"
  }
});

webpush.setVapidDetails(
  'mailto:test@test.com',
  'BDCztLxfEcpQ5ajQwvfhYhh0EiZJKXHXRrycNy-MGn7cRuu5-WzTCVq7gsZbwyHJN4krW2ODxiJ7B5W2j2Heqyo',
  'PXiro22utbjYd71HRwPYHwmhZGHrnzwUENOHZNfWP1M'
);

async function sendToAll(payload) {
  const { data: users, error } = await supabase
    .from('push_tokens')
    .select('*');

  if (error) {
    console.error("Error fetching tokens:", error);
    return;
  }

  for (const u of users) {
    try {
      const subscription = JSON.parse(u.token);

      if (!subscription.endpoint) {
        console.log("Skipping invalid subscription");
        continue;
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );

      console.log("Sent notification");

    } catch (err) {
      console.error("Push failed:", err.message);

      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log("🧹 Removing dead subscription");
        await supabase
          .from('push_tokens')
          .delete()
          .eq('id', u.id);
      }
    }
  }
}

async function checkAndSend() {

  const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'approved')
  .eq('notified', false);

for (const p of posts || []) {
  await supabase
  .from('posts')
  .update({ notified: true })
  .eq('id', p.id);

await sendToAll({
  title: "New Mission Log",
  body: p.content || "New post uploaded",
  url: "https://asc2026.vercel.app/"
});
}

  const { data: alerts } = await supabase
  .from('alerts')
  .select('*')
  .eq('notified', false);

for (const a of alerts || []) {
  await supabase
    .from('alerts')
    .update({ notified: true })
    .eq('id', a.id);

  await sendToAll({
    title: "Alert",
    body: a.text || "New alert",
    url: "https://asc2026.vercel.app/"
  });
}

  const { data: sessions } = await supabase
  .from('schedule')
  .select('*')
  .eq('status', 'ongoing')
  .eq('notified', false);

for (const s of sessions || []) {
  await supabase
    .from('schedule')
    .update({ notified: true })
    .eq('id', s.id);
  
  await sendToAll({
    title: "Session Live",
    body: s.session_name || "Session started",
    url: "https://asc2026.vercel.app/"
  });
}
}

let isChecking = false;

setInterval(async () => {
  if (isChecking) return;

  isChecking = true;

  try {
    await checkAndSend();
  } catch (err) {
    console.error("Loop error:", err);
  }

  isChecking = false;
}, 10000);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 Push server running");
});

if (!req.file) {
  return res.status(400).json({ error: "No file" });
}

if (req.file.size > 20 * 1024 * 1024) {
  return res.status(400).json({ error: "File too large (max 20MB)" });
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    const key = `${Date.now()}-${Math.random()}-${file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: "astro-space-camp",
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const fileUrl = `https://pub-ebdd37b7c49a438a99c76081ee0c44eb.r2.dev/${key}`;

    res.json({ url: fileUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
