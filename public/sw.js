var CACHE_NAME = "nobu-v5";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () {
        // Immediately take control of all open pages — critical for push on first install
        return self.clients.claim();
      })
  );
});

// ── Push received ──
// Works on: Android Chrome, Desktop Chrome/Edge/Firefox, iOS Safari 16.4+ (PWA mode only)
self.addEventListener("push", function (event) {
  var data = {
    title: "Real Duck Distro",
    body: "You have a new notification",
    url: "/announcements",
    image: null,
    tag: null,
  };

  try {
    if (event.data) {
      var parsed = event.data.json();
      if (parsed.title) data.title = parsed.title;
      if (parsed.body) data.body = parsed.body;
      if (parsed.url) data.url = parsed.url;
      if (parsed.image) data.image = parsed.image;
      if (parsed.tag) data.tag = parsed.tag;
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  var options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "nobu-" + Date.now(),
    renotify: true,
    // requireInteraction: keep notification visible until user taps (Android/Desktop)
    // iOS ignores this, which is fine — it shows briefly then goes to notification center
    requireInteraction: true,
    data: { url: data.url || "/announcements" },
    // Vibration pattern: buzz-pause-buzz (Android only, iOS ignores safely)
    vibrate: [200, 100, 200, 100, 200],
  };

  // Image support (Android/Desktop — iOS ignores)
  if (data.image) {
    options.image = data.image;
  }

  // Action buttons (Android/Desktop only — iOS ignores safely)
  options.actions = [
    { action: "open", title: "View Now" },
    { action: "dismiss", title: "Dismiss" },
  ];

  // Show the notification AND relay to any open windows for in-app toast
  event.waitUntil(
    self.registration.showNotification(data.title, options).then(function () {
      // Notify open tabs so they can show an in-app banner (foreground notification)
      return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({
            type: "PUSH_RECEIVED",
            title: data.title,
            body: data.body,
            url: data.url,
            image: data.image,
          });
        });
      });
    })
  );
});

// ── Notification click — open the app to the linked page ──
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  var targetUrl = "/announcements";
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  var fullUrl = self.location.origin + targetUrl;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clients) {
        // Try to focus an existing window and navigate it
        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          if (client.url.indexOf(self.location.origin) !== -1 && "focus" in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        // No existing window — open a new one
        return self.clients.openWindow(fullUrl);
      })
  );
});

// ── Subscription expired/changed — auto-resubscribe ──
// This fires when the push server invalidates a subscription (e.g. key rotation, expiry)
// Without this handler, users silently lose push and never get notifications again
self.addEventListener("pushsubscriptionchange", function (event) {
  var subOptions = { userVisibleOnly: true };
  if (event.oldSubscription && event.oldSubscription.options) {
    subOptions = event.oldSubscription.options;
  }

  event.waitUntil(
    self.registration.pushManager
      .subscribe(subOptions)
      .then(function (newSub) {
        var json = newSub.toJSON();
        // Send the new subscription to our server
        return fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: {
              endpoint: json.endpoint,
              keys: json.keys,
            },
            resubscribe: true,
          }),
        });
      })
      .catch(function (err) {
        console.error("Re-subscribe failed:", err);
      })
  );
});

self.addEventListener("notificationclose", function () {
  // Silent — could track dismissal rates here
});
