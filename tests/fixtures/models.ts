import type { CamRow, CamSearchResponseItem } from '@/features/models/models/camSearch'
import type { SearchCriteria } from '@/features/models/models/searchCriteria'
import { emptyCriteria } from '@/features/models/models/searchCriteria'

export const buildCamRow = (overrides: Partial<CamRow> = {}): CamRow => ({
  id: 'gomodel:1234',
  title: 'enabled by MSH2 Hsap',
  date: '2026-07-23',
  state: 'development',
  conformsToGpad: false,
  modified: false,
  contributorUris: ['http://orcid.org/0000-0002-2874-6934'],
  groupIds: [],
  contributors: [
    {
      uri: 'http://orcid.org/0000-0002-2874-6934',
      name: 'Tremayne Mushayahama',
      initials: 'TM',
    },
  ],
  groups: [],
  ...overrides,
})

export const buildCamSearchResponseItem = (
  overrides: Partial<CamSearchResponseItem> = {}
): CamSearchResponseItem => ({
  id: 'gomodel:1234',
  title: 'enabled by MSH2 Hsap',
  date: '2026-07-23',
  state: 'development',
  contributors: ['http://orcid.org/0000-0002-2874-6934'],
  groups: [],
  'conforms-to-gpad': false,
  'modified-p': false,
  ...overrides,
})

export const buildCriteria = (overrides: Partial<SearchCriteria> = {}): SearchCriteria => ({
  ...emptyCriteria(),
  ...overrides,
})
