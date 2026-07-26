// ============================================================
// Crop data — diseases per crop with mock treatment data
// ============================================================

export const CROPS = [
  {
    id: 'cotton',
    name: 'Cotton',
    latin: 'Gossypium hirsutum',
    image: '/images/cotton.png',
    color: '#A8C5B0',
    accent: '#3D6B4F',
    diseases: [
      {
        id: 'bacterial_blight',
        name: 'Bacterial Blight',
        severity: 'high',
        description:
          'Caused by Xanthomonas axonopodis pv. malvacearum. Angular, water-soaked lesions on leaves that turn brown and papery as the disease progresses.',
        symptoms: ['Angular brown lesions', 'Water-soaked margins', 'Boll rot', 'Blackarm of stem'],
        treatments: [
          'Apply copper-based bactericides (Copper Oxychloride 50 WP @ 3g/L) at first sign of infection.',
          'Remove and destroy infected plant debris to reduce inoculum.',
          'Use disease-free certified seed treated with hot water (56°C for 30 min).',
          'Avoid overhead irrigation; switch to drip irrigation to limit leaf wetness.',
          'Rotate crops with non-host plants for at least 2 seasons.',
        ],
      },
      {
        id: 'fusarium_wilt',
        name: 'Fusarium Wilt',
        severity: 'high',
        description:
          'Soil-borne pathogen Fusarium oxysporum f. sp. vasinfectum causes vascular wilting, yellowing, and sudden plant collapse.',
        symptoms: ['Yellowing of lower leaves', 'Vascular discoloration', 'Wilting at midday', 'Stunted growth'],
        treatments: [
          'Grow resistant or tolerant cotton varieties where available.',
          'Apply Trichoderma viride bio-fungicide to soil at planting (2.5 kg/ha).',
          'Maintain soil pH between 6.0–7.0 through liming.',
          'Avoid water stress; maintain even soil moisture.',
          'Practice 3-year rotation with non-susceptible crops like wheat or sorghum.',
        ],
      },
      {
        id: 'leaf_curl',
        name: 'Leaf Curl Disease',
        severity: 'medium',
        description:
          'Caused by Cotton Leaf Curl Virus (CLCuV) transmitted by whitefly (Bemisia tabaci). Plants show upward leaf curling, vein thickening, and enation.',
        symptoms: ['Upward leaf curling', 'Vein swelling (enation)', 'Stunted growth', 'Flower abortion'],
        treatments: [
          'Control whitefly vector with Imidacloprid 70 WS seed treatment.',
          'Remove and destroy infected plants immediately after detection.',
          'Spray Thiamethoxam 25 WG @ 0.5g/L for whitefly knockdown.',
          'Install yellow sticky traps at 5 per acre to monitor whitefly populations.',
          'Plant resistant varieties such as FH-142 or IR-NIBGE series.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Continue regular monitoring every 7–10 days.',
          'Maintain balanced fertilization (NPK) as per soil test recommendations.',
          'Ensure adequate irrigation scheduling based on crop growth stage.',
        ],
      },
    ],
  },
  {
    id: 'tomato',
    name: 'Tomato',
    latin: 'Solanum lycopersicum',
    image: '/images/tomato.png',
    color: '#E8C5A8',
    accent: '#C47B5A',
    diseases: [
      {
        id: 'early_blight',
        name: 'Early Blight',
        severity: 'medium',
        description:
          'Caused by Alternaria solani. Produces characteristic dark brown concentric ring lesions (target-board pattern) on older leaves first.',
        symptoms: ['Concentric ring lesions', 'Yellow halo around spots', 'Lower leaf yellowing', 'Defoliation'],
        treatments: [
          'Spray Mancozeb 75 WP @ 2.5g/L or Chlorothalonil 75 WP @ 2g/L every 7–10 days.',
          'Ensure adequate plant spacing (45–60 cm) for good air circulation.',
          'Remove and compost infected leaves; do not leave on soil surface.',
          'Apply organic mulch to reduce soil splash-back onto lower leaves.',
          'Use drip irrigation and water at the base of plants only.',
        ],
      },
      {
        id: 'late_blight',
        name: 'Late Blight',
        severity: 'high',
        description:
          'Caused by Phytophthora infestans — the pathogen responsible for the Irish Potato Famine. Fast-spreading, can destroy crops within days under cool moist conditions.',
        symptoms: ['Water-soaked dark lesions', 'White fungal sporulation on leaf underside', 'Greasy appearance', 'Rapid collapse'],
        treatments: [
          'Apply systemic fungicide Cymoxanil + Mancozeb (Curzate M8) @ 2.5g/L at first sign.',
          'Alternate with Dimethomorph 50 WP for resistance management.',
          'Destroy heavily infected plants and all debris immediately.',
          'Avoid working in fields when foliage is wet to prevent spread.',
          'Monitor weather forecasts; apply protectant sprays before rain events.',
        ],
      },
      {
        id: 'leaf_mold',
        name: 'Leaf Mold',
        severity: 'medium',
        description:
          'Caused by Passalora fulva (formerly Cladosporium fulvum). Common in greenhouse and high-humidity environments.',
        symptoms: ['Pale green/yellow spots on upper leaf', 'Olive-brown mold on lower leaf', 'Leaf curling upward', 'Premature defoliation'],
        treatments: [
          'Reduce humidity below 85% through improved ventilation in greenhouses.',
          'Apply Azoxystrobin 23 SC @ 1mL/L as a preventive or early curative spray.',
          'Use resistant varieties (Cf-gene carrying cultivars).',
          'Avoid excessive nitrogen fertilization which promotes lush, susceptible growth.',
          'Space plants adequately and prune lower leaves to improve airflow.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Continue regular scouting every 5–7 days.',
          'Maintain adequate calcium supply to prevent physiological disorders.',
          'Ensure consistent watering to avoid blossom end rot.',
        ],
      },
    ],
  },
  {
    id: 'tea',
    name: 'Tea',
    latin: 'Camellia sinensis',
    image: '/images/tea.png',
    color: '#C5D8A8',
    accent: '#4A7A30',
    diseases: [
      {
        id: 'blister_blight',
        name: 'Blister Blight',
        severity: 'high',
        description:
          'Caused by Exobasidium vexans. A major disease of tea in South Asia and Africa causing blistering and curling of young leaves.',
        symptoms: ['Pale green circular spots', 'White blister on underside', 'Curled distorted leaves', 'Shoot die-back'],
        treatments: [
          'Apply copper fungicides (Copper Oxychloride 50% WP @ 3g/L) at 10–14 day intervals during humid periods.',
          'Shade pruning to improve air circulation within the canopy.',
          'Avoid overhead irrigation; use drip system where possible.',
          'Remove and burn severely infected shoots.',
          'Select disease-tolerant clones from certified nurseries.',
        ],
      },
      {
        id: 'gray_blight',
        name: 'Gray Blight',
        severity: 'medium',
        description:
          'Caused by Pestalotiopsis theae. Produces gray-brown leaf spots with distinct dark margins on mature leaves.',
        symptoms: ['Brown lesions with gray center', 'Dark margin border', 'Acervuli (tiny black dots)', 'Leaf fall'],
        treatments: [
          'Spray Carbendazim 50 WP @ 1g/L or Thiophanate-methyl for control.',
          'Maintain balanced nutrition; avoid potassium deficiency.',
          'Timely plucking rounds to remove affected shoots.',
          'Improve drainage in waterlogged areas.',
          'Prune dead wood and maintain open bush structure.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Continue routine plucking schedules.',
          'Apply balanced NPK plus micronutrients as per soil analysis.',
          'Monitor for pest incidence (tea mosquito bug, thrips).',
        ],
      },
    ],
  },
  {
    id: 'coffee',
    name: 'Coffee',
    latin: 'Coffea arabica',
    image: '/images/coffee.png',
    color: '#C5A880',
    accent: '#6B4C35',
    diseases: [
      {
        id: 'leaf_rust',
        name: 'Coffee Leaf Rust',
        severity: 'high',
        description:
          'Caused by Hemileia vastatrix — the most economically damaging coffee disease worldwide. Orange powdery pustules form on the underside of leaves.',
        symptoms: ['Orange-yellow pustules on leaf underside', 'Yellow spots on upper surface', 'Premature defoliation', 'Reduced yield'],
        treatments: [
          'Apply copper-based fungicides (Copper Hydroxide 50 WP) at onset of rainy season.',
          'Use systemic triazole fungicides (Propiconazole 25 EC @ 1mL/L) for curative treatment.',
          'Plant rust-resistant Arabica varieties or Robusta cultivars.',
          'Maintain adequate potassium fertilization to improve plant resistance.',
          'Shade management: maintain 30–40% shade to reduce leaf wetness duration.',
        ],
      },
      {
        id: 'coffee_berry_disease',
        name: 'Coffee Berry Disease',
        severity: 'high',
        description:
          'Caused by Colletotrichum kahawae. Causes mummified "mummies" and dark lesions on berries, leading to total crop loss if uncontrolled.',
        symptoms: ['Dark sunken lesions on green berries', 'Mummified berries', 'Premature berry drop', 'Black rot of pulp'],
        treatments: [
          'Apply fungicide sprays from flower opening: Carbendazim + Mancozeb combination.',
          'Collect and destroy all mummified berries and fallen infected berries.',
          'Harvest all ripe and overripe berries promptly.',
          'Use resistant Ruiru 11 or Batian varieties.',
          'Ensure proper shade and nutrition to maintain plant vigor.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Maintain shade tree pruning schedule.',
          'Apply foliar nutrition (zinc, boron) at flowering stage.',
          'Monitor berry borer traps regularly.',
        ],
      },
    ],
  },
  {
    id: 'maize',
    name: 'Maize',
    latin: 'Zea mays',
    image: '/images/maize.png',
    color: '#D8C8A0',
    accent: '#8B6914',
    diseases: [
      {
        id: 'northern_leaf_blight',
        name: 'Northern Leaf Blight',
        severity: 'high',
        description:
          'Caused by Exserohilum turcicum. Long cigar-shaped tan lesions appear on leaves, reducing photosynthetic area and yield.',
        symptoms: ['Long tan/gray lesions (5–15 cm)', 'Cigar-shaped spots', 'Dark sporulation in lesion center', 'Lower leaf blighting upward'],
        treatments: [
          'Apply foliar fungicide Propiconazole 25 EC @ 1mL/L or Azoxystrobin at early tassel stage.',
          'Plant resistant hybrids with Ht1, Ht2, or HtN resistance genes.',
          'Reduce surface crop residue through tillage or rapid decomposition.',
          'Avoid dense plant populations that restrict air movement.',
          'Apply balanced NPK; nitrogen excess increases susceptibility.',
        ],
      },
      {
        id: 'gray_leaf_spot',
        name: 'Gray Leaf Spot',
        severity: 'medium',
        description:
          'Caused by Cercospora zeae-maydis. Rectangular gray lesions restricted by leaf veins, common in conservation tillage systems.',
        symptoms: ['Rectangular gray lesions', 'Vein-limited spots', 'Tan center with yellow halo', 'Lower canopy infection first'],
        treatments: [
          'Apply Trifloxystrobin + Propiconazole (Stratego YLD) as foliar spray.',
          'Rotate corn with soybean or wheat to reduce residue inoculum.',
          'Choose hybrids with good gray leaf spot resistance ratings.',
          'Manage crop residue through tillage where feasible.',
          'Scout fields at V10 stage and apply fungicide if disease threshold exceeded.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Continue regular field scouting.',
          'Maintain adequate soil moisture during pollination and grain fill.',
          'Monitor for fall armyworm — key pest of maize.',
        ],
      },
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    latin: 'Malus domestica',
    image: '/images/apple.png',
    color: '#D4B8B8',
    accent: '#8B3030',
    diseases: [
      {
        id: 'apple_scab',
        name: 'Apple Scab',
        severity: 'high',
        description:
          'Caused by Venturia inaequalis — the most economically important apple disease worldwide. Dark olive-green to black scabby lesions on leaves and fruit.',
        symptoms: ['Olive-green velvety spots', 'Scabby corky lesions on fruit', 'Distorted leaves', 'Premature leaf drop'],
        treatments: [
          'Apply protective fungicides (Captan 50 WP @ 2.5g/L) from pink bud stage at 7–10 day intervals.',
          'Use sterol-inhibiting fungicides (Myclobutanil, Penconazole) for curative action within 72 hours of infection.',
          'Rake and destroy fallen leaves in autumn to eliminate overwintering ascospores.',
          'Prune for open canopy to reduce humidity and leaf wetness duration.',
          'Plant scab-resistant varieties (Freedom, Liberty, Enterprise) in new orchards.',
        ],
      },
      {
        id: 'powdery_mildew',
        name: 'Powdery Mildew',
        severity: 'medium',
        description:
          'Caused by Podosphaera leucotricha. White powdery fungal growth on young leaves, shoots, and blossoms, reducing fruit set and quality.',
        symptoms: ['White powdery coating on young leaves', 'Silvery leaf surface', 'Stunted shoot growth', 'Blossom/fruit russeting'],
        treatments: [
          'Apply sulfur-based fungicides (Wettable Sulfur 80 WP @ 3g/L) from pink bud stage.',
          'Use DMI fungicides (Myclobutanil, Tebuconazole) at 10–14 day intervals.',
          'Prune and destroy infected shoots during dormant pruning.',
          'Avoid excessive nitrogen which promotes lush, susceptible shoot growth.',
          'Ensure good orchard ventilation and avoid dense canopies.',
        ],
      },
      {
        id: 'fire_blight',
        name: 'Fire Blight',
        severity: 'high',
        description:
          'Caused by the bacterium Erwinia amylovora. Rapid browning and "shepherd\'s crook" wilting of blossoms, shoots, and branches — appearance of scorched fire damage.',
        symptoms: ['Shepherd\'s crook wilting', 'Brown-black shoot tip dieback', 'Oozing bacterial exudate', 'Blossom blast'],
        treatments: [
          'Apply copper bactericides at pink bud and petal fall (Copper Hydroxide 50 WP @ 3g/L).',
          'Use streptomycin (where registered) or phosphonate alternatives during bloom.',
          'Prune infected wood 30 cm below visible symptoms; disinfect tools between cuts.',
          'Remove and burn all infected material; do not compost.',
          'Monitor fire blight infection models (Cougarblight, Maryblyt) to time sprays accurately.',
        ],
      },
      {
        id: 'healthy',
        name: 'Healthy Plant',
        severity: 'none',
        description: 'No disease detected. The leaf appears healthy with normal coloration and structure.',
        symptoms: [],
        treatments: [
          'Continue regular dormant pruning and canopy management.',
          'Apply calcium foliar sprays to prevent bitter pit in fruit.',
          'Monitor codling moth with pheromone traps.',
        ],
      },
    ],
  },
];

export const getCropById = (id) => CROPS.find((c) => c.id === id);
