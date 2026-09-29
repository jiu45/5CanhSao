# Kết quả sửa trải nghiệm sau báo cáo kiểm định

**Ngày:** 29/09/2026. Báo cáo gốc `FINAL_STORY_EXPERIENCE_VALIDATION.md` mô tả bản **trước** các thay đổi dưới đây. Hai comprehension gap số 2 và 3 được giữ theo chủ ý.

## P0

- Phase 5: phím E nay chỉ có một handler cho công tắc LED. Kiểm tra hai tab: OFF → ON → OFF bằng E, gạt cần bằng chuột bật ON; trạng thái của hai người được đồng bộ. Cặp nến xưa và LED hiện tại vì vậy có phản hồi đúng trên màn.

## P1

- Thư cuối: thời gian mỗi đoạn phụ thuộc độ dài; đoạn dài nhất 24 từ nay giữ khoảng 12,3 giây thay vì 9,2 giây. Nội dung thư không bị biên tập. Quyền tạm dừng và đọc lại vẫn hoạt động.
- Phase 6: điều tiết các nhóm người giấy đã có để dòng người dày dần và đi vào vùng nhìn trước khi hai đèn bị tách. Không thêm hàng loạt nhân vật 3D riêng lẻ.
- Phase 6: thêm vệt sáng dẫn lối trên đường về, cắt camera thẳng tới lối mới sau khi giải ảnh để không thấy khoảng sàn trống; giữ hai đèn đứng cạnh nhau 4,3 giây. Câu đoàn tụ chuyển lên phía trên khung hình để không che hai đèn.
- Khung kết: giữ lại hình hai đèn ông sao dưới trăng và nút đọc lại. Bản đọc đầy đủ có gợi ý cuộn khi thực sự dài hơn vùng nhìn.
- Kết nối thật: hai tab dùng khóa anon sẵn có đã `SUBSCRIBED` và nhìn thấy nhau qua Supabase khi chạy trong môi trường có mạng. Chưa tương đương một buổi chơi hai thiết bị thật.

## P2 và các điểm lệch hình–lời–thao tác

- Màn mở: bầu trời trăng sạch lỗi hạt vuông, phố có nhiều lớp mái và đèn; trang tranh thứ hai cho thấy bóng đứa trẻ và nói rõ “bạn còn bé”, nối ký ức đầu game với người cầm đèn hiện tại.
- Phase 1: nguyên liệu bay vào sao và biến khỏi chiếu theo từng lần chạm; người chơi được ngắm đèn vừa thắp trước khi nút rời phòng xuất hiện. Câu kể về bóng sao không thấy rõ trên vách đã được bỏ.
- Cửa Phase 1→2: ánh đèn ông sao còn hiện khi cánh cửa mở, tránh khung tối trống.
- Phase 3: đầu lân không còn mí mắt đỏ nhấp nháy sai; giữ góc nhìn trong sân hội trước khi bảng cử chỉ xuất hiện.
- Phase 4: giảm chói cục bộ của trăng và một số nguồn LED để đèn dẫn đường giữ vai trò chính. Không sửa cấu hình renderer/composer dùng chung.
- Phase 5: giữ nhịp hai đèn mới gặp trước khi cho đi tiếp.
- Ranh giới scene: dọn câu phụ đề cũ ngay lúc màn che kín để chữ cảnh trước không ló trên cảnh mới. Các câu dẫn sai hướng về Grand Plaza trước Phase 7 đã được sửa.
- Phase 7: nhịp hiện chữ dài hơn, có dấu cuộn ở bản đọc lại; kiểm tra màn hình dọc 390×844 thấy có thể đọc và đóng thư.

## Kiểm tra và giới hạn

- `npm run build`: đạt. Vite còn cảnh báo bundle chính lớn hơn 500 kB; đây là cảnh báo dung lượng cần tiếp tục theo dõi, không phải lỗi build.
- `git diff --check`: đạt, chỉ có cảnh báo chuyển LF/CRLF trên Windows.
- Lượt thao tác thực từ Phase 0 đến cửa Phase 5: 71 sự kiện chữ/UI, không có page error (`test-artifacts/final_validation_run_latest.log`).
- Hai tab mock từ đầu Phase 6 qua câu đố ông lão, hai nhánh ký ức, đoàn tụ, cổng và đầu thư Phase 7: đạt, không có page error (`test-artifacts/final_phase6_run_subtitle.log`). Ảnh kiểm tra nằm trong `test-artifacts/final_validation/`.
- Bàn giao Phase 5→6 trong cùng phiên hai tab mock: cả hai vào scene 7, còn kết nối với nhau, không có page error (`test-artifacts/phase5_to_6_handoff_smoke.mjs`). Phép thử đặt hai người gần cuối lối trước khi đi và bấm nút bàn giao; lượt đi tự nhiên của Phase 5 được kiểm tra riêng.
- Khúc cuối thư, camera lên trăng và khung kết được kiểm tra bằng lượt chạy theo thời gian thực bắt đầu từ cuối thư (`test-artifacts/inspect_finale_tail.mjs`). Chưa có một lượt tự động liên tục từ giây đầu đến hết toàn bộ 181 giây ending vì Chrome headless từng timeout trong lượt dài.
- Đã xem trực tiếp ảnh chụp các khung mở, làm đèn, cửa, lân, trăng hiện tại, dòng người, lối về, đoàn tụ, thư và màn kết. Chưa nghe kiểm định chủ quan toàn tuyến bằng loa/tai nghe của thiết bị nhận; không thể khẳng định bản phối cuối đã cân âm hoàn hảo chỉ từ kiểm tra mã và trình duyệt headless.
- Trước khi gửi bản quà, nên chơi một lượt trên **hai thiết bị thật** từ lời mời đến màn kết và nghe âm lượng trên điện thoại. Đây là khoảng trống xác minh còn lại, không phải lỗi game đã tái hiện.
