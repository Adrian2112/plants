const ALL = { label: "All", termId: null, termValueId: null }

const PLANT = [
  ALL,
  { label: "Flowering",      termId: 12, termValueId: 13 },
  { label: "Fruiting",       termId: 12, termValueId: 14 },
  { label: "Budding",        termId: 12, termValueId: 15 },
  { label: "Green Leaves",   termId: 36, termValueId: 38 },
  { label: "Colored Leaves", termId: 36, termValueId: 39 },
  { label: "Leaf Buds",      termId: 36, termValueId: 37 },
  { label: "No Leaves",      termId: 36, termValueId: 40 },
]

const BIRD = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2  },
  { label: "Juvenile", termId: 1, termValueId: 8  },
  { label: "Subadult", termId: 1, termValueId: 16 },
  { label: "Male",     termId: 9, termValueId: 10 },
  { label: "Female",   termId: 9, termValueId: 11 },
]

const MAMMAL = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2  },
  { label: "Juvenile", termId: 1, termValueId: 8  },
  { label: "Male",     termId: 9, termValueId: 10 },
  { label: "Female",   termId: 9, termValueId: 11 },
]

const REPTILE = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2  },
  { label: "Juvenile", termId: 1, termValueId: 8  },
  { label: "Male",     termId: 9, termValueId: 10 },
  { label: "Female",   termId: 9, termValueId: 11 },
]

const AMPHIBIAN = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2 },
  { label: "Larva",    termId: 1, termValueId: 6 },
  { label: "Juvenile", termId: 1, termValueId: 8 },
  { label: "Egg",      termId: 1, termValueId: 7 },
]

const INSECT = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2  },
  { label: "Larva",    termId: 1, termValueId: 6  },
  { label: "Pupa",     termId: 1, termValueId: 4  },
  { label: "Nymph",    termId: 1, termValueId: 5  },
  { label: "Egg",      termId: 1, termValueId: 7  },
  { label: "Teneral",  termId: 1, termValueId: 3  },
  { label: "Male",     termId: 9, termValueId: 10 },
  { label: "Female",   termId: 9, termValueId: 11 },
]

const ARACHNID = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2  },
  { label: "Juvenile", termId: 1, termValueId: 8  },
  { label: "Male",     termId: 9, termValueId: 10 },
  { label: "Female",   termId: 9, termValueId: 11 },
]

const FISH = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2 },
  { label: "Juvenile", termId: 1, termValueId: 8 },
]

const DEFAULT = [
  ALL,
  { label: "Adult",    termId: 1, termValueId: 2 },
  { label: "Juvenile", termId: 1, termValueId: 8 },
]

const MAP = {
  Plantae:         PLANT,
  Aves:            BIRD,
  Mammalia:        MAMMAL,
  Reptilia:        REPTILE,
  Amphibia:        AMPHIBIAN,
  Insecta:         INSECT,
  Arachnida:       ARACHNID,
  Actinopterygii:  FISH,
  Mollusca:        DEFAULT,
  Fungi:           [ALL],
  Chromista:       [ALL],
  Protozoa:        [ALL],
}

const DISPLAY_NAMES = {
  Plantae:        "Plants",
  Aves:           "Birds",
  Mammalia:       "Mammals",
  Reptilia:       "Reptiles",
  Amphibia:       "Amphibians",
  Insecta:        "Insects",
  Arachnida:      "Arachnids",
  Actinopterygii: "Fish",
  Mollusca:       "Mollusks",
  Fungi:          "Fungi",
  Chromista:      "Chromists",
  Protozoa:       "Protozoans",
}

export function getFiltersForTaxon(iconicTaxonName) {
  return MAP[iconicTaxonName] || DEFAULT
}

export function getDisplayName(iconicTaxonName) {
  return DISPLAY_NAMES[iconicTaxonName] || iconicTaxonName || "Other"
}
