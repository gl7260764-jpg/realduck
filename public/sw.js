var CACHE_NAME = "nobu-v7";

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
    silent: false,
    requireInteraction: true,
    timestamp: Date.now(),
    data: { url: data.url || "/announcements" },
    vibrate: [200, 100, 200, 100, 200],
  };

  if (data.image) {
    options.image = data.image;
  }

  options.actions = [
    { action: "open", title: "View Now" },
    { action: "dismiss", title: "Dismiss" },
  ];

  // Always show the notification first; broadcasting to clients is secondary.
  // If matchAll fails for any reason, the OS notification still fires.
  event.waitUntil(
    self.registration
      .showNotification(data.title, options)
      .then(function () {
        return self.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then(function (clients) {
            clients.forEach(function (client) {
              try {
                client.postMessage({
                  type: "PUSH_RECEIVED",
                  title: data.title,
                  body: data.body,
                  url: data.url,
                  image: data.image,
                });
              } catch (_err) {}
            });
          })
          .catch(function () {});
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
      .then(function (allClients) {
        var sameOrigin = allClients.filter(function (c) {
          return c.url.indexOf(self.location.origin) === 0;
        });

        // No open tab — open fresh
        if (sameOrigin.length === 0) {
          return self.clients.openWindow(fullUrl);
        }

        // Prefer a client already on the target URL — just focus it
        var exact = sameOrigin.find(function (c) {
          return c.url === fullUrl;
        });
        if (exact) return exact.focus();

        // Otherwise navigate an existing window to the target URL.
        // Installed PWAs sometimes reject client.navigate() on the initial page
        // load window; fall back to openWindow so the user always lands on the right URL.
        var first = sameOrigin[0];
        if ("navigate" in first) {
          return first
            .navigate(fullUrl)
            .then(function (navClient) { return navClient ? navClient.focus() : first.focus(); })
            .catch(function () { return self.clients.openWindow(fullUrl); });
        }
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
