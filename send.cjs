const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const app = express();
const supabase = createClient(
  'https://oclwbllfeslheerxhzbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbHdibGxmZXNsaGVlcnhoemJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODMyNCwiZXhwIjoyMDkxNjM0MzI0fQ.RuJ1NnNbmbFrRQksj2dnRnQe7p_IUCMlWMrbe97zgtw' // keep this secret
);

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
  console.log("Checking DB...");

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'approved')
    .eq('notified', false);

  console.log("Posts:", posts?.length);

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('notified', false);

  console.log("Alerts:", alerts?.length);

  const { data: sessions } = await supabase
    .from('schedule')
    .select('*')
    .eq('status', 'ongoing')
    .eq('notified', false);

  console.log("Sessions:", sessions?.length);
}

setInterval(() => {
  checkAndSend().catch(err => {
    console.error("Loop error:", err);
  });
}, 5000);

console.log("🚀 Push server running...");



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("🚀 Push server running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

app.get('/test', async (req, res) => {
  console.log("TEST TRIGGERED");

  await sendToAll({
    title: "TEST PUSH",
    body: "If you see this → working",
    url: "/"
  });

  res.send("Test sent");
});