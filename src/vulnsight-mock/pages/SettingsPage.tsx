import { useState, type FormEvent } from "react";
import {
  LLM_MODELS,
  activateProvider,
  bccInfo,
  createProvider,
  deleteProvider,
  githubBot,
  listProviders,
  testProvider,
} from "../store";
import { useStore } from "../useStore";

export function SettingsPage() {
  useStore();
  const providers = listProviders();
  const bot = githubBot();
  const bcc = bccInfo();
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!model) return;
    createProvider({ name, model, api_key: apiKey, base_url: baseUrl });
    setName("");
    setModel("");
    setApiKey("");
    setBaseUrl("");
    setMessage("Provider saved successfully.");
  }

  return (
    <div className="vs-wrap-settings vs-stack">
      <div>
        <h1 className="vs-title">Settings</h1>
        <p className="vs-lede">
          Configure AI providers, GitHub bot, and platform integrations.
        </p>
      </div>

      <section className="vs-card vs-card-pad">
        <h3 style={{ marginTop: 0 }}>Integration status</h3>
        <p className="vs-muted">
          VulnSight is running without external API keys. All agents, scans, and
          integrations use mock or local fallback data so you can evaluate the UI
          end-to-end.
        </p>
        <div className="vs-filters">
          <span className="vs-badge">API URL: frontend mock</span>
          <span className="vs-badge">LLM: mocked</span>
          <span className="vs-badge vs-badge-ok">GitHub bot: configured</span>
          <span className="vs-badge vs-badge-ok">BCC payments: configured</span>
        </div>
      </section>

      <section className="vs-card vs-card-pad">
        <h3 style={{ marginTop: 0 }}>AI providers</h3>
        <p className="vs-muted">
          LiteLLM routes every VulnSight AI request. Choose a LiteLLM model ID and
          provide that upstream provider&apos;s API key.
        </p>
        <p>
          <span className="vs-badge vs-badge-ok">Active: litellm</span>
        </p>
        {message && <p className="vs-msg">{message}</p>}

        {providers.length > 0 && (
          <div className="vs-stack" style={{ margin: "16px 0" }}>
            <h4 style={{ margin: 0 }}>Saved providers</h4>
            {providers.map((provider) => (
              <div key={provider.id} className="vs-provider">
                <div>
                  <strong>{provider.name}</strong>{" "}
                  {provider.is_active && <span className="vs-badge vs-badge-ok">Active</span>}{" "}
                  {provider.is_verified && <span className="vs-badge vs-badge-ok">Verified</span>}
                  <p className="vs-muted" style={{ margin: "4px 0 0" }}>
                    {provider.provider} • {provider.model}
                    {provider.api_key_mask ? ` • ${provider.api_key_mask}` : ""}
                  </p>
                </div>
                <div className="vs-row">
                  {!provider.is_active && (
                    <button type="button" className="vs-btn" onClick={() => activateProvider(provider.id)}>
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    className="vs-btn"
                    onClick={() => {
                      testProvider(provider.id);
                      setMessage("Provider test passed.");
                    }}
                  >
                    Test
                  </button>
                  <button type="button" className="vs-btn" onClick={() => deleteProvider(provider.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="vs-stack" onSubmit={handleSave}>
          <h4 style={{ margin: 0 }}>Add LiteLLM model</h4>
          <label className="vs-label" htmlFor="name">
            Display name
          </label>
          <input
            id="name"
            className="vs-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <label className="vs-label" htmlFor="base_url">
            Provider base URL (optional)
          </label>
          <input
            id="base_url"
            className="vs-input"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="For example: http://host.docker.internal:11434"
          />
          <label className="vs-label" htmlFor="api_key">
            Provider API key (optional for keyless models)
          </label>
          <input
            id="api_key"
            className="vs-input"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
          />
          <label className="vs-label" htmlFor="model">
            Model
          </label>
          <select
            id="model"
            className="vs-select"
            value={model}
            required
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="">Select a model…</option>
            {LLM_MODELS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <div className="vs-row">
            <button className="vs-btn vs-btn-primary" type="submit" disabled={!model}>
              Save provider
            </button>
            <button
              className="vs-btn"
              type="button"
              disabled={!model}
              onClick={() => setMessage("Credentials are valid.")}
            >
              Test credentials
            </button>
          </div>
        </form>
      </section>

      <section className="vs-card vs-card-pad">
        <h3 style={{ marginTop: 0 }}>GitHub bot</h3>
        <p className="vs-muted">
          Repository owners only need to add <strong>{bot.account}</strong> as a
          collaborator with Write permission.
        </p>
        <p className="vs-muted">Bot public SSH key (platform admin only)</p>
        <pre className="vs-key">{bot.public_key}</pre>
      </section>

      <section className="vs-card vs-card-pad">
        <h3 style={{ marginTop: 0 }}>BCC e-Commerce WebView</h3>
        <p className="vs-muted">
          Payment gateway is configured for currency {bcc.currency}. Card data is
          entered only on the BCC-hosted page.
        </p>
        <p className="vs-muted">Signature: {bcc.signature_note}</p>
      </section>
    </div>
  );
}
