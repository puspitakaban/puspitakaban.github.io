// projects/data.js
// Edit this file to add, remove, or update portfolio cards.

const PROJECTS = [
  {
    id: 'spatial-access',
    location: 'annArbor',
    eyebrow: 'MS Thesis · UMich 2024',
    eyebrowClass: 'blue',
    title: 'Spatial Accessibility Modeling of Health Services in Michigan',
    body: 'Applied the enhanced 2-step floating catchment area (E2SFCA) method to quantify physician accessibility across Michigan counties using road-network travel time.',
    chips: ['R · sf', 'Census API', 'E2SFCA', 'Network Analysis'],
    chipClass: 'blue'
  },
  {
    id: 'bayesian-edu',
    location: 'annArbor',
    eyebrow: 'Coursework Research · UMich 2023',
    eyebrowClass: 'blue',
    title: 'Bayesian Spatial Regression of Educational Attainment',
    body: 'Fitted a Besag–York–Mollié (BYM2) model to explore spatial autocorrelation in high-school graduation rates across Midwest counties.',
    chips: ['R · Stan', 'INLA', 'BYM2 Model', 'ACS Data'],
    chipClass: 'blue'
  },
  {
    id: 'stunting-me',
    location: 'jakarta',
    eyebrow: 'M&E Research · Indonesia 2022',
    eyebrowClass: '',
    title: 'Stunting Reduction Program — National Monitoring Framework',
    body: 'Designed the results-based M&E framework and geospatial dashboard for a multi-province nutrition program targeting under-5 stunting across Java and Nusa Tenggara.',
    chips: ['QGIS · Python', 'Bayesian Hierarchical', 'ODK Collect', 'Power BI'],
    chipClass: ''
  }
];

// Geographic centres of each location key
const LOCATIONS = {
  annArbor: { lat: 42.2808, lng: -83.7430, label: 'Ann Arbor, MI' },
  jakarta:  { lat: -6.2088, lng: 106.8456, label: 'Jakarta, Indonesia' }
};

// Card offsets from pin (px). Two cards side-by-side above Ann Arbor;
// one card above Jakarta.
const CARD_OFFSETS = {
  annArbor: [
    { dx: -245, dy: -220 },
    { dx:   15, dy: -220 }
  ],
  jakarta: [
    { dx: -114, dy: -210 }
  ]
};
