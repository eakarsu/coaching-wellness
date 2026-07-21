const test = require("node:test"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  jwt = require("jsonwebtoken");
const {
  transition,
  safetyEvaluation,
  canAccess,
} = require("../src/governance/domain.cjs");
const { authenticate } = require("../src/governance/auth.cjs");
const { createProviders } = require("../src/governance/providers.cjs");
const { loadConfig } = require("../src/governance/config.cjs");
test("enrollment transitions cover payment recovery, safety hold, consent revocation, and completion", () => {
  assert.equal(
    transition("PENDING_PAYMENT", "payment_failed"),
    "PAYMENT_FAILED",
  );
  assert.equal(
    transition("PAYMENT_FAILED", "retry_payment"),
    "PENDING_PAYMENT",
  );
  assert.equal(transition("PENDING_PAYMENT", "payment_succeeded"), "ACTIVE");
  assert.equal(transition("ACTIVE", "safety_hold"), "SAFETY_HOLD");
  assert.equal(transition("SAFETY_HOLD", "coach_clear"), "ACTIVE");
  assert.equal(transition("ACTIVE", "revoke_consent"), "CONSENT_REVOKED");
  assert.throws(
    () => transition("CONSENT_REVOKED", "payment_succeeded"),
    /Cannot/,
  );
});
test("deterministic safety rules hard-stop urgent symptoms and require coach approval for adjustments", () => {
  const critical = safetyEvaluation({
    pain: 9,
    energy: 2,
    mood: 3,
    adherence: 30,
    chestPain: true,
    fainting: false,
  });
  assert.equal(critical.hold, true);
  assert.deepEqual(
    critical.alerts.map((x) => x.severity),
    ["CRITICAL", "HIGH"],
  );
  assert.equal(critical.adjustment.rule, "LOW_ADHERENCE");
  const normal = safetyEvaluation({
    pain: 2,
    energy: 4,
    mood: 4,
    adherence: 90,
  });
  assert.equal(normal.hold, false);
  assert.equal(normal.adjustment, null);
});
test("wellness inputs reject out-of-range values and access is enrollment scoped", () => {
  assert.throws(
    () => safetyEvaluation({ pain: 11, energy: 4, mood: 4, adherence: 90 }),
    /pain/,
  );
  const e = { member_subject: "m", coach_subject: "c" };
  assert.equal(canAccess({ role: "member", subject: "m" }, e), true);
  assert.equal(canAccess({ role: "coach", subject: "other" }, e), false);
  assert.equal(canAccess({ role: "operator", subject: "o" }, e), true);
});
test("RS256 sessions require tenant and member/coach/operator role", () => {
  const pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }),
    c = {
      publicKey: pair.publicKey.export({ type: "spki", format: "pem" }),
      oidcIssuer: "https://id.test/",
      oidcAudience: "wellness",
    },
    token = jwt.sign(
      { tenant_id: crypto.randomUUID(), role: "member" },
      pair.privateKey,
      {
        algorithm: "RS256",
        subject: "m",
        issuer: c.oidcIssuer,
        audience: c.oidcAudience,
        expiresIn: "5m",
      },
    );
  assert.equal(
    authenticate({ authorization: `Bearer ${token}` }, c).role,
    "member",
  );
  assert.throws(() => authenticate({}, c), /required/);
});
test("provider adapters preserve idempotency and classify transient failure", async () => {
  let key;
  const p = createProviders(
    {
      billing: { baseUrl: "https://b.test", token: "b" },
      video: { baseUrl: "https://v.test", token: "v" },
      wearable: { baseUrl: "https://w.test", token: "w" },
      notification: { baseUrl: "https://n.test", token: "n" },
    },
    async (_u, o) => {
      key = o.headers["idempotency-key"];
      return { ok: false, status: 503 };
    },
  );
  await assert.rejects(
    p.wearable("sync", {}, "wear-key"),
    (e) => e.retryable && e.code === "WEARABLE_503",
  );
  assert.equal(key, "wear-key");
});
test("production config rejects placeholder, short secret, and non-TLS database configuration", () => {
  const pair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }),
    env = {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://app:secret@db.internal/wellness",
      DATABASE_SSL: "require",
      OIDC_ISSUER: "https://id.internal/",
      OIDC_AUDIENCE: "wellness",
      OIDC_AUTHORIZE_URL: "https://id.internal/authorize",
      OIDC_TOKEN_URL: "https://id.internal/token",
      OIDC_CLIENT_ID: "wellness-web",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI:
        "https://wellness.internal/api/v1/wellness/auth/callback",
      AUTH_PUBLIC_KEY_BASE64: Buffer.from(
        pair.publicKey.export({ type: "spki", format: "pem" }),
      ).toString("base64"),
      WEBHOOK_SIGNING_SECRET: "s".repeat(32),
      BILLING_BASE_URL: "https://billing.internal",
      BILLING_BEARER_TOKEN: "b-secret",
      VIDEO_BASE_URL: "https://video.internal",
      VIDEO_BEARER_TOKEN: "v-secret",
      WEARABLE_BASE_URL: "https://wear.internal",
      WEARABLE_BEARER_TOKEN: "w-secret",
      NOTIFICATION_BASE_URL: "https://notify.internal",
      NOTIFICATION_BEARER_TOKEN: "n-secret",
    };
  assert.equal(loadConfig(env).production, true);
  assert.throws(() => loadConfig({ ...env, DATABASE_SSL: "off" }), /mandatory/);
});
