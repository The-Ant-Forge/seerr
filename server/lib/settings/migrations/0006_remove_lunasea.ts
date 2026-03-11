const removeLunaSeaSetting = (settings: any): any => {
  if (
    settings.notifications &&
    settings.notifications.agents &&
    settings.notifications.agents.lunasea
  ) {
    delete settings.notifications.agents.lunasea;
  }
  return settings;
};

export default removeLunaSeaSetting;
