function make(name, s, fetchImpl) {
  return async (op, payload, key) => {
    let r;
    try {
      r = await fetchImpl(`${s.baseUrl.replace(/\/$/, "")}/${op}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${s.token}`,
          "content-type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
    } catch (cause) {
      throw Object.assign(new Error(`${name} network operation failed`, { cause }), {
        code: `${name.toUpperCase()}_NETWORK`,
        retryable: true,
      });
    }
    if (!r.ok)
      throw Object.assign(new Error(`${name} returned ${r.status}`), {
        code: `${name.toUpperCase()}_${r.status}`,
        retryable: r.status === 429 || r.status >= 500,
      });
    return r.json();
  };
}
function createProviders(c, f = fetch) {
  return {
    billing: make("billing", c.billing, f),
    video: make("video", c.video, f),
    wearable: make("wearable", c.wearable, f),
    notification: make("notification", c.notification, f),
  };
}
module.exports = { createProviders };
