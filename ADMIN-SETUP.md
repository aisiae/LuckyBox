# Firebase 관리자 통계 설정

## 연결 순서

1. Firebase Console에서 프로젝트를 선택하고 Firestore의 `(default)` 데이터베이스를 준비합니다.
2. 프로젝트 설정 → 서비스 계정에서 서버용 비공개 키를 준비합니다. Firestore 읽기·쓰기 IAM 권한이 필요합니다. 키 파일은 GitHub나 대화에 올리지 마세요.
3. Vercel의 lucky-box → Settings → Environment Variables에서 Production 환경에 등록합니다.
   - ADMIN_USERNAME: 관리자 아이디. 생략하면 admin.
   - ADMIN_PASSWORD: 최소 16자의 고유한 긴 비밀번호.
   - FIREBASE_PROJECT_ID: 서비스 계정 JSON의 project_id.
   - FIREBASE_CLIENT_EMAIL: JSON의 client_email.
   - FIREBASE_PRIVATE_KEY: JSON의 private_key. 실제 줄바꿈이나 리터럴 \n 모두 지원합니다.
4. firestore.rules의 통계 컬렉션 차단 규칙을 Firebase에 적용합니다. 기존 프로젝트라면 다른 서비스 규칙을 덮어쓰지 말고 병합하세요. 전역 허용 규칙과 겹치면 접근이 열릴 수 있습니다. Admin SDK는 서버 IAM 권한으로 접근합니다.
5. TTL 정책에서 컬렉션 그룹 visitors의 expiresAt 필드를 활성화하세요. 임의 식별 기록은 해당 날짜의 한국 시간 자정에서 2일 뒤 삭제 대상이 되며 실제 삭제는 비동기입니다. TTL이 없으면 기록이 남습니다. 기존 visitors 컬렉션이 있다면 영향 범위를 확인하세요. 일별·누적 집계에는 TTL을 적용하지 않습니다.
6. 재배포 후 /admin 로그인 → 홈페이지와 게임 방문 → 통계 새로고침으로 확인합니다. Preview에는 운영용 키를 등록하지 않거나 별도 Firebase 프로젝트를 사용하세요.

Upstash는 더 이상 필요하지 않습니다. Firebase 웹용 apiKey만으로는 연결할 수 없습니다. Firebase Authentication 로그인으로 바꾼 것은 아니며 기존 서버 로그인을 유지합니다.

## 데이터와 관리자 화면

일별 기록은 luckyboxDaily/YYYY-MM-DD에, 누적 기록은 luckyboxStats/totals에 저장합니다. 당일 중복 확인 기록은 일별 문서의 visitors 하위 컬렉션에 저장합니다. 집계는 트랜잭션으로 함께 반영합니다. 일별·전체 집계는 자동 만료 없이 보관합니다.

일별 방문자는 당일 브라우저 중복을 제외합니다. 누적 visitorDays는 일별 방문자 수의 합계로, 여러 날 방문한 같은 사람도 날짜마다 포함됩니다. 전체 기간의 중복 없는 사람 수는 아닙니다. 같은 페이지를 3초 안에 반복 호출한 조회는 제외합니다. 참가자 이름과 원본 IP를 저장하지 않습니다. 추적 거부 설정을 존중하며 자동 방문을 완벽하게 제외하지는 않습니다.

/admin은 일반 화면에 링크를 두지 않고 서버 HTTP Basic 인증으로 보호합니다. HTTPS에서 사용하고 공용 컴퓨터에서는 시크릿 창을 닫아 로그인 정보를 정리하세요. 비밀번호가 없거나 짧으면 접근이 차단됩니다.

화면은 최근 31일 기록과 누적값을 표시합니다. 오래된 일별 기록도 Firestore에 남습니다. 평균은 시작 다음 날부터 어제까지 완료된 날짜를 대상으로 계산하며 방문이 없는 날도 포함합니다. 광고 수익은 직접 입력한 RPM·환율·운영비에 따른 가정입니다.

설정 전에는 집계가 비활성화됩니다. 저장소 오류는 방문자 0명으로 표시하지 않습니다. 연결 이전 방문은 복원할 수 없습니다. 현재 Upstash 운영 데이터가 없어 데이터 이전은 진행하지 않았습니다.

## 비용과 로컬 확인

방문 집계마다 문서 읽기·쓰기가 발생하고 관리자 새로고침마다 날짜별 문서를 읽습니다. Firebase와 Vercel의 사용량을 확인하세요. TTL 삭제의 비용과 이용 조건도 확인하세요. 트래픽이 많아 누적 문서에 경합이 생기면 분산 카운터로 확장할 수 있습니다.

npm ci로 설치한 다음 .env.example을 참고해 비공개 .env를 만들고 node --env-file=.env server.mjs를 실행합니다. 테스트용 Firebase 프로젝트를 권장합니다. 자동 검증은 npm run check와 npm test입니다.

공식 문서: [서버 SDK](https://firebase.google.com/docs/admin/setup), [트랜잭션](https://firebase.google.com/docs/firestore/manage-data/transactions), [TTL](https://firebase.google.com/docs/firestore/ttl).
