// ── LOCATIONS ────────────────────────────────────────────────────────────────
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
const PROJECTS = [
  {
    id:          'north-jakarta-ej',
    location:    'jakarta',
    year:        '2024',
    title:       `Urban Dynamics in Northern Jakarta: Spatial Inequality and Colonial Legacies`,
    description: `Conducted spatial narrative analysis of North Jakarta's coastline using ArcGIS StoryMaps, tracing how colonial-era land allocation patterns shaped contemporary spatial inequality in Pantai Indah Kapuk — linking private investment flows, state policy, and displacement.`,
    tags:        ['ArcGIS StoryMaps', 'Urban Analysis', 'Spatial Inequality', 'Historical GIS'],
    link:        'https://storymaps.arcgis.com/stories/180455f398e446b48da6557d2e6ea47b'
  },
  {
    id:          'seagrass-enso',
    location:    'jakarta',
    year:        '2024',
    title:       `Bayesian Prediction of Seagrass Cover Under ENSO Variability in the Indo-Pacific`,
    description: `Built a Bayesian spatiotemporal model to predict seagrass cover dynamics across the Indo-Pacific under ENSO climate forcing, integrating remote sensing data with hierarchical modeling. Deployed as an interactive R Shiny dashboard for exploratory analysis.`,
    tags:        ['Bayesian Modeling', 'R · Stan', 'R Shiny', 'Remote Sensing', 'ENSO', 'Spatiotemporal'],
    link:        'https://bz1gpi-puspitakaban.shinyapps.io/SeagrassCover/'
  },
  {
    id:          'biclustering-vulnerability',
    location:    'jakarta',
    year:        '2019',
    title:       `Biclustering Method to Capture Spatial Patterns of Social Vulnerability in Indonesia`,
    description: `Applied biclustering algorithms to simultaneously cluster provinces and vulnerability indicators, identifying spatial co-occurrence patterns of social vulnerability across Indonesia. Published in Procedia Computer Science.`,
    tags:        ['Biclustering', 'R', 'Social Vulnerability', 'Multivariate Analysis', 'Published'],
    link:        'https://www.sciencedirect.com/science/article/pii/S1877050919310567'
  },
  {
    id:          'nightlight-sae',
    location:    'jakarta',
    year:        '2022',
    title:       `Night Light Data as Auxiliary Variable in Small Area Estimation`,
    description: `Leveraged VIIRS nighttime light satellite imagery as an auxiliary covariate in Fay-Herriot small area estimation models, improving sub-district poverty estimates where survey sample sizes are insufficient. Published in Communications in Statistics.`,
    tags:        ['Small Area Estimation', 'Remote Sensing', 'VIIRS', 'Survey Statistics', 'Published'],
    link:        'https://www.tandfonline.com/doi/abs/10.1080/03610926.2022.2077963'
  },
  {
    id:          'where-to-live',
    location:    'ann-arbor',
    year:        '2025',
    title:       `Where to Live in Ann Arbor — Neighborhood Decision Tool`,
    description: `Developing an interactive geospatial decision-support tool that scores Ann Arbor neighborhoods across walkability, transit access, amenities, and cost of living — combining spatial data wrangling, weighted overlay analysis, and a live web map interface.`,
    tags:        ['R · sf', 'Leaflet', 'Spatial Analysis', 'Web Map', 'In Development'],
    link:        'https://puspitakaban.github.io/where-to-live-ann-arbor/'
  }
  ,{
    id:          'um-ai-resource-map',
    location:    'ann-arbor',
    year:        '2024',
    title:       `UM AI Resource Map`,
    description: `Built an interactive web map for MIDAS (Michigan Institute for Data and AI in Society) cataloguing AI-related courses, labs, and research groups across the University of Michigan — enabling students and faculty to discover and navigate the university's AI ecosystem spatially.`,
    tags:        ['Leaflet', 'JavaScript', 'Web Mapping', 'MIDAS · UMich'],
    link:        'https://um-midas.github.io/AI-resource-map/'
  }
];