const NEEDS_POSTS_KEY = 'okcheonNeedsPosts'
const NEEDS_APPLICANT_KEY = 'okcheonNeedsApplicant'
const NEEDS_APPLICATIONS_KEY = 'okcheonNeedsApplications'

const seedPeoplePosts = [
  {
    id: 'people-1',
    type: 'people',
    category: '농촌일손',
    title: '복숭아 선별 작업 도와주실 분 구해요',
    region: '옥천읍',
    period: '8월 24일 - 8월 26일',
    schedule: '오전 8시부터 오후 2시까지',
    headcount: '2명',
    condition: '가벼운 농작업 가능하신 분',
    author: '이은자',
    phone: '010-4820-2301',
    content: '복숭아 박스 선별과 포장 작업을 함께 해주실 분을 찾습니다. 점심은 준비되어 있어요.',
    location: '옥천읍 삼청리 과수원',
  },
  {
    id: 'people-2',
    type: 'people',
    category: '주택수리',
    title: '농가 창고 지붕 보수 도와주실 분',
    region: '군북면',
    period: '이번 주말',
    schedule: '토요일 오전 9시',
    headcount: '1명',
    condition: '간단한 공구 사용 가능',
    author: '박성호',
    phone: '010-7300-1945',
    content: '비 오기 전에 창고 지붕 일부를 보수하려고 합니다. 경험 있으신 분이면 더 좋아요.',
    location: '군북면 증약리',
  },
  {
    id: 'people-3',
    type: 'people',
    category: '돌봄',
    title: '병원 동행 가능하신 분 찾습니다',
    region: '이원면',
    period: '9월 2일',
    schedule: '오전 10시 - 낮 12시',
    headcount: '1명',
    condition: '차량 이동 가능하신 분',
    author: '김명숙',
    phone: '010-9011-6520',
    content: '청주 병원 진료 동행을 부탁드리고 싶어요. 왕복 교통비와 사례비 드립니다.',
    location: '이원면 출발',
  },
  {
    id: 'people-4',
    type: 'people',
    category: '동아리',
    title: '귀농인 밴드 모임 기타 멤버 모집',
    region: '옥천읍',
    period: '상시 모집',
    schedule: '매주 수요일 저녁',
    headcount: '2명',
    condition: '초보 환영',
    author: '옥천옥 모임방',
    phone: '010-2210-7788',
    content: '동네 사람들과 가볍게 음악하는 모임입니다. 기타, 베이스 모두 환영해요.',
    location: '옥천읍 문화공간',
  },
]

const seedHousePosts = [
  {
    id: 'house-1',
    type: 'house',
    category: '주택',
    title: '마당 있는 단독주택 월세',
    region: '청산면',
    price: '보증금 300만원 / 월세 35만원',
    size: '24평',
    rooms: '방 2개, 거실 분리',
    maintenance: '관리비 없음',
    address: '청산면 예곡리',
    options: ['텃밭', '주차 가능', '창고'],
    author: '정미라',
    phone: '010-6131-4302',
    content: '조용한 마을 안쪽 집입니다. 작은 텃밭을 같이 쓰실 수 있어요.',
    photos: [],
  },
  {
    id: 'house-2',
    type: 'house',
    category: '원룸',
    title: '옥천역 근처 분리형 원룸',
    region: '옥천읍',
    price: '보증금 200만원 / 월세 28만원',
    size: '9평',
    rooms: '분리형 원룸',
    maintenance: '관리비 5만원',
    address: '옥천읍 금구리',
    options: ['냉장고', '세탁기', '에어컨'],
    author: '장터부동산',
    phone: '043-731-1940',
    content: '역과 시장이 가까워 처음 정착하시는 분이 지내기 편합니다.',
    photos: [],
  },
  {
    id: 'house-3',
    type: 'house',
    category: '투룸이상',
    title: '군서면 투룸 전세',
    region: '군서면',
    price: '전세 4,500만원',
    size: '18평',
    rooms: '투룸',
    maintenance: '실비 정산',
    address: '군서면 동평리',
    options: ['주차 가능', '도배 완료'],
    author: '한상민',
    phone: '010-7720-0083',
    content: '마을회관과 가까운 투룸입니다. 바로 입주 가능합니다.',
    photos: [],
  },
]

const seedPosts = [...seedPeoplePosts, ...seedHousePosts]

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getNeedPosts() {
  return readJson(NEEDS_POSTS_KEY, seedPosts)
}

export function saveNeedPost(post) {
  const posts = getNeedPosts()
  const nextPost = {
    ...post,
    id: post.id || `${post.type}-${Date.now()}`,
    createdAt: post.createdAt || new Date().toISOString(),
  }
  writeJson(NEEDS_POSTS_KEY, [nextPost, ...posts])
  return nextPost
}

export function getApplicantInfo() {
  return readJson(NEEDS_APPLICANT_KEY, {
    name: '',
    phone: '',
    region: '',
    note: '',
  })
}

export function saveApplicantInfo(info) {
  writeJson(NEEDS_APPLICANT_KEY, info)
  return info
}

export function saveNeedApplication(postId, applicant) {
  const applications = readJson(NEEDS_APPLICATIONS_KEY, [])
  const application = {
    id: `application-${Date.now()}`,
    postId,
    applicant,
    appliedAt: new Date().toISOString(),
  }
  writeJson(NEEDS_APPLICATIONS_KEY, [application, ...applications])
  return application
}
