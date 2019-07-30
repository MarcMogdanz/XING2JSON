import browser from "webextension-polyfill";

import createResume from "./transform";

// the popup js sends a message to this content script which
// triggers the resume generation
// eslint-disable-next-line consistent-return
async function createResumeMessage(message, sender, sendResponse) {
  if (message.task && message.task === "resume") {
    // if an error happens, e.g. the resume couldn't be created
    // we pass the error through to the popup script
    const resume = await createResume();

    return { resume };
  }
}

browser.runtime.onMessage.addListener(createResumeMessage);
