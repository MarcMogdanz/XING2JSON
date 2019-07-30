import $ from "jquery";
import moment from "moment";
import countries from "i18n-iso-countries";

import countriesEN from "i18n-iso-countries/langs/en.json";
import countriesDE from "i18n-iso-countries/langs/de.json";

countries.registerLocale(countriesEN);
countries.registerLocale(countriesDE);

const parseDates = datesElement => {
  let startDate = "";
  let endDate = "";

  // it is possible to have a work/education experience listed without specifiying any timeframe
  // therefore only parse those that have a timeframe
  if (datesElement.length === 1) {
    // the date element contains two dates separated by a "-"
    [startDate, endDate] = datesElement[0].innerText
      .split("-") // split them into two
      .map(string => string.trim()) // remove unnecessary spaces
      .map(string => {
        // dates can be either MM/YYYY or YYYY or the localized version of "today"

        const dateFullRegex = /^\d{2}\/\d{4}$/gm; // MM/YYYY
        if (dateFullRegex.exec(string)) {
          return moment(string, "MM/YYYY").format("YYYY-MM-DD");
        }

        const dateYearRegex = /^\d{4}$/gm; // YYYY
        if (dateYearRegex.exec(string)) {
          return moment(string, "YYYY").format("YYYY-MM-DD");
        }

        // as we cannot check for "today" in every language, we will
        // just assume if the other formats do not match, its "today"
        return "today";
      });
  }

  return [startDate, endDate];
};

const createResume = async () => {
  const resume = {
    basics: {
      location: {}
    }
  };

  const header = $(`div[class^="main-main-main-"]`)[0];
  const body = $(`iframe[class^="iFrame-iFrame-iFrame"][id="tab-content"]`)
    .contents()
    .find("body")[0];

  if (!header || !body) {
    return Promise.reject(new Error("HeaderOrBodyNotFound"));
  }

  // de
  // needed for country name to country code conversion
  const { lang } = $("html")[0];

  // some elements (like country name to country code conversion) require
  // the user's language, if this is not set or not valid we just
  // ignore these parts of the resume
  let useLanguageRelatedElements = true;

  if (!lang || !countries.isValid(lang)) {
    useLanguageRelatedElements = false;
  }

  // Max Mustermann
  const nameElement = $(
    `h2[data-qa="malt-profile-display-name"] > span`,
    header
  );
  let name = "";
  if (nameElement[0]) {
    name = nameElement[0].innerText;
  }
  resume.basics.name = name;

  // Hamburg, Germany
  const locationElement = $(
    `div[class^="location-location-locationText-"] > p`,
    header
  );
  let [city, country] = "";
  if (locationElement[0]) {
    [city, country] = locationElement[0].innerText
      .split(",")
      .map(string => string.trim());
  }
  resume.basics.location.city = city;
  if (useLanguageRelatedElements) {
    resume.basics.location.countryCode = countries.getAlpha2Code(country, lang);
  }

  // xing image url
  const imageElement = $(`img[alt="${name}"]`, header);
  let image = "";
  if (imageElement[0]) {
    image = imageElement[0].src;
  }
  resume.basics.image = image;

  // all work entries
  const workElements = $(`div[id="work-experience"] > ul > li`, body)
    .toArray()
    .map(element => $(`div[class="details"]`, element)[0]);
  const parsedWorkArray = await Promise.all(
    workElements.map(async element => {
      const datesElement = $("div.additional.top", element);
      const [startDate, endDate] = parseDates(datesElement);

      const companyNameElement = $("h4.job-company-name", element);
      let companyName = "";
      if (companyNameElement[0]) {
        companyName = companyNameElement[0].innerText;
      }

      const jobTitleElement = $("h3.job-title", element);
      let jobTitle = "";
      if (jobTitleElement[0]) {
        jobTitle = jobTitleElement[0].innerText;
      }

      const companyUrlElement = $("div.additional.company-url", element);
      let companyUrl = "";
      if (companyUrlElement[0]) {
        companyUrl = companyUrlElement[0].innerText;
      }

      return {
        startDate,
        endDate,
        name: companyName,
        position: jobTitle,
        url: companyUrl
      };
    })
  );
  resume.work = parsedWorkArray;

  // all education entries
  const educationElements = $(`div[id="education"] > ul > li`, body)
    .toArray()
    .map(element => $(`div[class="details"]`, element)[0]);
  const parsedEducationArray = await Promise.all(
    educationElements.map(async element => {
      const datesElement = $("div.additional.top", element);
      const [startDate, endDate] = parseDates(datesElement);

      const educationTitleElement = $("h3.education-title", element);
      let educationTitle = "";
      if (educationTitleElement[0]) {
        educationTitle = educationTitleElement[0].innerText;
      }

      const educationDescriptionElement = $(
        "h4.education-description",
        element
      );
      let educationDescription = "";
      if (educationDescriptionElement[0]) {
        educationDescription = educationDescriptionElement[0].innerText;
      }

      return {
        startDate,
        endDate,
        institution: educationTitle,
        area: educationDescription
      };
    })
  );
  resume.education = parsedEducationArray;

  // languages
  const languagesElement = $("ul#language-skills", body);

  // languages level 4 (First language)
  const languagesLevel4Elements = $(
    `li.language.language-level-4 > div > h3[itemprop="name"]`,
    languagesElement
  ).toArray();
  let languagesLevel4 = [];
  if (languagesLevel4Elements.length > 0) {
    languagesLevel4 = languagesLevel4Elements
      .map(element => element.innerText)
      .map(language => ({ language, fluency: "First language" }));
  }

  // languages level 3 (Fluent)
  const languagesLevel3Elements = $(
    `li.language.language-level-3 > div > h3[itemprop="name"]`,
    languagesElement
  ).toArray();
  let languagesLevel3 = [];
  if (languagesLevel3Elements.length > 0) {
    languagesLevel3 = languagesLevel3Elements
      .map(element => element.innerText)
      .map(language => ({ language, fluency: "Fluent" }));
  }

  // languages level 2 (Good knowledge)
  const languagesLevel2Elements = $(
    `li.language.language-level-2 > div > h3[itemprop="name"]`,
    languagesElement
  ).toArray();
  let languagesLevel2 = [];
  if (languagesLevel2Elements.length > 0) {
    languagesLevel2 = languagesLevel2Elements
      .map(element => element.innerText)
      .map(language => ({ language, fluency: "Good knowledge" }));
  }

  // languages level 1 (Basic knowledge)
  const languagesLevel1Elements = $(
    `li.language.language-level-1 > div > h3[itemprop="name"]`,
    languagesElement
  ).toArray();
  let languagesLevel1 = [];
  if (languagesLevel1Elements.length > 0) {
    languagesLevel1 = languagesLevel1Elements
      .map(element => element.innerText)
      .map(language => ({ language, fluency: "Basic knowledge" }));
  }

  // languages without level
  const languagesNoLevelElements = $(
    `li.language.language-level- > div > h3[itemprop="name"]`,
    languagesElement
  ).toArray();
  let languagesNoLevel = [];
  if (languagesNoLevelElements.length > 0) {
    languagesNoLevel = languagesNoLevelElements
      .map(element => element.innerText)
      .map(language => ({ language, fluency: "" }));
  }

  const allLanguages = []
    .concat(languagesLevel4)
    .concat(languagesLevel3)
    .concat(languagesLevel2)
    .concat(languagesLevel1)
    .concat(languagesNoLevel);
  resume.languages = allLanguages;

  return resume;
};

export default createResume;
