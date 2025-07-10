# Lesson 02: Vesting Smart Contract

# Table of Contents

1. Hiểu đúng về Handling Time.
2. Hiểu đúng về logic của smart contract.
3. Hiểu cách tương tác hợp đồng vesting.
4. Review code: Vesting contract.
5. Giải đáp các câu hỏi chưa rõ

## **1. Hiểu đúng về Handling Time**

Dựa vào ảnh trên, chúng ta có thể hiểu:

Thời gian trên ví khác với thời gian trên node thực thi
Thay đổi tham số Slot ở các HF sau
=> Có nghĩa là chỉ khi nào info (start) phải lớn hơn deadline, cụ thể hơn nữa là ô màu vàng phải qua hẳn thanh dọc deadline thì lúc này, hợp đồng vesting cho phép người thụ hưởng có thể unlock được. Bên cạnh đó, người chủ sở hữu có thể unlock bất cứ lúc nào.

---

Cardano sử dụng chuẩn POSIX time (số miliseconds).

Ứng dụng của handling time:

- Vesting contract: Chỉ cho phép rút tài sản sau một thời điểm nhất định.
- Time lock: Khoá hoặc mở khoá tài sản theo thời gian.
- Auction: Đặt thời gian bắt đầu/kết thúc đấu giá

## **2. Hiểu đúng luồng hoạt động của smart contract vesting**

```aiken
pub type VestingDatum {
  lock_until: Int, // Là thời gian (epoch) mà người thụ hưởng có thể nhận được tài sản
  owner: VerificationKeyHash, // Hash của public key của người sở hữu
  beneficiary: VerificationKeyHash, // Hash của public key người thụ hưởng
}

validator vesting {
  spend(
    datum_opt: Option<VestingDatum>,
    _redeemer: Data,
    _input: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt // Đảm bảo UTXO có datum hợp lệ
    // Logic hợp đồng sẽ thoả mãn 1 trong 2 điều kiện sau:
    // TH1: Nếu là người chủ sở hữu ký giao dịch thì họ có thể rút tài sản bất cứ lúc nào.
    // TH2: Nếu là người thụ hưởng ký giao dịch và thời gian hiện tại đã vượt qua lock_until thì họ có thể unlock.

    or {
      key_signed(tx.extra_signatories, datum.owner),
      and {
        key_signed(tx.extra_signatories, datum.beneficiary),
        valid_after(tx.validity_range, datum.lock_until),
      },
    }
  }

  else(_) {
    fail
  }
}


```

## **3. Hiểu cách tương tác hợp đồng vesting**

![Mô tả ảnh](URL_hoặc_đường_dẫn_ảnh)

## **4. Review code offchain: Vesting**

=> Check trong file lock.ts và unlock.ts

## **5. Quy trình lock và unlock hợp đồng vesting**

**a.Khoá tài sản**

B1: Kết nối ví và lấy thông tin.

B2: Set up các dữ liệu cần thiết (owner, age, address, phone) để làm inlinedatum trong giao dịch.

B3: Đọc smart contract từ file plutus.json và lấy địa chỉ smart contract.

B4: Tạo và gửi giao dịch lock tài sản vào contract với datum đó.

**b.Mở khoá tài sản**

B1: Khởi tạo và kết nối ví.

B2: Đọc smart contract (validator) và lấy địa chỉ contract.

B3: Tạo redeemer phù hợp với logic của smart contract.

B4: Lấy danh sách UTXO tại địa chỉ contract, chọn UTXO muốn unlock (thường dựa vào số lượng ADA hoặc datum).

B5: Lấy lại payment hash (nếu cần cho addSigner hoặc xác thực).

B6: Tạo và gửi giao dịch unlock

## **6. Giải đáp các câu hỏi chưa rõ**

**addSigner():**

**collectFrom():**
