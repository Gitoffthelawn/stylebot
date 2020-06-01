import ContextMenu from './contextmenu';
import BrowserAction from './browseraction';

import { copyToClipboard } from './utils';
import { saveOption, saveAccordionState } from './options';

/**
 * Initialize listeners for the background page
 */
const init = () => {
  chrome.extension.onRequest.addListener(function(
    request,
    sender,
    sendResponse
  ) {
    let response;
    switch (request.name) {
      case 'activateBrowserAction':
        BrowserAction.activate(sender.tab);
        break;

      case 'unhighlightBrowserAction':
        BrowserAction.unhighlight(sender.tab);
        break;

      case 'highlightBrowserAction':
        BrowserAction.highlight(sender.tab);
        break;

      case 'copyToClipboard':
        copyToClipboard(request.text);
        break;

      case 'save':
        window.cache.styles.save(request.url, request.rules, request.data);
        break;

      case 'doesStyleExist':
        sendResponse(window.cache.styles.exists(request.url));
        break;

      case 'transfer':
        window.cache.styles.transfer(request.source, request.destination);
        break;

      case 'getStyleUrlMetadataForTab':
        {
          const styleUrlMetadata = window.cache.styles.getStyleUrlMetadataForTab(
            sender.tab || request.tab
          );

          if (styleUrlMetadata) {
            response = { styleUrlMetadata, success: true };
          } else {
            response = { success: false };
          }
        }

        sendResponse(response);
        break;

      case 'getComputedStylesForTab':
        if (window.cache.styles.getComputedStylesForTab) {
          response = window.cache.styles.getComputedStylesForTab(
            sender.tab.url,
            sender.tab
          );
          response.success = true;
        } else {
          response = {
            success: false,
          };
        }

        sendResponse(response);
        break;

      case 'getComputedStylesForIframe':
        if (window.cache.styles.getComputedStylesForIframe) {
          response = window.cache.styles.getComputedStylesForIframe(
            request.url,
            sender.tab
          );

          response.success = true;
        } else {
          response = {
            success: false,
          };
        }

        sendResponse(response);
        break;

      case 'getEditableStyleUrlForTab':
        sendResponse(window.cache.styles.getEditableStyleUrlForTab(sender.tab));
        break;

      case 'enableStyleUrl':
        {
          window.cache.styles.toggle(request.styleUrl, true, true);
          window.cache.styles.updateStylesForTab(request.tab);
        }

        break;

      case 'disableStyleUrl':
        {
          window.cache.styles.toggle(request.styleUrl, false, true);
          window.cache.styles.updateStylesForTab(request.tab);
        }

        break;

      case 'fetchOptions':
        sendResponse({
          options: window.cache.options,
        });
        break;

      case 'showOptions':
        chrome.tabs.create({
          url: 'options/index.html',
          active: true,
        });

        break;

      case 'saveAccordionState':
        saveAccordionState(request.accordions);
        break;

      case 'saveOption':
        saveOption(request.option.name, request.option.value);
        break;

      case 'getOption':
        sendResponse(window.cache.options[request.optionName]);
        break;

      case 'fetchImportCSS':
        window.cache.styles.fetchImportCSS(request.url, function(css) {
          sendResponse({ text: css });
        });
    }
  });

  /**
   * Listen when an existing tab is updated to update the context
   * menu and browser action
   */
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.status === 'complete') {
      if (window.cache.options.contextMenu) {
        ContextMenu.update(tab);
      }
    }

    if (changeInfo.url) {
      BrowserAction.update(tab);
    }
  });

  /**
   * Listen when a tab is activated to update the context menu
   */
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    if (window.cache.options.contextMenu) {
      chrome.tabs.get(activeInfo.tabId, function(tab) {
        ContextMenu.update(tab);
      });
    }
  });

  /**
   * Listen when a tab is removed to clear its related cache
   */
  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (window.cache.loadingTabs[tabId]) {
      delete window.cache.loadingTabs[tabId];
    }
  });
};

export default { init };
