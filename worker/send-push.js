const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

async function sendPendingNotifications() {
  const { data: notifications, error } = await supabase
    .from('pending_notifications')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  if (error) {
    console.error('Supabase fetch error:', error);
    return;
  }

  for (const notif of notifications) {
    try {
      // Target subscriptions for user_id, or all if user_id is null
      let subQuery = supabase.from('push_subscriptions').select('id, subscription, user_id');
      if (notif.user_id) {
        subQuery = subQuery.eq('user_id', notif.user_id);
      }
      const { data: subscriptions, error: subError } = await subQuery;
      if (subError) throw subError;

      // Merge basic fields and any custom fields from notif.data
      const payload = {
        title: notif.title,
        body: notif.body,
        ...(notif.data || {})   // Merge icon, actions, click_url, etc.
      };

      let sent = 0, failed = 0;
      for (const row of subscriptions ?? []) {
        try {
          await webpush.sendNotification(row.subscription, JSON.stringify(payload));
          sent++;
        } catch (err) {
          failed++;
          // Remove invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', row.id);
          }
          console.error('Push error:', err);
        }
      }

      // Mark notification as sent
      await supabase
        .from('pending_notifications')
        .update({ status: 'sent', error: null })
        .eq('id', notif.id);

      console.log(`Notification sent: ${notif.id} (sent: ${sent}, failed: ${failed})`);

    } catch (err) {
      // On error, mark as failed
      await supabase
        .from('pending_notifications')
        .update({ status: 'failed', error: err.message })
        .eq('id', notif.id);

      console.error('Notification send failed:', notif.id, err);
    }
  }
}

setInterval(sendPendingNotifications, 60_000);
sendPendingNotifications();