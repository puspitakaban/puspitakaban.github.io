// ── LOCATIONS ────────────────────────────────────────────────────────────────
// Add a new city here, then reference its key in PROJECTS.

const LOCATIONS = {
  'ann-arbor': {
    label: 'Ann Arbor, MI',
    lat:    42.2808,
    lng:   -83.7430
  },
  'jakarta': {
    label: 'Jakarta, Indonesia',
    lat:   -6.2088,
    lng:   106.8456
  }
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────
// location: key from LOCATIONS above
// link:     external URL (opens in new tab)
// page:     filename inside /projects/ folder (e.g. 'my-project.html')
// Leave link and page empty for a non-clickable card.

const PROJECTS = [
  {
    id:       'spatial-access',
    location: 'ann-arbor',
    year:     '2024',
    title:    'Spatial Accessibility Modeling of Health Services in Michigan',
    body:     'Enhanced 2SFCA method to quantify physician accessibility across Michigan counties using road-network travel time.',
    chips:    ['R · sf', 'Census API', 'E2SFCA', 'Network Analysis'],
    link:     '',
    page:     ''
  },
  {
    id:       'bayesian-edu',
    location: 'ann-arbor',
    year:     '2023',
    title:    'Bayesian Spatial Regression of Educational Attainment',
    body:     'BYM2 model exploring spatial autocorrelation in high-school graduation rates across Midwest counties.',
    chips:    ['R · Stan', 'INLA', 'BYM2 Model', 'ACS Data'],
    link:     '',
    page:     ''
  },
  {
    id:       'stunting-me',
    location: 'jakarta',
    year:     '2022',
    title:    'Stunting Reduction Program — National M&E Framework',
    body:     'Results-based M&E framework and geospatial dashboard for a multi-province nutrition program across Java and Nusa Tenggara.',
    chips:    ['QGIS · Python', 'Bayesian Hierarchical', 'ODK Collect', 'Power BI'],
    link:     '',
    page:     ''
  }
];