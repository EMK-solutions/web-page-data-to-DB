/**
 * Every LinkedIn selector used by the job adapter.
 * Other capture modules must not add their own LinkedIn selectors.
 */
export const linkedInSelectors = {
  description: [
    ".jobs-description-content__text",
    ".show-more-less-html__markup",
    ".jobs-description__content",
    "#job-details",
  ],
  jobDetailsRegion: [
    ".jobs-search__job-details--container",
    ".jobs-details",
    ".job-view-layout",
    ".jobs-details__main-content",
  ],
  loginWall: [
    ".authwall",
    ".join-form",
    ".login__form",
    "form.login-form",
    "[data-tracking-control-name='auth_wall_desktop-login-button']",
  ],
  title: [
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    ".topcard__title",
    "h1",
  ],
  company: [
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".topcard__org-name-link",
    ".jobs-details-top-card__company-url",
  ],
  location: [
    ".job-details-jobs-unified-top-card__primary-description-container",
    ".jobs-unified-top-card__bullet",
    ".topcard__flavor--bullet",
  ],
} as const;

export const loginWallText =
  /\b(join now|join linkedin|sign in to view|sign in to see|agree & join)\b/i;
