import { useEffect, useRef, useState } from 'react'

// 폼에 끼워넣기 전, 주소 검색 위젯 단독 검증용 페이지.
// 실제 응답 데이터의 필드(특히 동/읍/면 분류에 쓸 필드)를 console.log로 확인하는 용도.
const POSTCODE_SCRIPT_SRC = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

// 법정동/법정리명이 "읍" 또는 "면"으로 끝나면 읍면 지역으로 분류 (그 외엔 동 지역으로 간주)
function classifyResidenceType(regionName) {
  return /(읍|면)$/.test(regionName || '') ? '읍면' : '동'
}

function loadPostcodeScript() {
  if (window.kakao?.Postcode) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('주소 검색 스크립트 로드 실패'))
    document.head.appendChild(script)
  })
}

function positionLayer(layer) {
  const width = 300
  const height = 400
  const borderWidth = 5
  layer.style.width = `${width}px`
  layer.style.height = `${height}px`
  layer.style.border = `${borderWidth}px solid #076818`
  layer.style.left = `${((window.innerWidth || document.documentElement.clientWidth) - width) / 2 - borderWidth}px`
  layer.style.top = `${((window.innerHeight || document.documentElement.clientHeight) - height) / 2 - borderWidth}px`
}

export default function AddressSearchTest() {
  const layerRef = useRef(null)
  const [scriptError, setScriptError] = useState('')
  const [rawData, setRawData] = useState(null)
  const [classification, setClassification] = useState(null)

  useEffect(() => {
    loadPostcodeScript().catch(err => setScriptError(err.message))
  }, [])

  const closeLayer = () => {
    if (layerRef.current) layerRef.current.style.display = 'none'
  }

  const openPostcode = () => {
    const layer = layerRef.current
    if (!layer || !window.kakao?.Postcode) return

    new window.kakao.Postcode({
      oncomplete(data) {
        // 1. 실제 응답 필드 확인
        console.log('[postcode] oncomplete data =', data)

        // 2. 동/읍/면 분류 함수 검증 — 후보 필드별로 결과 비교
        const candidates = {
          region_3depth_name: data.region_3depth_name,
          bname: data.bname,
          bname1: data.bname1,
          bname2: data.bname2,
        }
        Object.entries(candidates).forEach(([field, value]) => {
          console.log(`[classify] ${field} = "${value}" -> ${classifyResidenceType(value)}`)
        })

        setRawData(data)
        setClassification({
          field: 'region_3depth_name',
          value: data.region_3depth_name,
          residenceType: classifyResidenceType(data.region_3depth_name),
        })

        closeLayer()
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5,
    }).embed(layer)

    layer.style.display = 'block'
    positionLayer(layer)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'inherit' }}>
      <h2 style={{ margin: 0 }}>주소 검색 위젯 단독 검증</h2>
      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
        버튼을 눌러 주소를 검색하면, 콘솔에 응답 데이터와 동/읍/면 분류 결과가 출력됩니다.
      </p>

      {scriptError && <p style={{ color: '#d93025', fontSize: 13 }}>{scriptError}</p>}

      <button className="app-action-button" type="button" onClick={openPostcode} style={{ alignSelf: 'flex-start', padding: '10px 18px', borderRadius: 999, border: 'none', background: '#076818', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
        우편번호 찾기
      </button>

      {classification && (
        <div style={{ fontSize: 14 }}>
          <strong>{classification.field}</strong>: "{classification.value}" → 분류 결과: <strong>{classification.residenceType}</strong>
        </div>
      )}

      {rawData && (
        <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          {JSON.stringify(rawData, null, 2)}
        </pre>
      )}

      {/* iOS에서는 position:fixed 버그가 있음, 적용하는 사이트에 맞게 position:absolute 등을 이용하여 top,left값 조정 필요 */}
      <div
        ref={layerRef}
        style={{
          display: 'none',
          position: 'fixed',
          overflow: 'hidden',
          zIndex: 1000,
          WebkitOverflowScrolling: 'touch',
          background: '#fff',
        }}
      >
        <img
          src="//t1.kakaocdn.net/postcode/resource/images/close.png"
          onClick={closeLayer}
          alt="닫기 버튼"
          style={{ cursor: 'pointer', position: 'absolute', right: -3, top: -3, zIndex: 1 }}
        />
      </div>
    </div>
  )
}
