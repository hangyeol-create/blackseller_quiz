export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { count = 5, type = 'mix', topic = 'all' } = req.body || {};

  const GUIDE = `블랙셀러 통합 가이드 핵심:

[정보 입력 프로세스]
- 작업 할당: 작업일 1일 전부터 조회(월요일은 3일 전), 10건 단위
- 작업 선택: 당월 전체, 최신순
- 정보 입력: 위반사항 확인, 리셀러 판정, 셀러 정보 수집, 예외케이스

[신고 프로세스]
처리 방식 결정표:
- 필수표기O → 무조건 플랫폼 신고 (상담유형: 상품정보 미표기 및 부정확)
- 필수표기X + 개인정보O → 플랫폼 신고 (상담유형: 개인정보 침해), 네이버+저작권O는 신고 보류
- 필수표기X + 개인정보X + 저작권O → 신고 제출만 (네이버는 신고 보류)
- 필수표기X + 개인정보X + 저작권X → 신고 대상 아님 (리셀러 아님)
플랫폼별 상담유형:
- 네이버: 필수표기→상품정보 미표기 및 부정확 / 개인정보→개인정보 침해
- Gmarket/Auction: 필수표기→표시광고 / 개인정보→게시물 정책 위반
- 11번가: 필수표기→식품/화장품/의료기기 법위반 / 개인정보→개인정보 도용
- 롯데ON: 필수표기→상품 정보 오류 / 개인정보→기타
- 신세계몰: 필수표기→표시 광고 위반 / 개인정보→상품정보 오류
- 쿠팡: 모두→상품정보 오류
- 신고하기 창구 없는 플랫폼(GSshop 등): price admin에서 신고 제출만

[위반사항 확인]
1. 저작권 침해
- O: 본사 직접 작성 이미지(로고, 상세이미지, 안내문구) 사용
- X: 실제 제품 구매 후 촬영
- 애매한 건은 저작권 침해로 판단
2. 개인정보 침해 (3가지)
- 위탁배송 명시 누락: 위탁판매자가 배송업체 미명시 (예외: 지마켓/신세계 명시 문구 있으면 X)
- 판매자 개인정보 처리방침 누락: 수집항목+이용목적+제3자 제공여부 모두 있어야
- 개인정보 동의여부 누락: "구매시 처리방침에 동의한 것으로 간주" 문구 없으면 침해
3. 필수표기정보 침해
- 미기재: 사용기한/소비기한(기타재화 제외), 수입자(수입품만), 제조국, 제조사, 제조연월
- 허용: YYYY.MM.DD / 제조일로부터 계산 / 보유 기한 범위 / 발송일 기준 기간

[리셀러 판정]
- 위반사항 1개 이상 → 리셀러 O
- 위반사항 0개 → 리셀러 X
- 리셀러 X여도 셀러 정보 수집 진행

[셀러 정보 수집]
- 대형몰(지마켓, 옥션, 11번가, 쿠팡 등) 또는 제3의몰이면 실제 판매자 찾기
- 11번가-슈팅배송은 직접 매입이므로 회사가 셀러
- 쿠팡 판매자면 브랜드샵(본사 직영) 여부 확인
- 정보 없으면 레이틀리에서 전화번호 매칭, 그래도 안되면 관리자 전달

[예외 케이스 - 입력 보류]
- 판매 중지 상품, 개인 판매자(구매해야만 정보 확인 가능)

[P&G 신고 상태 업데이트]
- 매주 금요일, 2주 전 데이터 전수 검사
- blocked(판매중지) / active(판매중) / reactive(재개)`;

  const topicMap = {
    all: '전체',
    violation: '위반사항 확인',
    reseller: '리셀러 판정',
    platform: '플랫폼 신고 프로세스',
    seller: '셀러 정보 수집',
  };
  const typeMap = {
    mix: 'O/X와 4지선다 혼합',
    ox: 'O/X만',
    mc: '4지선다만',
  };

  const prompt = `블랙셀러 가이드 기반 작업자 교육 퀴즈 ${count}개를 만들어주세요.

가이드:
${GUIDE}

조건: 주제=${topicMap[topic] || '전체'}, 유형=${typeMap[type] || 'O/X와 4지선다 혼합'}, 실무에서 헷갈릴 만한 내용으로.

반드시 아래 JSON만 응답(다른 텍스트 없이):
{"quizzes":[{"id":1,"type":"ox","topic":"주제","question":"질문","answer":"O","explanation":"해설"},{"id":2,"type":"mc","topic":"주제","question":"질문","options":["A","B","C","D"],"answer":"A","explanation":"해설"}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const raw = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
