use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}
// ^^^ Code above is unchanged. ^^^
use vodka_extra_signatories.{key_signed}
use vodka_validity_range.{valid_after}

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
    expect Some(datum) = datum_opt
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

// key_signed: Kiểm tra xem một public key hash có nằm trong danh sách chữ ký của giao dịch không.
// valid_after: Kiểm tra xem thời gian hiện tại đã vượt qua thời điểm lock_until chưa.