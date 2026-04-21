import { getObservationPhotos, getHistogram, getTaxon } from "./inat_api.js"

const GALLERY_FILTERS = [
  { termId: null,  termValueId: null  },
  { termId: 12,    termValueId: 13    },
  { termId: 12,    termValueId: 14    },
  { termId: 36,    termValueId: 38    },
  { termId: 12,    termValueId: 15    },
  { termId: 36,    termValueId: 39    },
  { termId: 36,    termValueId: 40    },
  { termId: 36,    termValueId: 37    },
]

const SEASONALITY_FILTERS = [
  { termId: null, termValueId: null  },
  { termId: 12,   termValueId: 13    },
  { termId: 12,   termValueId: 14    },
  { termId: 12,   termValueId: 15    },
]

export async function prefetchForOffline(taxonId) {
  await Promise.allSettled([
    getTaxon(taxonId).catch(() => {}),
    prefetchPhotos(taxonId),
    prefetchSeasonality(taxonId),
  ])
}

async function prefetchPhotos(taxonId) {
  await Promise.allSettled(GALLERY_FILTERS.map(async (filter) => {
    try {
      const { photos } = await getObservationPhotos(taxonId, {
        termId: filter.termId,
        termValueId: filter.termValueId,
        page: 1,
      })
      await Promise.allSettled(
        photos.slice(0, 16).filter(p => p.small).map(p => fetch(p.small).catch(() => {}))
      )
    } catch {
      // best effort
    }
  }))
}

async function prefetchSeasonality(taxonId) {
  await Promise.allSettled(
    SEASONALITY_FILTERS.map(f =>
      getHistogram(taxonId, f.termId, f.termValueId).catch(() => {})
    )
  )
}
