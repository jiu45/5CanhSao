# Final continuity & audio polish — 30/09/2026

## Kết luận

**READY** cho lượt chơi thử cuối trên thiết bị sẽ dùng để tặng. Dedication đã gọn thành một nhịp mở màn riêng tư; hình đèn người nhận giữ đúng kiểu đã chọn trong cảnh múa lân, cảnh bay khỏi sân đình và cảnh kết. Bài kiểm tra liên tục với đèn cá chép đi từ mở game đến trạng thái kết thúc Phase 7; bài kiểm tra hai cửa sổ đi từ Phase 5 qua chia đường, hai câu đố ảnh, đoàn tụ và cổng cuối. Các ảnh chụp được xem lại bằng mắt, không chỉ dựa vào build.

## 1–2. Dedication và trạng thái tab

- Bỏ trang sách, lời dẫn dài và nút xác nhận. Nền đêm xanh rất tối cho `Dành tặng`, tiếp đến `maiixinh`; tự mờ đi để mở cảnh trăng. Tổng nhịp khoảng 6,35 giây **khi tab được nhìn thấy và có focus**.
- Tab mở trong nền không tiêu hao thời gian dedication. Nếu rời tab giữa đoạn mở đầu, nhịp hình và dấu âm khởi động lại khi quay về, để người nhận không bỏ lỡ tên mình.
- Chạm sớm lên màn dedication mở quyền âm thanh nếu trình duyệt cần tương tác; nó không bỏ qua chữ hoặc tự chuyển cảnh.
- Kiểm tra trình duyệt có cửa sổ: giữ tab nền hơn 8 giây, quay lại, rời tab giữa chừng rồi quay lại. Kiểm tra thêm ảnh màn 390×844 và 1280×720. Không có lỗi JavaScript.

## 3–5. Âm thanh và cảnh trăng mở đầu

- Dấu âm dedication là bốn nốt ngắn theo đường nét motif ký ức sẵn có. Nó chỉ được lên lịch khi AudioContext thật sự chạy; một lời hứa mở âm thanh đến muộn không thể phát lại dấu âm sau khi dedication đã hết.
- Cảnh trăng bắt đầu gió xa và dế nhẹ **trước** khi bấm `Tua ngược thời gian`. Khi tua ngược, lớp không khí này tiếp tục thay vì bị khởi động lại ở giữa cú máy.
- Nhạc đọc thư dùng câu nhạc thưa đã có của `FestivalScore` và hai âm nền thấp, ngân chậm. Nút tạm dừng hạ cả câu nhạc và lớp âm nền. Không có giai điệu dày lặp liên tục dưới chữ.
- Sau chữ cuối, sáu dấu pháo hoa được căn với sáu đốm sáng của `FinaleSky`, âm lượng nhẹ hơn bản thử. Khi camera chuyển lên trăng, nhạc lễ hội lùi lại và motif bốn nốt trở về. Lớp gió hậu thư dừng lúc end card khép cảnh.
- Mở `Đọc lại lời chúc` phát lại nền thư nhẹ; khép thư dừng lớp đó và cho motif cuối đáp lại một lần.

**Nguồn và quyền sử dụng:** Các dấu âm mới là Web Audio tạo trong game, không tải thêm bản ghi. Ba bản nhạc nền có sẵn và giấy phép của chúng vẫn được ghi trong [MUSIC_CREDITS.md](MUSIC_CREDITS.md); không thêm bài hát thương mại hoặc asset lấy không rõ nguồn.

## 6–7. Chiếc đèn của người nhận ở Phase 3 và câu chữ

- `TextureGenerator.createPlayerChildWithLanternTexture(style)` nhận cùng `LanternStyle` đã lưu ở cảnh làm đèn. Góc nhìn từ đầu lân và nhân vật dưới sân đình khi camera bay lên đều gọi hàm này bằng lựa chọn của người nhận.
- Cá chép, bươm bướm, thỏ sử dụng cùng đường nét giấy và nan tre từ `LanternSilhouetteArt`; giảm **lõi trắng của riêng proxy ba kiểu này** sau khi kiểm tra ảnh cho thấy bướm và thỏ bị cháy chi tiết. Giữ nguyên nhánh vẽ đèn ông sao truyền thống và ánh sáng gốc của nó. Đèn sao của đám đông và của người đồng hành không thay đổi.
- Phụ đề đoạn bay lên đã nói `Chiếc đèn bạn tự tay làm...`, phù hợp cả bốn kiểu đèn.

## 8. Thư và đoạn kết

Trong lượt chơi thực, lời chúc bắt đầu khi hai đèn đứng cạnh nhau ở trung tâm quảng trường; dừng đọc giữ nguyên câu và thời gian cảnh. Mốc cuối thực của thư ở khoảng 148 giây trong Phase 7, sau đó mới giải phóng ánh sáng và hiện end card. Kiểm tra riêng phần đuôi xác nhận end card với **cá chép của người nhận cạnh ngôi sao của người đồng hành**, nút đọc lại, âm nền dừng và nhạc đọc lại khởi động khi mở thư.

## 9. Tệp thay đổi

- `src/ui/DedicationPage.ts`, `src/style.css`: nhịp mở đầu và giao diện.
- `src/audio/AudioManager.ts`, `src/scenes/TimeTravelScene.ts`, `src/scenes/GrandFestivalScene.ts`: âm mở đầu, trăng, thư, pháo hoa và kết.
- `src/utils/TextureGenerator.ts`, `src/scenes/FestivalSquareScene.ts`: continuity đèn Phase 3.
- `src/config/StoryConfig.ts`: câu phụ đề trung tính với mọi kiểu đèn.
- Báo cáo này. Không đổi cấu hình gốc của renderer/composer, Supabase hay state machine multiplayer.

## 10–12. Kiểm tra trình duyệt, kiểu đèn và multiplayer

- `npm run build`: thành công. `git diff --check`: không có lỗi whitespace. Vite vẫn báo cảnh báo kích thước bundle trên 500 kB; cảnh báo này đã tồn tại ngoài phạm vi polish hiện tại.
- Lượt chơi cá chép từ dedication → tua trăng → làm đèn → đường tre → múa lân → bay khỏi đình → hiện tại → Phase 5 → Phase 6 → Phase 7 → thư → trạng thái end card. Không có `pageerror`. Ảnh chụp: `test-artifacts/final-polish-full-journey/`.
- Kiểm tra riêng bốn kiểu sao/cá/bướm/thỏ tại góc nhìn từ đầu lân và đoạn bay lên, sau một vòng sửa chỗ ánh sáng che mất hình: `test-artifacts/final-polish-review/`. Lượt chơi liên tục dùng **cá chép** được chọn bằng giao diện làm đèn, không gán kiểu trực tiếp ở giữa game.
- Hai cửa sổ ghép đôi ở Phase 5: người nhận là `StarLantern(style=carp)`, người đồng hành là `ModernStarLantern`; cả hai cùng bật LED, qua lối chung, chia hai nhánh, giải hai ảnh kỷ niệm, đoàn tụ và vào Phase 7. Không chỉnh logic mạng. Kiểm tra đuôi Phase 7 và đọc lại bằng browser riêng: `test-artifacts/final-polish-letter/`.
- Kiểm tra lại ánh sáng cảnh làm đèn và đường tre sau sửa Phase 3. Ảnh của hai cảnh giữ chất giấy cắt, ánh đèn và trăng như trước.

## 13. Giới hạn còn biết

- Chính sách autoplay của một số trình duyệt có thể giữ AudioContext ở trạng thái tạm ngưng cho tới tương tác đầu tiên. Dedication vẫn chạy đúng hình ảnh, và dấu âm **không phát muộn sai cảnh**. Chạm sớm vào dedication sẽ mở âm thanh; nếu người chơi không chạm và trình duyệt chặn autoplay, tiếng đầu tiên có thể tới ở nút tua ngược. Không thể đảm bảo âm thanh tự phát trên mọi trình duyệt chỉ bằng mã web.
- Âm lượng cảm nhận còn phụ thuộc điện thoại/tai nghe của người nhận. Trước khi gửi quà, nên nghe một lượt trên chính thiết bị đó, đặc biệt là mức rất nhỏ của bốn nốt mở đầu và nhạc nền đọc thư.

## 14. Khuyến nghị

**READY** cho bản chơi thử cá nhân. Một lượt nghe trên thiết bị của người nhận là bước duyệt cảm xúc cuối, không phải lỗi kỹ thuật đang chặn game.
