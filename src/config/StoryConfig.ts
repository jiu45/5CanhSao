export interface StoryConfigType {
  playerA: string;
  playerB: string;
  yearPast: string;
  locationPast: string;
  cinematicPeriodTitle: string;
  openingSubtitles: string[];
  craftingSubtitles: {
    step0: string;
    step1: string;
    step2: string;
    step3: string;
    completed: string;
  };
  doorRevealSubtitles: string[];
  villageWalk: {
    arrivalHint: string;
    candleWarning: string;
    windGustWarning: string;
    vignetteFamily: string;
    vignetteKids: string;
    vignetteFeast: string;
    vignetteTempleGate: string;
  };
  festivalSquare: {
    revealGateEntry: string;
    revealCrowdGathering: string;
    revealLionPeeking: string;
    revealLionFullDance: string;
    actionJoinPerformance: string;
    transitionToLion: string;
    lionPovIntro: string;
    gesturePrompt1: string;
    gesturePrompt2: string;
    gesturePrompt3: string;
    transitionToSpectator: string;
    spectatorPayoff: string;
    actionCompleteIterationB: string;
    actionStartMemoryAscent: string;
    ascentStage1: string;
    ascentStage1Lantern: string;
    ascentStage2Village: string;
    ascentStage3Constellation: string;
    ascentStage4Moon: string;
  };
  modernArrival: {
    moonTransition1: string;
    lanternEvolve: string;
    parkDescent: string;
    elevatedViewpoint: string;
    soundCueArrival: string;
    actionTurnToFestival: string;
    festivalVistaReveal: string;
    festivalVistaAnticipation: string;
    actionEnterPark: string;
    pivotToGrandSquare: string;
    approachingFestival: string;
    midApproach: string;
    nearFestivalHandoff: string;
    actionEnterFestival: string;
  };
  finalLetter: string;
}

export const StoryConfig: StoryConfigType = {
  playerA: "Anh",
  playerB: "Em",
  yearPast: "Cuối Thế Kỷ 20",
  locationPast: "Làng Quê Bắc Bộ",
  cinematicPeriodTitle: "Một vầng trăng mở lối về miền ký ức...",
  openingSubtitles: [
    "Vẫn là vầng trăng ấy, dù bao mùa đã đi qua...",
    "Nghe không? Tiếng trống ếch đang vọng về từ một con ngõ cũ.",
    "Một chiếc đèn nhỏ đã chờ ai đó thắp sáng đêm rằm."
  ],
  craftingSubtitles: {
    step0: "Trên chiếc chiếu cói, chiếc đèn đầu tiên bắt đầu từ vài thanh nan tre.",
    step1: "Những thanh nan tre khép lại thành khung sao năm cánh.",
    step2: "Giấy kiếng đỏ cam phủ lên khung tre. Vệt trăng xuyên qua lớp giấy mỏng...",
    step3: "Dây kẽm giữ chặt khung tre; cán đèn đã sẵn sàng để mang ra ngoài.",
    completed: "Từ vài thanh nan tre, bạn đã có một ngọn đèn để mang ra đêm hội."
  },
  doorRevealSubtitles: [
    "Cầm chiếc đèn mình vừa làm, đẩy nhẹ cánh cửa gỗ bước ra con ngõ làng...",
    "Ngoài kia, cả làng quê đang rộn rã tiếng cười đùa và tiếng trống ếch rước đèn."
  ],
  villageWalk: {
    arrivalHint: "Tiếng trống hội vọng đến từ cuối con đường tre. Cứ theo ánh đèn mà bước.",
    candleWarning: "Gió thu đang thổi nhè nhẹ, chớ chạy quá vội kẻo nến chao nghiêng nhé...",
    windGustWarning: "Gió thốc qua rặng tre. Ánh nến chao nghiêng trong tay bạn!",
    vignetteFamily: "Bên hiên nhà, hơi trà sen quyện trong tiếng chuyện trò.",
    vignetteKids: "Đám trẻ chạy ngang với đèn cá chép; tiếng cười lẫn trong tiếng trống.",
    vignetteFeast: "Một mâm cỗ trông trăng chờ cả nhà bên đường làng.",
    vignetteTempleGate: "Cổng đình đã hiện ra. Tiếng trống lân mỗi lúc một gần."
  },
  festivalSquare: {
    revealGateEntry: "Qua cổng đình, sân gạch mở ra dưới trăng.",
    revealCrowdGathering: "Đèn ông sao và đèn lon sữa bò nhấp nhô trên đầu lũ trẻ.",
    revealLionPeeking: "Từ sau vòng người, chiếc đầu lân đỏ chợt ló ra.",
    revealLionFullDance: "Con lân nhào qua nhịp trống. Ánh đèn bạn hòa vào vòng sáng dưới sân đình.",
    actionJoinPerformance: "Chăm chú dõi theo từng nhịp múa lân 🦁",
    transitionToLion: "Tiếng trống đưa ký ức đến thật gần... thử hòa mình vào một nhịp múa lân nào!",
    lionPovIntro: "Mở mắt ra giữa tiếng reo hò rộn rã! Hãy vung đầu lân theo từng nhịp trống giòn tan...",
    gesturePrompt1: "Điệu 1: Lắc đầu sang phải — Vẫy bờm nghênh đón bạn bè",
    gesturePrompt2: "Điệu 2: Nghiêng đầu sang trái — Chớp mắt đùa vui dưới trăng",
    gesturePrompt3: "Điệu 3: Chồm lân vút lên — Tung bay rực rỡ chúc phúc đêm rằm",
    transitionToSpectator: "Tiếng reo hò vỡ òa... Con lân cúi đầu chào, bạn nhẹ nhàng bừng tỉnh bên vầng sáng quen thuộc.",
    spectatorPayoff: "Ngọn nến trong tay bạn vẫn ấm giữa sân đình.",
    actionCompleteIterationB: "Hoàn thành điệu múa lân 🦁",
    actionStartMemoryAscent: "Hòa vào vầng trăng ký ức 🌕",
    ascentStage1: "Tiếng trống vẫn rung dưới chân bạn.",
    ascentStage1Lantern: "Chiếc đèn bạn tự tay làm hòa vào đoàn đèn dưới sân đình.",
    ascentStage2Village: "Mái đình và những tiếng cười lùi dần trong gió.",
    ascentStage3Constellation: "Từ trên cao, đêm hội chỉ còn là những chấm sáng nhỏ.",
    ascentStage4Moon: "Ngọn đèn dưới sân đình nhỏ dần; vầng trăng lớn lên trước mắt bạn."
  },
  modernArrival: {
    moonTransition1: "Nhiều năm trôi qua. Vầng trăng vẫn ở đó.",
    lanternEvolve: "Trên lối đá, một ánh đèn mới đang sáng lên.",
    parkDescent: "Triền cỏ, lối đá và những ngọn đèn điện dần hiện ra dưới chân bạn.",
    elevatedViewpoint: "Trên triền đồi, tác phẩm Mặt Trăng sáng giữa công viên vắng.",
    soundCueArrival: "Từ bên kia đồi, một nhịp trống lân vọng tới.",
    actionTurnToFestival: "Hướng về phía đêm hội rực rỡ 🏮",
    festivalVistaReveal: "Tháp Đèn Kéo Quân xoay chậm giữa khu hội ngoài.",
    festivalVistaAnticipation: "Những hình lân quay theo ánh đèn. Tiếng hội đã gần hơn.",
    actionEnterPark: "Theo lối đèn vào khu hội 🏮",
    pivotToGrandSquare: "Nhịp trống dẫn bạn về phía những dải đèn trên cao.",
    approachingFestival: "Con đường lát đá dẫn xuống khu hội.",
    midApproach: "Người và đèn cùng đổ về cổng hội.",
    nearFestivalHandoff: "Dưới vòm cổng, ánh đèn rước hội đã ở rất gần.",
    actionEnterFestival: "Bước vào đêm hội 🏮"
  },
  finalLetter: "Dù Trung Thu này hai đứa mình ở cách xa nhau, nhưng ngọn nến trong chiếc đèn này sẽ luôn sưởi ấm và soi sáng dẫn lối cho chúng mình cùng nhau."
};
