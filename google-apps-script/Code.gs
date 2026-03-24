/**
 * 최초 1회 실행: 시트 구조 초기화 + 문항 데이터 입력
 * Apps Script 편집기에서 setupSheet() 선택 후 ▶ 실행
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // "문항" 시트
  var qSheet = ss.getSheetByName('문항') || ss.insertSheet('문항');
  qSheet.clear();

  var headers = ['문항ID','파트번호','문항유형','문항텍스트','선택지','필수여부','placeholder','파트제목','파트안내문구','단위'];
  qSheet.appendRow(headers);

  var questions = [
    ['Q1',1,'radio','가장 최근 중대한 전략적 의사결정을 내리실 때, 사내 임원진이나 실무자들과 모든 정보를 투명하게 상의하기 어려웠던 경험이 있으십니까?','매우 자주 있다,가끔 있다,거의 없다,전혀 없다','Y','','리더의 고독 및 기존 대안 검증','',''],
    ['Q2',1,'text','위 문항에서 상의가 어려웠다면, 주로 어떤 외부 채널을 통해 조언을 구하셨습니까?','','Y','예: 외부 컨설팅, 동종업계 지인 모임 등','','',''],
    ['Q3',1,'radio','위에서 언급하신 외부 조언이나 프리미엄 네트워킹을 얻기 위해 연간 회사 차원(법인카드 등)에서 지출하는 비용은 대략 어느 정도입니까?','100만 원 미만,100만 원~300만 원,300만 원~500만 원,500만 원 이상','Y','','','',''],
    ['Q4',2,'radio','최근 3개월 내에 범용 생성형 AI(ChatGPT, Claude 등)를 업무에 활용해 보신 적이 있습니까?','매일 사용한다,주 1~2회 사용한다,한두 번 시도해 보았다,사용해 본 적 없다','Y','','AI 사용 경험 및 보안 리스크 검증','',''],
    ['Q5',2,'radio','기존 AI 서비스를 사용하실 때, 회사의 민감한 재무 데이터나 전략 기밀이 서버에 저장되거나 유출될 것이 우려되어 데이터 입력을 포기하신 경험이 있습니까?','여러 번 있다,한두 번 있다,없다','Y','','','',''],
    ['Q6',2,'radio','기존 AI의 답변이 너무 길고 장황하여, 바쁜 업무 중 즉각적인 의사결정에 오히려 방해가 된다고 느끼신 적이 있습니까?','매우 동의한다,약간 동의한다,동의하지 않는다','Y','','','',''],
    ['Q7',3,'number','이 서비스가 \'너무 비싸서\' 구매를 전혀 고려하지 않을 월 구독료는 얼마입니까?','','Y','예: 100','지불 의사 및 가격 민감도','다음은 \'입력 즉시 데이터가 완벽히 파기되는(Zero-Retention) 임원 전용 맞춤형 AI 섀도우 캐비닛(Shadow Cabinet)\' 서비스의 구독료에 대한 질문입니다. 법인카드 결제 기준, 적절하다고 생각하시는 월 구독료를 숫자로 적어주세요.','만 원'],
    ['Q8',3,'number','\'비싸다\'고 생각하지만, 여전히 구매를 고려해 볼 만한 월 구독료는 얼마입니까?','','Y','예: 50','','','만 원'],
    ['Q9',3,'number','비용 대비 가치가 뛰어나 \'가성비가 매우 좋다(Bargain)\'고 느껴지는 월 구독료는 얼마입니까?','','Y','예: 20','','','만 원'],
    ['Q10',3,'number','너무 저렴해서 서비스의 수준이나 \'데이터 보안의 신뢰성이 의심되는\' 월 구독료는 얼마입니까?','','Y','예: 5','','','만 원'],
    ['Q11',4,'email','본 설문 결과에 기반하여, 대화 내용이 100% 저장되지 않는 리더 전용 프라이빗 AI의 클로즈드 베타 버전이 출시될 예정입니다. 가장 먼저 초대장(Invite)과 본 벤치마크 조사 결과 리포트를 받아보시겠습니까? 참여를 원하시면 명함상의 이메일 주소를 남겨주세요.','','N','','확약(Commitment) 도출','',''],
  ];

  questions.forEach(function(row) { qSheet.appendRow(row); });

  // 헤더 서식
  var headerRange = qSheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#D4AF37');
  headerRange.setFontColor('#000000');
  qSheet.setFrozenRows(1);

  // 컬럼 너비
  qSheet.setColumnWidth(1, 70);   // 문항ID
  qSheet.setColumnWidth(2, 70);   // 파트번호
  qSheet.setColumnWidth(3, 80);   // 문항유형
  qSheet.setColumnWidth(4, 500);  // 문항텍스트
  qSheet.setColumnWidth(5, 350);  // 선택지
  qSheet.setColumnWidth(6, 70);   // 필수여부
  qSheet.setColumnWidth(7, 250);  // placeholder
  qSheet.setColumnWidth(8, 250);  // 파트제목
  qSheet.setColumnWidth(9, 400);  // 파트안내문구
  qSheet.setColumnWidth(10, 80);  // 단위

  // "응답" 시트
  var rSheet = ss.getSheetByName('응답') || ss.insertSheet('응답');
  rSheet.clear();

  // 기본 Sheet1 삭제 시도
  try {
    var sheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
    if (sheet1) ss.deleteSheet(sheet1);
  } catch(e) {}

  SpreadsheetApp.getUi().alert('설정 완료! "문항" 시트에 11개 문항이 입력되었습니다.');
}

/**
 * MasterMind Survey — Google Apps Script
 *
 * 시트 구조:
 *   "문항" 시트: 설문 문항 데이터 (관리자가 직접 편집)
 *   "응답" 시트: 설문 응답 데이터 (자동 기록)
 *
 * 배포: 웹 앱 → "누구나 액세스 가능"
 */

// GET: 문항 데이터 반환
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('문항');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var questions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue; // 빈 행 무시
    var q = {};
    for (var j = 0; j < headers.length; j++) {
      q[headers[j]] = row[j];
    }
    questions.push(q);
  }

  var output = ContentService.createTextOutput(JSON.stringify(questions));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// POST: 응답 데이터 저장
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('응답');
    var data = JSON.parse(e.postData.contents);

    // 첫 행이 없으면 헤더 생성
    if (sheet.getLastRow() === 0) {
      var headers = ['타임스탬프'];
      var keys = Object.keys(data);
      keys.sort();
      headers = headers.concat(keys);
      sheet.appendRow(headers);
    }

    // 기존 헤더 읽기
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [new Date()];

    for (var i = 1; i < existingHeaders.length; i++) {
      var key = existingHeaders[i];
      row.push(data[key] !== undefined ? data[key] : '');
    }

    // 새 문항이 추가된 경우 헤더 확장
    var dataKeys = Object.keys(data);
    for (var k = 0; k < dataKeys.length; k++) {
      if (existingHeaders.indexOf(dataKeys[k]) === -1) {
        existingHeaders.push(dataKeys[k]);
        sheet.getRange(1, existingHeaders.length).setValue(dataKeys[k]);
        row.push(data[dataKeys[k]]);
      }
    }

    sheet.appendRow(row);

    var output = ContentService.createTextOutput(JSON.stringify({ success: true }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (err) {
    var output = ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}
