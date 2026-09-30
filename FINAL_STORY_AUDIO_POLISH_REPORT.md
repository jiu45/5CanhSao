# Báo cáo polish cuối: lời kể, trang đề tặng và âm thanh mở đầu

Ngày kiểm tra: 01/10/2026

## 1. Trang đề tặng

- Giữ đúng một dòng **“Dành tặng maiixinh”**. “maiixinh” cùng cỡ chữ với phần còn lại, dùng màu vàng san hô và nét nghiêng nhẹ.
- Thêm tranh SVG tự dựng theo lối cắt giấy: trăng, dãy đèn treo, thân tre và ba lớp nền đêm. Bản dọc điện thoại có bố cục SVG riêng để hai đèn treo không bị cắt khỏi khung hình.
- Tranh và chữ cùng hiện sau khoảng chờ mở đầu. Cơ chế dừng/khởi động lại khi tab mất focus được giữ nguyên. Không thêm asset ngoài, phụ thuộc mới hay thay đổi logic cảnh.
- Đã chụp và xem lại khung 1280×720 và 390×844. Dòng chữ nằm gọn trên một hàng ở cả hai kích thước; trăng và đèn là nền, không che chữ.

## 2. Âm thanh Scene 0 và phần quá khứ

**Nguyên nhân tiếng “tạch/leng keng”:** `startNightAmbience()` trước đây phát oscillator 4.600 Hz thành cụm mỗi 120 ms. Xung âm có đầu rất sắc, lặp suốt khi ambience còn sống. Soundscape này khởi động ở màn trăng, tiếp tục qua tua ngược và làm đèn, được khởi động lại ở đường làng, rồi dừng khi vào sân đình Phase 3. Vì vậy cảm nhận “nó theo gần hết phần quá khứ” là đúng.

**Bản thay thế:** bỏ hẳn xung côn trùng tổng hợp đó. Giữ lớp không khí đêm tự tạo bằng nhiễu đã hạ dải cao, âm lượng thấp hơn, dao động rất chậm để có cảm giác gió qua lá. Bộ đệm được nối đầu/cuối êm để tránh click mỗi vòng lặp; nguồn được fade khi dừng. Không đổi nhạc Huế ở đường làng, nhịp trống hội, nhạc Phase 7 hay các cue tương tác.

Đã xem xét các bản thu [Soft Wind Leaves](https://pixabay.com/sound-effects/nature-soft-wind-leaves-316393/) và [Crickets at Night](https://pixabay.com/sound-effects/nature-crickets-at-night-65883/) cùng [điều khoản Pixabay](https://pixabay.com/service/license-summary/). Ở vị trí này, nền gió nguyên tác êm và không có dải côn trùng chói giúp tránh một vòng thu âm ngắn lặp lộ liễu hoặc âm thanh đồng quê khác bối cảnh. Vì không dùng bản thu ngoài nên không có file âm thanh hay điều khoản phân phối mới.

Giới hạn của trình duyệt: âm thanh có thể đợi thao tác đầu tiên của người chơi để mở AudioContext; cơ chế này đã có trước và không bị thay đổi.

## 3. Đường làng Phase 2

- Cùng một cơn gió, bước chân vội nay làm nến dễ tắt hơn; nếu đi chậm, gió vẫn có thể tắt nến nếu không che. Thao tác che đèn vẫn bảo vệ ngọn lửa.
- Lời hiện khi nến tắt phản ánh đúng tình huống: **“Gió và bước chân quá vội làm nến tắt…”** nếu đang chạy nhanh; **“Cơn gió thổi tắt nến…”** nếu đi chậm. Cả hai đều dẫn thẳng tới hành động che/châm lại nến.
- Dời nhịp đứa trẻ cầm đèn cá chép tới sau đoạn gió. Lời **“Lũ trẻ xóm trên rước đèn cá chép chạy về sân đình. Theo tiếng cười của chúng nào!”** xuất hiện sau khi em bé bắt đầu chạy vào hình; âm thanh reo gọi vẫn đi cùng động tác. Ưu tiên hiển thị lời này để mâm cỗ phía sau không cắt ngang câu.
- Giữ và đưa lên cùng bản phát hành câu người làm game đã sửa: **“Bạn châm lại ngọn nến. Ánh sáng nhỏ trở về trong tay.”** Câu này phù hợp cả bốn dáng đèn.

## 4. Rà soát câu chữ hiển thị Phase 0–7

Đã rà soát `StoryConfig`, lời trực tiếp trong các scene, trang chuyển ký ức, bộ chọn khung, các bước làm đèn, công tắc LED, phần hướng dẫn đi cùng nhau, câu hỏi Người Giữ Trăng và giao diện thư cuối. Những chỗ sửa có tác động tới người chơi:

| Vị trí | Điều chỉnh | Lý do |
|---|---|---|
| Chọn khung đèn | “em muốn…” → “bạn muốn…” | Người kể gọi người chơi là “bạn” trong hồi ức. |
| Bước dán giấy | Bỏ màu đỏ cam/đỏ vàng cố định | Cá chép, bướm, thỏ có màu giấy khác ngôi sao. |
| Bước buộc khung | “Dây kẽm & cán tre” → “Dây kẽm và cán tre” | Cùng chất giọng với các bước còn lại. |
| Rời căn phòng | “chiếc đèn mình vừa làm” → “chiếc đèn bạn vừa làm” | Thống nhất ngôi kể. |
| Công tắc hiện đại | “LED ON/OFF” → “ĐÃ BẬT/ĐÃ TẮT” | Toàn bộ chỉ dẫn giao diện bằng tiếng Việt. |
| Cùng bước Phase 5 | “Mình đi tiếp nhé” → “Cùng bước tiếp nhé”; giản lược chỉ dẫn chuột/W | Tránh đổi ngôi kể, dễ đọc khi chơi. |
| Thẻ ký ức Phase 6 | “bạn mình” → “người đồng hành” | Đúng quan hệ hai nhân vật và tránh mơ hồ. |

Giữ các từ **“anh/em”** ở nơi thể hiện rõ vai hai người; giữ nguyên nguyên văn `src/content/final-wish.txt` vì đó là lời chúc cá nhân do người tặng viết. Tên game “Ký ức đèn ông sao” vẫn là biểu tượng chung; lời về **chiếc đèn của người chơi** đã được kiểm tra để phù hợp bốn dáng đèn. Các câu trong Phase 4–6 dẫn tới *khu hội/tháp đèn*, chỉ Phase 7 mới mở quảng trường cuối.

## 5. Kiểm tra

- `npm run build`: đạt.
- Trình duyệt Chrome chạy bản dev: ảnh trang đề tặng desktop/mobile đã xem trực tiếp; cảnh nến tắt khi đi vội và cảnh đứa trẻ rước đèn cá chép đã chạy, chụp và đối chiếu lời với hình.
- `scripts/smoke_production.js`: đạt sau khi sửa mốc kiểm tra màn kết. Bài smoke cũ kiểm tra ở `messageEnd + 31 s`, sớm hơn lúc end card thật sự mở xong (`messageEnd + 33.1 s`). Mốc mới là `+34 s`; kiểm tra màn đầu, lời chúc sau reload và lớp chắn cuối đều đạt, không có page error.
- Không sửa Supabase, trạng thái multiplayer, đồng bộ tuyến đi, logic cổng, renderer hay post-processing chung. Không thêm package hay asset có bản quyền.

Ảnh QA ở thư mục cục bộ `test-artifacts/final_story_polish/` (thư mục này không được đưa vào build).
