# Kiểm định trải nghiệm và câu chuyện — game Trung Thu, Phase 0–7

**Ngày:** 28/09/2026
**Góc nhìn:** người nhận game lần đầu, chưa biết cốt truyện; sau lượt chơi mới đối chiếu với `STORY_AND_EMOTIONAL_DIRECTION.MD`.
**Trạng thái:** báo cáo gốc và vòng chỉnh UX/story đầu tiên. Các quan sát “hiện tại” bên dưới mô tả bản trước khi sửa; xem cập nhật ngay sau đây. Lá thư riêng và ảnh cá nhân được giữ nguyên.

## Cập nhật sau vòng chơi lại

- Mở đầu giờ có hai trang tranh cắt giấy người chơi tự lật, nối trăng hiện tại với ngôi nhà quá khứ rồi dẫn vào bàn làm đèn. Cảnh tua thời gian ngắn hơn, các hạt sáng được làm tròn và chuyển cảnh có lớp mái nhà.
- Bốn nguyên liệu trên chiếu cói đã chạm trực tiếp được; khay dưới màn chỉ còn chức năng chỉ dẫn/tiến độ. Thứ tự lời kể khớp với nan tre, giấy kiếng, dây kẽm/cán và nến. Cảnh bàn có nền phòng, vệt trăng, chiếu, bát hồ; khung điện thoại đã được kiểm tra.
- Gió trên đường làng có hậu quả mềm: nến tắt một lần khi đi qua gió mà không che, người chơi châm lại tại chỗ. Lời hướng dẫn phím và nút phản ánh trạng thái này. Phụ đề quan trọng có thời gian đọc tối thiểu; lượt giữ W liên tục vẫn cho thấy hiên nhà, cảnh báo gió, mâm cỗ và cổng đình.
- Chữ tiếng Việt chuyển sang font hệ thống có dấu ổn định; Phase 4 không còn gọi khu hội ngoài là “đại quảng trường”. Phase 3 chờ người chơi chọn lên trăng để có khoảng ngắm cảnh. Phase 4 bỏ avatar người chơi và sửa vị trí đèn trong đoạn đi tới hội: chiếc đèn tiếp tục đại diện cho người đó và luôn nằm trong khung hình.
- Phase 6 giữ người qua lại trên nhánh đường lúc lạc nhau; bảng hướng dẫn đổi ngay khi tách. Mặt sau ảnh kỷ niệm không còn tiết lộ đáp án qua caption. Phase 7 có nút tạm dừng lời chúc và cho đọc lại toàn văn sau kết thúc.
- Đã chơi lại liên tục từ mở đầu đến cửa vào Phase 5 bằng chuột/phím thật và chạy lại hai cửa sổ mock từ Phase 6 qua kết thúc. Không có lỗi runtime trong hai lượt. Đây chưa phải buổi playtest hai người thực trên mạng và thiết bị của người nhận, nên cảm nhận về thời gian chờ/phối hợp vẫn cần xác minh sau.

## Cập nhật vòng âm thanh và nhịp kể — 29/09/2026

- Thêm một chủ đề nhạc Web Audio **nguyên tác** biến đổi theo 15 trạng thái cảm xúc, từ gian nhà nhỏ tới đám đông, khoảng lạc nhau, đoàn tụ, cổng và lá thư. Âm thanh cũ của từng hành động vẫn được giữ, nhưng các nguồn ambience lặp được dừng khi rời cảnh. Không đưa bài hát hay bản thu thương mại vào build. Bảng chỉ đạo âm thanh, vị trí thích hợp của những ca khúc Trung Thu quen thuộc và điều kiện quyền sử dụng nằm trong `AUDIO_AND_STORY_DIRECTION.md`.
- Nút âm đã hoạt động và không còn bị bảng mời người chơi thứ hai che ở Phase 5. Kiểm tra trình duyệt cho thấy AudioContext mở sau thao tác của người chơi, nút tắt/bật đúng trạng thái và tín hiệu nhạc có mức RMS khác 0. Đây là kiểm tra chức năng, **chưa thay thế buổi nghe trên loa/tai nghe thật** để cân âm sắc, độ lớn và bản thu nhạc cụ Việt.
- Hướng dẫn W/Space ở đường làng được đưa vào nhãn điều khiển tách khỏi lời kể; phụ đề cơn gió nói về ánh nến đang chao và hình/ngọn lửa phản hồi tại cùng thời điểm. Lời sân đình và công viên được rút bớt những câu tả lặp, giữ các địa danh đúng tiến trình.
- Màn chờ Phase 5 có tranh nhỏ hai ngôi sao: một sáng, một đang chờ; màn hình dọc đã được căn camera để chiếc đèn thật vẫn thấy trên lối đi. Phase 6 giữ một nhịp dừng và bố cục hai đèn tại reunion rồi mới hướng về Inner Gate, không lộ kiến trúc Plaza ở phía sau.
- Ảnh kiểm tra mới: `test-artifacts/phase5_waiting_story.png`, `test-artifacts/phase5_waiting_story_mobile.png`, `test-artifacts/village_hint_story.png`, `test-artifacts/phase6_05_reunion.png`. Ảnh Phase 6 phải chạy với render bật; script kiểm thử thường tắt render ở tab chủ để tăng tốc, nên ảnh nền đen khi dùng chế độ mặc định là **đặc tính của harness**, không phải khung hình game.

## 1. Kết luận trải nghiệm

Game đã có một hình tượng rất đáng giữ: một chiếc đèn ông sao do người chơi thắp lên, một chiếc đèn thứ hai xuất hiện, hai ánh sáng lạc nhau rồi cùng đi qua cổng. Phần quá khứ có nhiều khung hình giàu cá tính; đại cảnh cuối và khoảnh khắc hai ánh đèn chạm nhau có tiềm năng chạm cảm xúc. Nhưng người chơi mới hiện phải **tự suy ra mối quan hệ giữa các cảnh**. Mở đầu chưa đặt họ vào vai đứa trẻ; thao tác lắp đèn giống chọn mục trong menu; lời kể đôi khi nói về thứ không có trên màn hình; các câu phụ đề có thể xuất hiện quá nhanh; câu “đại quảng trường” làm lộ địa điểm vốn chỉ nên xuất hiện ở Phase 7. Khi câu chuyện cần khán giả cảm thấy sự thiếu vắng của chiếc đèn kia, một số khung hình chỉ cho thấy một con đường vắng, chưa đủ tương phản với đám đông trước đó.

**Vấn đề gốc không phải số lượng cảnh ít.** Vấn đề là thiếu vài nhịp *đặt bối cảnh → cho người chơi làm một việc có ý nghĩa → để hình ảnh/âm thanh phản hồi → cho một khoảng lặng để cảm nhận*. Thêm nhiều đoạn chữ tự động có thể làm game dài hơn mà không sâu hơn. Nên sửa độ khớp giữa hình, lời, thao tác và âm thanh trước; sau đó thêm rất ít cảnh dẫn 2D ở những điểm thật sự thiếu cầu nối.

## 2. Phạm vi và độ tin cậy

- Tôi chơi liên tục từ màn trăng mở đầu đến cửa vào Phase 5 trên bản local `?mock=true`, kích thước 1280×720, bằng nút/bàn phím/chuột thật: chọn bốn bước lắp đèn, giữ đi hết đường làng, thực hiện ba cử chỉ múa lân, qua đoạn lên trăng, khám phá công viên hiện đại. Log ở [`test-artifacts/ux_journey/timeline.json`](test-artifacts/ux_journey/timeline.json), ảnh trong [`test-artifacts/ux_journey/`](test-artifacts/ux_journey/). Đây là một lượt chơi có chủ đích đi tiếp, không phải nghiên cứu nhiều người chơi.
- Tôi xem và đối chiếu cảnh Phase 5 tối/bật đèn, Phase 6 hai cửa sổ mock multiplayer, và chuỗi 17 ảnh thời điểm của Phase 7. Các mốc Phase 6–7 được đưa tới trạng thái bằng script kiểm thử, **không phải một lượt hai người thật chơi tự nhiên từ đầu đến cuối**. Vì vậy nhận xét về *hình và câu chữ* ở các trạng thái đó có độ tin cậy cao hơn nhận xét về thời gian chờ, hướng đi hay cảm giác phối hợp thực tế. Cần làm buổi playtest thật trước khi chốt thiết kế.
- Tôi đọc `STORY_AND_EMOTIONAL_DIRECTION.MD`, `PRESENT_VISUAL_IDENTITY.md`, toàn bộ `StoryConfig.ts`, các câu chữ trong Phase 5–7, UI lắp đèn, puzzle và logic hiển thị phụ đề. Tôi không chỉnh sửa ảnh kỷ niệm hay lời chúc cá nhân.
- Không đo FPS, network/CDN, thiết bị di động hoặc font trên Cloudflare production trong đợt này. Những điều đó là việc xác minh tiếp theo, không nên suy từ một ảnh local.

## 3. Đối chiếu mạch cảm xúc mong muốn và trải nghiệm hiện tại

| Nhịp trong story bible | Điều người chơi mới hiện nhận được | Khoảng hụt cần sửa |
|---|---|---|
| **Hoài niệm / tò mò** — đứa trẻ trong căn nhà nhỏ, một mùa Trung Thu xưa | Trăng trắng rất sáng, hạt vuông và một cú tua thời gian trừu tượng; sau đó cắt sang bàn vật liệu trong nền đen | Chưa thấy *ai* đang nhớ, ở *đâu*, vì sao lắp đèn. Màn 1 vào quá đột ngột. |
| **Ấm áp** — tự làm chiếc đèn, ngọn nến yếu dẫn ra làng | Bốn thẻ menu hoàn tất rất nhanh; ngôi sao sáng mạnh từ sớm | Thiếu cảm giác chính tay làm, thiếu độ yếu mong manh ban đầu nên hành trình giữ lửa yếu đi. |
| **Cộng đồng / choáng ngợp** — làng, trẻ rước đèn, sân đình, múa lân | Đường làng và sân hội có khung hình đẹp, chất papercraft rõ; múa lân có năng lượng | Cảnh báo gió không có hậu quả, vài phụ đề lướt qua; chuyển vào góc nhìn đầu lân đột ngột. |
| **Cùng một vầng trăng, thế giới đã đổi** | Đoạn nâng camera có ý tưởng tốt; hiện đại có sắc đèn khác | Trăng cần giữ cùng vị trí rõ hơn trong một khung so sánh; dòng “chiếc đèn năm xưa” chưa giải thích phép ẩn dụ, ảnh đầu Phase 4 ưu tiên sàn/đèn quá sáng hơn tác phẩm Mặt Trăng. |
| **Đồng hành** — chiếc đèn thứ hai là một người | Phase 5 có hai chiếc đèn và lời mời; đường tối/LED có tương tác | UI mời bạn giống công cụ phòng chơi nằm đè trên tranh; lời “đèn pin” sai đạo cụ; cần một nhịp nhận ra và chờ nhau. |
| **Đông → ngợp → cô đơn giữa người** | Đám đông Phase 6 có ánh sáng, hoạt động; khi tách đôi đường bỗng vắng | Chưa thấy quá trình ánh sáng kia bị người che khuất từng chút. “Một mình giữa biển người” chưa thành hình. |
| **Nhớ → tìm lại → đoàn tụ** | Ảnh cá nhân, puzzle, hai đèn gặp lại là các ý rất đúng | Puzzle có caption cho cả hai nên có thể đọc đáp án thay vì kể chuyện; khi đoàn tụ, hình còn gần như một trạng thái đi đường, chưa đủ khoảng lặng và phản hồi âm thanh/ánh sáng. |
| **Cùng bước tiếp → lời chúc riêng** | Cổng mở, quảng trường và ngôi sao hợp nhất có sức mạnh thị giác; lời chúc đã được tích hợp | Giữ wow shot thêm chút lâu và điều khiển nhịp đọc thư; lá thư đang auto chạy khoảng 95 giây qua 16 beat, cả ending khoảng 2 phút rưỡi. Đây là giả thuyết về nhịp, cần thử với người nhận thật hoặc người đọc mới. |

## 4. Các phát hiện ưu tiên cao

### P0 — Chữ tiếng Việt hiển thị lỗi ở nhiều màn

**Quan sát.** Ảnh mở đầu, phụ đề, bảng Phase 5–6 và câu đố ông lão có dấu bị tách/mất/hình dạng không ổn; ở màn đố có thể khó đọc ngay câu hỏi. Chuỗi Unicode trong DOM và `StoryConfig.ts` vẫn đúng, nên đây nghiêng về vấn đề **render/font**, chưa đủ bằng chứng để kết luận chính xác là Google Fonts tải chậm, thiếu glyph tiếng Việt, fallback hay antialias. Trang dùng Cinzel/Playfair Display/Quicksand từ Google Fonts (`index.html`, `src/style.css`); chữ kết được vẽ bằng Segoe UI và trông sạch hơn. `document.fonts.ready` tự nó không chứng minh đúng font đã tải.

**Ảnh hưởng.** Mất khả năng đọc ngay ở đoạn dẫn quan trọng nhất và làm tác phẩm có vẻ chưa hoàn thiện. Đây là lỗi phát hành, nên sửa trước mọi câu chữ mới.

**Phương án.** Chốt một font thân và một font nhấn có Vietnamese glyph/độ dấu được thử bằng bộ câu đầy đủ; lưu WOFF2 có subset tiếng Việt trong build, nêu fallback hỗ trợ tiếng Việt; tránh dùng Cinzel cho câu tiếng Việt dài. Kiểm tra rendered font thực tế, trạng thái tải font, kích thước dòng và dấu trên Chrome/Edge/Android/iPhone, mạng chậm và offline cache. Làm trang thử với “Trung Thu”, “chiếc đèn”, “Người Giữ Trăng”, “Tiếng trống”, các dấu `ă â ê ô ơ ư đ` trước khi đưa vào game. **Không sửa data Unicode bằng cách bỏ dấu.**

### P0 — Lời kể có thể bị cắt giữa chừng

**Quan sát được trong lượt chơi.** Cảnh báo cơn gió xuất hiện quanh giây 59,0, bị câu về trẻ rước đèn thay khoảng giây 59,6: chỉ còn ~0,6 giây đọc dù yêu cầu 5 giây. Lời bên hiên nhà không xuất hiện trong log DOM khi đi nhanh. Nút tiếp có thể hiện trước phụ đề liên quan. `StoryOverlay.setSubtitle()` tạo các `setTimeout` 300 ms và timer ẩn độc lập, không hủy/cấp quyền ưu tiên khi cue mới tới (`src/ui/StoryOverlay.ts`).

**Ảnh hưởng.** Người chơi bỏ lỡ lý do của hành động và cảm thấy câu chuyện chắp nối. Đọc hết file text sẽ không phát hiện lỗi này; nó chỉ xuất hiện khi *chơi theo tốc độ người thật*.

**Phương án.** Một bộ điều phối narrative duy nhất: cue quan trọng có min-dwell phù hợp số từ; cue mới được xếp hàng hoặc bỏ cue phụ nếu đã quá ngữ cảnh; khi chuyển cảnh hủy timer cũ; hành động tiếp không bật trước dòng thiết lập. Cho phép nhấn bỏ qua có chủ ý, không khóa di chuyển lâu. Quy định màn chỉ có một caption tường thuật chính, còn hướng dẫn điều khiển có vùng riêng. Test ba vận tốc: chậm, bình thường, giữ W tối đa.

### P0 — Phase 4 gọi “đại quảng trường” trước cao trào Phase 7

**Quan sát.** `modernArrival.festivalVistaReveal` tả Tháp Đèn Kéo Quân “giữa lòng đại quảng trường”; nút tiếp là “Khám phá đại quảng trường”. Lượt chơi thực tế thấy cả hai trước Phase 5. Story bible quy định Grand Plaza chỉ lộ sau Inner Gate ở Phase 7. Đây là lỗi logic không gian và làm suy yếu phần hé lộ cuối.

**Phương án câu thay đề xuất.** “Ở phía xa, Tháp Đèn Kéo Quân xoay chậm giữa **khu hội ngoài**; một lối đèn dẫn về phía đó.” Nút: “Theo lối đèn vào khu hội”. Giữ ngôn ngữ “quảng trường” và mọi nhận diện kiến trúc của nó cho Phase 7. Rà cả mốc âm thanh/biển chỉ đường để không vô tình báo trước.

### P1 — Mở đầu chưa giới thiệu vai và động lực

**Ảnh:** [`00_title.png`](test-artifacts/ux_journey/00_title.png), [`01_rewind.png`](test-artifacts/ux_journey/01_rewind.png), [`02_craft_start.png`](test-artifacts/ux_journey/02_craft_start.png). Mặt trăng là đĩa trắng gắt; trường sao vuông và rìa đen/nâu giống hiệu ứng kỹ thuật hơn tranh ký ức. Đoạn tua kéo khoảng 13 giây, nhưng người chơi không thấy một sự vật hay không gian nào *biến đổi*. Cut vào bàn lắp đèn không cho biết đây là căn nhà của một đứa trẻ và người chơi đại diện cho ai.

**Phương án cảnh 2D ngắn, có thể nhấn tiếp:** ① đêm nay: trăng treo trên mái phố, một chiếc đèn nhỏ chưa sáng; ② cùng trăng ấy trên mái nhà quê xưa, rèm tre/khung cửa/bóng đứa trẻ; ③ cận cảnh chiếc chiếu cói và bàn tay đặt nan tre dưới vệt trăng; ④ chuyển trực tiếp sang chính bố cục bàn lắp đèn để người chơi chạm vào nan đầu tiên. Chuyển ①→② bằng *trăng ở cùng vị trí*, lớp papercraft và âm thanh phố hiện đại rút đi, trống ếch/côn trùng đến. Có thể rút còn 2–3 tấm nếu nhịp chậm; mỗi tấm có 1 câu tối đa, không thêm lore. Người chơi điều khiển tốc độ qua nút/nhấn, nhưng cue hình/âm phải chạy hết một nhịp tối thiểu. Đảm bảo mở đầu đẹp ngay frame đầu, không dùng chữ thay cho bối cảnh.

### P1 — Lắp đèn là bấm danh mục, chưa phải tự tay làm

**Quan sát.** `CraftingUI` xếp bốn card dưới màn; chỉ card active được bấm, đồ vật trong thế giới là phông nền. Trên màn ghi “Chạm vào nguyên liệu”, nhưng vị trí phải chạm thực tế là icon/menu. Chiếu cói, cuộn kẽm, bát hồ trong lời kể chưa hiện ra rõ; căn phòng là khoảng đen. Sao hoàn thành phóng lớn và cháy sáng, một số bố cục bị cắt mép ([`03_craft_step_4.png`](test-artifacts/ux_journey/03_craft_step_4.png)).

**Phương án.** Dựng chiếu, nan tre, giấy kiếng, dây kẽm, hồ dán/nến như các đối tượng 2.5D/3D mỏng có hit area đủ lớn; người chơi chạm vào *vật đang nằm trên chiếu*. Có thể giữ tray rất nhỏ làm tiến độ/trợ giúp. Mỗi lần chạm có phản hồi tay/giấy/dây, một thay đổi thật trên đèn và âm riêng. Không cần kéo thả phức tạp: chạm một lần, vật tự chuyển tới vị trí theo hoạt họa để dễ chơi trên điện thoại. Cỡ sao và exposure nên tiến từ mờ/nhỏ → sáng ấm, tránh “thành phẩm” quá sớm. Ở bước đầu cho 1 giây quan sát căn nhà và bóng trăng trước khi hiện nhắc thao tác.

**Lỗi thứ tự nội dung hiện có.** Card số 2 là **giấy**, số 3 là **kẽm/cán**; `StoryConfig.craftingSubtitles.step2` lại nói **kẽm**, `step3` lại nói **giấy**. Cần thống nhất thứ tự của card, hoạt họa, vật được chạm, lời dẫn và âm Foley. Lời “nến tự động bừng sáng” cũng trái với card “Thắp nến”; nên cho người chơi tự châm nến và câu kể ghi nhận hành động đó.

### P1 — Ngọn nến không phản hồi lời cảnh báo

**Quan sát.** Tôi giữ tiến liên tục, không che nến ở đoạn gió. Log kết thúc: `lit=true`, `windTriggered=true`, `warningShown=true`, `shielded=false`; ngôi sao vẫn sáng. Logic `StarLantern.update` làm lửa nghiêng và ánh sáng giảm phần nào nhưng không tắt, trong ảnh gần như không đủ rõ. Lời “chớ chạy quá vội kẻo nến chao nghiêng”, “Giữ Space để bảo vệ” hứa một hành động có tác dụng. Cùng lúc `arrivalHint` lại thúc “nhanh nhanh tới đó”, hướng dẫn S/W đều như đi tới.

**Phương án ưu tiên:** giữ game thư thái nhưng tạo **hậu quả mềm**, không trừng phạt nặng. Khi đi nhanh/gặp gust, lửa co lại rõ, bóng sao trên đường rung, màu ấm tụt xuống, trống/tiếng gió nổi lên; che nến làm lửa hồi lại và âm thở nhẹ. Nếu không che, lửa có thể tắt *một lần có kiểm soát*, người chơi dừng và chạm châm lại; không game-over/đi lại cả đoạn. Hoặc nếu không muốn cơ chế tắt, sửa mọi câu chữ thành “gió làm ánh đèn chao nghiêng” và bỏ lệnh che nến như một yêu cầu bắt buộc. Nên chọn một hợp đồng cảm giác rồi đồng bộ văn bản, input, ánh sáng, âm. Sửa câu hối thúc thành mời đi chậm; hướng dẫn phím nói rõ W/S đúng chức năng thực tế.

## 5. Soát theo từng phase: hình, lời, hành động

### Phase 0 — Trăng và tua về quá khứ

- **Giữ:** Mặt Trăng làm vật thể nối hai thời đại; một thao tác chủ động để bắt đầu ký ức.
- **Sửa:** Thiết kế lại mặt trăng, viền mây, layer mái nhà/bóng tre theo papercraft; trăng là chủ thể có bề mặt và hào quang có kiểm soát, hạt sáng tròn/mềm thay vì vuông rời rạc. Hiệu ứng quay thời gian nên cho cùng một điểm neo hình học đổi mùa/kiến trúc/âm thanh, không chỉ xoay camera trong hạt.
- **Copy:** Ba câu `openingSubtitles` hiện mang ý thơ nhưng còn khái quát, chưa nói rõ bối cảnh của hành động tiếp. Dòng cuối về “ngọn nến soi sáng cả bầu trời tuổi thơ” hơi lớn lời so với ngọn nến nhỏ; đề xuất ngắn, cụ thể hơn, ví dụ: “Có một đêm rằm, trong căn nhà nhỏ ấy, em bé tự làm lấy một vì sao.” Chốt xưng hô sau khi xác định người kể là ai; đừng dùng “em” cho nhân vật khi câu chuyện chính cũng gọi người nhận là “em” nếu dễ gây nhầm.

### Phase 1 — Căn nhà và đèn ông sao

- `step0` kể “chiếu cói / 10 nan tre / kẽm / hồ dán”: chỉ dùng khi các đạo cụ này thực sự nhìn ra được. Thêm góc thấy vách đất, cửa, vệt trăng, bàn tay/bóng đứa trẻ để người chơi biết không gian.
- `step1` và `step2/3`: sửa thứ tự giấy–kẽm như phần trên; bớt thuật ngữ kỹ thuật trong subtitle chính, để chi tiết chế tác nằm ở hover/nhắc nhẹ hoặc visual.
- `completed`: thay lời “tự động bừng sáng” bằng lời xác nhận ngọn nến người chơi vừa thắp. Cho thành phẩm soi lên vách thành bóng sao, rồi dẫn mắt tới cửa.
- `doorRevealSubtitles[0]` hiện nói “bước ra sân đình” nhưng người chơi ra **đường tre qua làng**. Thay bằng “bước ra con ngõ làng; tiếng trống từ sân đình vọng lại ở phía xa”. Đây cũng là mục tiêu không gian rõ cho Phase 2.

### Phase 2 — Đường làng và giữ lửa

- Khung tre/trăng/hiên nhà đã giàu hình tượng ([`05_village_start.png`](test-artifacts/ux_journey/05_village_start.png)); giữ kết cấu tranh cắt giấy, đừng làm lại theo thế giới mở.
- `arrivalHint` xung đột với `candleWarning`; `movementInstruction` nhập nhằng; `windGustWarning` chỉ đáng dùng khi gust và phản hồi hiện rõ.
- `vignetteFamily`, `vignetteKids`, `vignetteFeast` nên hiện khi camera *thực sự nhìn/đi qua* đạo cụ đó và đủ thời gian đọc. Hiện ít nhất một câu bị lướt. Thay các câu liệt kê bằng một chi tiết đắt trong hình/âm: hơi trà, nhịp trống, tiếng cười trẻ. Để người chơi tự thấy thay vì lời đọc mô tả toàn bộ.
- Kết bằng cổng đình và một đoạn âm trống/ánh sáng dẫn tới Phase 3, không bấm nút ngay khi lời về cổng vừa xuất hiện.

### Phase 3 — Sân đình, múa lân, lên trăng

- **Giữ:** đám đông cầm đèn, trống lân, đèn thủ công hòa vào biển sáng; camera lên cao rồi nối trăng là đoạn đặc sắc ([`08_square_lion.png`](test-artifacts/ux_journey/08_square_lion.png), [`11_ascent.png`](test-artifacts/ux_journey/11_ascent.png)).
- `actionJoinPerformance` nói “chăm chú dõi theo”, nhưng thao tác tiếp chuyển người chơi vào POV đầu lân. Chuyển ý bằng một câu/ánh nhìn chủ động: “Hòa vào nhịp trống của đội lân”, hay biểu đạt đây là **ký ức tưởng tượng** của đứa trẻ. Câu “linh hồn như hòa vào đầu lân” tạo biến cố siêu nhiên không được gieo trước, nên viết mềm và cụ thể hơn.
- Ba hướng dẫn cử chỉ nên thật ngắn, có hình tay/hướng chuyển động, phản hồi từng động tác bằng trống/lân; ở màn hình chạm cần affordance tương đương.
- Sau payoff, hiện nút “Hòa vào vầng trăng ký ức” nhưng script có tự khởi động ascent sau khoảng 7,5 giây. Nếu muốn tự chạy như phim, bỏ nút giả quyền lựa chọn; nếu muốn người chơi quyết định, giữ nút và bỏ auto hoặc chỉ auto khi đã đọc xong và không tương tác trong một khoảng đủ dài. Không cắt mất khoảnh khắc ngắm sân hội.
- Lời ascent có nhiều câu tả cùng một ý “đốm sáng nhỏ”. Để hình ảnh và âm thanh kéo sự xa dần; ưu tiên một câu ngắn cuối đặt trăng làm cầu nối.

### Phase 4 — Cùng trăng, công viên hiện đại

- Lấy Mặt Trăng *đúng vị trí* cuối Phase 3/đầu Phase 4, cho công viên/ánh sáng điện dần hiện ra theo lớp. Ở checkpoint tôi chụp ([`12_modern_moon.png`](test-artifacts/ux_journey/12_modern_moon.png)), sao trắng-vàng lớn và sàn/kiến trúc chiếm mắt; tác phẩm Mặt Trăng chưa đọc rõ ở thời điểm câu phụ đề nhắc đến nó. Cần cân lại camera/exposure và thời điểm cue, không kết luận toàn cảnh Phase 4 đều như vậy.
- `lanternEvolve` nói “Chiếc đèn năm xưa vẫn ở đây” làm người mới hỏi: cùng một chiếc đèn vật lý hay cùng ký ức? Nếu là biểu tượng, viết “Dưới vầng trăng ấy, một ánh đèn khác cũng đang sáng lên” hoặc một câu được shot minh họa cụ thể.
- `festivalVistaReveal` và `actionEnterPark` thay “đại quảng trường” như P0. Phân biệt rõ **công viên / khu hội ngoài / sân Tháp Đèn Kéo Quân / lối dạo / Inner Gate / Đại Quảng Trường cuối** trong tên gọi và biển chỉ dẫn.
- Khung festival xa hiện đẹp ([`13_modern_festival_reveal.png`](test-artifacts/ux_journey/13_modern_festival_reveal.png)); giữ papercraft hiện đại, cải thiện bằng lớp foreground và con người có viền sáng, không cần thêm công trình Phase 7.

### Phase 5 — Mời chiếc đèn thứ hai và vùng tối

- Khi chiếc đèn thứ hai xuất hiện, cho một nhịp nhìn thấy đèn kia *từ xa tới gần* và ánh sáng phản ứng với nhau trước khi UI chia sẻ link chiếm vùng trên. Vẫn phải có thao tác mời bạn rõ, dễ copy, dễ biết trạng thái chờ/kết nối, nhưng nhãn hướng dẫn nên gọn và xuất hiện sau nhịp kể.
- Vùng tối trước/sau bật LED có visual đối lập nhìn ra được ([`phase5_dark_before_switch.png`](test-artifacts/phase5_dark_before_switch.png), [`phase5_dark_after_switch.png`](test-artifacts/phase5_dark_after_switch.png)), nhưng tháp hội rất sáng trong cùng khung nên cảm giác “cần ánh sáng kia” có thể nhẹ. Kiểm tra từ camera đi thật, không chỉ screenshot staged; nhấn phản chiếu hai loại ánh sáng lên nền/đèn còn lại.
- `triggerSwitchMonologue` gọi “đèn pin”, trong khi trên màn là **công tắc bóng LED của đèn ông sao**. Thay bằng “Tách. Ngọn đèn mới sáng lên cạnh ngọn nến cũ.” Tránh đọc kỹ thuật điện quá nhiều trong lời kể.
- Câu chờ đồng hành “Dừng lại một chút…” hợp chức năng nhưng có thể đi cùng một cử chỉ của hai chiếc đèn, để việc chờ không giống lỗi kết nối.

### Phase 6 — Đông, lạc, ký ức, gặp lại

- **Giữ:** phố hội có chất 2.5D; Inner Gate sau khi lạc có dáng lễ hội; cổng vẫn là **guarded reveal**, trước separation không được đọc rõ từ shared promenade; cuối phase chỉ haze/silhouette/ánh động phía sau, không hiện kiến trúc Phase 7.
- Rải nhịp **lively → crowded → overwhelming** bằng crowd/parallax, cường độ trống/tiếng nói và khoảng hở camera thu hẹp; ánh đèn bạn đồng hành chập chờn bị silhouette che từng lần. Khi mất nhau, không biến thành một con đường gần rỗng: giữ dòng người cùng đi nhưng bớt màu/sáng sát nhân vật, giảm âm cao, để “cô đơn giữa người” thành cảm giác đối lập. Ảnh separated hiện khá vắng so với ảnh crossing.
- Ông lão hiện là silhouette đẹp nhưng câu đố là panel 4 nút rộng như quiz web, chữ nhỏ và lỗi dấu ([`phase6_02_elder.png`](test-artifacts/phase6_02_elder.png)). Nếu giữ puzzle, đặt câu hỏi gần nhân vật/đèn, cho ông dẫn một câu có tính người; lựa chọn gắn với bốn biểu tượng giấy/đèn trong không gian, có fallback dễ thao tác. Mục đích là gợi **cùng một vầng trăng**, không kiểm tra kiến thức.
- Người Giữ Trăng/ký ức: ảnh thật đã được hỗ trợ, không thay bằng tranh vector. Viewer hiện thấy một ảnh kèm caption, chooser thấy bốn ảnh **kèm caption** (`Phase6PuzzleOverlay.ts`), làm câu đố dễ thành đọc tên thay vì kể một chi tiết cá nhân. Ẩn caption đáp án trong lúc chọn hoặc dùng nhãn trung tính, để hai người phải kể điều nhìn thấy/nhớ. Giữ alt text cho tiếp cận nhưng đừng biến alt/caption thành đáp án hiển thị. Cần onboarding ngắn “hãy nói chuyện với nhau” vì game không có voice chat tích hợp.
- Reunion ([`phase6_05_reunion.png`](test-artifacts/phase6_05_reunion.png)): hai đèn cạnh nhau, nhưng nên cho một khoảng 2–4 giây *không nhiệm vụ mới*: đèn kia tìm đến, nhịp nhạc lắng rồi hòa, vòng sáng hai đèn chạm nhau, camera gần hơn trước khi nhìn lên cổng. Tránh ép bấm gate ngay.
- Câu hiện tại Phase 6 đa phần thông báo trạng thái (“đi tiếp”, “đã trở lại”). Chọn ít câu hơn, cá nhân hơn, đúng người nhìn/người chờ; không dùng quá nhiều câu giải thích trạng thái máy.

### Phase 7 — Grand Plaza, hai ánh sáng, lời chúc

- Ảnh full reveal có cổng, trục sao, quảng trường đọc rõ và có kiểm soát; không tiết lộ trước đó ([`phase7/05_full_reveal.png`](test-artifacts/phase7/05_full_reveal.png)). Cho **~5 giây yên** đúng story bible trước khi hiện lời đầu, để wow shot được tự nói.
- Hai đèn trên ngôi sao là payoff đúng motif; giữ. Ở wide shot cuối, có quầng sáng/trăng tượng trung tâm và trăng thật lệch phía trên, dễ đọc như hai mặt trăng. Chọn rõ “tác phẩm trăng” và “trăng trên trời” qua bố cục/độ sáng hoặc một phép match cut cuối.
- Lá thư đã là text thật từ `src/content/final-wish.txt`. Parser tạo 14 beat nội dung + 2 lead, tổng khoảng **95 giây chỉ để đọc** và ending khoảng **149 giây** theo duration trong code. Không có pause/replay beat khi tự chạy; với chữ riêng tư đây là rủi ro lớn. Thử hai phiên bản với người đọc mới: (A) toàn thư tự động; (B) 40–60 giây cinematic cốt lõi rồi mở thư đầy đủ do người chơi nhấn/đọc theo tốc độ của mình, có thể xem lại. **Không rút/sửa lá thư cá nhân khi chưa có người viết duyệt.** Một số đoạn hiện chuyển từ lời chúc sang xin lỗi/nhắc quá trình làm game; đây có thể là sự chân thật người nhận quý, cũng có thể làm hạ cảm xúc sau cao trào. Nên nghe phản ứng người nhận/độc giả tin cậy và xin chính chủ duyệt thứ tự/biên tập.
- Tôi kiểm tra giới hạn 5 dòng của canvas text: với **nội dung hiện tại**, beat dài nhất đo được là 4 dòng ở font/cỡ đang dùng, nên **chưa có mất chữ**. Tuy vậy `FinaleMoment.wrap()` cắt ở 5 dòng sẽ nguy hiểm nếu lá thư đổi sau này; nên tách beat tự động hoặc co bố cục thay vì âm thầm cắt.
- `StoryConfig.finalLetter` chứa một câu kết khác trong khi Phase 7 dùng `final-wish.txt`; nên xác định một nguồn nội dung chính, để lần sau không sửa nhầm file.

## 6. Đề xuất hệ thống cảnh dẫn 2D — thêm ít, đúng chỗ

Không cần cắt game thành một chuỗi slide. Giữ **mỗi cảnh dẫn chỉ làm một nhiệm vụ cảm xúc**, trăng và đèn là điểm neo, layer tranh giấy có parallax nhẹ và chuyển động ánh sáng/âm thanh. Cho nhấn tiếp sau khoảng nhìn tối thiểu; có thể chạm lại để lùi một trang hoặc xem nhật ký câu chuyện, nhất là đối với lời chúc.

| Vị trí | Nhiệm vụ | Số panel / thời gian gợi ý | Chuyển tiếp |
|---|---|---|---|
| Trước Phase 1 | Cho biết đây là ký ức của một đứa trẻ và ngọn đèn sẽ do mình làm | 2–3 panel, khoảng 12–18 giây nếu người chơi đọc | Trăng cùng tọa độ; panel cuối match cut vào chiếu cói có đạo cụ bấm được |
| Cuối Phase 3 → Phase 4 | Cho thấy năm tháng đổi, trăng không đổi | Ưu tiên **một shot liên tục**; thêm tối đa 1 panel nếu camera khó kể đủ | Ngôi làng thành điểm sáng, âm trống xa dần, ánh bạc thành ánh đèn điện |
| Phase 4 → Phase 5 | Đặt mong muốn có người cùng đi trước khi hiện UI link | 1 panel/shot ngắn, 4–6 giây | Một ánh sao nhỏ xuất hiện bên rìa khung rồi thành chiếc đèn thứ hai |
| Phase 6 sau lạc / trước memory | Cho người chơi *cảm* sự vắng mặt và muốn tìm | Ưu tiên shot trong game, **không thêm panel nếu crowd/camera/âm đủ kể** | Chỗ trống nơi đèn kia vừa đi; ánh còn sót; tiếng hội bị lọc xa |
| Phase 6 → Phase 7 | Tích lũy mong chờ | Không thêm lời dẫn 2D; cổng, hai đèn và im lặng làm việc này | Sau cổng mới lộ Grand Plaza |

**Nguyên tắc kiểm tra:** nếu bỏ toàn bộ caption của một nhịp, người chơi vẫn nên hiểu “đang ở đâu / điều gì vừa đổi / cảm xúc gần nhất” từ hình và âm. Chữ chỉ chọn một chi tiết chưa thể kể bằng hình.

## 7. Âm thanh, khả năng đọc và ngôn ngữ giao diện

1. **Âm như chất nối:** một mô-típ trống ếch ở quá khứ, khi sang hiện tại biến thành nhịp xa của hội; cùng nốt/nhịp nhận ra nhưng chất liệu nhạc thay. Tiếng giấy, nan tre, dây kẽm, châm nến cần phản hồi từng thao tác. Gió phải làm lửa và âm phản ứng đồng thời. Khi tách đôi, lọc tiếng đông người để thấy cô độc; reunion trả lại dải âm và nhịp hai đèn.
2. **Giảm chữ nơi hình đã rõ:** nhiều câu hiện kể lại đúng những gì đang nhìn thấy (“rực rỡ”, “lung linh”, “tiếng trống”). Dùng chữ cho điểm nhìn cá nhân hoặc dẫn chú ý tới chi tiết cụ thể. Không cần mọi sự kiện có phụ đề.
3. **Tính nhất quán xưng hô:** game đang chuyển giữa “bạn”, nhân vật đứa trẻ, “Anh/Em” và lời của người tặng. Chọn quy tắc: lời dẫn trước khi mời người thứ hai là ngôi thứ hai trung tính; khi hai đèn gặp nhau, xưng hô thân mật chỉ trong đoạn thư hoặc khi người viết muốn rõ. Tránh nhân vật trẻ bị gọi “em” rồi trùng với người nhận.
4. **Phân biệt tường thuật và điều khiển:** phụ đề thơ không chứa lệnh `[Space]`, `[W]`; hướng dẫn input nằm ở affordance nhỏ riêng, chỉ hiện khi cần. Cỡ chữ/chống tương phản thử trên điện thoại và màn 720p. Đảm bảo nút có trạng thái focus và vùng chạm đủ lớn.
5. **Lựa chọn trải nghiệm:** nút âm, replay dòng vừa mất, tạm dừng đoạn thư và xem lại cảnh quan trọng sẽ giúp một người nhận game qua link thực sự đọc/nhìn theo nhịp của họ. Đây là hỗ trợ kể chuyện, không phải thêm cơ chế giải đố.

## 8. Thứ tự sửa khuyến nghị và tiêu chí chấp nhận

| Đợt | Việc | Tiêu chí kiểm tra khi chơi lại |
|---|---|---|
| **A — Không thêm cảnh mới** | Sửa font tiếng Việt, cue subtitle, copy sai địa điểm/thứ tự vật liệu/“đèn pin”, vùng chạm/input | Không có chữ vỡ; giữ W qua Phase 2 vẫn đọc được cue trọng yếu; không ai nghe “đại quảng trường” trước Phase 7; lời và vật khớp 100%. |
| **B — Đặt người chơi vào câu chuyện** | Mở đầu 2D ngắn, redesign bàn lắp đèn chạm trực tiếp, phản hồi ngọn nến | Người chơi mới mô tả được “mình là/đang theo ký ức ai, đang làm gì” trước phút đầu; tự tay thắp ngọn đèn có phản hồi thấy/nghe được. |
| **C — Kiểm tra tương phản cảm xúc** | Phase 2 gió; Phase 3 payoff; Phase 4 match moon; Phase 5 nhận ra người thứ hai; Phase 6 tách/reunion | Người chơi nhận ra gió tác động mà không cần đọc lệnh; phân biệt khu hội ngoài với plaza; mô tả đúng lúc thấy mất đèn kia và lúc thấy lại. |
| **D — Kết game** | Giữ grand reveal, thử nhịp đọc thư, replay/pause, kiểm font và moon wide shot | Ít nhất 5 giây plaza tự kể; không mất chữ; người chơi đọc được hết lời riêng theo tốc độ của mình; không nhầm hai trăng. |
| **E — Playtest** | 3–5 người chưa đọc bible, có ít nhất 1 cặp chơi thật trên hai máy và 1 điện thoại | Không gợi ý. Ghi điểm họ dừng, không hiểu, bỏ lỡ câu, gọi sai địa điểm; hỏi lại câu chuyện bằng lời của họ. Sửa theo quan sát, không chỉ theo screenshot đẹp. |

**Câu hỏi đánh giá quan trọng hơn “có đẹp không?”:** Sau mỗi phase, người chơi mới có thể trả lời (1) mình vừa đi qua đâu, (2) ánh đèn của mình/người kia đang thế nào, (3) mình mong điều gì ở cảnh tới? Nếu câu trả lời là “không biết” hoặc chỉ nhắc nút đã bấm, cảnh đó cần thêm một nhịp kể bằng hình/âm/thao tác.

## 9. Những điều nên giữ nguyên trong quá trình sửa

- Story bible và `PRESENT_VISUAL_IDENTITY.md` là chuẩn: quá khứ handmade papercraft, hiện tại Modern Illuminated Papercraft Diorama; đèn ông sao là motif chính. Không biến dự án thành open world hay dùng thêm visual Phase 7 trong Phase 4–6.
- Phase 6 Inner Gate tiếp tục là guarded reveal; trước separation không hiện rõ từ promenade, bên kia cổng cuối Phase 6 vẫn chỉ là sương sáng, bóng và chuyển động.
- Hình kỷ niệm cuối cùng là **ảnh thật** theo data config. Báo cáo này không đề xuất thay ảnh bằng minh họa.
- Lời chúc là nội dung riêng tư của người viết. Chỉ thay cấu trúc trình chiếu/cách đọc sau khi nghe phản ứng và có sự đồng ý của người viết về câu chữ.
- Không viết lại multiplayer/network/state machine chỉ để sửa art/story; những thay đổi kể chuyện nên là lớp cue/camera/UI được điều khiển bởi state hiện có.

## 10. Mốc bằng chứng để xem nhanh

- Mở đầu/căn nhà: [`00_title.png`](test-artifacts/ux_journey/00_title.png), [`01_rewind.png`](test-artifacts/ux_journey/01_rewind.png), [`02_craft_start.png`](test-artifacts/ux_journey/02_craft_start.png), [`03_craft_step_4.png`](test-artifacts/ux_journey/03_craft_step_4.png).
- Đường làng/sân đình: [`06_village_wind.png`](test-artifacts/ux_journey/06_village_wind.png), [`08_square_lion.png`](test-artifacts/ux_journey/08_square_lion.png), [`11_ascent.png`](test-artifacts/ux_journey/11_ascent.png).
- Hiện tại/đồng hành: [`12_modern_moon.png`](test-artifacts/ux_journey/12_modern_moon.png), [`13_modern_festival_reveal.png`](test-artifacts/ux_journey/13_modern_festival_reveal.png), [`phase5_dark_before_switch.png`](test-artifacts/phase5_dark_before_switch.png), [`phase5_dark_after_switch.png`](test-artifacts/phase5_dark_after_switch.png).
- Tách/gặp/kết: [`phase6_02_elder.png`](test-artifacts/phase6_02_elder.png), [`phase6_05_reunion.png`](test-artifacts/phase6_05_reunion.png), [`phase7/05_full_reveal.png`](test-artifacts/phase7/05_full_reveal.png). Ảnh Phase 6–7 là mốc staged, dùng để đánh giá khung hình và text, không chứng minh nhịp chơi thực tế.

---

**Đánh giá cuối:** Game hiện có đủ chất liệu để trở thành một món quà rất riêng. Công việc cần ưu tiên là làm cho *mỗi ánh đèn, mỗi câu dẫn, mỗi cú chạm và mỗi khoảng lặng nói cùng một điều*. Sửa chữ bị lỗi và nhịp phụ đề trước; sau đó mở đầu, lắp đèn, giữ lửa, cảnh lạc–đoàn tụ và nhịp đọc lá thư. Đây sẽ cải thiện cảm xúc mạnh hơn việc thêm nhiều công trình hoặc nhiều câu kể.
