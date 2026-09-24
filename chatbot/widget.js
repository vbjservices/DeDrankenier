(function () {
  "use strict";

  if (window.__DE_DRANKENIER_CHATBOT__) return;
  window.__DE_DRANKENIER_CHATBOT__ = true;

  const scriptElement = document.currentScript;
  const scriptUrl = new URL(scriptElement?.src || window.location.href, window.location.href);
  const widgetBaseUrl = new URL("./", scriptUrl);
  const assetVersion = scriptUrl.searchParams.get("v");

  const defaults = {
    webhookUrl: "https://n8n1.vbservices.org/webhook/0fc02da8-00c6-4f8b-bbbe-cbc6e1d107bc/chat",
    title: "De Drankenier Assistent",
    subtitle: "Jouw persoonlijke drankadviseur",
    position: "right",
    openByDefault: false,
    requestTimeoutMs: 15000,
    avatarUrl: widgetAssetUrl("assets/chat-avatar.png"),
    ctaImageUrl: widgetAssetUrl("assets/CTA.png"),
    welcomeText: "Hoi! Waar kan ik je mee helpen?\n\nIk kan je adviseren over wijnen, speciaalbieren en gedistilleerd, of je vragen beantwoorden over bestellingen, levering en meer.",
    quickActions: [
      { label: "Wijnadvies", prompt: "Ik wil graag wijnadvies.", icon: "wine" },
      { label: "Speciaalbier advies", prompt: "Ik wil graag advies over speciaalbier.", icon: "beer" },
      { label: "Cadeautips", prompt: "Kun je mij helpen met een cadeau?", icon: "gift" },
      { label: "Bestellen & levering", prompt: "Ik heb een vraag over bestellen of levering.", icon: "truck" },
      { label: "Overig", prompt: "Ik heb een andere vraag.", icon: "list" }
    ],
    telemetry: {
      enabled: true,
      supabaseUrl: "https://oxfhlfdwahuzzytpcivk.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJveGZobGZkd2FodXp6eXRwY2l2a3IiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2OTAwMjIxMywiZXhwIjoyMDg0NTc4MjEzfQ.EmA_DRdeiQ3br9dCw39qH0jvv0LpnPWDzqsQP5IYlNE",
      botId: "chatbot"
    }
  };

  const supplied = window.DeDrankenierChatbotConfig || {};
  const config = {
    ...defaults,
    ...supplied,
    telemetry: { ...defaults.telemetry, ...(supplied.telemetry || {}) }
  };

  const icons = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l-1 6a4.1 4.1 0 01-8 0L7 3zm5 10v7m-4 1h8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    beer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h11v14H5V6zm11 3h2a2 2 0 012 2v4a2 2 0 01-2 2h-2M8 9v7m4-7v7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v11H3V10zm-1-4h20v4H2V6zm10 0v15M7.5 6C5 6 4 2.5 6.5 2.5 9 2.5 12 6 12 6m4.5 0C19 6 20 2.5 17.5 2.5 15 2.5 12 6 12 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h12v12H3V5zm12 5h4l2 3v4h-6v-7zM7 20a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 0 100-4 2 2 0 000 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };

  let sessionId;
  let isSending = false;

  function bootstrap() {
    const host = document.createElement("div");
    host.id = "de-drankenier-chatbot";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = widgetAssetUrl("widget.css");
    shadow.appendChild(stylesheet);

    const shell = document.createElement("div");
    shell.className = "dd-shell";
    shell.dataset.position = config.position === "left" ? "left" : "right";
    shell.innerHTML = `
      <aside class="dd-cta" aria-label="Chat met onze drankadviseur">
        <button class="dd-cta-open" type="button" aria-label="Open de drankadviseur">
          <img src="${escapeAttribute(config.ctaImageUrl)}" alt="Chat met onze drankadviseur" />
        </button>
        <button class="dd-cta-close" type="button" aria-label="Verberg deze melding">${icons.close}</button>
      </aside>
      <section class="dd-window" id="ddWindow" role="dialog" aria-modal="false" aria-labelledby="ddTitle" aria-describedby="ddSubtitle">
        <header class="dd-header">
          <div class="dd-header-avatar"><img src="${escapeAttribute(config.avatarUrl)}" alt="" /></div>
          <div class="dd-heading">
            <h2 class="dd-title" id="ddTitle">${escapeHtml(config.title)}</h2>
            <p class="dd-subtitle" id="ddSubtitle">${escapeHtml(config.subtitle)}</p>
          </div>
          <button class="dd-icon-button dd-close" type="button" aria-label="Chat sluiten">${icons.close}</button>
        </header>
        <div class="dd-body" id="ddMessages" role="log" aria-live="polite" aria-relevant="additions"></div>
        <footer class="dd-footer">
          <form class="dd-form" id="ddForm">
            <label for="ddInput" hidden>Typ je bericht</label>
            <input class="dd-input" id="ddInput" name="message" type="text" placeholder="Typ je bericht..." autocomplete="off" maxlength="2000" />
            <button class="dd-send" type="submit" aria-label="Bericht versturen">${icons.send}</button>
          </form>
          <p class="dd-signature">De Drankenier Assistent <span>•</span> Altijd een goed advies</p>
        </footer>
      </section>
      <button class="dd-launcher" type="button" aria-label="Chat openen" aria-expanded="false" aria-controls="ddWindow">
        <img src="${escapeAttribute(config.avatarUrl)}" alt="" />
        <span class="dd-launcher-close">${icons.close}</span>
      </button>`;
    shadow.appendChild(shell);

    const ui = {
      shell,
      cta: shadow.querySelector(".dd-cta"),
      ctaOpen: shadow.querySelector(".dd-cta-open"),
      ctaClose: shadow.querySelector(".dd-cta-close"),
      window: shadow.querySelector(".dd-window"),
      launcher: shadow.querySelector(".dd-launcher"),
      close: shadow.querySelector(".dd-close"),
      body: shadow.querySelector(".dd-body"),
      form: shadow.querySelector(".dd-form"),
      input: shadow.querySelector(".dd-input"),
      send: shadow.querySelector(".dd-send")
    };

    sessionId = getSessionId();
    addMessage(ui, "bot", config.welcomeText, { actions: config.quickActions, timestamp: false });
    initializeCta(ui);

    ui.launcher.addEventListener("click", () => setOpen(ui, !ui.window.classList.contains("is-open")));
    ui.ctaOpen.addEventListener("click", () => setOpen(ui, true));
    ui.ctaClose.addEventListener("click", (event) => {
      event.stopPropagation();
      dismissCta(ui);
    });
    ui.close.addEventListener("click", () => setOpen(ui, false));
    ui.form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = ui.input.value.trim();
      if (!text || isSending) return;
      ui.input.value = "";
      sendMessage(ui, text);
    });
    shadow.addEventListener("click", (event) => {
      const action = event.target.closest("[data-dd-prompt]");
      if (action && !isSending) sendMessage(ui, action.dataset.ddPrompt);

      const navigation = event.target.closest("[data-dd-products-direction]");
      if (navigation) {
        const rail = navigation.parentElement.querySelector(".dd-products");
        const direction = Number(navigation.dataset.ddProductsDirection) || 1;
        rail?.scrollBy({ left: direction * Math.max(220, rail.clientWidth * .72), behavior: "smooth" });
      }
    });
    shadow.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      if (!image.classList.contains("dd-product-image")) {
        if (image.closest(".dd-cta")) ui.cta.hidden = true;
        return;
      }
      const fallback = image.dataset.ddFallbackSrc;
      if (fallback && image.src !== fallback) {
        image.src = fallback;
        return;
      }
      replaceWithImagePlaceholder(image);
    }, true);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && ui.window.classList.contains("is-open")) setOpen(ui, false);
    });

    if (config.openByDefault) setOpen(ui, true);
  }

  function setOpen(ui, open) {
    ui.window.classList.toggle("is-open", open);
    ui.launcher.setAttribute("aria-expanded", String(open));
    ui.launcher.setAttribute("aria-label", open ? "Chat sluiten" : "Chat openen");
    if (open) {
      dismissCta(ui);
      window.setTimeout(() => ui.input.focus(), 180);
    } else {
      ui.launcher.focus();
    }
  }

  function initializeCta(ui) {
    ui.cta.hidden = config.openByDefault || !config.ctaImageUrl;
  }

  function dismissCta(ui) {
    ui.cta.hidden = true;
  }

  async function sendMessage(ui, text) {
    isSending = true;
    ui.send.disabled = true;
    addMessage(ui, "user", text);
    const pending = addMessage(ui, "bot", "", { typing: true, timestamp: false });
    const messageId = `msg_${cryptoRandom()}_${Date.now()}`;
    const payload = {
      chatInput: text,
      sessionId,
      message_id: messageId,
      metadata: { site: location.hostname, path: location.pathname }
    };
    const startedAt = performance.now();

    try {
      const response = await fetchWithTimeout(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream, application/json" },
        body: JSON.stringify(payload)
      }, config.requestTimeoutMs);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = (response.headers.get("content-type") || "").toLowerCase();

      if (contentType.includes("text/event-stream") && response.body?.getReader) {
        pending.bubble.innerHTML = "";
        const streamedText = await readSse(response, (full) => {
          pending.bubble.innerHTML = renderMarkdown(full);
          scrollToLatest(ui);
        });
        if (!streamedText.trim()) pending.bubble.textContent = "Ik heb geen antwoord ontvangen. Probeer het nog eens.";
        finishMessage(pending);
      } else {
        const raw = await response.text();
        let data;
        try { data = JSON.parse(raw); } catch { data = raw; }
        const normalized = normalizeReply(data);
        pending.bubble.innerHTML = renderMarkdown(normalized.text, normalized.products.length > 0);
        finishMessage(pending);
        if (normalized.products.length) addProducts(ui, normalized.products);
      }

      updateBotStatus(true);
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "Het antwoord duurt te lang. Probeer het nog eens."
        : "Er ging iets mis. Probeer het later opnieuw.";
      pending.bubble.textContent = message;
      finishMessage(pending);
      updateBotStatus(false, error?.message || String(error));
      logFailedEvent({ messageId, text, message, payload, error, latencyMs: performance.now() - startedAt });
    } finally {
      isSending = false;
      ui.send.disabled = false;
      ui.input.focus();
      scrollToLatest(ui);
    }
  }

  function addMessage(ui, role, text, options = {}) {
    const row = document.createElement("article");
    row.className = `dd-message-row is-${role}`;
    const avatar = role === "bot"
      ? `<div class="dd-message-avatar"><img src="${escapeAttribute(config.avatarUrl)}" alt="" /></div>`
      : "";
    row.innerHTML = `${avatar}<div class="dd-message-column"><div class="dd-bubble"></div></div>`;
    const bubble = row.querySelector(".dd-bubble");

    if (options.typing) {
      bubble.setAttribute("aria-label", "De assistent typt");
      bubble.innerHTML = '<span class="dd-typing"><span></span><span></span><span></span></span>';
    } else {
      bubble.innerHTML = renderMarkdown(text);
    }

    ui.body.appendChild(row);
    if (options.timestamp !== false && !options.typing) appendTime(row);
    if (options.actions?.length) addQuickActions(ui, options.actions);
    scrollToLatest(ui);
    return { row, bubble };
  }

  function finishMessage(message) {
    message.bubble.removeAttribute("aria-label");
    appendTime(message.row);
  }

  function appendTime(row) {
    if (row.querySelector(".dd-time")) return;
    const time = document.createElement("time");
    time.className = "dd-time";
    time.dateTime = new Date().toISOString();
    time.textContent = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    row.querySelector(".dd-message-column").appendChild(time);
  }

  function addQuickActions(ui, actions) {
    const group = document.createElement("div");
    group.className = "dd-actions";
    group.setAttribute("aria-label", "Veelgekozen onderwerpen");
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "dd-chip";
      button.type = "button";
      button.dataset.ddPrompt = action.prompt || action.label;
      button.innerHTML = `${icons[action.icon] || icons.list}<span>${escapeHtml(action.label)}</span>`;
      group.appendChild(button);
    });
    ui.body.appendChild(group);
  }

  function addProducts(ui, products) {
    const wrap = document.createElement("div");
    wrap.className = "dd-products-wrap";
    const rail = document.createElement("div");
    rail.className = "dd-products";
    rail.setAttribute("aria-label", "Productaanbevelingen");

    products.slice(0, 8).forEach((product) => {
      const card = document.createElement("article");
      card.className = "dd-product";
      const image = safeUrl(product.image);
      const fallbackImage = originalImageUrl(image);
      const url = safeUrl(product.url);
      card.innerHTML = `
        ${image ? `<img class="dd-product-image" src="${escapeAttribute(image)}" data-dd-fallback-src="${escapeAttribute(fallbackImage)}" alt="${escapeAttribute(product.name || "Product")}" loading="lazy" />` : imagePlaceholderMarkup()}
        <div class="dd-product-info">
          <h3 class="dd-product-name">${escapeHtml(product.name || "Product")}</h3>
          ${product.subtitle ? `<p class="dd-product-subtitle">${escapeHtml(product.subtitle)}</p>` : ""}
          ${product.price ? `<p class="dd-product-price">${escapeHtml(product.price)}</p>` : ""}
        </div>
        ${url ? `<a class="dd-product-link" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">Bekijk product</a>` : ""}`;
      rail.appendChild(card);
    });

    wrap.appendChild(rail);
    if (products.length > 2) {
      const previous = document.createElement("button");
      previous.className = "dd-products-nav dd-products-previous";
      previous.type = "button";
      previous.dataset.ddProductsDirection = "-1";
      previous.setAttribute("aria-label", "Vorige producten bekijken");
      previous.innerHTML = icons.previous;
      previous.hidden = true;
      wrap.appendChild(previous);

      const next = document.createElement("button");
      next.className = "dd-products-nav dd-products-next";
      next.type = "button";
      next.dataset.ddProductsDirection = "1";
      next.setAttribute("aria-label", "Meer producten bekijken");
      next.innerHTML = icons.next;
      wrap.appendChild(next);

      let scheduled = false;
      rail.addEventListener("scroll", () => {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(() => {
          updateCarouselControls(wrap);
          scheduled = false;
        });
      }, { passive: true });
    }
    ui.body.appendChild(wrap);
    window.requestAnimationFrame(() => updateCarouselControls(wrap));
    scrollToLatest(ui);
  }

  function updateCarouselControls(wrap) {
    const rail = wrap.querySelector(".dd-products");
    const previous = wrap.querySelector(".dd-products-previous");
    const next = wrap.querySelector(".dd-products-next");
    if (!rail || !previous || !next) return;
    const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
    previous.hidden = rail.scrollLeft <= 4;
    next.hidden = rail.scrollLeft >= maximum - 4;
  }

  function imagePlaceholderMarkup() {
    return '<div class="dd-product-image dd-product-image-empty" role="img" aria-label="Geen productafbeelding beschikbaar"><span>Geen afbeelding beschikbaar</span></div>';
  }

  function replaceWithImagePlaceholder(image) {
    const placeholder = document.createElement("div");
    placeholder.className = "dd-product-image dd-product-image-empty";
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute("aria-label", "Geen productafbeelding beschikbaar");
    placeholder.innerHTML = "<span>Geen afbeelding beschikbaar</span>";
    image.replaceWith(placeholder);
  }

  function normalizeReply(data) {
    const source = Array.isArray(data) ? (data[0] || {}) : data;
    if (typeof source === "string") return { text: source, products: [] };
    if (!source || typeof source !== "object") return { text: "Ik heb geen antwoord ontvangen.", products: [] };
    const nested = source.output && typeof source.output === "object" ? source.output : null;
    const text = nested?.reply || nested?.text || source.reply || source.text || source.message ||
      (typeof source.output === "string" ? source.output : "Hier zijn een paar passende opties:");
    const suppliedProducts = nested?.products || source.products || [];
    const products = Array.isArray(suppliedProducts) && suppliedProducts.length
      ? suppliedProducts.map(normalizeProduct)
      : productsFromToolResults(source, String(text));
    return { text: String(text), products: Array.isArray(products) ? products : [] };
  }

  function productsFromToolResults(source, replyText) {
    const steps = Array.isArray(source.intermediateSteps) ? source.intermediateSteps : [];
    const rows = [];
    steps.forEach((step) => {
      if (typeof step?.observation !== "string") return;
      try {
        const parsed = JSON.parse(step.observation);
        if (Array.isArray(parsed)) rows.push(...parsed);
      } catch { /* Ignore non-JSON tool output. */ }
    });

    return rows
      .filter((row) => {
        const productUrl = String(row.product_link || "");
        const imageUrl = String(row.product_image || "");
        return (productUrl && replyText.includes(productUrl)) || (imageUrl && replyText.includes(imageUrl));
      })
      .slice(0, 8)
      .map((row) => ({
        name: row.product_name || "Product",
        subtitle: row.category || "",
        price: formatEuro(row.price_eur),
        image: row.product_image || "",
        url: row.product_link || ""
      }));
  }

  function normalizeProduct(product) {
    const url = product.url || product.product_link || "";
    return {
      ...product,
      name: product.name || product.product_name || "Product",
      subtitle: product.subtitle || product.category || "",
      price: product.price || formatEuro(product.price_eur),
      image: product.image || product.product_image || "",
      url
    };
  }

  function formatEuro(value) {
    const price = Number(value);
    if (!Number.isFinite(price)) return value ? String(value) : "";
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
  }

  function renderMarkdown(value, omitImages = false) {
    let markdown = String(value || "");
    if (omitImages) markdown = markdown.replace(/!\[[^\]]*]\(https?:\/\/[^\s)]+\)\s*/gi, "");
    const lines = escapeHtml(markdown).replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let listType = null;

    const closeList = () => {
      if (listType) output.push(`</${listType}>`);
      listType = null;
    };

    lines.forEach((line) => {
      const unordered = line.match(/^\s*[-•]\s+(.+)/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)/);
      if (unordered || ordered) {
        const wanted = unordered ? "ul" : "ol";
        if (listType !== wanted) {
          closeList();
          output.push(`<${wanted}>`);
          listType = wanted;
        }
        output.push(`<li>${renderInline((unordered || ordered)[1])}</li>`);
      } else {
        closeList();
        if (line.trim()) output.push(`<p>${renderInline(line.trim())}</p>`);
      }
    });
    closeList();
    return output.join("");
  }

  function renderInline(value) {
    const placeholders = [];
    let text = value.replace(/!\[([^\]]*)]\((https?:\/\/[^\s)]+)\)/gi, (_, label, url) => {
      const token = `@@DDMEDIA${placeholders.length}@@`;
      placeholders.push(`<img src="${escapeAttribute(url)}" data-dd-fallback-src="${escapeAttribute(originalImageUrl(url))}" alt="${label}" loading="lazy" />`);
      return token;
    });
    text = text.replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/gi, (_, label, url) => {
      const token = `@@DDLINK${placeholders.length}@@`;
      placeholders.push(`<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
      return token;
    });
    text = text.replace(/(https?:\/\/[^\s<]+)/gi, (url) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    placeholders.forEach((html, index) => {
      text = text.replace(`@@DDMEDIA${index}@@`, html).replace(`@@DDLINK${index}@@`, html);
    });
    return text;
  }

  async function readSse(response, onUpdate) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let full = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";
      events.forEach((event) => {
        event.split(/\r?\n/).forEach((line) => {
          if (!line.startsWith("data:")) return;
          const chunk = line.slice(5).trim();
          if (!chunk || chunk === "[DONE]") return;
          try {
            const parsed = JSON.parse(chunk);
            full += parsed.token ?? parsed.delta ?? parsed.text ?? parsed.output ?? parsed.message ?? "";
          } catch {
            full += chunk;
          }
        });
      });
      onUpdate(full);
    }
    onUpdate(full);
    return full;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number(timeoutMs) || 15000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
  }

  function getSessionId() {
    const key = "de_drankenier_chat_session";
    try {
      const stored = localStorage.getItem(key);
      if (stored) return stored;
      const created = `sess_${cryptoRandom()}_${Date.now()}`;
      localStorage.setItem(key, created);
      return created;
    } catch {
      return `sess_${cryptoRandom()}_${Date.now()}`;
    }
  }

  function cryptoRandom() {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint32Array(2);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (value) => value.toString(36)).join("");
    }
    return Math.random().toString(36).slice(2);
  }

  function telemetryConfig() {
    const telemetry = config.telemetry || {};
    if (!telemetry.enabled || !telemetry.supabaseUrl || !telemetry.supabaseAnonKey) return null;
    return {
      url: String(telemetry.supabaseUrl).replace(/\/+$/, ""),
      key: String(telemetry.supabaseAnonKey),
      botId: telemetry.botId || "chatbot"
    };
  }

  async function updateBotStatus(isUp, errorText = null) {
    const telemetry = telemetryConfig();
    if (!telemetry) return;
    const patch = isUp
      ? { is_up: true, last_ok_at: new Date().toISOString(), last_error_at: null, last_error: null }
      : { is_up: false, last_error_at: new Date().toISOString(), last_error: String(errorText || "webhook_error").slice(0, 500) };
    try {
      await fetch(`${telemetry.url}/rest/v1/chatbot_status?id=eq.${encodeURIComponent(telemetry.botId)}`, {
        method: "PATCH",
        headers: { apikey: telemetry.key, Authorization: `Bearer ${telemetry.key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(patch)
      });
    } catch { /* Telemetry must never block the chat. */ }
  }

  async function logFailedEvent({ messageId, text, message, payload, error, latencyMs }) {
    const telemetry = telemetryConfig();
    if (!telemetry) return;
    const workspaceId = location.hostname;
    const row = {
      workspace_id: workspaceId,
      bot_key: null,
      event_id: `${workspaceId}:${messageId}`,
      conversation_id: sessionId,
      created_at: new Date().toISOString(),
      user_message: text.slice(0, 4000),
      ai_output: message,
      success: false,
      escalated: false,
      lead: false,
      reason: error?.name === "AbortError" ? "webhook timeout" : "webhook fetch error",
      outcome: { success: false, escalated: false, lead: false, products: [], clicked_product: false },
      metrics: { tokens: 0, tokens_in: 0, tokens_out: 0, input_cost: 0, output_cost: 0, total_cost: 0, latency_ms: Math.round(latencyMs) },
      raw: { ...payload, error: error?.message || String(error) },
      latency_ms: Math.round(latencyMs)
    };
    try {
      await fetch(`${telemetry.url}/rest/v1/chat_events`, {
        method: "POST",
        headers: { apikey: telemetry.key, Authorization: `Bearer ${telemetry.key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row)
      });
    } catch { /* Telemetry must never block the chat. */ }
  }

  function scrollToLatest(ui) {
    window.requestAnimationFrame(() => { ui.body.scrollTop = ui.body.scrollHeight; });
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function widgetAssetUrl(path) {
    const url = new URL(path, widgetBaseUrl);
    if (assetVersion) url.searchParams.set("v", assetVersion);
    return url.href;
  }

  function originalImageUrl(value) {
    const url = safeUrl(value);
    if (!url) return "";
    return url.replace(/-\d+x\d+(?=\.[a-z0-9]+(?:$|\?))/i, "");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
  }

  function escapeAttribute(value) { return escapeHtml(String(value)); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  else bootstrap();
})();
