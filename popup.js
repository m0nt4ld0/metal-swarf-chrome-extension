document.addEventListener("DOMContentLoaded", () => {
  const getHtmlBtn = document.getElementById("getHtml");
  const closeModalBtn = document.getElementById("closeModal");

  // Traducción de textos del DOM usando i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      window.close();
    });
  }

  if (getHtmlBtn) {
    getHtmlBtn.addEventListener("click", async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
          throw new Error(chrome.i18n.getMessage("error_no_tab"));
        }

        const url = new URL(tab.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          alert(chrome.i18n.getMessage("error_invalid_url"));
          return;
        }

        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            func: () => {
              const html = document.documentElement.outerHTML;
              const links = Array.from(document.getElementsByTagName('a'))
                .map(a => a.href)
                .filter(href => href.endsWith('.torrent'));
              return { html, torrentLinks: links };
            },
          },
          async (results) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }

            if (!results || !results[0] || !results[0].result) {
              throw new Error(chrome.i18n.getMessage("error_no_html"));
            }

            const { html, torrentLinks } = results[0].result;
            const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]+/g;
            const magnetMatches = html.match(magnetRegex) || [];

            let fileContent = '';

            if (magnetMatches.length > 0) {
              fileContent += `${chrome.i18n.getMessage("magnet_section")}\n`;
              fileContent += magnetMatches.join('\n');
            }

            if (torrentLinks.length > 0) {
              if (fileContent) fileContent += '\n\n';
              fileContent += `${chrome.i18n.getMessage("torrent_section")}\n`;
              fileContent += torrentLinks.join('\n');
            }

            if (magnetMatches.length === 0 && torrentLinks.length === 0) {
              alert(chrome.i18n.getMessage("no_links_found"));
              return;
            }

            await navigator.clipboard.writeText(fileContent);
            alert(chrome.i18n.getMessage("success_copy"));

            const blob = new Blob([fileContent], { type: 'text/plain' });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${chrome.i18n.getMessage("filename_prefix")} - ${tab.title}.txt`;
            link.click();
            URL.revokeObjectURL(blobUrl);
          }
        );
      } catch (error) {
        console.error("Error:", error);
        alert(`${chrome.i18n.getMessage("error_generic")}: ${error.message}`);
      }
    });
  }

  const openModal = document.getElementById("openModal");
  if (openModal) {
    openModal.addEventListener("click", () => {
      chrome.windows.create({
        url: "modal.html",
        type: "popup",
        width: 400,
        height: 300
      });
    });
  }
});
