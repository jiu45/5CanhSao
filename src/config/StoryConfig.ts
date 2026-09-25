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
    movementInstruction: string;
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
  cinematicPeriodTitle: "Làng quê Bắc Bộ — Một mùa trăng cuối thế kỷ 20...",
  openingSubtitles: [
    "Thời gian chầm chậm quay ngược qua từng vòng tích tắc...",
    "Về một mùa trăng rằm cuối thế kỷ 20 đơn sơ mà đẹp đến lạ thường,",
    "Nơi ánh trăng và ngọn nến là thứ soi sáng cả bầu trời tuổi thơ."
  ],
  craftingSubtitles: {
    step0: "Trên chiếc chiếu cói bên vệt trăng xiên, 10 thanh nan tre, cuộn kẽm và bát hồ dán cơm nguội đã sẵn sàng...",
    step1: "Uốn ghép 10 thanh nan tre thành khung ngôi sao năm cánh kép thật đều và khéo léo...",
    step2: "Cột chặt các đầu cánh bằng dây kẽm mảnh, nẹp vòng tre tròn giữ căng bụng đèn...",
    step3: "Dán từng mảnh giấy kiếng đỏ cam viền vàng, bọc kín lớp áo trong suốt đón ánh trăng...",
    completed: "Ngọn nến bên trong tự động bừng sáng! Ánh lửa vàng cam hắt bóng ngôi sao lên khắp vách tường đất."
  },
  doorRevealSubtitles: [
    "Cầm chiếc đèn ông sao ấm áp, đẩy nhẹ cánh cửa gỗ bước ra sân đình...",
    "Ngoài kia, cả làng quê đang rộn rã tiếng cười đùa và tiếng trống ếch rước đèn."
  ],
  villageWalk: {
    arrivalHint: "Lễ hội đang ở ngay phía trước rồi, nhanh nhanh tới đó nào!",
    movementInstruction: "Nhấn hoặc giữ [S] / [W] (hoặc chạm giữ màn hình) để cất bước chạy tới đêm hội...",
    candleWarning: "Gió thu đang thổi nhè nhẹ, chớ chạy quá vội kẻo nến chao nghiêng nhé...",
    windGustWarning: "Gió thu thổi ào qua rặng tre! Giữ [Space] hoặc chạm [Che nến] để bảo vệ ngọn lửa!",
    vignetteFamily: "Bên hiên nhà, chén trà sen thơm ngát và đĩa bánh dẻo còn nguyên vẹn dưới ánh trăng...",
    vignetteKids: "Kìa, lũ trẻ xóm trên đang reo hò rước đèn cá chép chạy vụt tới sân đình kìa!",
    vignetteFeast: "Mâm cỗ trông trăng đủ đầy quả ngọt, tiếng trống ếch giòn tan giục giã từng nhịp bước...",
    vignetteTempleGate: "Cổng đình làng đã hiện ra rực rỡ cờ hoa! Tiếng trống lân rộn rã đón chào..."
  },
  festivalSquare: {
    revealGateEntry: "Đến trước sân đình rợp cờ hoa, ánh trăng vằng vặc soi sáng sân gạch thênh thang và tiếng trống lân rộn rã...",
    revealCrowdGathering: "Lũ trẻ quây quần thành vòng tròn hò reo, từng chiếc đèn ông sao, đèn lon sữa bò lấp lánh như ngàn vì tinh tú.",
    revealLionPeeking: "Phía sau đám đông, nhịp trống dồn dập vút lên... Thoáng thấy đầu lân đỏ rực chớp mắt tung bờm!",
    revealLionFullDance: "Chiếc đèn ông sao của bạn tỏa sáng ấm áp nhất giữa vòng tay bè bạn, ngắm con lân múa lượn rực rỡ...",
    actionJoinPerformance: "Chăm chú dõi theo từng nhịp múa lân 🦁",
    transitionToLion: "Khoảnh khắc ánh mắt chạm nhau... Choáng váng trong giây lát, linh hồn như hòa vào nhịp đập rạo rực của đầu lân!",
    lionPovIntro: "Mở mắt ra giữa tiếng reo hò rộn rã! Hãy vung đầu lân theo từng nhịp trống giòn tan...",
    gesturePrompt1: "Điệu 1: Lắc đầu sang phải — Vẫy bờm nghênh đón bạn bè",
    gesturePrompt2: "Điệu 2: Nghiêng đầu sang trái — Chớp mắt đùa vui dưới trăng",
    gesturePrompt3: "Điệu 3: Chồm lân vút lên — Tung bay rực rỡ chúc phúc đêm rằm",
    transitionToSpectator: "Tiếng reo hò vỡ òa... Con lân cúi đầu chào, bạn nhẹ nhàng bừng tỉnh bên vầng sáng quen thuộc.",
    spectatorPayoff: "Chiếc đèn ông sao trên tay bạn vẫn ấm áp lung linh, rực rỡ nhất giữa vòng tay bè bạn đêm rằm.",
    actionCompleteIterationB: "Hoàn thành điệu múa lân 🦁",
    actionStartMemoryAscent: "Hòa vào vầng trăng ký ức 🌕",
    ascentStage1: "Bạn đứng giữa vòng tay bè bạn, ngắm nhìn con lân cúi đầu tạ ơn dưới ánh trăng.",
    ascentStage1Lantern: "Chiếc đèn ông sao bạn tự tay làm... giờ đã là một phần ấm áp của cả đêm hội.",
    ascentStage2Village: "Tiếng trống lân rộn rã, tiếng cười bạn bè... dần dần hòa vào từng ngọn gió đêm quê nhà.",
    ascentStage3Constellation: "Lễ hội từng lớn lao biết bao trong mắt đứa trẻ... giờ chỉ còn là một đốm sáng nhỏ bé, ấm áp giữa đất trời bao la.",
    ascentStage4Moon: "Vầng trăng năm ấy vẫn sáng vẹn nguyên như thế. Ký ức tuổi thơ... chưa bao giờ phai nhạt."
  },
  modernArrival: {
    moonTransition1: "Nhiều năm tháng đã trôi qua... Dưới cùng một vầng trăng...",
    lanternEvolve: "Chiếc đèn năm xưa vẫn ở đây, thắp sáng theo một cách mới lung linh hơn.",
    parkDescent: "Bầu trời mở rộng... Những con đường rực rỡ sắc màu của thời hiện đại dần hiện ra.",
    elevatedViewpoint: "Đứng từ triền đồi công viên lộng gió, ngắm nhìn tác phẩm Mặt Trăng lung linh giữa bóng đêm tĩnh lặng...",
    soundCueArrival: "Bỗng từ phía bên kia triền đồi, tiếng trống lân rộn rã và tiếng cười hò reo vọng lại...",
    actionTurnToFestival: "Hướng về phía đêm hội rực rỡ 🏮",
    festivalVistaReveal: "Quay sang phía tiếng nhạc... Tháp Đèn Kéo Quân khổng lồ xoay chuyển rực rỡ giữa lòng đại quảng trường!",
    festivalVistaAnticipation: "Bóng lân rước đèn xoay vần lung linh, tiếng trống hội giục giã... Đêm hội Trung Thu rực rỡ đang chờ đón.",
    actionEnterPark: "Khám phá đại quảng trường 🏮",
    pivotToGrandSquare: "Từ phía bên kia triền đồi, tiếng nhạc rộn rã và ánh sáng đêm hội bừng lên gọi mời...",
    approachingFestival: "Cùng bước xuống đại lộ công viên... Lễ hội đang ngày một gần hơn.",
    midApproach: "Dọc theo con đường rực rỡ, dòng người nô nức cùng những chiếc đèn lung linh hướng về cổng hội.",
    nearFestivalHandoff: "Đêm hội đã ở ngay trước mắt... Ánh sáng rực rỡ và tiếng trống lân đón chào.",
    actionEnterFestival: "Bước vào đêm hội 🏮"
  },
  finalLetter: "Dù Trung Thu này hai đứa mình ở cách xa nhau, nhưng ngọn nến trong chiếc đèn ông sao này sẽ luôn sưởi ấm và soi sáng dẫn lối cho chúng mình cùng nhau."
};
