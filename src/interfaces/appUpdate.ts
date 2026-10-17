export interface AppUpdateTranslation {
  title: string;
  description: string;
}

export interface IAppUpdate {
  // Stable id, e.g. "dudar-148". Seeded entries are upserted by it.
  key: string;
  date: Date;
  // Pull requests in the dudar repo this update comes from
  prNumbers?: number[];
  translations: {
    [languageCode: string]: AppUpdateTranslation;
  };
}
