# Nội dung riêng cho maiixinh

Bản công khai chỉ chứa bốn tranh SVG và thư mặc định. PIN được kiểm tra trong Cloudflare Pages Function; ảnh và thư riêng phải nằm trong **R2 bucket riêng tư**, không bật public bucket URL.

## Những tệp đã giữ lại trên máy

Các tệp cũ nằm trong thư mục `private-personal/` (đã được `.gitignore`):

| Tệp trên máy | R2 object key |
| --- | --- |
| `private-personal/deck.json` | `deck.json` |
| `private-personal/letter.txt` | `letter.txt` |
| `private-personal/photos/moon_bamboo.jpg` | `photos/moon_bamboo.jpg` |
| `private-personal/photos/star_lantern.jpg` | `photos/star_lantern.jpg` |
| `private-personal/photos/lion_dance.png` | `photos/lion_dance.png` |
| `private-personal/photos/family_tray.jpg` | `photos/family_tray.jpg` |

Trong R2, tạo thư mục `photos` rồi tải bốn ảnh vào đó; giữ nguyên tên và đuôi tệp. Tải `deck.json` và `letter.txt` ở ngay thư mục gốc của bucket.

## Cấu hình Cloudflare trước khi phát hành

1. Tạo một R2 bucket riêng tư và tải sáu object ở bảng trên lên đúng key.
2. Trong Pages project, tạo R2 binding tên `PERSONAL_CONTENT` trỏ đến bucket đó.
3. Tạo hai **secret** cho cả Production và Preview: `PERSONAL_PIN` là bốn chữ số, `PERSONAL_SESSION_SECRET` là chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Không đặt chúng trong biến `VITE_`, `.env` của Vite, mã nguồn hay cuộc trò chuyện.
4. Redeploy sau khi thêm binding và secret. Kiểm tra chế độ khách trước, rồi nhập PIN trên cả hai thiết bị nếu chơi cùng nhau với ảnh thật.

PIN bốn số chỉ thích hợp để tách nội dung cho một nhóm nhỏ. Endpoint có giới hạn năm lần nhập sai trong 15 phút cho mỗi địa chỉ mạng; trước khi chia sẻ rộng, nên bật thêm Cloudflare WAF rate limit cho `/api/personal/unlock`. Nội dung riêng từng tồn tại trong lịch sử Git và ở bản web cũ, nên việc xóa khỏi bản build mới **không xóa các bản sao cũ**. Nếu repository công khai hoặc các URL cũ đã được chia sẻ, cần xử lý lịch sử và deployment cũ riêng trước khi coi các tệp ấy là bí mật.
