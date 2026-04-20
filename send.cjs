const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const app = express();
// 🔐 Supabase
const supabase = createClient(
  'https://oclwbllfeslheerxhzbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbHdibGxmZXNsaGVlcnhoemJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODMyNCwiZXhwIjoyMDkxNjM0MzI0fQ.RuJ1NnNbmbFrRQksj2dnRnQe7p_IUCMlWMrbe97zgtw' // keep this secret
);

// 🔑 VAPID
webpush.setVapidDetails(
  'mailto:test@test.com',
  'BMKW8Snx4rYm7G9rIosndIkfrRIYYt3BIpey-A62Kgid1W9m66YWizh062d-WfaFo0frvVC-3HhN4wC5m5lwwU4',
  '6NDLripLHwQesWIGt9pT1MD8BnEvnT7sEkws50l-NUM'
);

// 🚀 SEND TO ALL USERS
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
      // 🔥 FIX: parse token
      const subscription = JSON.parse(u.token);

      // 🔥 SAFETY: skip invalid
      if (!subscription.endpoint) {
        console.log("Skipping invalid subscription");
        continue;
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );

      console.log("✅ Sent notification");

    } catch (err) {
      console.error("❌ Push failed:", err.message);

      // 🔥 OPTIONAL: delete broken subscriptions
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

// 🚀 MAIN LOOP
async function checkAndSend() {

  // 🔔 NEW POSTS
  const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'approved')
  .eq('notified', false);

for (const p of posts || []) {
  await sendToAll({
    title: "📸 New Mission Log",
    body: p.content || "New post uploaded",
    url: "https://astro-space-camp-tracker.vercel.app/"
  });

  // mark as notified immediately
  await supabase
    .from('posts')
    .update({ notified: true })
    .eq('id', p.id);
}

  // 🚨 ALERTS
  const { data: alerts } = await supabase
  .from('alerts')
  .select('*')
  .eq('notified', false);

for (const a of alerts || []) {
  await sendToAll({
    title: "🚨 Alert",
    body: a.text || "New alert",
    url: "https://astro-space-camp-tracker.vercel.app/"
  });

  await supabase
    .from('alerts')
    .update({ notified: true })
    .eq('id', a.id);
}

  // 📡 SESSION LIVE
  const { data: sessions } = await supabase
  .from('schedule')
  .select('*')
  .eq('status', 'ongoing')
  .eq('notified', false);

for (const s of sessions || []) {
  await sendToAll({
    title: "📡 Session Live",
    body: s.session_name || "Session started",
    url: "https://astro-space-camp-tracker.vercel.app"
  });

  await supabase
    .from('schedule')
    .update({ notified: true })
    .eq('id', s.id);
}
}

// ⏱ RUN LOOP
setInterval(() => {
  checkAndSend().catch(err => {
    console.error("Loop error:", err);
  });
}, 5000);

console.log("🚀 Push server running...");

// 👇 keep your existing loop
setInterval(() => {
  checkAndSend().catch(err => {
    console.error("Loop error:", err);
  });
}, 10000);

// 👇 ADD THIS SERVER PART
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 Push server running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});