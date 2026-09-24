# De Drankenier chatbot widget

This folder is self-contained. Copy the complete `chatbot` folder to the website and add this just before the closing `</body>` tag:

```html
<script src="/chatbot/widget.js?v=9" defer></script>
```

The widget uses Shadow DOM, so existing WordPress/theme styles cannot accidentally restyle it and the widget styles cannot leak into the website.

## Optional configuration

Place configuration before the script tag:

```html
<script>
  window.DeDrankenierChatbotConfig = {
    webhookUrl: "https://example.com/webhook/chat",
    position: "right",
    openByDefault: false
  };
</script>
<script src="/chatbot/widget.js?v=9" defer></script>
```

## Product cards

Normal text and streamed responses continue to work. The widget automatically extracts products referenced in the current n8n `intermediateSteps` catalogue output. A cleaner long-term contract is to return JSON in this shape:

```json
{
  "reply": "Hier zijn een paar passende opties:",
  "products": [
    {
      "name": "Product name",
      "subtitle": "Grape or product type",
      "price": "€ 12,95",
      "image": "https://example.com/product.jpg",
      "url": "https://www.dedrankenier.nl/product/example"
    }
  ]
}
```

The n8n spreadsheet data is the single source of truth. Every recommended product should include a direct, publicly accessible HTTPS URL in `product_image`. The widget does not store product images locally or scrape WordPress pages. If `product_image` is empty or cannot load, the card displays a clear “Geen afbeelding beschikbaar” placeholder.

For WordPress, add the script through the child theme or a small site plugin rather than editing a parent theme file; that prevents theme updates from removing the integration.
