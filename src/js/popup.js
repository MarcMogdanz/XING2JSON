import browser from "webextension-polyfill";
import $ from "jquery";

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/popup.css";

(async function executeCode() {
  $(document).ready(async () => {
    // eslint-disable-next-line no-useless-escape
    const xingRegex = /(https?:\/\/(.+?\.)?xing\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/g;
    const usernameRegex = /xing\.com\/profile\/(.*?)\/cv/gm;

    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    // determine on which page the user is
    const onXING = xingRegex.exec(activeTab.url) !== null;
    const onProfile = usernameRegex.exec(activeTab.url) !== null;

    // hide all possible elements for all scenarios by default
    const divNotOnXING = $("#notOnXING");
    divNotOnXING.hide();

    const divNotOnProfile = $("#notOnProfile");
    divNotOnProfile.hide();

    const divGenerateJSON = $("#generateJSON");
    divGenerateJSON.hide();

    // show element for the current state
    if (onXING && onProfile) {
      divNotOnXING.hide();
      divNotOnProfile.hide();
      divGenerateJSON.show();
    } else if (onXING && !onProfile) {
      divNotOnXING.hide();
      divNotOnProfile.show();
      divGenerateJSON.hide();
    } else {
      divNotOnXING.show();
      divNotOnProfile.hide();
      divGenerateJSON.hide();
    }

    // click event handler for opening github repo
    const openGitHub = $("#openGitHub");
    openGitHub.click(async () => {
      await browser.tabs.create({
        url: "https://github.com/MarcMogdanz/XING2JSON"
      });
    });

    // click event handler for opening xing
    const openXINGButton = $("#openXING");
    openXINGButton.click(async () => {
      await browser.tabs.create({ url: "https://xing.com" });
    });

    // click event handler for generating resume
    const generateResumeButton = $("#generateResume");
    generateResumeButton.click(async () => {
      // send message to the content script to generate
      // the resume and send it back
      let response;
      try {
        response = await browser.tabs.sendMessage(activeTab.id, {
          task: "resume"
        });
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert(
          "Could not generate resume... this should actually never happen. Only when XING changes their HTML, so yeah. It's bad."
        );
        return;
      }

      // set the resume in the local storage so the options page
      // can read it and display it
      await browser.storage.local.set({
        last: {
          resume: response.resume
        }
      });

      // open the options page where the resume is displayed
      await browser.runtime.openOptionsPage();
    });
  });
})();
