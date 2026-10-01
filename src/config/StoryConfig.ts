export interface StoryConfigType {
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
}

export const StoryConfig: StoryConfigType = {
  cinematicPeriodTitle: "",
  openingSubtitles: [
    "",
    "Nghe như có tiếng trống vọng lại từ một con ngõ cũ...",
    ""
  ],
  craftingSubtitles: {
    step0: "",
    step1: "Nan tre đã thành một ngôi sao.",
    step2: "Giấy kiếng phủ lên khung. Chiếc đèn bắt đầu có màu.",
    step3: "Buộc cho chắc. Chiếc đèn đã có cán cầm.",
    completed: "Sáng rồi."
  },
  doorRevealSubtitles: [
    "Ngoài kia có người đang gọi nhau.",
    "Ngoài ngõ, tiếng cười đã theo tiếng trống về phía sân đình."
  ],
  villageWalk: {
    arrivalHint: "Tiếng trống mỗi lúc một gần.",
    candleWarning: "",
    windGustWarning: "Gió mạnh lên rồi.",
    vignetteFamily: "Bên hiên, tiếng chuyện trò lẫn trong mùi trà nóng.",
    vignetteKids: "Lũ trẻ xóm trên chạy trước rồi. Theo chúng ra sân đình thôi!",
    vignetteFeast: "",
    vignetteTempleGate: ""
  },
  festivalSquare: {
    revealGateEntry: "Tiếng trống ở ngay đây.",
    revealCrowdGathering: "",
    revealLionPeeking: "",
    revealLionFullDance: "",
    actionJoinPerformance: "Thử múa cùng nhịp trống",
    transitionToLion: "",
    lionPovIntro: "",
    gesturePrompt1: "",
    gesturePrompt2: "",
    gesturePrompt3: "",
    transitionToSpectator: "",
    spectatorPayoff: "Ngọn nến vẫn cháy trong tay.",
    actionCompleteIterationB: "",
    actionStartMemoryAscent: "Ngước nhìn trăng",
    ascentStage1: "Tiếng trống còn ở phía dưới.",
    ascentStage1Lantern: "",
    ascentStage2Village: "",
    ascentStage3Constellation: "",
    ascentStage4Moon: ""
  },
  modernArrival: {
    moonTransition1: "Trăng vẫn ở đó.",
    lanternEvolve: "",
    parkDescent: "",
    elevatedViewpoint: "",
    soundCueArrival: "Lại là tiếng trống ấy.",
    actionTurnToFestival: "Quay theo tiếng trống",
    festivalVistaReveal: "",
    festivalVistaAnticipation: "Tiếng hội đã gần.",
    actionEnterPark: "Theo lối đèn",
    pivotToGrandSquare: "",
    approachingFestival: "",
    midApproach: "",
    nearFestivalHandoff: "",
    actionEnterFestival: "Bước vào khu hội"
  }
};
